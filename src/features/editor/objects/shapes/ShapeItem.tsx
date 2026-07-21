import { Ellipse, Rect } from 'react-konva'
import type { ShapeData } from '../../types'
import { dashForLineStyle } from './dash'

function hexToRgbTriplet(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

/** A radial gradient's stops/center/radius, relative to the node's own local
 * coordinate space (Konva gradients ignore the node's fill and are anchored
 * to its untransformed origin) — shared by the circle and rect branches so
 * only the radius/center math differs between them. When no second color is
 * given, it fades the first color out to transparent (the original
 * single-color heatmap look) instead of blending into a different hue. */
function gradientProps(
  color: string,
  color2: string | null | undefined,
  centerX: number,
  centerY: number,
  radius: number,
) {
  const [r, g, b] = hexToRgbTriplet(color)
  const stops = color2
    ? (() => {
        const [r2, g2, b2] = hexToRgbTriplet(color2)
        return [0, `rgba(${r}, ${g}, ${b}, 0.9)`, 1, `rgba(${r2}, ${g2}, ${b2}, 0.85)`]
      })()
    : [
        0, `rgba(${r}, ${g}, ${b}, 0.9)`,
        0.6, `rgba(${r}, ${g}, ${b}, 0.45)`,
        1, `rgba(${r}, ${g}, ${b}, 0)`,
      ]
  return {
    fillRadialGradientStartPoint: { x: centerX, y: centerY },
    fillRadialGradientEndPoint: { x: centerX, y: centerY },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: radius,
    fillRadialGradientColorStops: stops,
  }
}

export function ShapeItem({ data }: { data: ShapeData }) {
  const common = {
    stroke: data.noBorder ? undefined : data.stroke,
    strokeWidth: data.noBorder ? 0 : data.strokeWidth,
    dash: dashForLineStyle(data.lineStyle),
    opacity: data.opacity,
  }

  if (data.kind === 'circle') {
    const fillProps = data.gradientColor
      ? gradientProps(data.gradientColor, data.gradientColor2, 0, 0, Math.max(data.width, data.height) / 2)
      : { fill: data.fill }
    return <Ellipse radiusX={data.width / 2} radiusY={data.height / 2} {...common} {...fillProps} />
  }

  const fillProps = data.gradientColor
    ? gradientProps(
        data.gradientColor,
        data.gradientColor2,
        data.width / 2,
        data.height / 2,
        Math.max(data.width, data.height) / 2,
      )
    : { fill: data.fill }
  return (
    <Rect
      x={-data.width / 2}
      y={-data.height / 2}
      width={data.width}
      height={data.height}
      cornerRadius={4}
      {...common}
      {...fillProps}
    />
  )
}
