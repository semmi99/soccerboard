import { Group, Line, Text } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { PlayerZoneData } from '../../types'

function centroid(points: number[]): { x: number; y: number } {
  let x = 0
  let y = 0
  const n = points.length / 2
  for (let i = 0; i < points.length; i += 2) {
    x += points[i]!
    y += points[i + 1]!
  }
  return { x: x / n, y: y / n }
}

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
  const center = data.label ? centroid(points) : null

  return (
    <>
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
      {center && (
        <Group x={center.x} y={center.y} listening={false}>
          <Text
            text={data.label}
            fontSize={17}
            fontStyle="bold"
            fill="#ffffff"
            width={140}
            offsetX={70}
            offsetY={9}
            align="center"
            shadowColor="#000000"
            shadowBlur={4}
            shadowOpacity={0.8}
          />
        </Group>
      )}
    </>
  )
}
