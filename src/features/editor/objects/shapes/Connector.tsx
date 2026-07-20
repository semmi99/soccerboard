import { Group, Line, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { ConnectorData } from '../../types'
import { dashForLineStyle } from './dash'
import { computePathDistanceMeters, midpointOf } from './arrowDistance'
import { useEditorStore } from '../../store/editorStore'

const LABEL_FONT_SIZE = 12

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
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const pitchWidthM = useEditorStore((s) => s.pitchWidthM)

  const points = [from.x, from.y, to.x, to.y]
  const distanceLabel = data.showDistance
    ? `${Math.round(computePathDistanceMeters(points, pitchLengthM, pitchWidthM))} m`
    : null
  const mid = distanceLabel ? midpointOf(points) : null
  const labelWidth = distanceLabel ? LABEL_FONT_SIZE * distanceLabel.length * 0.62 + 12 : 0

  return (
    <Group>
      <Line
        ref={lineRef}
        points={points}
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
      {distanceLabel && mid && (
        <Group name="connector-distance-label" x={mid.x} y={mid.y} listening={false}>
          <Rect
            x={-labelWidth / 2}
            y={-LABEL_FONT_SIZE * 1.6}
            width={labelWidth}
            height={LABEL_FONT_SIZE * 1.4}
            cornerRadius={LABEL_FONT_SIZE * 0.3}
            fill="rgba(10, 10, 10, 0.7)"
          />
          <Text
            x={-labelWidth / 2}
            y={-LABEL_FONT_SIZE * 1.6}
            width={labelWidth}
            height={LABEL_FONT_SIZE * 1.4}
            text={distanceLabel}
            fontSize={LABEL_FONT_SIZE}
            fontStyle="bold"
            fill="#ffffff"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  )
}
