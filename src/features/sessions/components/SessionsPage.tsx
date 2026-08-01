import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import { listExercises, type Exercise } from '../../../lib/supabase/exercises'
import {
  createTrainingSession,
  deleteTrainingSession,
  listTrainingSessions,
  updateTrainingSession,
  type SessionItem,
  type TrainingSession,
} from '../../../lib/supabase/trainingSessions'

interface BuilderState {
  mode: 'create' | 'edit'
  id?: string
  name: string
  items: SessionItem[]
}

const DEFAULT_DURATION_MIN = 15

function totalMinutes(items: SessionItem[]): number {
  return items.reduce((sum, i) => sum + i.durationMin, 0)
}

function groupByCategory(exercises: Exercise[]): [string, Exercise[]][] {
  const map = new Map<string, Exercise[]>()
  for (const ex of exercises) {
    const list = map.get(ex.category) ?? []
    list.push(ex)
    map.set(ex.category, list)
  }
  return [...map.entries()]
}

export function SessionsPage() {
  const { t } = useTranslation('sessions')
  const organization = useAuthStore((s) => s.organization)

  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [builder, setBuilder] = useState<BuilderState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // The session currently rendered into the print-only view — set right
  // before calling window.print() and cleared once the print dialog closes,
  // so the hidden printable markup only exists in the DOM while needed.
  const [printSession, setPrintSession] = useState<TrainingSession | BuilderState | null>(null)

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    setIsLoading(true)
    Promise.all([listTrainingSessions(organization.id), listExercises(organization.id)])
      .then(([sessionRows, exerciseRows]) => {
        if (cancelled) return
        setSessions(sessionRows)
        setExercises(exerciseRows)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('loadError'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [organization, t])

  useEffect(() => {
    if (!printSession) return
    const handleAfterPrint = () => setPrintSession(null)
    window.addEventListener('afterprint', handleAfterPrint)
    // A microtask delay so the printable markup has actually painted before
    // the browser snapshots the page for the print dialog.
    const timer = setTimeout(() => window.print(), 50)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [printSession])

  function addExercise(ex: Exercise) {
    if (!builder) return
    setBuilder({
      ...builder,
      items: [
        ...builder.items,
        { exerciseId: ex.id, name: ex.name, category: ex.category, durationMin: DEFAULT_DURATION_MIN },
      ],
    })
  }

  function removeItem(index: number) {
    if (!builder) return
    setBuilder({ ...builder, items: builder.items.filter((_, i) => i !== index) })
  }

  function setItemDuration(index: number, min: number) {
    if (!builder) return
    setBuilder({
      ...builder,
      items: builder.items.map((it, i) => (i === index ? { ...it, durationMin: Math.max(0, min) } : it)),
    })
  }

  function reorderItems(fromIndex: number, toIndex: number) {
    if (!builder) return
    const items = [...builder.items]
    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved!)
    setBuilder({ ...builder, items })
  }

  async function handleSaveSession() {
    if (!organization || !builder) return
    setIsSaving(true)
    setError(null)
    try {
      if (builder.mode === 'edit' && builder.id) {
        const updated = await updateTrainingSession(builder.id, { name: builder.name, items: builder.items })
        setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      } else {
        const created = await createTrainingSession({
          orgId: organization.id,
          name: builder.name,
          items: builder.items,
        })
        setSessions((prev) => [created, ...prev])
      }
      setBuilder(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTrainingSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const printItems = printSession?.items ?? []
  const printName = printSession ? ('name' in printSession ? printSession.name : '') : ''

  return (
    <div className="h-full overflow-y-auto bg-pitch-950 print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <AppHeader />
      </div>

      <main className="p-8 print:hidden">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {!builder && (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">{t('title')}</h2>
              <Button
                variant="secondary"
                onClick={() => setBuilder({ mode: 'create', name: t('newSessionDefaultName'), items: [] })}
              >
                {t('createNew')}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-white/40">{t('empty')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((s) => (
                  <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-pitch-700 bg-pitch-900 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-white">{s.name}</span>
                      <span className="shrink-0 text-xs text-white/40">
                        {t('totalMinutes', { min: totalMinutes(s.items) })}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      {t('exerciseCount', { count: s.items.length })}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setBuilder({ mode: 'edit', id: s.id, name: s.name, items: s.items })}
                        className="text-white/40 hover:text-violet-accent-bright"
                      >
                        {t('common:actions.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintSession(s)}
                        className="text-white/40 hover:text-violet-accent-bright"
                      >
                        {t('print')}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === s.id}
                        onClick={() => void handleDelete(s.id)}
                        className="text-white/40 hover:text-red-400 disabled:opacity-50"
                      >
                        {t('common:actions.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {builder && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
                {t('library')}
              </h2>
              {exercises.length === 0 ? (
                <p className="text-sm text-white/40">{t('libraryEmpty')}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {groupByCategory(exercises).map(([category, list]) => (
                    <div key={category}>
                      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/30">
                        {category}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        {list.map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => addExercise(ex)}
                            className="flex items-center justify-between gap-2 rounded-md border border-pitch-700 bg-pitch-900 px-3 py-2 text-left text-sm text-white/80 hover:border-violet-accent/50 hover:text-white"
                          >
                            {ex.name}
                            <span className="shrink-0 text-xs text-white/40">{t('addToSession')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-white/60">{t('sessionName')}</span>
                <input
                  type="text"
                  value={builder.name}
                  onChange={(e) => setBuilder({ ...builder, name: e.target.value })}
                  className="rounded-md border border-pitch-600 bg-pitch-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-accent"
                />
              </label>

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">
                  {t('sessionItems')}
                </h2>
                <span className="text-sm font-medium text-white/70">
                  {t('totalMinutes', { min: totalMinutes(builder.items) })}
                </span>
              </div>

              {builder.items.length === 0 ? (
                <p className="text-sm text-white/40">{t('sessionEmpty')}</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {builder.items.map((item, index) => (
                    <div
                      key={`${item.exerciseId}-${index}`}
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index)
                      }}
                      onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (draggedIndex !== null && draggedIndex !== index) reorderItems(draggedIndex, index)
                        setDraggedIndex(null)
                        setDragOverIndex(null)
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null)
                        setDragOverIndex(null)
                      }}
                      className={`flex cursor-grab items-center gap-2 rounded-md border bg-pitch-900 px-3 py-2 text-sm active:cursor-grabbing ${
                        dragOverIndex === index ? 'border-violet-accent' : 'border-pitch-700'
                      }`}
                    >
                      <span className="text-white/20">⠿</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-white">{item.name}</p>
                        <p className="truncate text-xs text-white/40">{item.category}</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={item.durationMin}
                        onChange={(e) => setItemDuration(index, Number(e.target.value))}
                        className="w-16 shrink-0 rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1 text-right text-sm text-white outline-none focus:border-violet-accent"
                      />
                      <span className="shrink-0 text-xs text-white/40">{t('minutesAbbr')}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="shrink-0 text-white/30 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="primary" disabled={isSaving} onClick={() => void handleSaveSession()}>
                  {t('common:actions.save')}
                </Button>
                <Button
                  variant="secondary"
                  disabled={builder.items.length === 0}
                  onClick={() => setPrintSession(builder)}
                >
                  {t('print')}
                </Button>
                <Button variant="secondary" onClick={() => setBuilder(null)}>
                  {t('common:actions.cancel')}
                </Button>
              </div>
            </section>
          </div>
        )}
      </main>

      {printSession && (
        <div className="hidden print:block print:p-8">
          <h1 className="text-2xl font-bold text-black">{printName}</h1>
          <p className="mb-6 text-sm text-black/60">
            {t('totalMinutes', { min: totalMinutes(printItems) })} · {t('exerciseCount', { count: printItems.length })}
          </p>
          <ol className="flex flex-col gap-4">
            {printItems.map((item, index) => (
              <li key={`${item.exerciseId}-${index}`} className="border-b border-black/20 pb-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-lg font-semibold text-black">
                    {index + 1}. {item.name}
                  </span>
                  <span className="shrink-0 text-sm text-black/70">
                    {t('totalMinutes', { min: item.durationMin })}
                  </span>
                </div>
                <p className="text-sm text-black/50">{item.category}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
