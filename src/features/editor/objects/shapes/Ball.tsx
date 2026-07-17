import { Circle, Group, Line } from 'react-konva'

export function BallShape() {
  return (
    <Group>
      <Circle radius={9} fill="#f5f5f0" stroke="#1a1a1a" strokeWidth={1.5} />
      <Line points={[0, -9, 0, 9]} stroke="#1a1a1a" strokeWidth={1} />
      <Line points={[-9, 0, 9, 0]} stroke="#1a1a1a" strokeWidth={1} />
    </Group>
  )
}
