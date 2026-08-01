import { Line } from 'react-konva'
import type { FreehandData } from '../../types'

export function FreehandShape({ data }: { data: FreehandData }) {
  return (
    <Line
      points={data.points}
      stroke={data.color}
      strokeWidth={data.strokeWidth}
      lineCap="round"
      lineJoin="round"
      tension={0.3}
      shadowColor="black"
      shadowBlur={2}
      shadowOpacity={0.35}
    />
  )
}
