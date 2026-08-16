import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import {
  averagePlayerRating,
  createPlayer,
  createTeam,
  deletePlayer,
  deleteTeam,
  importApiFootballSquad,
  listPlayers,
  listTeams,
  removeTeamCrest,
  updatePlayer,
  uploadPlayerPhoto,
  uploadTeamCrest,
  type Player,
  type PlayerFormValues,
  type Team,
} from '../../../lib/supabase/squad'
import type { ApiFootballPlayer, ApiFootballTeam } from '../../../lib/supabase/apiFootball'
import { PlayerFormDialog } from './PlayerFormDialog'
import { BulkAddPlayersDialog } from './BulkAddPlayersDialog'
import { ApiFootballImportDialog } from './ApiFootballImportDialog'

/** Buckets a free-text position string into the tactical Tor/Abwehr/
 * Mittelfeld/Sturm grouping used for the sortable squad table — matches
 * on keywords so it works for both the manual position vocabulary
 * (Innenverteidigung, Offensives Mittelfeld, ...) and the generic
 * API-Football import labels (Abwehr, Mittelfeld, Sturm). */
function positionGroup(position: string | null): number {
  if (!position) return 4
  const p = position.toLowerCase()
  if (p.includes('tor')) return 0
  if (p.includes('verteidig') || p.includes('abwehr')) return 1
  if (p.includes('mittelfeld')) return 2
  if (p.includes('flügel') || p.includes('stürmer') || p.includes('sturm')) return 3
  return 4
}

const POSITION_GROUP_LABEL_KEYS = [
  'positionGroups.goalkeeper',
  'positionGroups.defense',
  'positionGroups.midfield',
  'positionGroups.attack',
  'positionGroups.none',
] as const

