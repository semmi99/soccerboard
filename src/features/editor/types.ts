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
  /** Marks this chip as the offside-line reference (the last outfield
   * defender) — every opposing-team chip then gets an automatic "Onside/
   * Abseits by X.Xm" label relative to this player's position, UNLESS one
   * or more opposing chips are marked with `offsideTarget` (see below), in
   * which case only those get the label. At most one chip should carry
   * this per frame; if several do, the first one found wins. */
  offsideReference?: boolean
  /** Narrows the offside check (see `offsideReference` above) to just this
   * chip instead of every opposing-team player — for when only one
   * attacker's run actually matters. Ignored if no chip on the frame has
   * this set (falls back to labeling the whole opposing team). */
  offsideTarget?: boolean
  /** Overrides the number/custom-text color inside the chip circle.
   * Unset falls back to white — the original look. */
  numberColor?: string
  /** Overrides the label text color below the chip. Unset falls back to
   * white — the original look. */
  labelColor?: string
  /** Shows the linked player's uploaded photo (see Kader page) inside the
   * chip circle instead of the kit/crest fill — opt-in per chip since a
   * lineup graphic wants faces, but a tactical board full of photos would
   * be harder to read at a glance than plain team colors. No effect if
   * `playerId` isn't set or that player has no photo uploaded. */
  showPhoto?: boolean
  /** Overrides the chip's fill with a flat custom color instead of the
   * team's kit pattern/colors — for drills that need to split a team into
   * more than the usual two (home/away) groups by color. Takes priority
   * over a team crest (which is team-wide, so a per-player override should
   * win) but not over `showPhoto`. Unset keeps the normal team-kit look. */
  color?: string | null
}

export type KitPattern = 'solid' | 'stripes' | 'hoops' | 'sash' | 'split' | 'collar'

/** Chip outline used for every player marker on the board — a plain circle
 * (the original look) or a jersey silhouette. One board-wide choice rather
 * than per-side, since a mixed circle/shirt board would look inconsistent. */
export type MarkerShape = 'circle' | 'shirt'

export interface KitConfig {
  pattern: KitPattern
  color1: string
  color2: string
}

/** Which of a project's two saved kit configs is currently in effect —
 * lets a coach flip between "my team" and "the opponent" without
 * reconfiguring colors each time (see editorStore's swapKitSlot). */
export type KitSlot = 'primary' | 'secondary'

/** How a player chip's name label is displayed: the full "First Last"
 * string (auto-wrapping if too wide to fit), just the last name on one
 * line, or the first/last name forced onto their own line each — a
 * project-wide choice rather than per-chip, since a team should look
 * consistent across the whole board. */
export type PlayerLabelFormat = 'full' | 'lastName' | 'twoLine'

export interface TeamKit {
  home: KitConfig
  away: KitConfig
  gk: KitConfig
  chipScale: number
  /** When set, every HOME chip renders this badge image instead of its kit
   * colors. Independent from awayCrestUrl — without a linked team, home and
   * away represent two distinct sides (e.g. us vs. an opponent), so one
   * side's crest must never bleed onto the other. For a linked real team,
   * both fields are set to that team's own single crest (see
   * TeamSquadPanel), since there it's the same club's badge either way. */
  homeCrestUrl?: string | null
  /** Same as homeCrestUrl, for AWAY chips. */
  awayCrestUrl?: string | null
  /** Unset behaves as 'circle' — matches every board saved before this
   * setting existed. */
  markerShape?: MarkerShape
}

