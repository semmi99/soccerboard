import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { addPlayerNote, deletePlayerNote, listPlayerNotes, type PlayerNote } from '../../../lib/supabase/squad'

function formatTimestamp(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** A running scouting-observation log for one player, separate from the
 * single overwritable free-text `notes` field above it — each entry is
 * timestamped and attributed so a coach can look back at how a player has
 * developed over several sessions/matches instead of just the latest note. */
export function PlayerNotesLog({
  playerId,
  authorId,
  authorName,
}: {
  playerId: string
  authorId: string
  authorName: string | null
}) {
  const { t, i18n } = useTranslation(['squad', 'common'])
  const [notes, setNotes] = useState<PlayerNote[] | null>(null)
  const [draft, setDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listPlayerNotes(playerId)
      .then((data) => {
        if (!cancelled) setNotes(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [playerId])

  async function handleAdd() {
    const content = draft.trim()
    if (!content) return
    setIsSaving(true)
    setError(null)
    try {
      const note = await addPlayerNote(playerId, authorId, content)
      setNotes((prev) => [{ ...note, authorName: note.authorName ?? authorName }, ...(prev ?? [])])
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deletePlayerNote(id)
      setNotes((prev) => (prev ?? []).filter((n) => n.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5 sm:flex-row">
        <textarea
          rows={2}
          className="flex-1 rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
          placeholder={t('playerForm.notesLog.placeholder')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          disabled={!draft.trim()}
          loading={isSaving}
          onClick={() => void handleAdd()}
        >
          {t('playerForm.notesLog.add')}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {notes === null ? (
        <p className="text-xs text-white/40">{t('playerForm.notesLog.loading')}</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-white/40">{t('playerForm.notesLog.empty')}</p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-pitch-700 bg-pitch-800/60 px-3 py-2 text-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-white/40">
                <span>
                  {formatTimestamp(note.createdAt, i18n.language)}
                  {note.authorName ? ` · ${note.authorName}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="text-white/40 hover:text-red-400 disabled:opacity-50"
                >
                  {t('common:actions.delete')}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-white/90">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
