import { Line } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { ConnectorData } from '../../types'
import { dashForLineStyle } from './dash'

export function ConnectorShape({
  data,
  from,
  to,
  isSelected,
  onSelect,
  lineRef,
}: {
  data: ConnectorData
  from: { x: number; y: number }
  to: { x: number; y: number }
  isSelected: boolean
  onSelect: (additive: boolean) => void
  lineRef?: (node: Konva.Line | null) => void
}) {
  return (
    <Line
      ref={lineRef}
      points={[from.x, from.y, to.x, to.y]}
      stroke={isSelected ? '#a855f7' : data.color}
      strokeWidth={isSelected ? data.strokeWidth + 1.5 : data.strokeWidth}
      dash={dashForLineStyle(data.lineStyle)}
      lineCap="round"
      hitStrokeWidth={16}
      shadowColor={isSelected ? '#a855f7' : undefined}
      shadowBlur={isSelected ? 6 : 0}
      shadowOpacity={0.7}
      onClick={(e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true
        onSelect(e.evt.shiftKey)
      }}
      onTap={(e: KonvaEventObject<TouchEvent>) => {
        e.cancelBubble = true
        onSelect(false)
      }}
    />
  )
}
