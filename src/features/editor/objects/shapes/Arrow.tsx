import { Arrow, Group, Rect, Text } from 'react-konva'
import type { ArrowData } from '../../types'
import { dashForLineStyle } from './dash'
import { computeCurvedPoints } from './arrowCurve'
import { computeArrowDistanceMeters } from './arrowDistance'
import { useEditorStore } from '../../store/editorStore'

const BASE_POINTER_SIZE = 12
const BASE_LABEL_FONT_SIZE = 12

function midpointOf(points: number[]): { x: number; y: number } {
  let sx = 0
  let sy = 0
  const n = points.length / 2
  for (let i = 0; i < points.length; i += 2) {
    sx += points[i]!
    sy += points[i + 1]!
  }
  return { x: sx / n, y: sy / n }
}

export function ArrowShape({ data, scale = 1 }: { data: ArrowData; scale?: number }) {
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const pitchWidthM = useEditorStore((s) => s.pitchWidthM)

  // The object's own scale (resize handle) multiplies into this shape's
  // rendered size, so the pointer/arrowhead would otherwise balloon far
  // more than the line as the arrow is stretched. Divide it back out here
  // so the arrowhead stays close to its intended size regardless of scale.
  const showArrowhead = data.showArrowhead ?? true
  const safeScale = Math.max(scale, 0.2)
  const pointerSize = showArrowhead ? BASE_POINTER_SIZE / safeScale : 0
  const points = data.shape === 'curved' ? computeCurvedPoints(data) : data.points

  const distanceLabel = data.showDistance
    ? `${Math.round(computeArrowDistanceMeters(data, pitchLengthM, pitchWidthM))} m`
    : null
  const mid = distanceLabel ? midpointOf(points) : null
  const labelFontSize = BASE_LABEL_FONT_SIZE / safeScale
  const labelWidth = distanceLabel ? labelFontSize * distanceLabel.length * 0.62 + 12 : 0

  return (
    <Group>
      <Arrow
        points={points}
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
      {distanceLabel && mid && (
        <Group x={mid.x} y={mid.y} listening={false}>
          <Rect
            x={-labelWidth / 2}
            y={-labelFontSize * 1.6}
            width={labelWidth}
            height={labelFontSize * 1.4}
            cornerRadius={labelFontSize * 0.3}
            fill="rgba(10, 10, 10, 0.7)"
          />
          <Text
            x={-labelWidth / 2}
            y={-labelFontSize * 1.6}
            width={labelWidth}
            height={labelFontSize * 1.4}
            text={distanceLabel}
            fontSize={labelFontSize}
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
