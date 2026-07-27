import { Circle, Group, Line, Rect, Shape } from 'react-konva'
import type { EquipmentData, EquipmentKind } from '../../types'

export const EQUIPMENT_DEFAULT_COLORS: Record<EquipmentKind, string> = {
  cone: '#f97316',
  mini_goal: '#e5e7eb',
  mannequin: '#ceff00',
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
 * load since it doesn't depend on any prop. A tall, straight-sided basket
 * (gentle taper only, no big round bulge — a lampshade, not a balloon)
 * ending at a narrow bottom edge; the tripod legs (see MANNEQUIN_LEGS)
 * continue on from there. */
const MANNEQUIN_OUTLINE: number[] = (() => {
  const keyframes: [number, number][] = [
    [-14, 5],
    [-10, 6.5],
    [-2, 7.5],
    [6, 7],
    [10, 5.5],
    [13, 4],
  ]
  const STEPS = 8
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

/** The dummy's 4-leg stand: each leg attaches along the basket's bottom
 * edge, bows outward at mid-length, then converges onto the narrow base
 * plate — drawn as a single quadratic curve per leg (a tensioned Line
 * spline overshoots badly with only 3 points, crossing neighboring legs)
 * so the bow stays clean and predictable. */
const MANNEQUIN_LEG_TOP_X = [-6, -2, 2, 6]
const MANNEQUIN_LEG_BOTTOM_X = [-3, -1, 1, 3]
const MANNEQUIN_LEG_TOP_Y = 13
const MANNEQUIN_LEG_CONTROL_Y = 24
const MANNEQUIN_LEG_BOTTOM_Y = 33
const MANNEQUIN_LEGS: [number, number, number][] = MANNEQUIN_LEG_TOP_X.map((top, i) => {
  const bottom = MANNEQUIN_LEG_BOTTOM_X[i]!
  // Control point: the straight-line midpoint pulled slightly further out,
  // for a subtle bow — pulling it out much further makes neighboring legs'
  // curves cross over each other into a woven-basket look instead of 4
  // distinct legs.
  return [top, ((top + bottom) / 2) * 1.15, bottom]
})

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
      // A solid molded free-kick dummy (SELECT-style): an opaque colored
      // basket body with a fine punched-dot texture (not a wire mesh), a
      // tall oval carry-handle loop on top, 4 bowed legs, and a black
      // ground plate with holes — no spikes below it (kept for a flat
      // pitch-diagram look, not a literal 3D ground stake).
      const outline = MANNEQUIN_OUTLINE
      const dotSpacing = 2.6
      const dots: { x: number; y: number }[] = []
      for (let dy = -13; dy <= 12; dy += dotSpacing) {
        for (let dx = -8; dx <= 8; dx += dotSpacing) dots.push({ x: dx, y: dy })
      }
      return (
        <Group>
          <Circle y={-19} radius={5} scaleY={1.5} stroke={color} strokeWidth={2.2} />
          <Group
            clipFunc={(ctx) => {
              ctx.moveTo(outline[0]!, outline[1]!)
              for (let i = 2; i < outline.length; i += 2) ctx.lineTo(outline[i]!, outline[i + 1]!)
              ctx.closePath()
            }}
          >
            <Rect x={-9} y={-14} width={18} height={27} fill={color} />
            {dots.map((d, i) => (
              <Circle key={i} x={d.x} y={d.y} radius={0.6} fill="rgba(255,255,255,0.45)" />
            ))}
          </Group>
          <Line points={outline} closed stroke={darken(color, 0.15)} strokeWidth={1.2} lineJoin="round" />
          {MANNEQUIN_LEGS.map(([topX, ctrlX, botX], i) => (
            <Shape
              key={`leg-${i}`}
              stroke={color}
              strokeWidth={1.6}
              lineCap="round"
              sceneFunc={(ctx, shape) => {
                ctx.beginPath()
                ctx.moveTo(topX, MANNEQUIN_LEG_TOP_Y)
                ctx.quadraticCurveTo(ctrlX, MANNEQUIN_LEG_CONTROL_Y, botX, MANNEQUIN_LEG_BOTTOM_Y)
                ctx.strokeShape(shape)
              }}
            />
          ))}
          <Rect x={-5} y={MANNEQUIN_LEG_BOTTOM_Y - 0.7} width={10} height={3} cornerRadius={1} fill="#1c1c1c" />
          {MANNEQUIN_LEG_BOTTOM_X.map((hx, i) => (
            <Circle key={`hole-${i}`} x={hx} y={MANNEQUIN_LEG_BOTTOM_Y + 0.8} radius={0.9} fill="#cfcfcf" />
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
