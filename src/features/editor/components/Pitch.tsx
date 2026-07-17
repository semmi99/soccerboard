import { Arc, Circle, Group, Line, Rect, Text } from 'react-konva'
import { PITCH_LOGICAL, PITCH_STAGE_SIZE } from '../constants'
import type { PitchDesign, PitchOrientation } from '../types'

const { width: L, height: B } = PITCH_LOGICAL // length (x), breadth (y)
const CX = L / 2
const CY = B / 2
const STADIUM_MARGIN = 90

const THEMES: Record<PitchDesign, { grassA: string; grassB: string; line: string }> = {
  classic_green: { grassA: '#1e7d32', grassB: '#1a6b2b', line: 'rgba(255,255,255,0.85)' },
  night_navy: { grassA: '#0f1a2e', grassB: '#0b1424', line: 'rgba(212,175,55,0.8)' },
  stadium_bowl: { grassA: '#1e8a3e', grassB: '#1a7a36', line: 'rgba(255,255,255,0.92)' },
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

function Markings({ stroke, boundary = true }: { stroke: string; boundary?: boolean }) {
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
      {boundary && (
        <Rect x={0} y={0} width={L} height={B} stroke={stroke} strokeWidth={3} listening={false} />
      )}
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

const SEAT_WALKWAY_WIDTH = 20
const BOWL_CORNER_R = 74

/** Deterministic pseudo-random generator (mulberry32) so the crowd speckle
 * is stable across re-renders instead of jittering every time Pitch renders. */
function mulberry32(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CROWD_COLORS = ['#f5f5f0', '#f0d878', '#d9534f', '#5b8fd1', '#e8e8e2']
const CROWD_DOTS = (() => {
  const rand = mulberry32(42)
  return Array.from({ length: 240 }, () => ({
    x: rand() * L,
    y: rand() * B,
    r: 1 + rand() * 1.3,
    color: CROWD_COLORS[Math.floor(rand() * CROWD_COLORS.length)]!,
    opacity: 0.35 + rand() * 0.4,
  }))
})()

const FLOODLIGHT_POS: [number, number][] = [
  [50, 50],
  [L - 50, 50],
  [50, B - 50],
  [L - 50, B - 50],
]

/** Smooth gradient-shaded bowl (lighter near the pitch, dark toward the
 * outer rim) with a couple of subtle tier lines and sparse crowd speckle —
 * reads as photographic depth at any size instead of a repeating pattern
 * that aliases into noise once shrunk to the editor's actual canvas size. */
function SeatBowl() {
  return (
    <>
      <Rect
        x={0}
        y={0}
        width={L}
        height={B}
        cornerRadius={BOWL_CORNER_R}
        fillRadialGradientStartPoint={{ x: CX, y: CY }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: CX, y: CY }}
        fillRadialGradientEndRadius={Math.max(L, B) * 0.62}
        fillRadialGradientColorStops={[0, '#3d4b61', 0.5, '#232c3a', 0.82, '#141a24', 1, '#080b10']}
        listening={false}
      />
      <Rect
        x={18}
        y={18}
        width={L - 36}
        height={B - 36}
        cornerRadius={Math.max(BOWL_CORNER_R - 14, 20)}
        stroke="rgba(0,0,0,0.32)"
        strokeWidth={2}
        listening={false}
      />
      <Rect
        x={42}
        y={42}
        width={L - 84}
        height={B - 84}
        cornerRadius={Math.max(BOWL_CORNER_R - 32, 16)}
        stroke="rgba(0,0,0,0.26)"
        strokeWidth={2}
        listening={false}
      />
      {CROWD_DOTS.map((d, i) => (
        <Circle key={i} x={d.x} y={d.y} radius={d.r} fill={d.color} opacity={d.opacity} listening={false} />
      ))}
      {FLOODLIGHT_POS.map(([x, y], i) => (
        <Circle
          key={i}
          x={x}
          y={y}
          radius={34}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={34}
          fillRadialGradientColorStops={[0, 'rgba(255,252,235,0.5)', 1, 'rgba(255,252,235,0)']}
          listening={false}
        />
      ))}
    </>
  )
}

function Walkway() {
  const inset = STADIUM_MARGIN - SEAT_WALKWAY_WIDTH / 2
  const w = L - 2 * inset
  const h = B - 2 * inset
  const r = Math.max(BOWL_CORNER_R - inset * 0.6, 12)

  return (
    <>
      <Rect
        x={inset}
        y={inset}
        width={w}
        height={h}
        cornerRadius={r}
        stroke="#aab2ba"
        strokeWidth={SEAT_WALKWAY_WIDTH}
        listening={false}
      />
      <Text
        text="TACTICBOARD PRO"
        x={0}
        y={inset - 7}
        width={L}
        align="center"
        fontStyle="bold"
        fontSize={14}
        letterSpacing={3}
        fill="#333a41"
        listening={false}
      />
      <Text
        text="TACTICBOARD PRO"
        x={0}
        y={B - inset - 8}
        width={L}
        align="center"
        fontStyle="bold"
        fontSize={14}
        letterSpacing={3}
        fill="#333a41"
        listening={false}
      />
    </>
  )
}

function StadiumBackdrop() {
  return (
    <>
      <Rect x={0} y={0} width={L} height={B} cornerRadius={BOWL_CORNER_R} fill="#04140b" listening={false} />
      <SeatBowl />
      <Walkway />
    </>
  )
}

export function Pitch({
  design,
  orientation,
}: {
  design: PitchDesign
  orientation: PitchOrientation
}) {
  const theme = THEMES[design]
  const stage = PITCH_STAGE_SIZE[orientation]
  const rotation = orientation === 'vertical' ? 90 : 0
  const isStadium = design === 'stadium_bowl'

  const grassScaleX = isStadium ? (L - STADIUM_MARGIN * 2) / L : 1
  const grassScaleY = isStadium ? (B - STADIUM_MARGIN * 2) / B : 1

  return (
    <Group
      x={stage.width / 2}
      y={stage.height / 2}
      offsetX={CX}
      offsetY={CY}
      rotation={rotation}
    >
      {isStadium && <StadiumBackdrop />}
      <Group
        x={isStadium ? STADIUM_MARGIN : 0}
        y={isStadium ? STADIUM_MARGIN : 0}
        scaleX={grassScaleX}
        scaleY={grassScaleY}
      >
        <Stripes theme={theme} />
        <Markings stroke={theme.line} />
      </Group>
    </Group>
  )
}
