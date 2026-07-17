import { Arc, Circle, Group, Line, Rect, Shape, Text } from 'react-konva'
import type Konva from 'konva'
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

/** Traces a "cushion"-distorted rounded rect: edges bow outward, corners cut diagonally. */
function tracePitchBoundary(
  ctx: Konva.Context,
  w: number,
  h: number,
  cut: number,
  bulgeV: number,
  bulgeH: number,
) {
  ctx.beginPath()
  ctx.moveTo(cut, 0)
  ctx.quadraticCurveTo(w / 2, -bulgeV, w - cut, 0)
  ctx.quadraticCurveTo(w, 0, w, cut)
  ctx.quadraticCurveTo(w + bulgeH, h / 2, w, h - cut)
  ctx.quadraticCurveTo(w, h, w - cut, h)
  ctx.quadraticCurveTo(w / 2, h + bulgeV, cut, h)
  ctx.quadraticCurveTo(0, h, 0, h - cut)
  ctx.quadraticCurveTo(-bulgeH, h / 2, 0, cut)
  ctx.quadraticCurveTo(0, 0, cut, 0)
  ctx.closePath()
}

const BOUNDARY_CUT = 55
const BOUNDARY_BULGE_V = 34
const BOUNDARY_BULGE_H = 22

function PitchBoundaryShape({ stroke }: { stroke: string }) {
  return (
    <Shape
      listening={false}
      stroke={stroke}
      strokeWidth={3}
      sceneFunc={(ctx, shape) => {
        tracePitchBoundary(ctx, L, B, BOUNDARY_CUT, BOUNDARY_BULGE_V, BOUNDARY_BULGE_H)
        ctx.fillStrokeShape(shape)
      }}
    />
  )
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

/** Walks the perimeter of a rounded rect (w x h, corner radius r), calling
 * `cb(x, y, tangentAngleDeg)` at roughly `spacing`-px intervals, clockwise
 * from the top edge. Used to scatter stadium-seat units around the bowl. */
function forEachRoundRectPerimeter(
  w: number,
  h: number,
  r: number,
  spacing: number,
  cb: (x: number, y: number, angleDeg: number) => void,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  const arcLen = (Math.PI * rr) / 2
  const segs: { len: number; point: (t: number) => { x: number; y: number; angleDeg: number } }[] = [
    { len: w - 2 * rr, point: (t) => ({ x: rr + t * (w - 2 * rr), y: 0, angleDeg: 0 }) },
    {
      len: arcLen,
      point: (t) => {
        const a = -90 + t * 90
        const rad = (a * Math.PI) / 180
        return { x: w - rr + rr * Math.cos(rad), y: rr + rr * Math.sin(rad), angleDeg: a + 90 }
      },
    },
    { len: h - 2 * rr, point: (t) => ({ x: w, y: rr + t * (h - 2 * rr), angleDeg: 90 }) },
    {
      len: arcLen,
      point: (t) => {
        const a = t * 90
        const rad = (a * Math.PI) / 180
        return { x: w - rr + rr * Math.cos(rad), y: h - rr + rr * Math.sin(rad), angleDeg: a + 90 }
      },
    },
    { len: w - 2 * rr, point: (t) => ({ x: w - rr - t * (w - 2 * rr), y: h, angleDeg: 180 }) },
    {
      len: arcLen,
      point: (t) => {
        const a = 90 + t * 90
        const rad = (a * Math.PI) / 180
        return { x: rr + rr * Math.cos(rad), y: h - rr + rr * Math.sin(rad), angleDeg: a + 90 }
      },
    },
    { len: h - 2 * rr, point: (t) => ({ x: 0, y: h - rr - t * (h - 2 * rr), angleDeg: 270 }) },
    {
      len: arcLen,
      point: (t) => {
        const a = 180 + t * 90
        const rad = (a * Math.PI) / 180
        return { x: rr + rr * Math.cos(rad), y: rr + rr * Math.sin(rad), angleDeg: a + 90 }
      },
    },
  ]
  for (const seg of segs) {
    if (seg.len <= 0) continue
    const steps = Math.max(1, Math.round(seg.len / spacing))
    for (let i = 0; i < steps; i++) {
      const { x, y, angleDeg } = seg.point(i / steps)
      cb(x, y, angleDeg)
    }
  }
}

const SEAT_OUTER_PAD = 6
const SEAT_WALKWAY_WIDTH = 16
const SEAT_ROWS = 6
const SEAT_SPACING = 12
const SEAT_A = '#0f3d20'
const SEAT_B = '#1a5c33'
const SEAT_ACCENT = '#2f8f52'
const BOWL_CORNER_R = 74

function SeatBowl() {
  const seatBandWidth = STADIUM_MARGIN - SEAT_WALKWAY_WIDTH - SEAT_OUTER_PAD
  const ringThickness = seatBandWidth / SEAT_ROWS

  return (
    <Shape
      listening={false}
      sceneFunc={(ctx) => {
        for (let row = 0; row < SEAT_ROWS; row++) {
          const inset = SEAT_OUTER_PAD + row * ringThickness + ringThickness / 2
          const rw = L - 2 * inset
          const rh = B - 2 * inset
          const r = Math.max(BOWL_CORNER_R - inset * 0.6, 16)
          const seatW = SEAT_SPACING * 0.82
          const seatH = ringThickness * 0.82
          let i = 0
          forEachRoundRectPerimeter(rw, rh, r, SEAT_SPACING, (px, py, angleDeg) => {
            const isAccent = i % 23 === 0
            const color = isAccent ? SEAT_ACCENT : (i + row) % 2 === 0 ? SEAT_A : SEAT_B
            ctx.save()
            ctx.translate(inset + px, inset + py)
            ctx.rotate((angleDeg * Math.PI) / 180)
            ctx.fillStyle = color
            ctx.fillRect(-seatW / 2, -seatH / 2, seatW, seatH)
            ctx.restore()
            i++
          })
        }
      }}
    />
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
        stroke="#9aa3ab"
        strokeWidth={SEAT_WALKWAY_WIDTH}
        listening={false}
      />
      <Text
        text="TACTICBOARD PRO"
        x={0}
        y={inset - 6}
        width={L}
        align="center"
        fontStyle="bold"
        fontSize={13}
        letterSpacing={3}
        fill="#3a4048"
        listening={false}
      />
      <Text
        text="TACTICBOARD PRO"
        x={0}
        y={B - inset - 7}
        width={L}
        align="center"
        fontStyle="bold"
        fontSize={13}
        letterSpacing={3}
        fill="#3a4048"
        listening={false}
      />
    </>
  )
}

function StadiumBackdrop() {
  return (
    <>
      <Rect x={0} y={0} width={L} height={B} cornerRadius={BOWL_CORNER_R} fill="#08120c" listening={false} />
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
        clipFunc={
          isStadium
            ? (ctx) => tracePitchBoundary(ctx, L, B, BOUNDARY_CUT, BOUNDARY_BULGE_V, BOUNDARY_BULGE_H)
            : undefined
        }
      >
        <Stripes theme={theme} />
        <Markings stroke={theme.line} boundary={!isStadium} />
      </Group>
      {isStadium && (
        <Group x={STADIUM_MARGIN} y={STADIUM_MARGIN} scaleX={grassScaleX} scaleY={grassScaleY}>
          <PitchBoundaryShape stroke={theme.line} />
        </Group>
      )}
    </Group>
  )
}
