export type Team = 'home' | 'away'
export type LineStyle = 'solid' | 'dashed' | 'dotted'
export type ArrowShape = 'straight' | 'curved' | 'polyline'
export type ShapeKind = 'circle' | 'rect' | 'polygon'
export type EquipmentKind =
  | 'cone'
  | 'mini_goal'
  | 'mannequin'
  | 'slalom_pole'
  | 'ladder'

export interface PlayerChipData {
  team: Team
  number: number
  label: string
  playerId?: string
  isGoalkeeper?: boolean
  /** Short tactical role tag rendered above the chip (e.g. "PIVOT", "FREE",
   * "RB") — distinct from `label`, which is the player's name below it. */
  roleLabel?: string
}

export type KitPattern = 'solid' | 'stripes' | 'hoops' | 'sash' | 'split' | 'collar'

export interface KitConfig {
  pattern: KitPattern
  color1: string
  color2: string
}

export interface TeamKit {
  home: KitConfig
  away: KitConfig
  gk: KitConfig
  chipScale: number
}

export interface ArrowData {
  shape: ArrowShape
  points: number[] // flat [x1,y1,x2,y2,...] relative to the object's x/y anchor
  lineStyle: LineStyle
  color: string
  strokeWidth: number
  showArrowhead?: boolean // false renders as a plain line (e.g. freehand zone dividers)
  curveOffset?: number // curved arrows only: perpendicular bend depth, user-adjustable
}

export interface ShapeData {
  kind: ShapeKind
  width: number
  height: number
  points?: number[] // polygon only, relative to x/y anchor
  fill: string
  stroke: string
  strokeWidth: number
  lineStyle: LineStyle
  opacity: number
}

export interface TextData {
  text: string
  fontSize: number
  color: string
  fontStyle: 'normal' | 'bold' | 'italic'
}

export interface EquipmentData {
  kind: EquipmentKind
  color?: string
}

export interface BallData {
  color?: string
}

export interface ConnectorData {
  fromId: string
  toId: string
  color: string
  strokeWidth: number
  lineStyle: LineStyle
}

export interface PlayerZoneData {
  playerIds: string[] // ordered polygon vertices, resolved live from player_chip positions
  fill: string
  stroke: string
  opacity: number
  /** Optional call-out rendered centered in the zone (e.g. "4 v 3"). */
  label?: string
}

export type ObjectType =
  | 'player_chip'
  | 'arrow'
  | 'shape'
  | 'text'
  | 'training_equipment'
  | 'ball'
  | 'connector'
  | 'player_zone'

export interface FrameObjectBase {
  id: string
  x: number
  y: number
  rotation: number
  scale: number
  zIndex: number
}

export type FrameObject =
  | (FrameObjectBase & { objectType: 'player_chip'; data: PlayerChipData })
  | (FrameObjectBase & { objectType: 'arrow'; data: ArrowData })
  | (FrameObjectBase & { objectType: 'shape'; data: ShapeData })
  | (FrameObjectBase & { objectType: 'text'; data: TextData })
  | (FrameObjectBase & { objectType: 'training_equipment'; data: EquipmentData })
  | (FrameObjectBase & { objectType: 'ball'; data: BallData })
  | (FrameObjectBase & { objectType: 'connector'; data: ConnectorData })
  | (FrameObjectBase & { objectType: 'player_zone'; data: PlayerZoneData })

/** Lower-third overlay shown on the pitch for this frame and baked into
 * PNG/video export — a step badge, headline, and optional subline, matching
 * the "coaching explainer" caption style used in social-media tactics reels.
 * Rendered only when `title` is non-empty. */
export interface FrameCaption {
  badge?: string
  title: string
  subtitle?: string
  /** Position of the block's anchor (its bottom-left corner), draggable in
   * the editor. Defaults to the stage's bottom-left when unset. */
  x?: number
  y?: number
}

export interface EditorFrame {
  id: string
  durationMs: number
  objects: FrameObject[]
  caption?: FrameCaption
}

export type PitchDesign =
  | 'classic_green'
  | 'night_navy'
  | 'dark_orange'
  | 'turquoise'
  | 'royal_blue'
  | 'maroon'
  | 'light_gray'
export type PitchOrientation = 'vertical' | 'horizontal'
export type ZoneGridStyle = 'none' | 'thirds_channels' | 'guardiola'
/** How much of the pitch's length is shown/exported: the full pitch, or a
 * zoomed-in slice of just the attacking end for corner-kick/set-piece
 * diagrams. */
export type FieldCrop = 'full' | 'half' | 'three_quarter' | 'third'

export type ToolId =
  | 'select'
  | 'player_home'
  | 'player_away'
  | 'player_home_gk'
  | 'player_away_gk'
  | 'arrow_straight'
  | 'arrow_curved'
  | 'line_straight'
  | 'pass_release'
  | 'pass_bounce'
  | 'run_arrow'
  | 'shape_circle'
  | 'shape_rect'
  | 'shape_polygon'
  | 'text'
  | 'ball'
  | 'connector'
  | 'player_zone'
  | `equipment_${EquipmentKind}`
