import { create } from 'zustand'
import type {
  EditorFrame,
  FrameObject,
  PitchDesign,
  PitchOrientation,
  ToolId,
} from '../types'
import { createObjectForTool } from '../objects/factory'

interface FramesSnapshot {
  frames: EditorFrame[]
  activeFrameIndex: number
}

function cloneObject(o: FrameObject): FrameObject {
  return { ...o, data: { ...o.data } } as FrameObject
}

function cloneFrames(frames: EditorFrame[]): EditorFrame[] {
  return frames.map((f) => ({
    ...f,
    objects: f.objects.map(cloneObject),
  }))
}

function emptyFrame(durationMs = 1000): EditorFrame {
  return { id: crypto.randomUUID(), durationMs, objects: [] }
}

interface EditorState {
  projectId: string | null
  projectTitle: string
  pitchDesign: PitchDesign
  orientation: PitchOrientation
  frames: EditorFrame[]
  activeFrameIndex: number
  selection: string[]
  tool: ToolId
  isPlaying: boolean
  isDirty: boolean
  past: FramesSnapshot[]
  future: FramesSnapshot[]

  loadProject: (opts: {
    projectId: string
    projectTitle: string
    frames: EditorFrame[]
  }) => void
  resetToBlankProject: () => void
  markSaved: () => void

  setPitchDesign: (d: PitchDesign) => void
  setOrientation: (o: PitchOrientation) => void
  setProjectTitle: (title: string) => void
  setTool: (tool: ToolId) => void
  setSelection: (ids: string[]) => void

  activeFrame: () => EditorFrame

  addObjectAt: (x: number, y: number) => void
  beginHistoryCheckpoint: () => void
  updateObjectLive: (objectId: string, patch: Partial<FrameObject>) => void
  removeSelected: () => void
  duplicateSelected: () => void
  bringToFront: (objectId: string) => void
  sendToBack: (objectId: string) => void

  addFrame: (maxFrames: number) => boolean
  removeFrame: (index: number) => void
  duplicateFrame: (index: number, maxFrames: number) => boolean
  reorderFrames: (fromIndex: number, toIndex: number) => void
  setActiveFrameIndex: (index: number) => void
  setFrameDuration: (index: number, durationMs: number) => void
  setIsPlaying: (playing: boolean) => void

  undo: () => void
  redo: () => void
}

