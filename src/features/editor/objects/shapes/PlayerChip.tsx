import { Circle, Group, Text } from 'react-konva'
import { TEAM_COLORS } from '../../constants'
import type { PlayerChipData } from '../../types'

export function PlayerChipShape({ data }: { data: PlayerChipData }) {
  const color = TEAM_COLORS[data.team]
  return (
    <Group>
      <Circle radius={18} fill={color} stroke="#ffffff" strokeWidth={2} shadowBlur={4} shadowOpacity={0.4} />
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
