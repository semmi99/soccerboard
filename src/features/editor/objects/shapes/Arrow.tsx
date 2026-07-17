import { Arrow } from 'react-konva'
import type { ArrowData } from '../../types'
import { dashForLineStyle } from './dash'

const BASE_POINTER_SIZE = 12

export function ArrowShape({ data, scale = 1 }: { data: ArrowData; scale?: number }) {
  // The object's own scale (resize handle) multiplies into this shape's
  // rendered size, so the pointer/arrowhead would otherwise balloon far
  // more than the line as the arrow is stretched. Divide it back out here
  // so the arrowhead stays close to its intended size regardless of scale.
  const pointerSize = BASE_POINTER_SIZE / Math.max(scale, 0.2)

  return (
    <Arrow
      points={data.points}
      stroke={data.color}
      fill={data.color}
      strokeWidth={data.strokeWidth}
      dash={dashForLineStyle(data.lineStyle)}
      tension={data.shape === 'curved' ? 0.5 : 0}
      pointerLength={pointerSize}
      pointerWidth={pointerSize}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={16}
    />
  )
}
