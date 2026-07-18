import { Circle, Group, Line } from 'react-konva'
import type { BallData } from '../../types'

export function BallShape({ data }: { data: BallData }) {
  const fill = data.color ?? '#f5f5f0'
  return (
    <Group>
      <Circle radius={9} fill={fill} stroke="#1a1a1a" strokeWidth={1.5} />
      <Line points={[0, -9, 0, 9]} stroke="#1a1a1a" strokeWidth={1} />
      <Line points={[-9, 0, 9, 0]} stroke="#1a1a1a" strokeWidth={1} />
    </Group>
  )
}
