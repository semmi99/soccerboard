import type { RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'
import type { useProjectSave } from '../hooks/useProjectSave'
import { Button } from '../../../components/ui/Button'
import { ExportMenu } from './ExportMenu'

export function TopBar({
  stageRef,
  save,
}: {
  stageRef: RefObject<Konva.Stage | null>
  save: ReturnType<typeof useProjectSave>
}) {
  const navigate = useNavigate()
  const projectTitle = useEditorStore((s) => s.projectTitle)
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)

  const { handleSave, isSaving, saveError, isDirty, projectId } = save

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-pitch-700 bg-pitch-900 px-4">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="rounded-md px-2 py-1 text-sm text-white/60 hover:bg-pitch-800 hover:text-white"
      >
        ← Dashboard
      </button>

      <input
        value={projectTitle}
        onChange={(e) => setProjectTitle(e.target.value)}
        placeholder="Projektname"
        title="Projektname (klicken zum Umbenennen)"
        className="min-w-0 max-w-xs truncate rounded-md border border-pitch-700 bg-pitch-800/60 px-2 py-1 text-sm font-medium text-white outline-none hover:border-pitch-600 focus:border-violet-accent focus:bg-pitch-800"
      />

      <div className="flex items-center gap-1">
        <Button variant="ghost" disabled={!canUndo} onClick={undo} title="Rückgängig (Strg+Z)">
          Rückgängig
        </Button>
        <Button variant="ghost" disabled={!canRedo} onClick={redo} title="Wiederholen (Strg+Shift+Z)">
          Wiederholen
        </Button>
      </div>

      {saveError && <p className="max-w-xs truncate text-xs text-red-400">{saveError}</p>}

      <ExportMenu stageRef={stageRef} />

      <Button
        onClick={() => void handleSave()}
        loading={isSaving}
        disabled={!isDirty && Boolean(projectId)}
        title="Speichern (Strg+S)"
      >
        {projectId ? 'Speichern' : 'Projekt erstellen'}
      </Button>
    </header>
  )
}
