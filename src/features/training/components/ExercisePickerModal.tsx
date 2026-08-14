import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { listExercises, type Exercise } from '../../../lib/supabase/exercises'

export function ExercisePickerModal({
  orgId,
  excludeIds,
  onClose,
  onPick,
}: {
  orgId: string
  excludeIds: string[]
  onClose: () => void
  onPick: (exercise: Exercise) => void
}) {
  const { t } = useTranslation('training')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listExercises(orgId)
      .then((rows) => {
        if (!cancelled) setExercises(rows)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('exercisePicker.loadError'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orgId, t])

  const available = exercises.filter((e) => !excludeIds.includes(e.id))

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{t('exercisePicker.title')}</h2>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-col gap-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-white/40">{t('exercisePicker.loading')}</p>}
          {!isLoading && available.length === 0 && (
            <p className="text-sm text-white/40">{t('exercisePicker.empty')}</p>
          )}
          {available.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onPick(ex)}
              className="flex flex-col items-start gap-0.5 rounded-lg border border-pitch-700 bg-pitch-800/40 p-3 text-left hover:border-violet-accent/60"
            >
              <span className="text-sm font-medium text-white">{ex.name}</span>
              <span className="text-xs text-white/40">{ex.category}</span>
              {ex.description && <span className="mt-1 text-xs text-white/50">{ex.description}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
