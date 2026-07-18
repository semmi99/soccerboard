import { Circle, Ellipse, Group, Line } from 'react-konva'
import type { BallData } from '../../types'

const R = 9

/** A modern tournament-ball look: shaded sphere, a couple of organic
 * accent-colored panels and thin curved seams, instead of the classic
 * black/white pentagon pattern. Original design, not modeled on any
 * specific real match ball. */
export function BallShape({ data }: { data: BallData }) {
  const accent = data.color ?? '#ff5a1f'
  return (
    <Group>
      <Circle
        radius={R}
        fillRadialGradientStartPoint={{ x: -R * 0.3, y: -R * 0.3 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={R * 1.3}
        fillRadialGradientColorStops={[0, '#ffffff', 1, '#d9d9d9']}
        stroke="#1a1a1a"
        strokeWidth={1}
      />
      <Group clipFunc={(ctx) => ctx.arc(0, 0, R - 0.5, 0, Math.PI * 2, false)}>
        <Line
          points={[-R, -R * 0.2, -R * 0.2, -R * 0.9, R * 0.5, -R * 0.5, R * 0.1, R * 0.1]}
          closed
          fill={accent}
          opacity={0.85}
          tension={0.5}
          listening={false}
        />
        <Line
          points={[R * 0.9, R * 0.1, R * 0.3, R * 0.9, -R * 0.4, R * 0.6, -R * 0.1, -R * 0.1]}
          closed
          fill={accent}
          opacity={0.5}
          tension={0.5}
          listening={false}
        />
        <Line
          points={[-R, 0, -R * 0.2, -R * 0.3, R * 0.3, R * 0.1, R, -R * 0.1]}
          stroke="#1a1a1a"
          strokeWidth={0.6}
          tension={0.5}
          opacity={0.6}
          listening={false}
        />
        <Line
          points={[0, -R, -R * 0.15, -R * 0.1, R * 0.1, R * 0.3, -R * 0.1, R]}
          stroke="#1a1a1a"
          strokeWidth={0.6}
          tension={0.5}
          opacity={0.6}
          listening={false}
        />
      </Group>
      <Ellipse
        x={-R * 0.35}
        y={-R * 0.35}
        radiusX={R * 0.28}
        radiusY={R * 0.18}
        rotation={-30}
        fill="#ffffff"
        opacity={0.6}
        listening={false}
      />
    </Group>
  )
}
