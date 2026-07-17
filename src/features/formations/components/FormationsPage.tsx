import { useEffect, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { AppHeader } from '../../../app/AppHeader'
import { Button } from '../../../components/ui/Button'
import { PRESET_FORMATIONS } from '../presets'
import {
  createFormation,
  deleteFormation,
  listFormations,
  type Formation,
} from '../../../lib/supabase/formations'
import { FormationPreview } from './FormationPreview'

function SaveAsDialog({
  defaultName,
  onCancel,
  onSave,
}: {
  defaultName: string
  onCancel: () => void
  onSave: (name: string) => Promise<void>
}) {
  const [name, setName] = useState(defaultName)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    try {
      await onSave(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-sm rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl"
      >
        <h2 className="mb-3 text-sm font-semibold text-white">Als eigene Formation speichern</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-white/70">Name</span>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
          />
        </label>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button type="submit" loading={isSaving}>
            Speichern
          </Button>
        </div>
      </form>
    </div>
  )
}

export function FormationsPage() {
  const organization = useAuthStore((s) => s.organization)
  const [customFormations, setCustomFormations] = useState<Formation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveAsPreset, setSaveAsPreset] = useState<(typeof PRESET_FORMATIONS)[number] | null>(null)
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

  async function handleSaveAs(name: string) {
    if (!organization || !saveAsPreset) return
    const created = await createFormation({
      orgId: organization.id,
      name,
      formationType: saveAsPreset.type,
      positions: saveAsPreset.positions,
    })
    setCustomFormations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    setSaveAsPreset(null)
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
                    onClick={() => setSaveAsPreset(preset)}
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
            Eigene Formationen
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
            </div>
          ) : customFormations.length === 0 ? (
            <p className="text-sm text-white/40">
              Noch keine eigenen Formationen. Speichere eine Vorlage oben als eigene Formation.
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
                    <button
                      type="button"
                      disabled={deletingId === f.id}
                      onClick={() => void handleDelete(f.id)}
                      className="shrink-0 text-xs text-white/40 hover:text-red-400 disabled:opacity-50"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {saveAsPreset && (
        <SaveAsDialog
          defaultName={saveAsPreset.name}
          onCancel={() => setSaveAsPreset(null)}
          onSave={handleSaveAs}
        />
      )}
    </div>
  )
}
