import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { Button } from '../../../components/ui/Button'
import { createExercise } from '../../../lib/supabase/exercises'
import { writePendingExercise } from '../../training/draftBridge'
import { EXERCISE_CATEGORIES } from '../exerciseCategories'

const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2.5 py-1.5 text-sm text-white outline-none focus:border-violet-accent'

/** Shown instead of the normal project-save flow when the blank board at
 * /editor/new is being used as a scratchpad to build a brand-new exercise
 * for the training planner (see TrainingSessionEditor's "+ Neue Übung
 * erstellen"). Saves straight into the `exercises` library (never a
 * `projects` row — see useProjectSave's exerciseMode) and hands the result
 * back to the training form via sessionStorage before navigating back. */
export function SaveExerciseBar() {
  const { t } = useTranslation(['editor', 'common'])
  const navigate = useNavigate()
  const organization = useAuthStore((s) => s.organization)
  const frames = useEditorStore((s) => s.frames)

  const [name, setName] = useState('')
  const [category, setCategory] = useState(EXERCISE_CATEGORIES[0]!)
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!organization || !name.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      const created = await createExercise({
        orgId: organization.id,
        name: name.trim(),
        category,
        description: description.trim() || null,
        frames,
      })
      writePendingExercise({
        exerciseId: created.id,
        exerciseName: created.name,
        exerciseCategory: created.category,
        exerciseDescription: created.description,
        frames: created.frames,
      })
      navigate('/training')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveExerciseBar.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-violet-accent/30 bg-violet-accent/10 px-4 py-2">
      <span className="shrink-0 text-xs font-medium text-white/70">{t('saveExerciseBar.label')}</span>
      <input
        className={inputClass}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('saveExerciseBar.namePlaceholder')}
      />
      <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
        {EXERCISE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {t(`exercisesModal.categories.${c}`, { defaultValue: c })}
          </option>
        ))}
      </select>
      <input
        className={`${inputClass} min-w-0 flex-1`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('saveExerciseBar.descriptionPlaceholder')}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button variant="ghost" onClick={() => navigate('/training')}>
        {t('common:actions.cancel')}
      </Button>
      <Button loading={isSaving} disabled={!name.trim()} onClick={() => void handleSave()}>
        {t('saveExerciseBar.save')}
      </Button>
    </div>
  )
}
