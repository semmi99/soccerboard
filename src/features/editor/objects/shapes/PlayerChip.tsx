import { Circle, Group, Rect, Text } from 'react-konva'
import { TEAM_COLORS } from '../../constants'
import type { KitConfig, PlayerChipData } from '../../types'
import { useEditorStore } from '../../store/editorStore'

const CHIP_R = 18
const GK_FALLBACK: KitConfig = { pattern: 'solid', color1: '#eab308', color2: '#111827' }

function KitFill({ kit }: { kit: KitConfig }) {
  if (kit.pattern === 'solid') {
    return <Circle radius={CHIP_R} fill={kit.color1} stroke="#ffffff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.4} />
  }

  const bars =
    kit.pattern === 'stripes'
      ? Array.from({ length: 5 }, (_, i) => {
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
        })
      : Array.from({ length: 4 }, (_, i) => {
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
        })

  return (
    <>
      <Group clipFunc={(ctx) => ctx.arc(0, 0, CHIP_R, 0, Math.PI * 2, false)}>{bars}</Group>
      <Circle radius={CHIP_R} stroke="#ffffff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.4} />
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
      <KitFill kit={kit} />
      <Text
        text={String(data.number)}
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
          fontSize={11}
          fill="#ffffff"
          width={100}
          offsetX={50}
          y={22}
          align="center"
          listening={false}
        />
      )}
    </Group>
  )
}