function DeleteConfirmDialog({
  name,
  onCancel,
  onConfirm,
  isDeleting,
  titleKey = 'deleteDialog.title',
  bodyAfterKey = 'deleteDialog.bodyAfter',
}: {
  name: string
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
  titleKey?: string
  bodyAfterKey?: string
}) {
  const { t } = useTranslation(['squad', 'common'])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <h2 className="text-sm font-semibold text-white">{t(titleKey)}</h2>
        <p className="mt-2 text-sm text-white/60">
          <span className="text-white">{name}</span> {t(bodyAfterKey)}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            {t('common:actions.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
            {t('common:actions.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function NewTeamDialog({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (name: string, ageGroup: string) => Promise<void>
}) {
  const { t } = useTranslation(['squad', 'common'])
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await onCreate(name, ageGroup)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.createFailed'))
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-sm rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl"
      >
        <h2 className="mb-3 text-sm font-semibold text-white">{t('newTeamDialog.title')}</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('newTeamDialog.nameLabel')}</span>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('newTeamDialog.namePlaceholder')}
              className="rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('newTeamDialog.ageGroupLabel')}</span>
            <input
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
            />
          </label>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" loading={isSaving}>
            {t('newTeamDialog.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function SquadPage() {
  const { t } = useTranslation(['squad', 'common'])
  const organization = useAuthStore((s) => s.organization)
  const profile = useAuthStore((s) => s.profile)

  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingPlayer, setEditingPlayer] = useState<Player | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDeleteTeam, setPendingDeleteTeam] = useState<Team | null>(null)
  const [isDeletingTeam, setIsDeletingTeam] = useState(false)
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showApiFootballImport, setShowApiFootballImport] = useState(false)
  const [isUploadingCrest, setIsUploadingCrest] = useState(false)
  const [sortBy, setSortBy] = useState<'number' | 'position'>('number')

  const sortedPlayers = useMemo(() => {
    if (sortBy === 'number') return players
    return [...players].sort((a, b) => {
      const groupDiff = positionGroup(a.position) - positionGroup(b.position)
      if (groupDiff !== 0) return groupDiff
      return (a.jersey_number ?? 999) - (b.jersey_number ?? 999)
    })
  }, [players, sortBy])

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    listTeams(organization.id)
      .then((data) => {
        if (cancelled) return
        setTeams(data)
        setActiveTeamId((current) => current ?? data[0]?.id ?? null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('errors.loadTeamsFailed'))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTeams(false)
      })
    return () => {
      cancelled = true
    }
  }, [organization])

  useEffect(() => {
    if (!activeTeamId) {
      setPlayers([])
      return
    }
    let cancelled = false
    setIsLoadingPlayers(true)
    listPlayers(activeTeamId)
      .then((data) => {
        if (!cancelled) setPlayers(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('errors.loadPlayersFailed'))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPlayers(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTeamId])

  async function handleCrestFile(file: File) {
    if (!organization || !activeTeamId) return
    setIsUploadingCrest(true)
    try {
      const crestUrl = await uploadTeamCrest(organization.id, activeTeamId, file)
      setTeams((ts) => ts.map((t) => (t.id === activeTeamId ? { ...t, crest_url: crestUrl } : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.crestUploadFailed'))
    } finally {
      setIsUploadingCrest(false)
    }
  }

  async function handleRemoveCrest() {
    if (!activeTeamId) return
    try {
      await removeTeamCrest(activeTeamId)
      setTeams((ts) => ts.map((team) => (team.id === activeTeamId ? { ...team, crest_url: null } : team)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.crestRemoveFailed'))
    }
  }

  async function handleCreateTeam(name: string, ageGroup: string) {
    if (!organization) return
    const team = await createTeam({ orgId: organization.id, name, ageGroup, season: '' })
    setTeams((prev) => [...prev, team].sort((a, b) => a.name.localeCompare(b.name)))
    setActiveTeamId(team.id)
    setShowNewTeam(false)
  }

  async function handleSavePlayer(values: PlayerFormValues, photoFile: File | null) {
    let saved =
      editingPlayer && editingPlayer !== 'new'
        ? await updatePlayer(editingPlayer.id, values)
        : await createPlayer(values)

    if (photoFile && organization) {
      const photoUrl = await uploadPlayerPhoto(organization.id, saved.id, photoFile)
      saved = { ...saved, photo_url: photoUrl }
    }

    setPlayers((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      const next = exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]
      return next.sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999))
    })
    setEditingPlayer(null)
  }

  async function handleBulkAdd(
    entries: { firstName: string; lastName: string; jerseyNumber: number | null }[],
  ) {
    if (!activeTeamId) return
    const created: Player[] = []
    for (const entry of entries) {
      const player = await createPlayer({
        teamId: activeTeamId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        jerseyNumber: entry.jerseyNumber,
        position: '',
        secondaryPosition: '',
        strongFoot: '',
        birthDate: '',
        nationality: '',
        phone: '',
        email: '',
        notes: '',
        attributes: {},
      })
      created.push(player)
    }
    setPlayers((prev) =>
      [...prev, ...created].sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999)),
    )
    setShowBulkAdd(false)
  }

  async function handleApiFootballImport(team: ApiFootballTeam, players: ApiFootballPlayer[]) {
    if (!organization) return
    const result = await importApiFootballSquad(organization.id, team.name, players)
    setTeams((prev) => [...prev, result.team].sort((a, b) => a.name.localeCompare(b.name)))
    setActiveTeamId(result.team.id)
    setShowApiFootballImport(false)
  }

  async function confirmDeletePlayer() {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    try {
      await deletePlayer(pendingDelete.id)
      setPlayers((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  async function confirmDeleteTeam() {
    if (!pendingDeleteTeam) return
    setIsDeletingTeam(true)
    try {
      await deleteTeam(pendingDeleteTeam.id)
      const remaining = teams.filter((t) => t.id !== pendingDeleteTeam.id)
      setTeams(remaining)
      setActiveTeamId((current) => (current === pendingDeleteTeam.id ? (remaining[0]?.id ?? null) : current))
      setPendingDeleteTeam(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.deleteTeamFailed'))
    } finally {
      setIsDeletingTeam(false)
    }
  }

  const activeTeam = teams.find((t) => t.id === activeTeamId)

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />

      <div className="flex items-center justify-between border-b border-pitch-700 px-8 py-5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">{t('title')}</h1>
          {!isLoadingTeams && teams.length > 0 && (
            <select
              value={activeTeamId ?? ''}
              onChange={(e) => setActiveTeamId(e.target.value)}
              className="rounded-lg border border-pitch-600 bg-pitch-800 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-accent"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowNewTeam(true)}
            className="text-sm text-white/40 hover:text-white/70"
          >
            {t('newTeam')}
          </button>
          {activeTeam && (
            <button
              type="button"
              onClick={() => setPendingDeleteTeam(activeTeam)}
              className="text-sm text-white/40 hover:text-red-400"
            >
              {t('deleteTeam')}
            </button>
          )}
          {profile?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowApiFootballImport(true)}
              className="text-sm text-white/40 hover:text-white/70"
            >
              {t('apiFootballImport')}
            </button>
          )}
          {activeTeam && (
            <div
              className="flex items-center gap-2 rounded-lg border border-pitch-700 px-2 py-1"
              title={t('crestTitle')}
            >
              {activeTeam.crest_url ? (
                <img
                  src={activeTeam.crest_url}
                  alt={t('crestAlt')}
                  className="h-7 w-7 shrink-0 rounded-full bg-pitch-800 object-contain"
                />
              ) : (
                <div className="h-7 w-7 shrink-0 rounded-full bg-pitch-800" />
              )}
              <label className="cursor-pointer text-xs text-white/50 hover:text-white/80">
                {isUploadingCrest ? t('crestUploading') : t('crestUpload')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingCrest}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleCrestFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
              {activeTeam.crest_url && (
                <button
                  type="button"
                  onClick={() => void handleRemoveCrest()}
                  title={t('crestRemove')}
                  className="text-xs text-white/40 hover:text-red-400"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
        {activeTeam && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowBulkAdd(true)}>
              {t('bulkAdd')}
            </Button>
            <Button onClick={() => setEditingPlayer('new')}>{t('addPlayer')}</Button>
          </div>
        )}
      </div>

      <main className="p-8">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {isLoadingTeams ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-white/40">
            <p>{t('empty.noTeam')}</p>
            <button
              type="button"
              onClick={() => setShowNewTeam(true)}
              className="text-violet-accent-bright underline"
            >
              {t('empty.createFirstTeam')}
            </button>
          </div>
        ) : isLoadingPlayers ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-white/40">
            <p>{t('empty.noPlayers')}</p>
            <button
              type="button"
              onClick={() => setEditingPlayer('new')}
              className="text-violet-accent-bright underline"
            >
              {t('empty.addFirstPlayer')}
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-pitch-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-pitch-900 text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => setSortBy('number')}
                      className={sortBy === 'number' ? 'text-white' : 'hover:text-white/70'}
                    >
                      {t('table.number')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">{t('table.name')}</th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => setSortBy('position')}
                      className={sortBy === 'position' ? 'text-white' : 'hover:text-white/70'}
                    >
                      {t('table.position')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">{t('table.secondaryPosition')}</th>
                  <th className="px-4 py-3 font-medium">{t('table.foot')}</th>
                  <th className="px-4 py-3 font-medium">{t('table.rating')}</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-pitch-700 bg-pitch-900/40">
                {sortedPlayers.map((p, i) => {
                  const group = positionGroup(p.position)
                  const prevGroup = i > 0 ? positionGroup(sortedPlayers[i - 1]!.position) : null
                  const showDivider = sortBy === 'position' && prevGroup !== null && group !== prevGroup
                  return (
                    <Fragment key={p.id}>
                      {showDivider && (
                        <tr key={`divider-${p.id}`} aria-hidden="true">
                          <td colSpan={7} className="border-t-2 border-violet-accent/40 bg-pitch-900 px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                            {t(POSITION_GROUP_LABEL_KEYS[group]!)}
                          </td>
                        </tr>
                      )}
                  <tr className="hover:bg-pitch-800/60">
                    <td className="px-4 py-2.5 font-semibold text-white/80">
                      {p.jersey_number ?? '–'}
                    </td>
                    <td className="px-4 py-2.5 text-white">
                      <div className="flex items-center gap-2.5">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt=""
                            className="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 shrink-0 rounded-full bg-pitch-800" />
                        )}
                        <span>
                          {p.first_name} {p.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-white/60">
                      {p.position ? t(`positions.${p.position}`, { defaultValue: p.position }) : '–'}
                    </td>
                    <td className="px-4 py-2.5 text-white/60">
                      {p.secondary_position
                        ? t(`positions.${p.secondary_position}`, { defaultValue: p.secondary_position })
                        : '–'}
                    </td>
                    <td className="px-4 py-2.5 text-white/60">
                      {p.strong_foot ? t(`feet.${p.strong_foot}`, { defaultValue: p.strong_foot }) : '–'}
                    </td>
                    <td className="px-4 py-2.5 text-white/60">
                      {averagePlayerRating(p.attributes)?.toFixed(1) ?? '–'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer(p)}
                        className="mr-2 text-xs text-white/40 hover:text-violet-accent-bright"
                      >
                        {t('common:actions.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(p)}
                        className="text-xs text-white/40 hover:text-red-400"
                      >
                        {t('common:actions.delete')}
                      </button>
                    </td>
                  </tr>
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editingPlayer && activeTeamId && (
        <PlayerFormDialog
          teamId={activeTeamId}
          player={editingPlayer === 'new' ? undefined : editingPlayer}
          onCancel={() => setEditingPlayer(null)}
          onSubmit={handleSavePlayer}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmDialog
          name={`${pendingDelete.first_name} ${pendingDelete.last_name}`}
          isDeleting={deletingId === pendingDelete.id}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDeletePlayer}
        />
      )}

      {pendingDeleteTeam && (
        <DeleteConfirmDialog
          name={pendingDeleteTeam.name}
          isDeleting={isDeletingTeam}
          onCancel={() => setPendingDeleteTeam(null)}
          onConfirm={confirmDeleteTeam}
          titleKey="deleteTeamDialog.title"
          bodyAfterKey="deleteTeamDialog.bodyAfter"
        />
      )}

      {showNewTeam && (
        <NewTeamDialog onCancel={() => setShowNewTeam(false)} onCreate={handleCreateTeam} />
      )}

      {showBulkAdd && (
        <BulkAddPlayersDialog onCancel={() => setShowBulkAdd(false)} onSubmit={handleBulkAdd} />
      )}

      {showApiFootballImport && (
        <ApiFootballImportDialog
          onCancel={() => setShowApiFootballImport(false)}
          onImport={handleApiFootballImport}
        />
      )}
    </div>
  )
}
