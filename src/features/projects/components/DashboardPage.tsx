import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/store/authStore'
import { limitsForTier } from '../../../lib/limits'
import { deleteProject, listProjects, type ProjectSummary } from '../../../lib/supabase/projects'
import { Button } from '../../../components/ui/Button'
import { OrgLogoUploader } from './OrgLogoUploader'
import { AppHeader } from '../../../app/AppHeader'

function PitchThumbnail() {
  return (
    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-md bg-gradient-to-br from-pitch-800 to-pitch-900">
      <svg viewBox="0 0 65 100" className="h-2/3 w-2/3 opacity-40">
        <rect x="1" y="1" width="63" height="98" fill="none" stroke="#1c8dc9" strokeWidth="1.5" />
        <line x1="1" y1="50" x2="64" y2="50" stroke="#1c8dc9" strokeWidth="1.5" />
        <circle cx="32.5" cy="50" r="9" fill="none" stroke="#1c8dc9" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function DeleteConfirmDialog({
  title,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  title: string
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <h2 className="text-sm font-semibold text-white">Projekt löschen?</h2>
        <p className="mt-2 text-sm text-white/60">
          <span className="text-white">„{title}“</span> wird unwiderruflich gelöscht, inklusive
          aller Frames.
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

export function DashboardPage() {
  const navigate = useNavigate()
  const organization = useAuthStore((s) => s.organization)

  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(null)

  useEffect(() => {
    if (!organization) return
    let cancelled = false
    setIsLoading(true)
    listProjects(organization.id)
      .then((data) => {
        if (!cancelled) setProjects(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Projekte konnten nicht geladen werden.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [organization])

  async function confirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setDeletingId(id)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center bg-pitch-950">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
      </div>
    )
  }

  const maxProjects = limitsForTier(organization.subscription_tier).maxProjects
  const limitReached = projects.length >= maxProjects

  return (
    <div className="h-full overflow-y-auto bg-pitch-950">
      <AppHeader />
      <div className="flex items-center justify-between border-b border-pitch-700 px-8 py-5">
        <div className="flex items-center gap-4">
          <OrgLogoUploader />
          <div>
            <h1 className="text-lg font-semibold text-white">Projekte</h1>
            <p className="text-sm text-white/40">
              {projects.length} / {Number.isFinite(maxProjects) ? maxProjects : '∞'} Projekte ·{' '}
              {organization.subscription_tier === 'free' ? 'Free-Tier' : organization.subscription_tier}
            </p>
          </div>
        </div>
        <Button
          disabled={limitReached}
          title={limitReached ? `Free-Limit von ${maxProjects} Projekten erreicht` : undefined}
          onClick={() => navigate('/editor/new')}
        >
          Neues Projekt
        </Button>
      </div>

      <main className="p-8">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-white/40">
            <p>Noch keine Projekte.</p>
            <Link to="/editor/new" className="text-violet-accent-bright underline">
              Erstes Projekt anlegen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative flex flex-col overflow-hidden rounded-xl border border-pitch-700 bg-pitch-900 transition-colors hover:border-violet-accent"
              >
                <Link to={`/editor/${project.id}`} className="p-3">
                  <PitchThumbnail />
                </Link>
                <div className="flex items-start justify-between gap-2 p-3 pt-0">
                  <div className="min-w-0">
                    <Link
                      to={`/editor/${project.id}`}
                      className="block truncate text-sm font-medium text-white hover:text-violet-accent-bright"
                    >
                      {project.title}
                    </Link>
                    <p className="text-xs text-white/40">{formatDate(project.updatedAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(project)}
                    title="Projekt löschen"
                    className="shrink-0 rounded-md px-1.5 py-1 text-xs text-white/40 hover:bg-red-600/20 hover:text-red-400"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {pendingDelete && (
        <DeleteConfirmDialog
          title={pendingDelete.title}
          isDeleting={deletingId === pendingDelete.id}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