export interface ArrowData {
  shape: ArrowShape
  points: number[] // flat [x1,y1,x2,y2,...] relative to the object's x/y anchor
  lineStyle: LineStyle
  color: string
  strokeWidth: number
  showArrowhead?: boolean // false renders as a plain line (e.g. freehand zone dividers)
  /** Adds a second arrowhead at the line's start point too, alongside the
   * regular one at the end — a double pass/run indicator. No effect when
   * showArrowhead is false. */
  arrowheadStart?: boolean
  curveOffset?: number // curved arrows only: perpendicular bend depth, user-adjustable
  /** Shows the real-world pass/run distance (computed from the project's
   * pitch size) as a small label near the arrow's midpoint. */
  showDistance?: boolean
  /** Soft, narrow glow following the line's path (fading from `color` at
   * full strength to fully transparent at the edges) — a lane/channel
   * highlight, not a large filled area. */
  glow?: boolean
  /** false = a rigid, fixed straight arrow: no draggable interior points and
   * no "Ziehpunkt hinzufügen" button, so it can only be moved/rotated/scaled
   * as a whole, never reshaped. Unset/undefined behaves as bendable (the
   * original behavior), matching every arrow saved before this existed. */
  bendable?: boolean
  /** Marks this as a "blocked option" — a passing lane that was considered
   * but cut off — rendering a small X at its end instead of relying on the
   * arrowhead alone. */
  blocked?: boolean
  /** Treats this line as an opponent's defensive line: shades the pitch
   * area between it and the nearer goal line and labels that gap's real-
   * world depth in meters, recomputed live from the line's own position. */
  spaceBehind?: boolean
  /** Hides the depth-arrow + "Xm" label for the space-behind zone while
   * still shading the area. Unset shows the label (the original
   * behavior). */
  spaceBehindShowLabel?: boolean
  /** Renders the line as a wavy "dribble" path (through cones/opponents)
   * instead of a smooth line — works alongside either the straight or
   * curved shape and any bend points already on it. */
  dribble?: boolean
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
  /** 'radial' (the original centered heatmap look) or 'linear' (a straight
   * sweep from the shape's left edge to its right edge). Unset/undefined
   * behaves as 'radial' for shapes saved before this option existed. */
  gradientDirection?: 'radial' | 'linear'
  /** Hides the border entirely, regardless of `stroke`/`strokeWidth`. */
  noBorder?: boolean
  /** Shows a small label above the shape with its real-world size (from the
   * project's pitch dimensions) and, when one or more player chips sit
   * inside it, the resulting area per player — the "space per player"
   * figure used to gauge a small-sided training zone's intensity (less
   * space per player ≈ more duels/strength work, more space ≈ more
   * running/speed). */
  showAreaInfo?: boolean
  /** Opt-in richer stat card next to the shape — a coach-labeled category
   * tag plus up to 3 custom-labeled strength bars (1-4 pips each), for
   * characterizing a training zone's physical demand at a glance. Separate
   * from `showAreaInfo`/never auto-enabled by it — a coach who just wants
   * the plain size/space-per-player readout shouldn't get an extra card
   * they didn't ask for. */
  showStatsCard?: boolean
  statsCardCategory?: string
  statsCardColor?: string
  statsCardBars?: { label: string; level: number }[]
}

export interface TextData {
  text: string
  fontSize: number
  color: string
  fontStyle: 'normal' | 'bold' | 'italic'
  /** Pill background color — the "Badge" text preset's look, but available
   * to any text object. */
  background?: string
  /** When true, the pill background renders as a gradient (from
   * `background` as the first stop) instead of a flat fill — same recipe
   * as ShapeData's gradient. */
  backgroundGradient?: boolean
  /** Second gradient stop color. When unset/null, falls back to
   * `background` faded to fully transparent. */
  backgroundGradientColor2?: string | null
  /** 'radial' (from the center) or 'linear' (left edge to right edge).
   * Unset behaves as 'radial'. */
  backgroundGradientDirection?: 'radial' | 'linear'
  /** Drop shadow for legibility over busy pitch backgrounds — used by the
   * "Titel"/"Untertitel" text presets. */
  shadow?: boolean
}

export type QuoteFontFamily =
  | 'system'
  | 'georgia'
  | 'times'
  | 'arial_black'
  | 'impact'
  | 'trebuchet'
  | 'courier'

/** Web-safe font stacks only (no Google Fonts/custom uploads) — a PNG/video
 * export rasterizes the Konva stage synchronously, so a not-yet-loaded web
 * font would silently fall back at export time. Shared between the renderer
 * and the sidebar's font-family selects. */
export const QUOTE_FONT_STACKS: Record<QuoteFontFamily, string> = {
  system: 'Inter, system-ui, sans-serif',
  georgia: 'Georgia, serif',
  times: '"Times New Roman", Times, serif',
  arial_black: '"Arial Black", Arial, sans-serif',
  impact: 'Impact, "Arial Narrow", sans-serif',
  trebuchet: '"Trebuchet MS", sans-serif',
  courier: '"Courier New", monospace',
}

/** A freely-placeable heading + body text card ("MISS IT, AND IT'S 3 v 0"
 * style callout), matching the look of tactical-analysis explainer reels.
 * Unlike the old per-frame FrameCaption, this is an ordinary object like any
 * shape/text/equipment — repeatable, individually draggable/resizable. */
export interface QuoteCardData {
  /** Manually resized via the Transformer's free corner-drag, same as
   * ShapeData — text wraps into the given box instead of auto-growing it. */
  width: number
  height: number

  /** undefined/null = no card background (fully transparent). */
  background?: string | null
  backgroundGradient?: boolean
  background2?: string | null
  backgroundGradientDirection?: 'radial' | 'linear'
  /** undefined/null = no border. */
  borderColor?: string | null

