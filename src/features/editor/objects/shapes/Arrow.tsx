import { Arrow } from 'react-konva'
import type { ArrowData } from '../../types'
import { dashForLineStyle } from './dash'

export function ArrowShape({ data }: { data: ArrowData }) {
  return (
    <Arrow
      points={data.points}
      stroke={data.color}
      fill={data.color}
      strokeWidth={data.strokeWidth}
      dash={dashForLineStyle(data.lineStyle)}
      tension={data.shape === 'curved' ? 0.5 : 0}
      pointerLength={12}
      pointerWidth={12}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={16}
    />
  )
}
