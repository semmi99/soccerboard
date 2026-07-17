import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { Button } from '../../../components/ui/Button'

export function TopBar({ rightSlot }: { rightSlot?: ReactNode }) {
  const navigate = useNavigate()
  const projectTitle = useEditorStore((s) => s.projectTitle)
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)

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
        className="min-w-0 flex-1 truncate rounded-md bg-transparent px-2 py-1 text-sm font-medium text-white outline-none hover:bg-pitch-800 focus:bg-pitch-800"
      />

      <div className="flex items-center gap-1">
        <Button variant="ghost" disabled={!canUndo} onClick={undo} title="Rückgängig (Strg+Z)">
          Rückgängig
        </Button>
        <Button variant="ghost" disabled={!canRedo} onClick={redo} title="Wiederholen (Strg+Shift+Z)">
          Wiederholen
        </Button>
      </div>

      <div className="flex items-center gap-2">{rightSlot}</div>
    </header>
  )
}
