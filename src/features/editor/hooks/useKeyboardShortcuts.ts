import { useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function useKeyboardShortcuts({ onSave }: { onSave: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey

      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave()
        return
      }

      if (isTypingTarget(e.target)) return

      const store = useEditorStore.getState()

      if (isMod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
        return
      }

      if (isMod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        store.redo()
        return
      }

      if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        store.duplicateSelected()
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selection.length === 0) return
        e.preventDefault()
        store.removeSelected()
        return
      }

      if (e.key === 'Escape') {
        store.setSelection([])
        store.setConnectorDraftFromId(null)
        store.setTool('select')
        return
      }

      if (e.key === ' ' && !store.isPlaying) {
        e.preventDefault()
        if (store.frames.length > 1) {
          store.setActiveFrameIndex(0)
          store.setIsPlaying(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave])
}
