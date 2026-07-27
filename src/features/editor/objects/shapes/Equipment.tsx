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

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

/** A closed, smoothly-rounded basket silhouette (no sharp corners) —
 * sampled from a few (y, half-width) keyframes eased into each other, then
 * mirrored — used for both the mannequin's stroke outline and its mesh
 * clip region, so the two always agree exactly. Computed once at module
 * load since it doesn't depend on any prop. Ends at a narrow rounded
 * bottom (y=10) rather than tapering to a point — the tripod legs (drawn
 * separately, see MANNEQUIN_LEGS) continue on from there. */
const MANNEQUIN_OUTLINE: number[] = (() => {
  const keyframes: [number, number][] = [
    [-18, 3],
    [-13, 4],
    [-8, 9],
    [-2, 10],
    [4, 9],
    [7, 7],
    [10, 4],
  ]
  const STEPS = 6
  const right: { x: number; y: number }[] = []
  for (let i = 0; i < keyframes.length - 1; i++) {
    const [y0, w0] = keyframes[i]!
    const [y1, w1] = keyframes[i + 1]!
    for (let s = 0; s < STEPS; s++) {
      const t = s / STEPS
      right.push({ x: w0 + (w1 - w0) * smoothstep(t), y: y0 + (y1 - y0) * t })
    }
  }
  const [lastY, lastW] = keyframes[keyframes.length - 1]!
  right.push({ x: lastW, y: lastY })
  const left = right
    .slice()
    .reverse()
    .map((p) => ({ x: -p.x, y: p.y }))
  return [...right, ...left].flatMap((p) => [p.x, p.y])
})()

/** The dummy's tripod stand — three straight legs splaying out from the
 * basket's bottom edge, matching how the real free-kick mannequins are
 * propped up. */
const MANNEQUIN_LEGS: [number, number, number, number][] = [
  [-4, 10, -6, 21],
  [0, 10, 0, 21],
  [4, 10, 6, 21],
]

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
    case 'mannequin': {
      // A woven free-kick "wall" dummy — a smoothly-rounded basket body
      // with a small carry-handle loop on top, drawn as an outlined mesh
      // (stroke + diagonal crosshatch) rather than a solid silhouette,
      // matching how the real training dummies look.
      const outline = MANNEQUIN_OUTLINE
      const hatchOffsets = [-30, -22, -14, -6, 2, 10, 18, 26]
      return (
        <Group>
          <Circle y={-23} radius={3} stroke={color} strokeWidth={1.5} />
          <Line points={[0, -20, 0, -18]} stroke={color} strokeWidth={1.5} />
          <Group
            clipFunc={(ctx) => {
              ctx.moveTo(outline[0]!, outline[1]!)
              for (let i = 2; i < outline.length; i += 2) ctx.lineTo(outline[i]!, outline[i + 1]!)
              ctx.closePath()
            }}
          >
            <Rect x={-16} y={-20} width={32} height={40} fill={`${color}26`} />
            {hatchOffsets.map((c) => (
              <Line key={`h1-${c}`} points={[-16, c - 16, 16, c + 16]} stroke={color} strokeWidth={0.75} opacity={0.55} />
            ))}
            {hatchOffsets.map((c) => (
              <Line key={`h2-${c}`} points={[-16, c + 16, 16, c - 16]} stroke={color} strokeWidth={0.75} opacity={0.55} />
            ))}
          </Group>
          <Line points={outline} closed stroke={color} strokeWidth={1.5} lineJoin="round" />
          {MANNEQUIN_LEGS.map(([x1, y1, x2, y2], i) => (
            <Line key={`leg-${i}`} points={[x1, y1, x2, y2]} stroke={color} strokeWidth={1.5} lineCap="round" />
          ))}
        </Group>
      )
    }
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
