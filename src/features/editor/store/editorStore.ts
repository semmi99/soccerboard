import { create } from 'zustand'
import type {
  CaptionBadge,
  EditorFrame,
  EquipmentKind,
  FieldCrop,
  FrameCaption,
  FrameCaptionCard,
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

const DEFAULT_CARD_X = 24
const DEFAULT_CARD_Y = 58
const DEFAULT_CARD_WIDTH = 300
const DEFAULT_BADGE_X = 24
const DEFAULT_BADGE_Y = 28

function defaultFrameCaption(): FrameCaption {
  return { badges: [], cards: [] }
}

function cloneCaption(caption: FrameCaption | null | undefined): FrameCaption | null {
  if (!caption) return null
  return {
    badges: caption.badges.map((b) => ({ ...b, id: crypto.randomUUID() })),
    cards: caption.cards.map((c) => ({ ...c, id: crypto.randomUUID() })),
  }
}

function defaultCaptionBadge(existingCount: number): CaptionBadge {
  return {
    id: crypto.randomUUID(),
    text: 'LABEL',
    x: DEFAULT_BADGE_X,
    y: DEFAULT_BADGE_Y + existingCount * 32,
    color: '#ef4444',
  }
}

function defaultFrameCaptionCard(existingCount: number): FrameCaptionCard {
  return {
    id: crypto.randomUUID(),
    cardX: DEFAULT_CARD_X + existingCount * 24,
    cardY: DEFAULT_CARD_Y + existingCount * 24,
    cardWidth: DEFAULT_CARD_WIDTH,
    background: 'rgba(255,255,255,0.97)',
  }
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
  addImageObject: (url: string, naturalWidth: number, naturalHeight: number) => void
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
  addRatioBadgeFromSelection: () => void
  bringToFront: (objectId: string) => void
  sendToBack: (objectId: string) => void

  addFrame: (maxFrames: number) => boolean
  removeFrame: (index: number) => void
  duplicateFrame: (index: number, maxFrames: number) => boolean
  appendFrames: (newFrames: EditorFrame[], maxFrames: number) => boolean
  reorderFrames: (fromIndex: number, toIndex: number) => void
  setActiveFrameIndex: (index: number) => void
  setFrameDuration: (index: number, durationMs: number) => void
  addFrameCaptionBadge: (index: number) => void
  updateFrameCaptionBadge: (index: number, badgeId: string, patch: Partial<CaptionBadge>) => void
  removeFrameCaptionBadge: (index: number, badgeId: string) => void
  addFrameCaptionCard: (index: number) => void
  updateFrameCaptionCard: (index: number, cardId: string, patch: Partial<FrameCaptionCard>) => void
  removeFrameCaptionCard: (index: number, cardId: string) => void
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
    // A small source image (an icon or logo well under maxDim) would
    // otherwise insert at its tiny native pixel size — smaller than the
    // Transformer's own resize handles, so a plain drag lands on a handle
    // instead of the image and triggers a runaway resize that flings it far
    // off the pitch instead of just moving it. Upscaling so the larger side
    // is at least minDim keeps it comfortably bigger than the handles.
    const minDim = 90
    let ratio = Math.min(maxDim / naturalWidth, maxDim / naturalHeight, 1)
    if (Math.max(naturalWidth, naturalHeight) * ratio < minDim) {
      ratio = minDim / Math.max(naturalWidth, naturalHeight)
    }
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
    const { frames, activeFrameIndex, orientation } = get()
    // The Stage's own canvas is sized to exactly match the pitch — there is
    // no "just past the touchline but still visible" margin, the canvas
    // simply stops there. Any object whose x/y ends up past that edge is
    // drawn outside the canvas's pixel bounds and doesn't render at all —
    // invisible, with no on-screen anchor left to grab and pull it back. A
    // runaway drag or rotation (a long arrow especially: a small angle
    // change swings its far end a long way) can push a pivot that far
    // without any error, so it silently vanishes and even survives a save.
    // Clamping the pivot to the pitch's own bounds keeps it always visible
    // regardless of what a stray transform tried to do.
    const stage = PITCH_STAGE_SIZE[orientation]
    const margin = 0
    const clampedPatch = { ...patch }
    if (typeof clampedPatch.x === 'number') {
      clampedPatch.x = Math.max(-margin, Math.min(stage.width + margin, clampedPatch.x))
    }
    if (typeof clampedPatch.y === 'number') {
      clampedPatch.y = Math.max(-margin, Math.min(stage.height + margin, clampedPatch.y))
    }
    const nextFrames = frames.map((f, i) =>
      i === activeFrameIndex
        ? {
            ...f,
            objects: f.objects.map((o) =>
              o.id === objectId ? ({ ...o, ...clampedPatch } as typeof o) : o,
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
      // Carries the caption over instead of dropping it — losing the
      // title/subtitle card on every duplicate meant retyping it for each
      // new beat of what's usually the same ongoing sequence.
      caption: cloneCaption(source.caption),
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

  addFrameCaptionBadge: (index) => {
    const { frames } = get()
    const nextFrames = frames.map((f, i) => {
      if (i !== index) return f
      const caption = f.caption ?? defaultFrameCaption()
      return { ...f, caption: { ...caption, badges: [...caption.badges, defaultCaptionBadge(caption.badges.length)] } }
    })
    set({ frames: nextFrames, isDirty: true })
  },

  updateFrameCaptionBadge: (index, badgeId, patch) => {
    const { frames } = get()
    const nextFrames = frames.map((f, i) => {
      if (i !== index || !f.caption) return f
      return {
        ...f,
        caption: {
          ...f.caption,
          badges: f.caption.badges.map((b) => (b.id === badgeId ? { ...b, ...patch } : b)),
        },
      }
    })
    set({ frames: nextFrames, isDirty: true })
  },

  removeFrameCaptionBadge: (index, badgeId) => {
    const { frames } = get()
    const nextFrames = frames.map((f, i) => {
      if (i !== index || !f.caption) return f
      return { ...f, caption: { ...f.caption, badges: f.caption.badges.filter((b) => b.id !== badgeId) } }
    })
    set({ frames: nextFrames, isDirty: true })
  },

  addFrameCaptionCard: (index) => {
    const { frames } = get()
    const nextFrames = frames.map((f, i) => {
      if (i !== index) return f
      const caption = f.caption ?? defaultFrameCaption()
      return { ...f, caption: { ...caption, cards: [...caption.cards, defaultFrameCaptionCard(caption.cards.length)] } }
    })
    set({ frames: nextFrames, isDirty: true })
  },

  updateFrameCaptionCard: (index, cardId, patch) => {
    const { frames } = get()
    const nextFrames = frames.map((f, i) => {
      if (i !== index || !f.caption) return f
      return {
        ...f,
        caption: {
          ...f.caption,
          cards: f.caption.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
        },
      }
    })
    set({ frames: nextFrames, isDirty: true })
  },

  removeFrameCaptionCard: (index, cardId) => {
    const { frames } = get()
    const nextFrames = frames.map((f, i) => {
      if (i !== index || !f.caption) return f
      return { ...f, caption: { ...f.caption, cards: f.caption.cards.filter((c) => c.id !== cardId) } }
    })
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
