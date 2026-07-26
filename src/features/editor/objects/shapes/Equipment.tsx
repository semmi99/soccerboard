import { Circle, Group, Line, Rect } from 'react-konva'
import type { EquipmentData, EquipmentKind } from '../../types'

export const EQUIPMENT_DEFAULT_COLORS: Record<EquipmentKind, string> = {
  cone: '#f97316',
  mini_goal: '#e5e7eb',
  mannequin: '#94a3b8',
  slalom_pole: '#facc15',
  ladder: '#e5e7eb',
  ring: '#ef4444',
}

/** Darkens a hex color for the cone's base/shadow accent. */
function darken(hex: string, amount = 0.3) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 0xff) * (1 - amount))
  const g = Math.round(((n >> 8) & 0xff) * (1 - amount))
  const b = Math.round((n & 0xff) * (1 - amount))
  return `rgb(${r}, ${g}, ${b})`
}

/** Lightens a hex color toward white — the cone marker's glossy highlight. */
function lighten(hex: string, amount = 0.4) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * amount)
  const g = Math.round(((n >> 8) & 0xff) + (255 - ((n >> 8) & 0xff)) * amount)
  const b = Math.round((n & 0xff) + (255 - (n & 0xff)) * amount)
  return `rgb(${r}, ${g}, ${b})`
}

export function EquipmentShape({ data }: { data: EquipmentData }) {
  return (
    <Group scaleX={data.scaleX ?? 1} scaleY={data.scaleY ?? 1}>
      <EquipmentIcon data={data} />
    </Group>
  )
}

function EquipmentIcon({ data }: { data: EquipmentData }) {
  const color = data.color ?? EQUIPMENT_DEFAULT_COLORS[data.kind]

  switch (data.kind) {
    case 'cone': {
      // A top-down marker disc (matching how it actually reads on a
      // bird's-eye tactics pitch) rather than the old side-view triangle
      // silhouette — glossy radial shading plus the small stacking-hole
      // dot, same look regardless of which of the 6 marker colors is picked.
      const r = 13
      return (
        <Group>
          <Circle
            radius={r}
            fillRadialGradientStartPoint={{ x: -r * 0.35, y: -r * 0.35 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientEndRadius={r * 1.3}
            fillRadialGradientColorStops={[0, lighten(color, 0.55), 0.55, color, 1, darken(color, 0.3)]}
            stroke={darken(color, 0.5)}
            strokeWidth={0.5}
          />
          <Circle x={-r * 0.15} y={-r * 0.32} radius={r * 0.18} fill="rgba(0, 0, 0, 0.5)" />
        </Group>
      )
    }
    case 'mini_goal': {
      // A small pop-up goal: front frame (the goal mouth), a receding back
      // edge for a pseudo-3D box shape, and a light net mesh instead of one
      // big X — a single diagonal cross read as "broken window", not a net.
      const left = -16
      const top = -10
      const width = 32
      const height = 20
      const backLeft = left + 5
      const backRight = left + width - 5
      const backTop = top - 6
      return (
        <Group>
          <Line
            points={[left, top, backLeft, backTop, backRight, backTop, left + width, top]}
            stroke={color}
            strokeWidth={1.5}
          />
          <Line points={[left, top, backLeft, backTop]} stroke={color} strokeWidth={1.5} />
          <Line points={[left + width, top, backRight, backTop]} stroke={color} strokeWidth={1.5} />
          <Rect x={left} y={top} width={width} height={height} stroke={color} strokeWidth={2} fill="rgba(255,255,255,0.06)" />
          {[0.25, 0.5, 0.75].map((f) => (
            <Line key={`v-${f}`} points={[left + width * f, top, left + width * f, top + height]} stroke={color} strokeWidth={0.75} opacity={0.5} />
          ))}
          {[0.33, 0.66].map((f) => (
            <Line key={`h-${f}`} points={[left, top + height * f, left + width, top + height * f]} stroke={color} strokeWidth={0.75} opacity={0.5} />
          ))}
        </Group>
      )
    }
    case 'mannequin':
      return (
        <Group>
          <Circle y={-14} radius={6} fill={color} />
          <Rect x={-7} y={-8} width={14} height={22} cornerRadius={4} fill={color} />
        </Group>
      )
    case 'slalom_pole':
      return <Line points={[0, -22, 0, 10]} stroke={color} strokeWidth={3} />
    case 'ladder':
      return (
        <Group>
          <Rect x={-30} y={-8} width={60} height={16} stroke={color} strokeWidth={2} fill="rgba(255,255,255,0.05)" />
          {[-18, -6, 6, 18].map((x) => (
            <Line key={x} points={[x, -8, x, 8]} stroke={color} strokeWidth={2} />
          ))}
        </Group>
      )
    case 'ring':
      return <Circle radius={15} stroke={color} strokeWidth={5} />
    default:
      return null
  }
}
