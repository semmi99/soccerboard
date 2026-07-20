import { Line } from 'react-konva'
import type Konva from 'konva'

/** The filled area auto-detected from a closed loop of connectors (see
 * connectorZones.ts) — purely a derived visual, not its own stored/selectable
 * object, so there's nothing here to click, delete, or configure. */
export function ConnectorZoneShape({
  points,
  lineRef,
}: {
  points: number[]
  lineRef?: (node: Konva.Line | null) => void
}) {
  return (
    <Line
      ref={lineRef}
      points={points}
      closed
      fill="rgba(240, 216, 120, 0.25)"
      stroke="#f0d878"
      strokeWidth={1.5}
      opacity={1}
      listening={false}
    />
  )
}
