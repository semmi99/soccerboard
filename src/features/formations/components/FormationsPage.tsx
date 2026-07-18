import { useEffect, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import { PRESET_FORMATIONS, type FormationPosition } from '../presets'
import {
  createFormation,
  deleteFormation,
  listFormations,
  updateFormation,
  type Formation,
} from '../../../lib/supabase/formations'
import { FormationPreview } from './FormationPreview'
import { FormationEditorModal } from './FormationEditorModal'

interface EditorState {
  mode: 'create' | 'edit'
  id?: string
  title: string
  defaultName: string
  formationType: string
  positions: FormationPosition[]
}

export function FormationsPage() {
  const organization = useAuthStore((s) => s.organization)
  const [customFormations, setCustomFormations] = useState<Formation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    listFormations(organization.id)
      .then((data) => {
        if (!cancelled) setCustomFormations(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Formationen konnten nicht geladen werden.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [organization])

  async function handleSave(input: { name: string; formationType: string; positions: FormationPosition[] }) {
    if (!organization || !editorState) return

    if (editorState.mode === 'edit' && editorState.id) {
      const updated = await updateFormation(editorState.id, { name: input.name, positions: input.positions })
      setCustomFormations((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f)).sort((a, b) => a.name.localeCompare(b.name)),
      )
    } else {
      const created = await createFormation({
        orgId: organization.id,
        name: input.name,
        formationType: input.formationType,
        positions: input.positions,
      })
      setCustomFormations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setEditorState(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteFormation(id)
      setCustomFormations((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />

      <main className="p-8">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
            Vorlagen
          </h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {PRESET_FORMATIONS.map((preset) => (
              <div
                key={preset.type}
                className="flex flex-col overflow-hidden rounded-xl border border-pitch-700 bg-pitch-900"
              >
                <div className="aspect-[5/7] w-full p-2">
                  <FormationPreview positions={preset.positions} />
                </div>
                <div className="flex items-center justify-between gap-2 p-3 pt-0">
                  <span className="text-sm font-medium text-white">{preset.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditorState({
                        mode: 'create',
                        title: `"${preset.name}" als eigene Formation`,
                        defaultName: `${preset.name} (eigen)`,
                        formationType: preset.type,
                        positions: preset.positions,
                      })
                    }
                    className="text-xs text-white/40 hover:text-violet-accent-bright"
                  >
                    Speichern als…
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40">
              Eigene Formationen
            </h2>
            <Button
              variant="secondary"
              onClick={() =>
                setEditorState({
                  mode: 'create',
                  title: 'Neue Formation erstellen',
                  defaultName: 'Neue Formation',
                  formationType: 'custom',
                  positions: [],
                })
              }
            >
              + Neue Formation erstellen
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
            </div>
          ) : customFormations.length === 0 ? (
            <p className="text-sm text-white/40">
              Noch keine eigenen Formationen. Erstelle eine neue oder speichere eine Vorlage oben als eigene
              Formation.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {customFormations.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-pitch-700 bg-pitch-900"
                >
                  <div className="aspect-[5/7] w-full p-2">
                    <FormationPreview positions={f.positions} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 pt-0">
                    <span className="truncate text-sm font-medium text-white">{f.name}</span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditorState({
                            mode: 'edit',
                            id: f.id,
                            title: `"${f.name}" bearbeiten`,
                            defaultName: f.name,
                            formationType: f.formationType,
                            positions: f.positions,
                          })
                        }
                        className="text-xs text-white/40 hover:text-violet-accent-bright"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === f.id}
                        onClick={() => void handleDelete(f.id)}
                        className="text-xs text-white/40 hover:text-red-400 disabled:opacity-50"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {editorState && (
        <FormationEditorModal
          title={editorState.title}
          defaultName={editorState.defaultName}
          defaultFormationType={editorState.formationType}
          initialPositions={editorState.positions}
          onCancel={() => setEditorState(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
