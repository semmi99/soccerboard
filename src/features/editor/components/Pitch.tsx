import { Arc, Circle, Group, Line, Rect } from 'react-konva'
import { PITCH_LOGICAL, PITCH_STAGE_SIZE } from '../constants'
import type { PitchDesign, PitchOrientation } from '../types'

const { width: L, height: B } = PITCH_LOGICAL // length (x), breadth (y)
const CX = L / 2
const CY = B / 2
const STADIUM_MARGIN = 90

const THEMES: Record<PitchDesign, { grassA: string; grassB: string; line: string }> = {
  classic_green: { grassA: '#1e7d32', grassB: '#1a6b2b', line: 'rgba(255,255,255,0.85)' },
  night_navy: { grassA: '#0f1a2e', grassB: '#0b1424', line: 'rgba(212,175,55,0.8)' },
  stadium_bowl: { grassA: '#2d8a3e', grassB: '#279938', line: 'rgba(255,255,255,0.9)' },
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

function StadiumBowl() {
  const ringCount = 6
  const ringThickness = STADIUM_MARGIN / ringCount
  const seatA = '#0f3d1f'
  const seatB = '#164d28'

  return (
    <>
      <Rect x={0} y={0} width={L} height={B} cornerRadius={70} fill="#0a1f12" listening={false} />
      {Array.from({ length: ringCount }, (_, i) => {
        const inset = i * ringThickness + ringThickness / 2
        return (
          <Rect
            key={i}
            x={inset}
            y={inset}
            width={L - inset * 2}
            height={B - inset * 2}
            cornerRadius={Math.max(60 - inset * 0.55, 16)}
            stroke={i % 2 === 0 ? seatA : seatB}
            strokeWidth={ringThickness}
            listening={false}
          />
        )
      })}
      {/* running track */}
      <Rect
        x={STADIUM_MARGIN - 10}
        y={STADIUM_MARGIN - 10}
        width={L - (STADIUM_MARGIN - 10) * 2}
        height={B - (STADIUM_MARGIN - 10) * 2}
        cornerRadius={14}
        stroke="#8a5a3a"
        strokeWidth={10}
        listening={false}
      />
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
      {isStadium && <StadiumBowl />}
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
