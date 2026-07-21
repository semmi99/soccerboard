import { useEffect, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { useEditorStore } from '../store/editorStore'
import { limitsForTier } from '../../../lib/limits'
import { Button } from '../../../components/ui/Button'
import { createExercise, deleteExercise, listExercises, type Exercise } from '../../../lib/supabase/exercises'

const CATEGORIES = [
  'Aufwärmen',
  'Passen',
  'Abschluss',
  'Kondition',
  'Taktik',
  'Standardsituationen',
  'Sonstiges',
]

const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2.5 py-1.5 text-sm text-white outline-none focus:border-violet-accent'

function sortExercises(list: Exercise[]): Exercise[] {
  return [...list].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  )
}

export function ExercisesModal({ onClose }: { onClose: () => void }) {
  const organization = useAuthStore((s) => s.organization)
  const frames = useEditorStore((s) => s.frames)
  const appendFrames = useEditorStore((s) => s.appendFrames)

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [showSaveForm, setShowSaveForm] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0]!)
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    setIsLoading(true)
    listExercises(organization.id)
      .then((rows) => {
        if (!cancelled) setExercises(rows)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [organization])

  async function handleSaveCurrent() {
    if (!organization || !name.trim()) return
    setIsSaving(true)
    setActionError(null)
    try {
      const created = await createExercise({
        orgId: organization.id,
        name: name.trim(),
        category,
        description: description.trim() || null,
        frames,
      })
      setExercises((prev) => sortExercises([...prev, created]))
      setName('')
      setDescription('')
      setShowSaveForm(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleInsert(exercise: Exercise) {
    if (!organization) return
    const maxFrames = limitsForTier(organization).maxFrames
    const ok = appendFrames(exercise.frames, maxFrames)
    if (!ok) {
      setActionError(`Frame-Limit erreicht: maximal ${maxFrames} Frames pro Projekt.`)
      return
    }
    onClose()
  }

  async function handleDelete(id: string) {
    setActionError(null)
    try {
      await deleteExercise(id)
      setExercises((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Übungsbibliothek</h2>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        {actionError && <p className="text-sm text-red-400">{actionError}</p>}

        {!showSaveForm ? (
          <Button variant="secondary" onClick={() => setShowSaveForm(true)}>
            + Aktuelles Board als Übung speichern
          </Button>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-pitch-700 bg-pitch-800/50 p-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-white/70">Name</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-white/70">Kategorie</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-white/70">Beschreibung (optional)</span>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={() => void handleSaveCurrent()} loading={isSaving} disabled={!name.trim()}>
                Speichern
              </Button>
              <Button variant="ghost" onClick={() => setShowSaveForm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-white/40">Lädt …</p>}
          {loadError && <p className="text-sm text-red-400">{loadError}</p>}
          {!isLoading && !loadError && exercises.length === 0 && (
            <p className="text-sm text-white/40">Noch keine gespeicherten Übungen.</p>
          )}
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-pitch-700 bg-pitch-800/40 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{ex.name}</p>
                <p className="text-xs text-white/40">
                  {ex.category} · {ex.frames.length} Frame{ex.frames.length === 1 ? '' : 's'}
                </p>
                {ex.description && <p className="mt-1 truncate text-xs text-white/50">{ex.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button variant="secondary" onClick={() => handleInsert(ex)}>
                  Einfügen
                </Button>
                <Button variant="danger" onClick={() => void handleDelete(ex.id)}>
                  Löschen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
