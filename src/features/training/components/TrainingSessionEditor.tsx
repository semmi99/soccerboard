import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import { listPlayers, listTeams, type Player, type Team } from '../../../lib/supabase/squad'
import {
  createPrinzip,
  createUnterphase,
  listPrinzipien,
  listUnterphasen,
  type Prinzip,
  type Unterphase,
} from '../../../lib/supabase/trainingTaxonomy'
import {
  loadSession,
  nextSessionNumber,
  saveSession,
  type SessionExerciseRef,
} from '../../../lib/supabase/trainingSessions'
import type { Exercise } from '../../../lib/supabase/exercises'
import { PLAYER_STATUS_OPTIONS, SCHWERPUNKT_OPTIONS, SPIELPHASE_OPTIONS } from '../types'
import type { PlayerStatus, Schwerpunkt, Spielphase } from '../types'
import { ExercisePickerModal } from './ExercisePickerModal'
import { openSessionPrintWindow } from '../pdf/sessionPrint'

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'
const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'

const STATUS_COLORS: Record<PlayerStatus, string> = {
  aktiv: 'bg-green-600/80 text-white',
  individuell: 'bg-yellow-600/80 text-white',
  krank: 'bg-red-600/80 text-white',
}

function TaxonomyPicker({
  label,
  items,
  value,
  onChange,
  onCreate,
}: {
  label: string
  items: { id: string; name: string }[]
  value: string | null
  onChange: (id: string | null) => void
  onCreate: (name: string) => Promise<void>
}) {
  const { t } = useTranslation('training')
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setIsSaving(true)
    try {
      await onCreate(newName.trim())
      setNewName('')
      setIsAdding(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-white/60">{label}</span>
      {!isAdding ? (
        <div className="flex gap-1.5">
          <select
            className={`${selectClass} flex-1`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">—</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" onClick={() => setIsAdding(true)}>
            {t('sessionEditor.addTaxonomy')}
          </Button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <input
            autoFocus
            className={`${inputClass} flex-1`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('sessionEditor.newTaxonomyPlaceholder')}
          />
          <Button type="button" loading={isSaving} disabled={!newName.trim()} onClick={() => void handleCreate()}>
            {t('common:actions.save')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
            {t('common:actions.cancel')}
          </Button>
        </div>
      )}
    </label>
  )
}

export function TrainingSessionEditor({
  sessionId,
  onClose,
  onSaved,
}: {
  sessionId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation(['training', 'common'])
  const organization = useAuthStore((s) => s.organization)
  const profile = useAuthStore((s) => s.profile)

  const [teams, setTeams] = useState<Team[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, PlayerStatus>>({})

  const [unterphasen, setUnterphasen] = useState<Unterphase[]>([])
  const [prinzipien, setPrinzipien] = useState<Prinzip[]>([])

  const [sessionNumber, setSessionNumber] = useState(1)
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [schwerpunkt, setSchwerpunkt] = useState<Schwerpunkt>(SCHWERPUNKT_OPTIONS[0])
  const [spielphase, setSpielphase] = useState<Spielphase>(SPIELPHASE_OPTIONS[0])
  const [unterphaseId, setUnterphaseId] = useState<string | null>(null)
  const [prinzipId, setPrinzipId] = useState<string | null>(null)
  const [koerperlich, setKoerperlich] = useState(5)
  const [physisch, setPhysisch] = useState(5)
  const [exercises, setExercises] = useState<SessionExerciseRef[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  const [isLoading, setIsLoading] = useState(sessionId !== null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load org-scoped picklists once.
  useEffect(() => {
    if (!organization) return
    listTeams(organization.id).then(setTeams).catch(() => setTeams([]))
    listUnterphasen(organization.id).then(setUnterphasen).catch(() => setUnterphasen([]))
    listPrinzipien(organization.id).then(setPrinzipien).catch(() => setPrinzipien([]))
  }, [organization])

  // Load the existing session (edit mode) once the picklists exist.
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    loadSession(sessionId)
      .then((s) => {
        if (cancelled) return
        setTeamId(s.teamId)
        setSessionNumber(s.sessionNumber)
        setSessionDate(s.sessionDate)
        setSchwerpunkt(s.schwerpunkt)
        setSpielphase(s.spielphase)
        setUnterphaseId(s.unterphaseId)
        setPrinzipId(s.prinzipId)
        setKoerperlich(s.koerperlich ?? 5)
        setPhysisch(s.physisch ?? 5)
        setExercises(s.exercises)
        setPlayerStatuses(Object.fromEntries(s.players.map((p) => [p.playerId, p.status])))
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('sessionEditor.loadError')))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, t])

  // Load the chosen team's roster, defaulting any player not already tracked
  // (new team, or a player added to the squad since this session was last
  // saved) to 'aktiv' instead of dropping them from the attendance table.
  useEffect(() => {
    if (!teamId) {
      setPlayers([])
      return
    }
    listPlayers(teamId)
      .then((rows) => {
        setPlayers(rows)
        setPlayerStatuses((prev) => {
          const next = { ...prev }
          for (const p of rows) if (!(p.id in next)) next[p.id] = 'aktiv'
          return next
        })
      })
      .catch(() => setPlayers([]))
  }, [teamId])

  // New session: pick the org's only team automatically, and re-derive the
  // next session number for whichever team is selected.
  useEffect(() => {
    if (sessionId) return
    if (!teamId && teams.length === 1) {
      setTeamId(teams[0]!.id)
      return
    }
    if (teamId) nextSessionNumber(teamId).then(setSessionNumber).catch(() => {})
  }, [sessionId, teamId, teams])

  async function handleSave() {
    if (!organization || !profile || !teamId) return
    setIsSaving(true)
    setError(null)
    try {
      await saveSession({
        sessionId,
        orgId: organization.id,
        teamId,
        createdBy: profile.id,
        sessionNumber,
        sessionDate,
        schwerpunkt,
        spielphase,
        unterphaseId,
        prinzipId,
        koerperlich,
        physisch,
        players: Object.entries(playerStatuses).map(([playerId, status]) => ({ playerId, status })),
        exerciseIds: exercises.map((e) => e.exerciseId),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sessionEditor.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  function handlePrint() {
    const team = teams.find((tm) => tm.id === teamId)
    openSessionPrintWindow({
      sessionNumber,
      sessionDate,
      teamName: team?.name ?? '',
      schwerpunkt,
      spielphase,
      unterphaseName: unterphasen.find((u) => u.id === unterphaseId)?.name ?? null,
      prinzipName: prinzipien.find((p) => p.id === prinzipId)?.name ?? null,
      koerperlich,
      physisch,
      players: players.map((p) => ({
        name: `${p.first_name} ${p.last_name}`.trim(),
        position: p.position,
        status: playerStatuses[p.id] ?? 'aktiv',
      })),
      exercises,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-pitch-950">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />
      <main className="mx-auto max-w-5xl p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-white">
            {sessionId ? t('sessionEditor.editTitle', { number: sessionNumber }) : t('sessionEditor.newTitle')}
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="secondary" onClick={handlePrint} disabled={!teamId}>
              {t('sessionEditor.savePdf')}
            </Button>
            <Button loading={isSaving} disabled={!teamId} onClick={() => void handleSave()}>
              {t('common:actions.save')}
            </Button>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="flex flex-col gap-4">
            <div className="rounded-xl border border-pitch-700 bg-pitch-900 p-5">
              <h2 className="mb-3 text-sm font-semibold text-white">{t('sessionEditor.metaTitle')}</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-white/60">{t('sessionEditor.teamLabel')}</span>
                  <select
                    className={selectClass}
                    value={teamId ?? ''}
                    onChange={(e) => setTeamId(e.target.value || null)}
                  >
                    <option value="">—</option>
                    {teams.map((tm) => (
                      <option key={tm.id} value={tm.id}>
                        {tm.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-white/60">{t('sessionEditor.dateLabel')}</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-white/60">{t('sessionEditor.schwerpunktLabel')}</span>
                  <select
                    className={selectClass}
                    value={schwerpunkt}
                    onChange={(e) => setSchwerpunkt(e.target.value as Schwerpunkt)}
                  >
                    {SCHWERPUNKT_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-white/60">{t('sessionEditor.spielphaseLabel')}</span>
                  <select
                    className={selectClass}
                    value={spielphase}
                    onChange={(e) => setSpielphase(e.target.value as Spielphase)}
                  >
                    {SPIELPHASE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
                <TaxonomyPicker
                  label={t('sessionEditor.unterphaseLabel')}
                  items={unterphasen}
                  value={unterphaseId}
                  onChange={setUnterphaseId}
                  onCreate={async (name) => {
                    if (!organization) return
                    const created = await createUnterphase(organization.id, name)
                    setUnterphasen((prev) => [...prev, created])
                    setUnterphaseId(created.id)
                  }}
                />
                <TaxonomyPicker
                  label={t('sessionEditor.prinzipLabel')}
                  items={prinzipien}
                  value={prinzipId}
                  onChange={setPrinzipId}
                  onCreate={async (name) => {
                    if (!organization) return
                    const created = await createPrinzip(organization.id, name)
                    setPrinzipien((prev) => [...prev, created])
                    setPrinzipId(created.id)
                  }}
                />
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-white/60">
                    {t('sessionEditor.koerperlichLabel')}: {koerperlich}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={koerperlich}
                    onChange={(e) => setKoerperlich(Number(e.target.value))}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-white/60">
                    {t('sessionEditor.physischLabel')}: {physisch}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={physisch}
                    onChange={(e) => setPhysisch(Number(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-pitch-700 bg-pitch-900 p-5">
              <h2 className="mb-3 text-sm font-semibold text-white">{t('sessionEditor.rosterTitle')}</h2>
              {!teamId ? (
                <p className="text-sm text-white/40">{t('sessionEditor.pickTeamFirst')}</p>
              ) : players.length === 0 ? (
                <p className="text-sm text-white/40">{t('sessionEditor.emptyRoster')}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 py-1">
                      <span className="min-w-0 flex-1 truncate text-sm text-white">
                        {p.first_name} {p.last_name}
                        {p.position && <span className="ml-2 text-xs text-white/40">{p.position}</span>}
                      </span>
                      <div className="flex shrink-0 gap-1">
                        {PLAYER_STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setPlayerStatuses((prev) => ({ ...prev, [p.id]: status }))}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                              (playerStatuses[p.id] ?? 'aktiv') === status
                                ? STATUS_COLORS[status]
                                : 'bg-pitch-800 text-white/40'
                            }`}
                          >
                            {t(`playerStatus.${status}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-pitch-700 bg-pitch-900 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">
                {t('sessionEditor.exercisesTitle', { count: exercises.length })}
              </h2>
              {organization && exercises.length < 6 && (
                <Button variant="secondary" onClick={() => setShowExercisePicker(true)}>
                  {t('sessionEditor.addExercise')}
                </Button>
              )}
            </div>
            {exercises.length === 0 ? (
              <p className="text-sm text-white/40">{t('sessionEditor.emptyExercises')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {exercises.map((ex, i) => (
                  <div
                    key={`${ex.exerciseId}-${i}`}
                    className="flex flex-col gap-1 rounded-lg border border-pitch-700 bg-pitch-800/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white">{ex.exerciseName}</span>
                      <button
                        type="button"
                        onClick={() => setExercises((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-xs text-white/40 hover:text-red-400"
                      >
                        {t('common:actions.remove')}
                      </button>
                    </div>
                    <span className="text-xs text-white/40">{ex.exerciseCategory}</span>
                    {ex.exerciseDescription && (
                      <span className="text-xs text-white/50">{ex.exerciseDescription}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {showExercisePicker && organization && (
        <ExercisePickerModal
          orgId={organization.id}
          excludeIds={exercises.map((e) => e.exerciseId)}
          onClose={() => setShowExercisePicker(false)}
          onPick={(exercise: Exercise) => {
            setExercises((prev) => [
              ...prev,
              {
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                exerciseCategory: exercise.category,
                exerciseDescription: exercise.description,
              },
            ])
            setShowExercisePicker(false)
          }}
        />
      )}
    </div>
  )
}
