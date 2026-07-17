import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { TopBar } from './TopBar'
import { Toolbar } from './Toolbar'
import { PropertiesSidebar } from './PropertiesSidebar'
import { EditorCanvas } from './EditorCanvas'
import { Timeline } from './Timeline'

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const resetToBlankProject = useEditorStore((s) => s.resetToBlankProject)

  useEffect(() => {
    if (projectId === 'new') {
      resetToBlankProject()
    }
    // Loading an existing project by id is wired up once persistence lands.
  }, [projectId, resetToBlankProject])

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
