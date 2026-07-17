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
}

export type KitPattern = 'solid' | 'stripes' | 'hoops'

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

export type BallData = Record<string, never>

export interface ConnectorData {
  fromId: string
  toId: string
  color: string
  strokeWidth: number
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

export type PitchDesign = 'classic_green' | 'night_navy' | 'stadium_bowl'
export type PitchOrientation = 'vertical' | 'horizontal'

export type ToolId =
  | 'select'
  | 'player_home'
  | 'player_away'
  | 'player_home_gk'
  | 'player_away_gk'
  | 'arrow_straight'
  | 'arrow_curved'
  | 'shape_circle'
  | 'shape_rect'
  | 'shape_polygon'
  | 'text'
  | 'ball'
  | 'connector'
  | `equipment_${EquipmentKind}`
