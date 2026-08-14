import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import {
  deleteSession,
  listSessions,
  type TrainingSessionSummary,
} from '../../../lib/supabase/trainingSessions'
import { TrainingSessionEditor } from './TrainingSessionEditor'
import { peekDraftSessionId } from '../draftBridge'

type View = { mode: 'list' } | { mode: 'edit'; sessionId: string | null }

/** Land back on the session editor (not the list) after a round-trip to
 * /editor/new to build a new exercise — TrainingSessionEditor itself does
 * the real (consuming) draft read once mounted. */
function initialView(): View {
  const draftSessionId = peekDraftSessionId()
  return draftSessionId !== undefined ? { mode: 'edit', sessionId: draftSessionId } : { mode: 'list' }
}

export function TrainingPage() {
  const { t } = useTranslation(['training', 'common'])
  const organization = useAuthStore((s) => s.organization)
  const profile = useAuthStore((s) => s.profile)

  const [sessions, setSessions] = useState<TrainingSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>(initialView)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function reload() {
    if (!organization) return
    setIsLoading(true)
    listSessions(organization.id)
      .then(setSessions)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('loadError')))
      .finally(() => setIsLoading(false))
  }

  useEffect(reload, [organization])

  async function handleDelete(id: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    setDeletingId(id)
    try {
      await deleteSession(id)
      setSessions((s) => s.filter((row) => row.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  if (!organization || !profile) {
    return (
      <div className="flex h-full items-center justify-center bg-pitch-950">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
      </div>
    )
  }

  if (profile.role !== 'admin') {
    return (
      <div className="h-full bg-pitch-950">
        <AppHeader />
        <div className="flex flex-col items-center gap-2 py-20 text-white/50">
          <p>{t('adminOnlyNotice')}</p>
        </div>
      </div>
    )
  }

  if (view.mode === 'edit') {
    return (
      <TrainingSessionEditor
        sessionId={view.sessionId}
        onClose={() => setView({ mode: 'list' })}
        onSaved={() => {
          setView({ mode: 'list' })
          reload()
        }}
      />
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />
      <main className="mx-auto max-w-4xl p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">{t('title')}</h1>
            <p className="mt-1 text-sm text-white/40">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setView({ mode: 'edit', sessionId: null })}>{t('newSession')}</Button>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-white/40">{t('empty')}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-pitch-700 bg-pitch-900 px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => setView({ mode: 'edit', sessionId: s.id })}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <span className="shrink-0 rounded-md bg-pitch-800 px-2 py-1 text-xs font-semibold text-white/60">
                    {t('sessionNumberShort', { number: s.sessionNumber })}
                  </span>
                  <span className="w-24 shrink-0 text-sm text-white/70">{s.sessionDate}</span>
                  <span className="truncate text-sm font-medium text-white">{s.teamName}</span>
                  <span className="truncate text-xs text-white/40">{s.schwerpunkt}</span>
                </button>
                <Button
                  variant="danger"
                  loading={deletingId === s.id}
                  onClick={() => void handleDelete(s.id)}
                >
                  {t('common:actions.delete')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
