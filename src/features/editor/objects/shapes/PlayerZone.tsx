import { Line } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { PlayerZoneData } from '../../types'

export function PlayerZoneShape({
  data,
  points,
  isSelected,
  onSelect,
  lineRef,
}: {
  data: PlayerZoneData
  points: number[]
  isSelected: boolean
  onSelect: (additive: boolean) => void
  lineRef?: (node: Konva.Line | null) => void
}) {
  return (
    <Line
      ref={lineRef}
      points={points}
      closed
      fill={data.fill}
      stroke={isSelected ? '#a855f7' : data.stroke}
      strokeWidth={isSelected ? 3 : 2}
      opacity={data.opacity}
      shadowColor={isSelected ? '#a855f7' : undefined}
      shadowBlur={isSelected ? 8 : 0}
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
