import { Line } from 'react-konva'
import type Konva from 'konva'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** The filled area auto-detected from a closed loop of connectors (see
 * connectorZones.ts) — purely a derived visual, not its own stored/selectable
 * object, so there's nothing here to click, delete, or configure directly.
 * Its color instead follows whichever connector color forms the loop
 * (already user-editable via the connector's own "Farbe" picker), so a
 * differently-colored set of connectors gives a differently-colored zone
 * without a separate control. */
export function ConnectorZoneShape({
  points,
  color = '#f0d878',
  lineRef,
}: {
  points: number[]
  color?: string
  lineRef?: (node: Konva.Line | null) => void
}) {
  return (
    <Line
      ref={lineRef}
      points={points}
      closed
      fill={hexToRgba(color, 0.25)}
      stroke={color}
      strokeWidth={1.5}
      opacity={1}
      listening={false}
    />
  )
}
