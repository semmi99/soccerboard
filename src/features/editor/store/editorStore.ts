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

/** Object types whose data has one plain hex "color" field — used by the
 * multi-select color picker so a whole batch (e.g. two arrows) can be
 * recolored at once. Shapes/quote cards are deliberately excluded: their
 * fill is stored as an rgba string with its own separate opacity, a
 * different convention that a single flat hex swatch would clobber. */
function withPrimaryColor(o: FrameObject, color: string): FrameObject {
  switch (o.objectType) {
    case 'arrow':
    case 'connector':
    case 'text':
    case 'ball':
    case 'training_equipment':
      return { ...o, data: { ...o.data, color } } as FrameObject
    default:
      return o
  }
}

export function hasPrimaryColor(o: FrameObject): boolean {
  return (
    o.objectType === 'arrow' ||
    o.objectType === 'connector' ||
    o.objectType === 'text' ||
    o.objectType === 'ball' ||
    o.objectType === 'training_equipment'
  )
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
  /** Draws a light line from each player/ball's previous-frame position to
   * its current one — a persistent, always-on version of the editor-only
   * motion guide, visible for every mover at once (not just the selection),
   * including during playback. */
  showMovementTrails: boolean
  fieldCrop: FieldCrop
  /** Flips a non-full field crop to show the other end of the pitch (the
   * other goal) — a no-op for the full crop, which already shows both. */
  fieldMirrored: boolean
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
  /** In-memory copy/paste buffer (not persisted with the project) — holds
   * whatever was last copied/cut so it can be pasted again, including into
   * a different frame. */
  clipboard: FrameObject[]

  loadProject: (opts: {
    projectId: string
    projectTitle: string
    pitchDesign: PitchDesign
    orientation: PitchOrientation
    teamId: string | null
    zoneGridStyle: ZoneGridStyle
    zoneGridCustomId: string | null
    showPitchMarkings: boolean
    showMovementTrails: boolean
    fieldCrop: FieldCrop
    fieldMirrored: boolean
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
  setShowMovementTrails: (show: boolean) => void
  setFieldCrop: (crop: FieldCrop) => void
  setFieldMirrored: (mirrored: boolean) => void
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
  addImageObject: (url: string, naturalWidth: number, naturalHeight: number) => void
  addReferenceImageObject: (url: string, naturalWidth: number, naturalHeight: number) => void
  placeGroupAt: (x: number, y: number) => void
  addConnector: (fromId: string, toId: string) => void
  setLastConnectorColor: (color: string) => void
  applyFormationToFrame: (positions: FormationPosition[], players: FormationPlayer[]) => void
  beginHistoryCheckpoint: () => void
  updateObjectLive: (objectId: string, patch: Partial<FrameObject>) => void
  setObjectPositions: (patches: { id: string; x: number; y: number }[]) => void
  applyEquipmentStyleToAll: (
    kind: EquipmentKind,
    patch: { color?: string; scale?: number; rotation?: number },
  ) => void
  setSelectedLocked: (locked: boolean) => void
  setColorForSelected: (color: string) => void
  removeSelected: () => void
  clearActiveFrame: () => void
  duplicateSelected: () => void
  addRatioBadgeFromSelection: () => void
  bringToFront: (objectId: string) => void
  sendToBack: (objectId: string) => void
  nudgeSelected: (dx: number, dy: number) => void
  copySelected: () => void
  cutSelected: () => void
  pasteClipboard: () => void

  addFrame: (maxFrames: number) => boolean
  removeFrame: (index: number) => void
  duplicateFrame: (index: number, maxFrames: number) => boolean
  appendFrames: (newFrames: EditorFrame[], maxFrames: number) => boolean
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
  showMovementTrails: false,
  fieldCrop: 'full',
  fieldMirrored: false,
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
  clipboard: [],

  loadProject: ({
    projectId,
    projectTitle,
    pitchDesign,
    orientation,
    teamId,
    zoneGridStyle,
    zoneGridCustomId,
    showPitchMarkings,
    showMovementTrails,
    fieldCrop,
    fieldMirrored,
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
      showMovementTrails,
      fieldCrop,
      fieldMirrored,
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
      showMovementTrails: false,
      fieldCrop: 'full',
      fieldMirrored: false,
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
  setShowMovementTrails: (show) => set({ showMovementTrails: show, isDirty: true }),
  setFieldCrop: (crop) => set({ fieldCrop: crop, isDirty: true }),
  setFieldMirrored: (mirrored) => set({ fieldMirrored: mirrored, isDirty: true }),
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
    const { tool, frames, activeFrameIndex, pendingPlayer, pendingPlayers, teamKit, orientation } = get()
    if (tool === 'select') return
    if (
      pendingPlayers.length > 0 &&
      (tool === 'player_home' || tool === 'player_away' || tool === 'player_home_gk' || tool === 'player_away_gk')
    ) {
      get().placeGroupAt(x, y)
      return
    }
    const created = createObjectForTool(tool, x, y, pendingPlayer, orientation)
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

  // Images are placed immediately after upload (there's no click-to-place
  // step like other tools, since the file has to exist first) — dropped at
  // the pitch center, capped to a reasonable max size so a huge photo
  // doesn't blow past the pitch, then selected so the user can drag/resize
  // it right away.
  addImageObject: (url, naturalWidth, naturalHeight) => {
    const { frames, activeFrameIndex, orientation } = get()
    pushHistory(get, set)
    const stage = PITCH_STAGE_SIZE[orientation]
    const maxDim = 220
    const ratio = Math.min(maxDim / naturalWidth, maxDim / naturalHeight, 1)
    const width = naturalWidth * ratio
    const height = naturalHeight * ratio
    const frame = frames[activeFrameIndex]!
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const newObject: FrameObject = {
      id: crypto.randomUUID(),
      x: stage.width / 2,
      y: stage.height / 2,
      rotation: 0,
      scale: 1,
      zIndex: maxZ + 1,
      objectType: 'image',
      data: { url, width, height },
    }
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, newObject] } : f,
    )
    set({ frames: nextFrames, selection: [newObject.id], tool: 'select', isDirty: true })
  },

  // "Trace over a match photo" workflow: the image fills the pitch (rather
  // than the small default insert size), starts dimmed so player chips
  // placed on top stay legible, and is sent behind everything already on
  // the frame. Left unlocked (unlike an earlier version of this) since the
  // photo rarely lines up with the pitch on the first try — the user needs
  // to drag/rotate it into alignment before tracing over it; a manual lock
  // toggle is still available in the sidebar once it's positioned.
  addReferenceImageObject: (url, naturalWidth, naturalHeight) => {
    const { frames, activeFrameIndex, orientation } = get()
    pushHistory(get, set)
    const stage = PITCH_STAGE_SIZE[orientation]
    const ratio = Math.min(stage.width / naturalWidth, stage.height / naturalHeight)
    const width = naturalWidth * ratio
    const height = naturalHeight * ratio
    const frame = frames[activeFrameIndex]!
    const minZ = frame.objects.reduce((m, o) => Math.min(m, o.zIndex), 0)
    const newObject: FrameObject = {
      id: crypto.randomUUID(),
      x: stage.width / 2,
      y: stage.height / 2,
      rotation: 0,
      scale: 1,
      zIndex: minZ - 1,
      objectType: 'image',
      data: { url, width, height, opacity: 0.55 },
    }
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, newObject] } : f,
    )
    set({ frames: nextFrames, selection: [newObject.id], tool: 'select', isDirty: true })
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

  // Batched sibling of updateObjectLive — applied during a group drag (see
  // EditorCanvas's handleDragMove) so every object in a multi-selection
  // moves by the same delta in one store update instead of the dragged
  // object alone.
  setObjectPositions: (patches) => {
    const { frames, activeFrameIndex } = get()
    if (!patches.length) return
    const patchMap = new Map(patches.map((p) => [p.id, p]))
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.map((o) => {
              const p = patchMap.get(o.id)
              return p ? { ...o, x: p.x, y: p.y } : o
            }),
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

  setSelectedLocked: (locked) => {
    const { selection, frames, activeFrameIndex } = get()
    if (!selection.length) return
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? { ...f, objects: f.objects.map((o) => (selection.includes(o.id) ? { ...o, locked } : o)) }
        : f,
    )
    set({ frames: nextFrames, isDirty: true })
  },

  // Recolors every selected object that has a plain hex color field (see
  // withPrimaryColor) — e.g. two selected arrows both take the new color
  // at once — silently leaving any selected object without one (shapes,
  // player chips, ...) untouched.
  setColorForSelected: (color) => {
    const { selection, frames, activeFrameIndex } = get()
    if (!selection.length) return
    pushHistory(get, set)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? { ...f, objects: f.objects.map((o) => (selection.includes(o.id) ? withPrimaryColor(o, color) : o)) }
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

  // Arrow-key nudge: moves every selected, unlocked object by the same
  // delta. Connectors aren't in `selection` themselves (their line is
  // derived from the two chips they join) so they follow along for free.
  nudgeSelected: (dx, dy) => {
    const { selection, frames, activeFrameIndex } = get()
    if (!selection.length) return
    pushHistory(get, set)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.map((o) =>
              selection.includes(o.id) && !o.locked ? { ...o, x: o.x + dx, y: o.y + dy } : o,
            ),
          }
        : f,
    )
    set({ frames: nextFrames, isDirty: true })
  },

  // Copies the current selection into an in-memory clipboard (data only —
  // pasting always mints fresh ids) so it can be pasted again, including
  // into a different frame or after switching frames entirely.
  copySelected: () => {
    const { selection, frames, activeFrameIndex } = get()
    if (!selection.length) return
    const frame = frames[activeFrameIndex]!
    const copied = frame.objects.filter((o) => selection.includes(o.id)).map(cloneObject)
    if (!copied.length) return
    set({ clipboard: copied })
  },

  cutSelected: () => {
    if (!get().selection.length) return
    get().copySelected()
    get().removeSelected()
  },

  // Pastes the clipboard into the CURRENTLY active frame (which may not be
  // the frame it was copied from) with fresh ids, offset slightly so the
  // paste is visibly distinct from the source instead of sitting exactly on
  // top of it. A connector is only kept if both the chips it joins were
  // copied alongside it — remapped to their pasted (new-id) counterparts —
  // otherwise it would dangle off objects that may not exist in the target
  // frame at all.
  pasteClipboard: () => {
    const { clipboard, frames, activeFrameIndex } = get()
    if (!clipboard.length) return
    pushHistory(get, set)
    const idMap = new Map<string, string>()
    for (const o of clipboard) idMap.set(o.id, crypto.randomUUID())
    const frame = frames[activeFrameIndex]!
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const pasted: FrameObject[] = clipboard
      .map((o, i) => {
        if (o.objectType === 'connector') {
          const fromId = idMap.get(o.data.fromId)
          const toId = idMap.get(o.data.toId)
          if (!fromId || !toId) return null
          return {
            ...cloneObject(o),
            id: idMap.get(o.id)!,
            zIndex: maxZ + 1 + i,
            data: { ...o.data, fromId, toId },
          } as FrameObject
        }
        return {
          ...cloneObject(o),
          id: idMap.get(o.id)!,
          x: o.x + 24,
          y: o.y + 24,
          zIndex: maxZ + 1 + i,
        } as FrameObject
      })
      .filter((o): o is FrameObject => o !== null)
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, ...pasted] } : f,
    )
    set({
      frames: nextFrames,
      selection: pasted.map((p) => p.id),
      isDirty: true,
    })
  },

  // Counts home vs away among the currently-selected player chips (e.g. from
  // a marquee drag over a group) and drops a "X v Y" badge at their
  // centroid — the numbers-up/down callout tactical explainers use, without
  // having to type the ratio by hand or recount it after moving players.
  addRatioBadgeFromSelection: () => {
    const { frames, activeFrameIndex, selection } = get()
    const frame = frames[activeFrameIndex]
    if (!frame) return
    const chips = frame.objects.filter(
      (o): o is Extract<FrameObject, { objectType: 'player_chip' }> =>
        o.objectType === 'player_chip' && selection.includes(o.id),
    )
    if (chips.length < 2) return
    const homeCount = chips.filter((c) => c.data.team === 'home').length
    const awayCount = chips.filter((c) => c.data.team === 'away').length
    const cx = chips.reduce((s, c) => s + c.x, 0) / chips.length
    const cy = chips.reduce((s, c) => s + c.y, 0) / chips.length

    pushHistory(get, set)
    const maxZ = frame.objects.reduce((m, o) => Math.max(m, o.zIndex), -1)
    const newObject: FrameObject = {
      id: crypto.randomUUID(),
      x: cx,
      y: cy - 55,
      rotation: 0,
      scale: 1,
      zIndex: maxZ + 1,
      objectType: 'text',
      data: {
        text: `${homeCount} v ${awayCount}`,
        fontSize: 20,
        color: '#0f172a',
        fontStyle: 'bold',
        background: '#ffe100',
      },
    }
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex ? { ...f, objects: [...f.objects, newObject] } : f,
    )
    set({ frames: nextFrames, selection: [newObject.id], isDirty: true })
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

  // Inserts a saved exercise's frames (see src/lib/supabase/exercises.ts) at
  // the end of the current sequence, so a full training session is built by
  // chaining several exercises one after another. Every id is regenerated —
  // unlike duplicateFrame, these frames never need to tween from/into the
  // project's existing frames, so there's no reason to keep the source
  // exercise's own ids (and reusing them risks colliding with a second
  // insert of the same exercise later).
  appendFrames: (newFrames, maxFrames) => {
    const { frames } = get()
    if (frames.length + newFrames.length > maxFrames) return false
    pushHistory(get, set)
    const cloned: EditorFrame[] = newFrames.map((f) => ({
      id: crypto.randomUUID(),
      durationMs: f.durationMs,
      objects: f.objects.map((o) => ({ ...cloneObject(o), id: crypto.randomUUID() })),
    }))
    set({ frames: [...frames, ...cloned], activeFrameIndex: frames.length, isDirty: true })
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