  headingText: string
  headingFontFamily: QuoteFontFamily
  headingFontSize: number
  headingColor: string
  headingGradient?: boolean
  headingColor2?: string | null
  headingGradientDirection?: 'radial' | 'linear'
  /** The heading's own optional box (background/border), independent of the
   * card's own background/border — matches the "eyebrow" callout look where
   * the heading sits in its own small bordered pill above the body text. */
  headingBoxEnabled?: boolean
  headingBoxBackground?: string
  headingBoxBorderColor?: string
  /** undefined = 'center', matching the pre-existing (unconfigurable) default. */
  headingAlign?: 'left' | 'center' | 'right'

  bodyText: string
  bodyFontFamily: QuoteFontFamily
  bodyFontSize: number
  bodyColor: string
  bodyGradient?: boolean
  bodyColor2?: string | null
  bodyGradientDirection?: 'radial' | 'linear'
  /** undefined = 'left', matching the pre-existing (unconfigurable) default. */
  bodyAlign?: 'left' | 'center' | 'right'
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

export interface ImageData {
  url: string
  /** Base (unscaled) size in stage pixels — the object's own `scale` (via
   * the Transformer, same as chips/equipment) multiplies on top of this. */
  width: number
  height: number
  /** Dims the image so player chips placed on top of it (the "trace over a
   * match photo" workflow) stay legible against a busy broadcast frame.
   * Unset/undefined renders fully opaque, matching every image inserted
   * before this existed. */
  opacity?: number
}

/** A hand-drawn stroke — collected from a click-and-drag gesture rather
 * than placed as a fixed shape, so `points` can hold anywhere from a dozen
 * to a few hundred pairs. Unlike ArrowData's points (each individually
 * draggable via its own handle), a freehand path is only ever moved/
 * resized/rotated as a whole — per-point handles wouldn't be usable at
 * this density. */
export interface FreehandData {
  points: number[] // flat [x1,y1,x2,y2,...], relative to the object's x/y anchor (the stroke's own bounding-box center)
  color: string
  strokeWidth: number
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
  /** Soft, narrow glow following the connector's path — see ArrowData.glow. */
  glow?: boolean
  /** Wider, filled color band running alongside the connector (the
   * "corridor" look in reference tactics-analysis graphics) — distinct
   * from `glow`'s blur-based halo, this is an actual translucent shape,
   * visible even at a small render size where a blur washes out. */
  zone?: boolean
  /** Which side of the line the `zone` band spills toward — flips the band
   * to the opposite side instead of always pointing the same way. */
  zoneFlipped?: boolean
  /** Width (perpendicular reach) of the `zone` band in px — falls back to a
   * strokeWidth-derived default when unset. */
  zoneWidth?: number
  /** Color for the `zone` band's dark-to-light gradient — falls back to
   * `color` when unset, same as `loopFillColor` below. */
  zoneColor?: string
  /** Fill color for the area enclosed when this connector is part of a
   * closed loop (see connectorZones.ts) — falls back to `color` when unset,
   * so existing boards keep looking the same until someone picks a
   * dedicated fill color for the enclosed area. */
  loopFillColor?: string
}

export type ObjectType =
  | 'player_chip'
  | 'arrow'
  | 'shape'
  | 'text'
  | 'training_equipment'
  | 'ball'
  | 'connector'
  | 'image'
  | 'quote_card'
  | 'freehand'

export interface FrameObjectBase {
  id: string
  x: number
  y: number
  rotation: number
  scale: number
  zIndex: number
  /** Freezes the object in place — dragging (and, for arrows, the bend-point
   * handles) is disabled, but it can still be selected, restyled, or
   * deleted. Toggled from the properties sidebar, not tied to any one
   * object type since accidental drags happen on lines just as much as any
   * other object. */
  locked?: boolean
}

export type FrameObject =
  | (FrameObjectBase & { objectType: 'player_chip'; data: PlayerChipData })
  | (FrameObjectBase & { objectType: 'arrow'; data: ArrowData })
  | (FrameObjectBase & { objectType: 'shape'; data: ShapeData })
  | (FrameObjectBase & { objectType: 'text'; data: TextData })
  | (FrameObjectBase & { objectType: 'training_equipment'; data: EquipmentData })
  | (FrameObjectBase & { objectType: 'ball'; data: BallData })
  | (FrameObjectBase & { objectType: 'connector'; data: ConnectorData })
  | (FrameObjectBase & { objectType: 'image'; data: ImageData })
  | (FrameObjectBase & { objectType: 'quote_card'; data: QuoteCardData })
  | (FrameObjectBase & { objectType: 'freehand'; data: FreehandData })

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
  | 'custom'
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
  | 'arrow_rigid'
  | 'team_line'
  | 'pen'
  | 'shape_circle'
  | 'shape_rect'
  | 'text'
  | 'text_badge'
  | 'text_title'
  | 'text_subtitle'
  | 'quote_card'
  | 'callout_pill'
  | 'ball'
  | 'connector'
  | `equipment_${EquipmentKind}`
