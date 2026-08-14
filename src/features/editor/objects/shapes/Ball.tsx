import { Circle, Ellipse, Group, Line } from 'react-konva'
import type { BallData } from '../../types'

const R = 9

/** Vertices of a regular pentagon, flattened to [x0,y0,x1,y1,...] — used
 * for both the central patch and the small rim fragments below. */
function pentagonPoints(cx: number, cy: number, r: number, rotationDeg: number): number[] {
  const points: number[] = []
  for (let k = 0; k < 5; k++) {
    const a = ((rotationDeg + k * 72 - 90) * Math.PI) / 180
    points.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  return points
}

/** The classic black-pentagon-on-white pattern — a central pentagon with
 * five seams curving out to the rim, plus a few rim-edge fragments for
 * texture. This is the generic/public-domain truncated-icosahedron ball
 * pattern (predates any single manufacturer and is the basis of the ⚽
 * emoji glyph), hand-drawn here as original vector shapes — not a
 * reproduction of any specific manufacturer's photo or trademarked
 * colorway. `data.color` tints the patches instead of pure black, so the
 * existing per-ball color customization still works. */
export function BallShape({ data }: { data: BallData }) {
  const patchColor = data.color ?? '#1a1a1a'
  const centralR = 3.1
  const centralRotation = 18
  const centralPoints = pentagonPoints(0, -0.8, centralR, centralRotation)

  const seamTargets = Array.from({ length: 5 }, (_, k) => {
    const a = ((centralRotation + k * 72 - 90) * Math.PI) / 180
    return { x: (centralR + 0.4) * Math.cos(a), y: -0.8 + (centralR + 0.4) * Math.sin(a) }
  })

  const rimFragmentAngles = [-126, -54, 18, 90, 162]

  return (
    <Group>
      <Circle radius={R + 0.7} fill="rgba(0,0,0,0.16)" y={0.5} listening={false} />
      <Circle
        radius={R}
        fillRadialGradientStartPoint={{ x: -R * 0.3, y: -R * 0.3 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={R * 1.3}
        fillRadialGradientColorStops={[0, '#ffffff', 1, '#dcdcdc']}
        stroke="#161616"
        strokeWidth={1}
      />
      <Group clipFunc={(ctx) => ctx.arc(0, 0, R - 0.6, 0, Math.PI * 2, false)}>
        <Line points={centralPoints} closed fill={patchColor} stroke="#111" strokeWidth={0.4} listening={false} />
        {seamTargets.map((t, i) => {
          const vx = centralPoints[i * 2]!
          const vy = centralPoints[i * 2 + 1]!
          const rimX = vx * (R / centralR) * 0.98
          const rimY = vy * (R / centralR) * 0.98
          return (
            <Line
              key={i}
              points={[vx, vy, t.x, t.y, rimX, rimY]}
              stroke="#111"
              strokeWidth={0.55}
              tension={0.3}
              opacity={0.85}
              listening={false}
            />
          )
        })}
        {rimFragmentAngles.map((deg, i) => {
          const a = (deg * Math.PI) / 180
          const cx = Math.cos(a) * R * 0.86
          const cy = Math.sin(a) * R * 0.86
          return (
            <Line
              key={i}
              points={pentagonPoints(cx, cy, 1.9, deg + 90)}
              closed
              fill={patchColor}
              opacity={0.9}
              listening={false}
            />
          )
        })}
      </Group>
      <Ellipse
        x={-R * 0.32}
        y={-R * 0.35}
        radiusX={R * 0.26}
        radiusY={R * 0.16}
        rotation={-30}
        fill="#ffffff"
        opacity={0.75}
        listening={false}
      />
    </Group>
  )
}
