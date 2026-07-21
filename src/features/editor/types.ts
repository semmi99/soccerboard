export type Team = 'home' | 'away'
export type LineStyle = 'solid' | 'dashed' | 'dotted'
export type ArrowShape = 'straight' | 'curved' | 'polyline'
export type ShapeKind = 'circle' | 'rect'
export type EquipmentKind =
  | 'cone'
  | 'mini_goal'
  | 'mannequin'
  | 'slalom_pole'
  | 'ladder'
  | 'ring'

export interface PlayerChipData {
  team: Team
  number: number
  label: string
  playerId?: string
  isGoalkeeper?: boolean
  /** Overrides what's shown in the chip circle instead of `number` — a
   * letter, other text, or (when explicitly set to '') nothing at all.
   * `undefined` means "show the number" (the default). */
  displayText?: string
  /** Pulses a glowing ring around the chip so it draws attention in this
   * frame — e.g. to call out who a sequence is about. */
  highlighted?: boolean
  /** Bends this object's playback path from the previous frame's position
   * into this one — a quadratic-curve control point in stage coordinates,
   * dragged via the editor's motion-guide handle. `undefined`/`null` means
   * a straight line (the original behavior). */
  motionBend?: [number, number] | null
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
  /** When set, every chip of this team renders this badge image instead of
   * its kit colors — a crest doesn't have a home/away variant. */
  crestUrl?: string | null
}

export interface ArrowData {
  shape: ArrowShape
  points: number[] // flat [x1,y1,x2,y2,...] relative to the object's x/y anchor
  lineStyle: LineStyle
  color: string
  strokeWidth: number
  showArrowhead?: boolean // false renders as a plain line (e.g. freehand zone dividers)
  curveOffset?: number // curved arrows only: perpendicular bend depth, user-adjustable
  /** Shows the real-world pass/run distance (computed from the project's
   * pitch size) as a small label near the arrow's midpoint. */
  showDistance?: boolean
}

export interface ShapeData {
  kind: ShapeKind
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  lineStyle: LineStyle
  opacity: number
  /** When set, the shape fills with a radial gradient from this color
   * (solid at the center) fading out at its edge — e.g. for heatmap-style
   * pitch zones — instead of the flat `fill` color. */
  gradientColor?: string | null
  /** Second gradient stop color (the edge). When unset/null, falls back to
   * gradientColor faded to fully transparent (the original single-color
   * look) instead of a genuine two-color blend. */
  gradientColor2?: string | null
  /** Hides the border entirely, regardless of `stroke`/`strokeWidth`. */
  noBorder?: boolean
}

export interface TextData {
  text: string
  fontSize: number
  color: string
  fontStyle: 'normal' | 'bold' | 'italic'
  /** Pill background color — the "Badge" text preset's look, but available
   * to any text object. */
  background?: string
  /** Drop shadow for legibility over busy pitch backgrounds — used by the
   * "Titel"/"Untertitel" text presets. */
  shadow?: boolean
}

export interface EquipmentData {
  kind: EquipmentKind
  color?: string
  /** Independent width/height stretch (from a free corner-drag resize),
   * applied on top of the object's own uniform `scale` — lets a cone or
   * ladder be pulled long without also getting proportionally wider. */
  scaleX?: number
  scaleY?: number
}

export interface BallData {
  color?: string
  /** Same as `PlayerChipData.motionBend` — bends the ball's playback path
   * from the previous frame's position into this one. */
  motionBend?: [number, number] | null
}

export interface ConnectorData {
  fromId: string
  toId: string
  color: string
  strokeWidth: number
  /** Shows the real-world distance (from the project's pitch size) between
   * the two connected players as a small label at the midpoint. */
  showDistance?: boolean
  lineStyle: LineStyle
}

export type ObjectType =
  | 'player_chip'
  | 'arrow'
  | 'shape'
  | 'text'
  | 'training_equipment'
  | 'ball'
  | 'connector'

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

export interface EditorFrame {
  id: string
  durationMs: number
  objects: FrameObject[]
}

export type PitchDesign =
  | 'classic_green'
  | 'night_navy'
  | 'dark_orange'
  | 'turquoise'
  | 'royal_blue'
  | 'maroon'
  | 'light_gray'
  | 'brand_blue'
export type PitchOrientation = 'vertical' | 'horizontal'
export type ZoneGridStyle = 'none' | 'thirds_channels' | 'guardiola' | 'custom'

export interface ZoneGridLine {
  orientation: 'vertical' | 'horizontal'
  /** Fraction across the pitch's length (vertical lines) or width
   * (horizontal lines), 0..1. */
  position: number
}
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
  | 'line_straight'
  | 'shape_circle'
  | 'shape_rect'
  | 'text'
  | 'text_badge'
  | 'text_title'
  | 'text_subtitle'
  | 'ball'
  | 'connector'
  | `equipment_${EquipmentKind}`
