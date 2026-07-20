import { Arc, Circle, Group, Line, Rect } from 'react-konva'
import { PITCH_LOGICAL, getCropLength, getCropOriginX, getCroppedStageSize } from '../constants'
import type { FieldCrop, PitchDesign, PitchOrientation, ZoneGridStyle } from '../types'

const { width: L, height: B } = PITCH_LOGICAL // length (x), breadth (y)
const CX = L / 2 // the pitch's true midfield line — a fixed anatomical point, independent of any crop
const CY = B / 2

const THEMES: Record<PitchDesign, { grassA: string; grassB: string; line: string }> = {
  classic_green: { grassA: '#1e7d32', grassB: '#1a6b2b', line: 'rgba(255,255,255,0.85)' },
  night_navy: { grassA: '#0f1a2e', grassB: '#0b1424', line: 'rgba(212,175,55,0.8)' },
  dark_orange: { grassA: '#0c0c0c', grassB: '#090909', line: 'rgba(255,140,26,0.9)' },
  turquoise: { grassA: '#0f766e', grassB: '#0d6560', line: 'rgba(255,255,255,0.85)' },
  royal_blue: { grassA: '#1c4f8c', grassB: '#173f70', line: 'rgba(255,255,255,0.85)' },
  maroon: { grassA: '#5c1f1f', grassB: '#4a1818', line: 'rgba(240,216,120,0.85)' },
  light_gray: { grassA: '#e5e7eb', grassB: '#d1d5db', line: 'rgba(20,20,20,0.85)' },
  brand_blue: { grassA: '#145f89', grassB: '#12557c', line: 'rgba(242,167,59,0.85)' },
}

function Stripes({ theme }: { theme: { grassA: string; grassB: string } }) {
  const stripeCount = 10
  const stripeWidth = L / stripeCount
  return (
    <>
      {Array.from({ length: stripeCount }, (_, i) => (
        <Rect
          key={i}
          x={i * stripeWidth}
          y={0}
          width={stripeWidth}
          height={B}
          fill={i % 2 === 0 ? theme.grassA : theme.grassB}
          listening={false}
        />
      ))}
    </>
  )
}

function Markings({ stroke }: { stroke: string }) {
  const penaltyDepth = 157
  const penaltyWidth = 385
  const penaltyY0 = CY - penaltyWidth / 2

  const sixYardDepth = 52
  const sixYardWidth = 175
  const sixYardY0 = CY - sixYardWidth / 2

  const penaltySpotOffset = 105
  const centerCircleR = 87
  const cornerR = 8
  const goalWidth = 70
  const goalDepth = 12

  const common = { stroke, strokeWidth: 2.5, listening: false }

  return (
    <>
      {/* outer boundary */}
      <Rect x={0} y={0} width={L} height={B} stroke={stroke} strokeWidth={3} listening={false} />
      {/* halfway line */}
      <Line points={[CX, 0, CX, B]} {...common} />
      {/* center circle + spot */}
      <Circle x={CX} y={CY} radius={centerCircleR} {...common} />
      <Circle x={CX} y={CY} radius={3} fill={stroke} listening={false} />

      {/* left penalty area */}
      <Rect x={0} y={penaltyY0} width={penaltyDepth} height={penaltyWidth} {...common} />
      <Rect x={0} y={sixYardY0} width={sixYardDepth} height={sixYardWidth} {...common} />
      <Circle x={penaltySpotOffset} y={CY} radius={3} fill={stroke} listening={false} />
      <Arc
        x={penaltySpotOffset}
        y={CY}
        innerRadius={centerCircleR}
        outerRadius={centerCircleR}
        angle={106}
        rotation={-53}
        {...common}
      />
      <Rect x={-goalDepth} y={CY - goalWidth / 2} width={goalDepth} height={goalWidth} {...common} />

      {/* right penalty area */}
      <Rect
        x={L - penaltyDepth}
        y={penaltyY0}
        width={penaltyDepth}
        height={penaltyWidth}
        {...common}
      />
      <Rect
        x={L - sixYardDepth}
        y={sixYardY0}
        width={sixYardDepth}
        height={sixYardWidth}
        {...common}
      />
      <Circle x={L - penaltySpotOffset} y={CY} radius={3} fill={stroke} listening={false} />
      <Arc
        x={L - penaltySpotOffset}
        y={CY}
        innerRadius={centerCircleR}
        outerRadius={centerCircleR}
        angle={106}
        rotation={127}
        {...common}
      />
      <Rect x={L} y={CY - goalWidth / 2} width={goalDepth} height={goalWidth} {...common} />

      {/* corner arcs */}
      <Arc x={0} y={0} innerRadius={cornerR} outerRadius={cornerR} angle={90} rotation={0} {...common} />
      <Arc x={L} y={0} innerRadius={cornerR} outerRadius={cornerR} angle={90} rotation={90} {...common} />
      <Arc x={L} y={B} innerRadius={cornerR} outerRadius={cornerR} angle={90} rotation={180} {...common} />
      <Arc x={0} y={B} innerRadius={cornerR} outerRadius={cornerR} angle={90} rotation={270} {...common} />
    </>
  )
}

