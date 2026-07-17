import { useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { limitsForTier } from '../../../lib/limits'
import { countProjects, saveProject } from '../../../lib/supabase/projects'
import { Button } from '../../../components/ui/Button'
import { ExportMenu } from './ExportMenu'

export function TopBar({ stageRef }: { stageRef: RefObject<Konva.Stage | null> }) {
  const navigate = useNavigate()
  const projectId = useEditorStore((s) => s.projectId)
  const projectTitle = useEditorStore((s) => s.projectTitle)
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle)
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const orientation = useEditorStore((s) => s.orientation)
  const frames = useEditorStore((s) => s.frames)
  const isDirty = useEditorStore((s) => s.isDirty)
  const markSaved = useEditorStore((s) => s.markSaved)
  const setProjectIdInStore = useEditorStore((s) => s.setProjectId)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)

  const organization = useAuthStore((s) => s.organization)
  const profile = useAuthStore((s) => s.profile)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    if (!organization || !profile) return
    setIsSaving(true)
    setSaveError(null)

    try {
      if (!projectId) {
        const maxProjects = limitsForTier(organization.subscription_tier).maxProjects
        const existing = await countProjects(organization.id)
        if (existing >= maxProjects) {
          setSaveError(
            `Free-Limit erreicht: maximal ${maxProjects} Projekte. Upgrade für mehr.`,
          )
          return
        }
      }

      const savedId = await saveProject({
        projectId,
        orgId: organization.id,
        createdBy: profile.id,
        title: projectTitle,
        pitchDesign,
        orientation,
        frames,
      })

      if (!projectId) {
        setProjectIdInStore(savedId)
        navigate(`/editor/${savedId}`, { replace: true })
      }
      markSaved()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setIsSaving(false)
    }
  }

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

      {saveError && <p className="max-w-xs truncate text-xs text-red-400">{saveError}</p>}

      <ExportMenu stageRef={stageRef} />

      <Button onClick={handleSave} loading={isSaving} disabled={!isDirty && Boolean(projectId)}>
        {projectId ? 'Speichern' : 'Projekt erstellen'}
      </Button>
    </header>
  )
}