const MAX_HISTORY = 50

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  projectTitle: 'Neues Projekt',
  pitchDesign: 'classic_green',
  orientation: 'vertical',
  frames: [emptyFrame()],
  activeFrameIndex: 0,
  selection: [],
  tool: 'select',
  isPlaying: false,
  isDirty: false,
  past: [],
  future: [],

  loadProject: ({ projectId, projectTitle, frames }) => {
    set({
      projectId,
      projectTitle,
      frames: frames.length ? frames : [emptyFrame()],
      activeFrameIndex: 0,
      selection: [],
      past: [],
      future: [],
      isDirty: false,
    })
  },

  resetToBlankProject: () => {
    set({
      projectId: null,
      projectTitle: 'Neues Projekt',
      frames: [emptyFrame()],
      activeFrameIndex: 0,
      selection: [],
      past: [],
      future: [],
      isDirty: false,
    })
  },

  markSaved: () => set({ isDirty: false }),

  setPitchDesign: (d) => set({ pitchDesign: d, isDirty: true }),
  setOrientation: (o) => set({ orientation: o, isDirty: true }),
  setProjectTitle: (title) => set({ projectTitle: title, isDirty: true }),
  setTool: (tool) => set({ tool, selection: [] }),
  setSelection: (ids) => set({ selection: ids }),

  activeFrame: () => {
    const { frames, activeFrameIndex } = get()
    return frames[activeFrameIndex] ?? frames[0]!
  },

  addObjectAt: (x, y) => {
    const { tool, frames, activeFrameIndex } = get()
    if (tool === 'select') return
    const created = createObjectForTool(tool, x, y)
    if (!created) return

    pushHistory(get, set)
    const frame = frames[activeFrameIndex]!
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const newObject: FrameObject = { ...created, zIndex: maxZ + 1 }
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, newObject] } : f,
    )
    set({ frames: nextFrames, selection: [newObject.id], tool: 'select', isDirty: true })
  },

  beginHistoryCheckpoint: () => pushHistory(get, set),

  updateObjectLive: (objectId, patch) => {
    const { frames, activeFrameIndex } = get()
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.map((o) =>
              o.id === objectId ? ({ ...o, ...patch } as typeof o) : o,
            ),
          }
        : f,
    )
    set({ frames: nextFrames, isDirty: true })
  },

  removeSelected: () => {
    const { selection, frames, activeFrameIndex } = get()
    if (!selection.length) return
    pushHistory(get, set)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? { ...f, objects: f.objects.filter((o) => !selection.includes(o.id)) }
        : f,
    )
    set({ frames: nextFrames, selection: [], isDirty: true })
  },

  duplicateSelected: () => {
    const { selection, frames, activeFrameIndex } = get()
    if (!selection.length) return
    pushHistory(get, set)
    const frame = frames[activeFrameIndex]!
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const duplicates: FrameObject[] = frame.objects
      .filter((o) => selection.includes(o.id))
      .map(
        (o, i) =>
          ({
            ...cloneObject(o),
            id: crypto.randomUUID(),
            x: o.x + 20,
            y: o.y + 20,
            zIndex: maxZ + 1 + i,
          }) as FrameObject,
      )
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, ...duplicates] } : f,
    )
    set({
      frames: nextFrames,
      selection: duplicates.map((d) => d.id),
      isDirty: true,
    })
  },

  bringToFront: (objectId) => {
    const { frames, activeFrameIndex } = get()
    pushHistory(get, set)
    const frame = frames[activeFrameIndex]!
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.map((o) =>
              o.id === objectId ? { ...o, zIndex: maxZ + 1 } : o,
            ),
          }
        : f,
    )
    set({ frames: nextFrames, isDirty: true })
  },

  sendToBack: (objectId) => {
    const { frames, activeFrameIndex } = get()
    pushHistory(get, set)
    const frame = frames[activeFrameIndex]!
    const minZ = frame.objects.reduce((m, o) => Math.min(m, o.zIndex), 0)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.map((o) =>
              o.id === objectId ? { ...o, zIndex: minZ - 1 } : o,
            ),
          }
        : f,
    )
    set({ frames: nextFrames, isDirty: true })
  },

  addFrame: (maxFrames) => {
    const { frames, activeFrameIndex } = get()
    if (frames.length >= maxFrames) return false
    pushHistory(get, set)
    const nextFrames = [...frames]
    nextFrames.splice(activeFrameIndex + 1, 0, emptyFrame())
    set({ frames: nextFrames, activeFrameIndex: activeFrameIndex + 1, isDirty: true })
    return true
  },

  removeFrame: (index) => {
    const { frames } = get()
    if (frames.length <= 1) return
    pushHistory(get, set)
    const nextFrames = frames.filter((_, i) => i !== index)
    set({
      frames: nextFrames,
      activeFrameIndex: Math.max(0, Math.min(index, nextFrames.length - 1)),
      isDirty: true,
    })
  },

  duplicateFrame: (index, maxFrames) => {
    const { frames } = get()
    if (frames.length >= maxFrames) return false
    pushHistory(get, set)
    const source = frames[index]!
    const copy: EditorFrame = {
      id: crypto.randomUUID(),
      durationMs: source.durationMs,
      // Object ids are intentionally kept identical to the source frame so that
      // moving them in the new frame produces a smooth tween during playback
      // instead of an instant swap (matching is done by id, see EditorCanvas).
      objects: source.objects.map(cloneObject),
    }
    const nextFrames = [...frames]
    nextFrames.splice(index + 1, 0, copy)
    set({ frames: nextFrames, activeFrameIndex: index + 1, isDirty: true })
    return true
  },

  reorderFrames: (fromIndex, toIndex) => {
    const { frames } = get()
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= frames.length ||
      toIndex >= frames.length
    )
      return
    pushHistory(get, set)
    const nextFrames = [...frames]
    const [moved] = nextFrames.splice(fromIndex, 1)
    nextFrames.splice(toIndex, 0, moved!)
    set({ frames: nextFrames, activeFrameIndex: toIndex, isDirty: true })
  },

  setActiveFrameIndex: (index) => set({ activeFrameIndex: index, selection: [] }),

  setFrameDuration: (index, durationMs) => {
    const { frames } = get()
    const nextFrames = frames.map((f, i) => (i === index ? { ...f, durationMs } : f))
    set({ frames: nextFrames, isDirty: true })
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  undo: () => {
    const { past, frames, activeFrameIndex, future } = get()
    if (!past.length) return
    const previous = past[past.length - 1]!
    set({
      frames: previous.frames,
      activeFrameIndex: previous.activeFrameIndex,
      past: past.slice(0, -1),
      future: [{ frames, activeFrameIndex }, ...future].slice(0, MAX_HISTORY),
      selection: [],
      isDirty: true,
    })
  },

  redo: () => {
    const { future, frames, activeFrameIndex, past } = get()
    if (!future.length) return
    const next = future[0]!
    set({
      frames: next.frames,
      activeFrameIndex: next.activeFrameIndex,
      future: future.slice(1),
      past: [...past, { frames, activeFrameIndex }].slice(-MAX_HISTORY),
      selection: [],
      isDirty: true,
    })
  },
}))

function pushHistory(
  get: () => EditorState,
  set: (partial: Partial<EditorState>) => void,
) {
  const { frames, activeFrameIndex, past } = get()
  const snapshot: FramesSnapshot = {
    frames: cloneFrames(frames),
    activeFrameIndex,
  }
  set({ past: [...past, snapshot].slice(-MAX_HISTORY), future: [] })
}
