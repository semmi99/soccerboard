import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'
import { loadProject } from '../../../lib/supabase/projects'
import { useProjectSave } from '../hooks/useProjectSave'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { TopBar } from './TopBar'
import { Toolbar } from './Toolbar'
import { PropertiesSidebar } from './PropertiesSidebar'
import { EditorCanvas } from './EditorCanvas'
import { Timeline } from './Timeline'

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const stageRef = useRef<Konva.Stage>(null)
  const resetToBlankProject = useEditorStore((s) => s.resetToBlankProject)
  const loadProjectIntoStore = useEditorStore((s) => s.loadProject)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const save = useProjectSave()

  useKeyboardShortcuts({ onSave: save.handleSave })

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
          teamId: project.teamId,
          zoneGridStyle: project.zoneGridStyle,
          zoneGridCustomId: project.zoneGridCustomId,
          showPitchMarkings: project.showPitchMarkings,
          fieldCrop: project.fieldCrop,
          pitchLengthM: project.pitchLengthM,
          pitchWidthM: project.pitchWidthM,
          customKit: project.customKit,
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
      <TopBar stageRef={stageRef} save={save} />
      <div className="flex min-h-0 flex-1">
        <Toolbar />
        <main className="min-w-0 flex-1 bg-pitch-950 p-4">
          <EditorCanvas stageRef={stageRef} />
        </main>
        <PropertiesSidebar />
      </div>
      <Timeline />
    </div>
  )
}
