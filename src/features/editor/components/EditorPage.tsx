import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { loadProject } from '../../../lib/supabase/projects'
import { TopBar } from './TopBar'
import { Toolbar } from './Toolbar'
import { PropertiesSidebar } from './PropertiesSidebar'
import { EditorCanvas } from './EditorCanvas'
import { Timeline } from './Timeline'

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const resetToBlankProject = useEditorStore((s) => s.resetToBlankProject)
  const loadProjectIntoStore = useEditorStore((s) => s.loadProject)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!projectId) return

    if (projectId === 'new') {
      resetToBlankProject()
      return
    }

    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    loadProject(projectId)
      .then((project) => {
        if (cancelled) return
        loadProjectIntoStore({
          projectId: project.id,
          projectTitle: project.title,
          pitchDesign: project.pitchDesign,
          orientation: project.orientation,
          frames: project.frames,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Projekt konnte nicht geladen werden.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [projectId, resetToBlankProject, loadProjectIntoStore])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-pitch-950">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-pitch-950 text-white/70">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-sm text-violet-accent-bright underline"
        >
          Zurück zum Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-pitch-950">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Toolbar />
        <main className="min-w-0 flex-1 bg-pitch-950 p-4">
          <EditorCanvas />
        </main>
        <PropertiesSidebar />
      </div>
      <Timeline />
    </div>
  )
}
