import { useEffect, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import {
  createPlayer,
  createTeam,
  deletePlayer,
  listPlayers,
  listTeams,
  updatePlayer,
  uploadPlayerPhoto,
  type Player,
  type PlayerFormValues,
  type Team,
} from '../../../lib/supabase/squad'
import { PlayerFormDialog } from './PlayerFormDialog'
import { BulkAddPlayersDialog } from './BulkAddPlayersDialog'

function DeleteConfirmDialog({
  name,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  name: string
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <h2 className="text-sm font-semibold text-white">Spieler löschen?</h2>
        <p className="mt-2 text-sm text-white/60">
          <span className="text-white">{name}</span> wird aus dem Kader entfernt.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
            Löschen
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
      setError(err instanceof Error ? err.message : 'Erstellen fehlgeschlagen.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-sm rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl"
      >
        <h2 className="mb-3 text-sm font-semibold text-white">Neues Team</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">Name</span>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. U16"
              className="rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">Altersklasse (optional)</span>
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
            Abbrechen
          </Button>
          <Button type="submit" loading={isSaving}>
            Erstellen
          </Button>
        </div>
      </form>
    </div>
  )
}

export function SquadPage() {
  const organization = useAuthStore((s) => s.organization)

  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingPlayer, setEditingPlayer] = useState<Player | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)

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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Teams konnten nicht geladen werden.')
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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Kader konnte nicht geladen werden.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPlayers(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTeamId])

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
      })
      created.push(player)
    }
    setPlayers((prev) =>
      [...prev, ...created].sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999)),
    )
    setShowBulkAdd(false)
  }

  async function confirmDeletePlayer() {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    try {
      await deletePlayer(pendingDelete.id)
      setPlayers((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.')
    } finally {
      setDeletingId(null)
    }
  }

  const activeTeam = teams.find((t) => t.id === activeTeamId)

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />

      <div className="flex items-center justify-between border-b border-pitch-700 px-8 py-5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">Kader</h1>
          {!isLoadingTeams && teams.length > 0 && (
            <select
              value={activeTeamId ?? ''}
              onChange={(e) => setActiveTeamId(e.target.value)}
              className="rounded-lg border border-pitch-600 bg-pitch-800 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-accent"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowNewTeam(true)}
            className="text-sm text-white/40 hover:text-white/70"
          >
            + Neues Team
          </button>
        </div>
        {activeTeam && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowBulkAdd(true)}>
              Mehrere Spieler auf einmal
            </Button>
            <Button onClick={() => setEditingPlayer('new')}>Spieler hinzufügen</Button>
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
            <p>Noch kein Team angelegt.</p>
            <button
              type="button"
              onClick={() => setShowNewTeam(true)}
              className="text-violet-accent-bright underline"
            >
              Erstes Team anlegen
            </button>
          </div>
        ) : isLoadingPlayers ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-white/40">
            <p>Noch keine Spieler in diesem Team.</p>
            <button
              type="button"
              onClick={() => setEditingPlayer('new')}
              className="text-violet-accent-bright underline"
            >
              Ersten Spieler hinzufügen
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-pitch-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-pitch-900 text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Nr.</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Nebenposition</th>
                  <th className="px-4 py-3 font-medium">Fuß</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-pitch-700 bg-pitch-900/40">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-pitch-800/60">
                    <td className="px-4 py-2.5 font-semibold text-white/80">
                      {p.jersey_number ?? '–'}
                    </td>
                    <td className="px-4 py-2.5 text-white">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-4 py-2.5 text-white/60">{p.position ?? '–'}</td>
                    <td className="px-4 py-2.5 text-white/60">{p.secondary_position ?? '–'}</td>
                    <td className="px-4 py-2.5 text-white/60">{p.strong_foot ?? '–'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer(p)}
                        className="mr-2 text-xs text-white/40 hover:text-violet-accent-bright"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(p)}
                        className="text-xs text-white/40 hover:text-red-400"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
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

      {showNewTeam && (
        <NewTeamDialog onCancel={() => setShowNewTeam(false)} onCreate={handleCreateTeam} />
      )}

      {showBulkAdd && (
        <BulkAddPlayersDialog onCancel={() => setShowBulkAdd(false)} onSubmit={handleBulkAdd} />
      )}
    </div>
  )
}
