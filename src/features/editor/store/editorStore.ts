import { create } from 'zustand'
import type {
  EditorFrame,
  EquipmentKind,
  FieldCrop,
  FrameObject,
  PitchDesign,
  PitchOrientation,
  TeamKit,
  ToolId,
  ZoneGridLine,
  ZoneGridStyle,
} from '../types'
import { createObjectForTool, type PendingRealPlayer } from '../objects/factory'
import { PITCH_STAGE_SIZE } from '../constants'
import type { FormationPosition } from '../../formations/presets'

export interface FormationPlayer {
  id: string
  jerseyNumber: number | null
  label: string
  isGoalkeeper?: boolean
}

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
  zoneGridStyle: ZoneGridStyle
  zoneGridCustomId: string | null
  /** Resolved lines for `zoneGridCustomId`, pushed in by whoever fetched the
   * org's saved zone grids (mirrors how `teamKit` is resolved from `teamId`). */
  zoneGridCustomLines: ZoneGridLine[]
  showPitchMarkings: boolean
  fieldCrop: FieldCrop
  pitchLengthM: number
  pitchWidthM: number
  teamId: string | null
  teamKit: TeamKit | null
  /** Kit colors chosen when no real team is linked to the project — persisted
   * with the project itself since there's no team row to hang it off of. */
  customKit: TeamKit | null
  playerPhotos: Record<string, string>
  frames: EditorFrame[]
  activeFrameIndex: number
  selection: string[]
  tool: ToolId
  pendingPlayer: PendingRealPlayer | null
  pendingPlayers: PendingRealPlayer[]
  connectorDraftFromId: string | null
  lastConnectorColor: string
  isPlaying: boolean
  isDirty: boolean
  past: FramesSnapshot[]
  future: FramesSnapshot[]

  loadProject: (opts: {
    projectId: string
    projectTitle: string
    pitchDesign: PitchDesign
    orientation: PitchOrientation
    teamId: string | null
    zoneGridStyle: ZoneGridStyle
    zoneGridCustomId: string | null
    showPitchMarkings: boolean
    fieldCrop: FieldCrop
    pitchLengthM: number
    pitchWidthM: number
    customKit: TeamKit | null
    frames: EditorFrame[]
  }) => void
  resetToBlankProject: () => void
  markSaved: () => void
  setProjectId: (id: string) => void

  setPitchDesign: (d: PitchDesign) => void
  setOrientation: (o: PitchOrientation) => void
  setZoneGridStyle: (style: ZoneGridStyle) => void
  setZoneGridCustomId: (id: string | null) => void
  setZoneGridCustomLines: (lines: ZoneGridLine[]) => void
  setShowPitchMarkings: (show: boolean) => void
  setFieldCrop: (crop: FieldCrop) => void
  setPitchLengthM: (m: number) => void
  setPitchWidthM: (m: number) => void
  setProjectTitle: (title: string) => void
  setTeamId: (id: string | null) => void
  setTeamKit: (kit: TeamKit | null) => void
  setCustomKit: (kit: TeamKit) => void
  setPlayerPhotos: (photos: Record<string, string>) => void
  setTool: (tool: ToolId) => void
  setSelection: (ids: string[]) => void
  setPendingPlayer: (player: PendingRealPlayer | null) => void
  setPendingPlayers: (players: PendingRealPlayer[]) => void
  setConnectorDraftFromId: (id: string | null) => void

  activeFrame: () => EditorFrame

  addObjectAt: (x: number, y: number) => void
  placeGroupAt: (x: number, y: number) => void
  addConnector: (fromId: string, toId: string) => void
  setLastConnectorColor: (color: string) => void
  applyFormationToFrame: (positions: FormationPosition[], players: FormationPlayer[]) => void
  beginHistoryCheckpoint: () => void
  updateObjectLive: (objectId: string, patch: Partial<FrameObject>) => void
  applyEquipmentStyleToAll: (
    kind: EquipmentKind,
    patch: { color?: string; scale?: number; rotation?: number },
  ) => void
  removeSelected: () => void
  clearActiveFrame: () => void
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
  zoneGridStyle: 'none',
  zoneGridCustomId: null,
  zoneGridCustomLines: [],
  showPitchMarkings: true,
  fieldCrop: 'full',
  pitchLengthM: 105,
  pitchWidthM: 68,
  teamId: null,
  teamKit: null,
  customKit: null,
  playerPhotos: {},
  frames: [emptyFrame()],
  activeFrameIndex: 0,
  selection: [],
  tool: 'select',
  pendingPlayer: null,
  pendingPlayers: [],
  connectorDraftFromId: null,
  lastConnectorColor: '#f0d878',
  isPlaying: false,
  isDirty: false,
  past: [],
  future: [],

  loadProject: ({
    projectId,
    projectTitle,
    pitchDesign,
    orientation,
    teamId,
    zoneGridStyle,
    zoneGridCustomId,
    showPitchMarkings,
    fieldCrop,
    pitchLengthM,
    pitchWidthM,
    customKit,
    frames,
  }) => {
    set({
      projectId,
      projectTitle,
      pitchDesign,
      orientation,
      zoneGridStyle,
      zoneGridCustomId,
      zoneGridCustomLines: [],
      showPitchMarkings,
      fieldCrop,
      pitchLengthM,
      pitchWidthM,
      teamId,
      teamKit: teamId ? null : customKit,
      customKit,
      playerPhotos: {},
      frames: frames.length ? frames : [emptyFrame()],
      activeFrameIndex: 0,
      selection: [],
      pendingPlayer: null,
      pendingPlayers: [],
      connectorDraftFromId: null,
      lastConnectorColor: '#f0d878',
      past: [],
      future: [],
      isDirty: false,
    })
  },

  setProjectId: (id) => set({ projectId: id }),

  resetToBlankProject: () => {
    set({
      projectId: null,
      projectTitle: 'Neues Projekt',
      pitchDesign: 'brand_blue',
      zoneGridStyle: 'none',
      zoneGridCustomId: null,
      zoneGridCustomLines: [],
      showPitchMarkings: true,
      fieldCrop: 'full',
      pitchLengthM: 105,
      pitchWidthM: 68,
      teamId: null,
      teamKit: null,
      customKit: null,
      playerPhotos: {},
      frames: [emptyFrame()],
      activeFrameIndex: 0,
      selection: [],
      pendingPlayer: null,
      pendingPlayers: [],
      connectorDraftFromId: null,
      lastConnectorColor: '#f0d878',
      past: [],
      future: [],
      isDirty: false,
    })
  },

  markSaved: () => set({ isDirty: false }),

  setPitchDesign: (d) => set({ pitchDesign: d, isDirty: true }),
  setOrientation: (o) => set({ orientation: o, isDirty: true }),
  setZoneGridStyle: (style) => set({ zoneGridStyle: style, isDirty: true }),
  setZoneGridCustomId: (id) => set({ zoneGridCustomId: id, isDirty: true }),
  setZoneGridCustomLines: (lines) => set({ zoneGridCustomLines: lines }),
  setShowPitchMarkings: (show) => set({ showPitchMarkings: show, isDirty: true }),
  setFieldCrop: (crop) => set({ fieldCrop: crop, isDirty: true }),
  setPitchLengthM: (m) => set({ pitchLengthM: m, isDirty: true }),
  setPitchWidthM: (m) => set({ pitchWidthM: m, isDirty: true }),
  setProjectTitle: (title) => set({ projectTitle: title, isDirty: true }),
  setTeamId: (id) => set({ teamId: id, isDirty: true }),
  setTeamKit: (kit) => set({ teamKit: kit }),
  setCustomKit: (kit) => set({ customKit: kit, teamKit: kit, isDirty: true }),
  setPlayerPhotos: (photos) => set({ playerPhotos: photos }),
  setTool: (tool) => set({ tool, selection: [] }),
  setSelection: (ids) => set({ selection: ids }),
  setPendingPlayer: (player) => set({ pendingPlayer: player }),
  setPendingPlayers: (players) => set({ pendingPlayers: players }),
  setConnectorDraftFromId: (id) => set({ connectorDraftFromId: id }),

  activeFrame: () => {
    const { frames, activeFrameIndex } = get()
    return frames[activeFrameIndex] ?? frames[0]!
  },

  addObjectAt: (x, y) => {
    const { tool, frames, activeFrameIndex, pendingPlayer, pendingPlayers, teamKit } = get()
    if (tool === 'select') return
    if (
      pendingPlayers.length > 0 &&
      (tool === 'player_home' || tool === 'player_away' || tool === 'player_home_gk' || tool === 'player_away_gk')
    ) {
      get().placeGroupAt(x, y)
      return
    }
    const created = createObjectForTool(tool, x, y, pendingPlayer)
    if (!created) return

    pushHistory(get, set)
    const frame = frames[activeFrameIndex]!
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const scale =
      created.objectType === 'player_chip' && teamKit ? teamKit.chipScale : created.scale
    const newObject: FrameObject = { ...created, scale, zIndex: maxZ + 1 }
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, newObject] } : f,
    )
    set({
      frames: nextFrames,
      selection: [newObject.id],
      pendingPlayer: null,
      isDirty: true,
    })
  },

  placeGroupAt: (x, y) => {
    const { tool, pendingPlayers, frames, activeFrameIndex, teamKit } = get()
    if (!pendingPlayers.length) return
    const team = tool === 'player_away' || tool === 'player_away_gk' ? 'away' : 'home'
    const isGkTool = tool === 'player_home_gk' || tool === 'player_away_gk'

    pushHistory(get, set)
    const frame = frames[activeFrameIndex]!
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const scale = teamKit?.chipScale ?? 1
    const spacing = 46
    const n = pendingPlayers.length
    const startX = x - ((n - 1) * spacing) / 2

    const newObjects: FrameObject[] = pendingPlayers.map((p, i) => ({
      id: crypto.randomUUID(),
      x: startX + i * spacing,
      y,
      rotation: 0,
      scale,
      zIndex: maxZ + 1 + i,
      objectType: 'player_chip',
      data: {
        team,
        number: p.jerseyNumber ?? i + 1,
        label: p.label,
        playerId: p.id,
        isGoalkeeper: isGkTool || p.isGoalkeeper,
      },
    }))

    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, ...newObjects] } : f,
    )
    set({
      frames: nextFrames,
      selection: newObjects.map((o) => o.id),
      pendingPlayers: [],
      isDirty: true,
    })
  },

  addConnector: (fromId, toId) => {
    if (fromId === toId) return
    const { frames, activeFrameIndex, lastConnectorColor } = get()
    const frame = frames[activeFrameIndex]!
    const exists = frame.objects.some(
      (o) =>
        o.objectType === 'connector' &&
        ((o.data.fromId === fromId && o.data.toId === toId) ||
          (o.data.fromId === toId && o.data.toId === fromId)),
    )
    if (exists) {
      set({ connectorDraftFromId: null })
      return
    }
    pushHistory(get, set)
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const newObject: FrameObject = {
      id: crypto.randomUUID(),
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      zIndex: maxZ + 1,
      objectType: 'connector',
      // The first connector line drawn sets the color for the rest of the
      // chain (see setLastConnectorColor) instead of always resetting to a
      // hardcoded default, so a multi-hop connection reads as one sequence.
      data: { fromId, toId, color: lastConnectorColor, strokeWidth: 2.5, lineStyle: 'dashed' },
    }
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, newObject] } : f,
    )
    set({
      frames: nextFrames,
      selection: [newObject.id],
      connectorDraftFromId: null,
      isDirty: true,
    })
  },

  setLastConnectorColor: (color) => set({ lastConnectorColor: color }),

  applyFormationToFrame: (positions, players) => {
    pushHistory(get, set)
    const { frames, activeFrameIndex, orientation, teamKit } = get()
    const stage = PITCH_STAGE_SIZE[orientation]
    const chipScale = teamKit?.chipScale ?? 1
    const frame = frames[activeFrameIndex]!
    const keptObjects = frame.objects.filter(
      (o) => !(o.objectType === 'player_chip' && o.data.team === 'home'),
    )
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const sortedPlayers = [...players].sort(
      (a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999),
    )

    const newChips: FrameObject[] = positions.map((pos, i) => {
      const player = sortedPlayers[i]
      const px = orientation === 'vertical' ? pos.x * stage.width : pos.y * stage.width
      const py = orientation === 'vertical' ? (1 - pos.y) * stage.height : pos.x * stage.height
      return {
        id: crypto.randomUUID(),
        x: px,
        y: py,
        rotation: 0,
        scale: chipScale,
        zIndex: maxZ + 1 + i,
        objectType: 'player_chip',
        data: player
          ? {
              team: 'home',
              number: player.jerseyNumber ?? i + 1,
              label: player.label,
              playerId: player.id,
              isGoalkeeper: player.isGoalkeeper ?? pos.role === 'TW',
            }
          : { team: 'home', number: i + 1, label: pos.role, isGoalkeeper: pos.role === 'TW' },
      } as FrameObject
    })

    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...keptObjects, ...newChips] } : f,
    )
    set({ frames: nextFrames, selection: [], isDirty: true })
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

  applyEquipmentStyleToAll: (kind, patch) => {
    const { frames, activeFrameIndex } = get()
    pushHistory(get, set)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.map((o) =>
              o.objectType === 'training_equipment' && o.data.kind === kind
                ? {
                    ...o,
                    scale: patch.scale ?? o.scale,
                    rotation: patch.rotation ?? o.rotation,
                    data: { ...o.data, color: patch.color ?? o.data.color },
                  }
                : o,
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
    const removedIds = new Set(selection)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.filter((o) => {
              if (removedIds.has(o.id)) return false
              if (o.objectType === 'connector') {
                return !removedIds.has(o.data.fromId) && !removedIds.has(o.data.toId)
              }
              return true
            }),
          }
        : f,
    )
    set({ frames: nextFrames, selection: [], isDirty: true })
  },

  clearActiveFrame: () => {
    const { frames, activeFrameIndex } = get()
    if (!frames[activeFrameIndex]!.objects.length) return
    pushHistory(get, set)
    const nextFrames = frames.map((f, i) => (i === activeFrameIndex ? { ...f, objects: [] } : f))
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