/** Dashed tactical grid: 2 lines splitting the pitch into attacking/middle/
 * defensive thirds, and 4 lines splitting it into 5 vertical channels
 * (wide/half-space/central lanes). */
function ZoneLines({ stroke }: { stroke: string }) {
  const thirds = [L / 3, (2 * L) / 3]
  const channelCount = 5
  const channels = Array.from({ length: channelCount - 1 }, (_, i) => (B / channelCount) * (i + 1))
  const common = { stroke, strokeWidth: 1.5, dash: [7, 7], opacity: 0.6, listening: false }

  return (
    <>
      {thirds.map((x, i) => (
        <Line key={`third-${i}`} points={[x, 0, x, B]} {...common} />
      ))}
      {channels.map((y, i) => (
        <Line key={`channel-${i}`} points={[0, y, L, y]} {...common} />
      ))}
    </>
  )
}

/** The "positional play" grid: the pitch split into 3 lengthwise bands
 * (thin end bands + a big middle band) and 3 widthwise lanes (thin outer
 * lanes + a wide center lane), full length/width. Within the middle band,
 * the center lane is further split into 3 sub-lanes; within the two outer
 * lanes, the middle band is further split into 3 sub-bands — giving the
 * offset "brick" look of the reference diagram rather than a uniform grid.
 * The end bands are snapped to the penalty-box depth so this grid's own
 * lines land flush on the box edge instead of drawing a redundant second
 * line right next to it when markings are shown alongside the grid. */
function GuardiolaGrid({ stroke }: { stroke: string }) {
  const topBandEnd = 157 // matches Markings' penaltyDepth
  const bottomBandStart = L - 157
  const laneLeftEnd = 0.191 * B
  const laneRightStart = 0.804 * B

  const centerWidth = laneRightStart - laneLeftEnd
  const centerSub1 = laneLeftEnd + 0.287 * centerWidth
  const centerSub2 = laneLeftEnd + 0.713 * centerWidth

  const midLen = bottomBandStart - topBandEnd
  const lenSub1 = topBandEnd + 0.238 * midLen
  const lenSub2 = bottomBandStart - 0.238 * midLen

  const common = { stroke, strokeWidth: 1.5, opacity: 0.75, listening: false }

  return (
    <>
      {/* lane boundaries (left/center/right), full length */}
      <Line points={[0, laneLeftEnd, L, laneLeftEnd]} {...common} />
      <Line points={[0, laneRightStart, L, laneRightStart]} {...common} />
      {/* band boundaries (top/middle/bottom), full width */}
      <Line points={[topBandEnd, 0, topBandEnd, B]} {...common} />
      <Line points={[bottomBandStart, 0, bottomBandStart, B]} {...common} />
      {/* center lane split into 3, only within the middle band */}
      <Line points={[topBandEnd, centerSub1, bottomBandStart, centerSub1]} {...common} />
      <Line points={[topBandEnd, centerSub2, bottomBandStart, centerSub2]} {...common} />
      {/* outer lanes split into 3, only within their own width */}
      <Line points={[lenSub1, 0, lenSub1, laneLeftEnd]} {...common} />
      <Line points={[lenSub2, 0, lenSub2, laneLeftEnd]} {...common} />
      <Line points={[lenSub1, laneRightStart, lenSub1, B]} {...common} />
      <Line points={[lenSub2, laneRightStart, lenSub2, B]} {...common} />
    </>
  )
}

export function Pitch({
  design,
  orientation,
  zoneGridStyle = 'none',
  showPitchMarkings = true,
  fieldCrop = 'full',
}: {
  design: PitchDesign
  orientation: PitchOrientation
  zoneGridStyle?: ZoneGridStyle
  showPitchMarkings?: boolean
  fieldCrop?: FieldCrop
}) {
  const theme = THEMES[design]
  const stage = getCroppedStageSize(orientation, fieldCrop)
  const rotation = orientation === 'vertical' ? 90 : 0

  // A crop is just a smaller "window" into the same full-size pitch: the
  // window's own center (not the pitch's true center) becomes the rotation
  // anchor, so only that slice ends up inside the (now smaller) stage —
  // everything else is naturally clipped by the stage bounds like normal.
  const cropLength = getCropLength(fieldCrop)
  const cropOriginX = getCropOriginX(fieldCrop)
  const anchorX = cropOriginX + cropLength / 2

  return (
    <Group
      x={stage.width / 2}
      y={stage.height / 2}
      offsetX={anchorX}
      offsetY={CY}
      rotation={rotation}
    >
      <Stripes theme={theme} />
      {showPitchMarkings && <Markings stroke={theme.line} />}
      {zoneGridStyle === 'thirds_channels' && <ZoneLines stroke={theme.line} />}
      {zoneGridStyle === 'guardiola' && <GuardiolaGrid stroke={theme.line} />}
    </Group>
  )
}
