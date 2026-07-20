import { useEffect, useRef } from 'react'
import { Circle, Group, Rect, Text } from 'react-konva'
import Konva from 'konva'
import { TEAM_COLORS } from '../../constants'
import type { KitConfig, PlayerChipData } from '../../types'
import { useEditorStore } from '../../store/editorStore'

const CHIP_R = 18
const GK_FALLBACK: KitConfig = { pattern: 'solid', color1: '#eab308', color2: '#111827' }

/** Pulsing glow ring behind a highlighted chip — its radius/opacity oscillate
 * on a Konva.Animation tied to the shape's own layer, so it keeps pulsing
 * continuously (including while recording video export) without React
 * re-rendering every frame. */
function HighlightRing() {
  const ref = useRef<Konva.Circle>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const phase = (Math.sin(frame.time / 350) + 1) / 2 // 0..1
      node.radius(CHIP_R + 4 + phase * 9)
      node.opacity(0.85 - phase * 0.6)
    }, node.getLayer())
    anim.start()
    return () => {
      anim.stop()
    }
  }, [])

  return (
    <Circle
      ref={ref}
      radius={CHIP_R + 4}
      stroke="#ffe100"
      strokeWidth={3}
      listening={false}
    />
  )
}

function KitPatternContent({ kit }: { kit: KitConfig }) {
  switch (kit.pattern) {
    case 'stripes':
      return (
        <>
          {Array.from({ length: 5 }, (_, i) => {
            const w = (CHIP_R * 2) / 5
            return (
              <Rect
                key={i}
                x={-CHIP_R + i * w}
                y={-CHIP_R}
                width={w}
                height={CHIP_R * 2}
                fill={i % 2 === 0 ? kit.color1 : kit.color2}
              />
            )
          })}
        </>
      )
    case 'hoops':
      return (
        <>
          {Array.from({ length: 4 }, (_, i) => {
            const h = (CHIP_R * 2) / 4
            return (
              <Rect
                key={i}
                x={-CHIP_R}
                y={-CHIP_R + i * h}
                width={CHIP_R * 2}
                height={h}
                fill={i % 2 === 0 ? kit.color1 : kit.color2}
              />
            )
          })}
        </>
      )
    case 'sash':
      return (
        <>
          <Rect x={-CHIP_R} y={-CHIP_R} width={CHIP_R * 2} height={CHIP_R * 2} fill={kit.color1} />
          <Rect
            x={0}
            y={0}
            offsetX={CHIP_R * 1.5}
            offsetY={CHIP_R * 0.45}
            width={CHIP_R * 3}
            height={CHIP_R * 0.9}
            rotation={45}
            fill={kit.color2}
          />
        </>
      )
    case 'split':
      return (
        <>
          <Rect x={-CHIP_R} y={-CHIP_R} width={CHIP_R} height={CHIP_R * 2} fill={kit.color1} />
          <Rect x={0} y={-CHIP_R} width={CHIP_R} height={CHIP_R * 2} fill={kit.color2} />
        </>
      )
    case 'collar':
      return (
        <>
          <Rect x={-CHIP_R} y={-CHIP_R} width={CHIP_R * 2} height={CHIP_R * 2} fill={kit.color1} />
          <Rect x={-CHIP_R} y={-CHIP_R} width={CHIP_R * 2} height={CHIP_R * 0.6} fill={kit.color2} />
        </>
      )
    case 'solid':
    default:
      return <Rect x={-CHIP_R} y={-CHIP_R} width={CHIP_R * 2} height={CHIP_R * 2} fill={kit.color1} />
  }
}

function KitFill({ kit }: { kit: KitConfig }) {
  return (
    <>
      <Group clipFunc={(ctx) => ctx.arc(0, 0, CHIP_R, 0, Math.PI * 2, false)}>
        <KitPatternContent kit={kit} />
      </Group>
      <Circle
        radius={CHIP_R}
        stroke="#ffffff"
        strokeWidth={2}
        shadowColor="#000000"
        shadowBlur={6}
        shadowOffsetY={3}
        shadowOpacity={0.45}
      />
    </>
  )
}

export function PlayerChipShape({ data }: { data: PlayerChipData }) {
  const teamKit = useEditorStore((s) => s.teamKit)
  const kit: KitConfig = data.isGoalkeeper
    ? (teamKit?.gk ?? GK_FALLBACK)
    : teamKit
      ? teamKit[data.team]
      : { pattern: 'solid', color1: TEAM_COLORS[data.team], color2: TEAM_COLORS[data.team] }

  return (
    <Group>
      {data.highlighted && <HighlightRing />}
      <KitFill kit={kit} />
      <Text
        text={data.displayText !== undefined ? data.displayText : String(data.number)}
        fontSize={15}
        fontStyle="bold"
        fill="#ffffff"
        width={36}
        height={36}
        offsetX={18}
        offsetY={18}
        align="center"
        verticalAlign="middle"
        listening={false}
        shadowColor="#000000"
        shadowBlur={3}
        shadowOpacity={0.6}
      />
      {data.label && (
        <Text
          text={data.label}
          fontSize={14}
          fontStyle="bold"
          fill="#ffffff"
          width={110}
          offsetX={55}
          y={22}
          align="center"
          listening={false}
          shadowColor="#000000"
          shadowBlur={3}
          shadowOpacity={0.7}
        />
      )}
    </Group>
  )
}
