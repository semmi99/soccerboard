import { Circle, Line, Rect } from 'react-konva'
import type { ShapeData } from '../../types'
import { dashForLineStyle } from './dash'

export function ShapeItem({ data }: { data: ShapeData }) {
  const common = {
    fill: data.fill,
    stroke: data.stroke,
    strokeWidth: data.strokeWidth,
    dash: dashForLineStyle(data.lineStyle),
    opacity: data.opacity,
  }

  if (data.kind === 'circle') {
    return <Circle radius={data.width / 2} {...common} />
  }

  if (data.kind === 'rect') {
    return (
      <Rect
        x={-data.width / 2}
        y={-data.height / 2}
        width={data.width}
        height={data.height}
        cornerRadius={4}
        {...common}
      />
    )
  }

  return <Line points={data.points ?? []} closed {...common} />
}
