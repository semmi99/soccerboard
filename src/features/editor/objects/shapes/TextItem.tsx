import { Group, Rect, Text } from 'react-konva'
import type { TextData } from '../../types'

function hexToRgbTriplet(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

/** Same gradient recipe as ShapeItem's — radial (centered) or linear (left
 * edge to right edge), fading to transparent unless a second color is given. */
function gradientFillProps(
  color: string,
  color2: string | null | undefined,
  direction: 'radial' | 'linear' | undefined,
  width: number,
  height: number,
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
  if (direction === 'linear') {
    return {
      fillLinearGradientStartPoint: { x: 0, y: height / 2 },
      fillLinearGradientEndPoint: { x: width, y: height / 2 },
      fillLinearGradientColorStops: stops,
    }
  }
  return {
    fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: Math.max(width, height) / 2,
    fillRadialGradientColorStops: stops,
  }
}

export function TextItem({ data }: { data: TextData }) {
  const shadowProps = data.shadow
    ? { shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.8 }
    : {}

  if (data.background) {
    const paddingX = 14
    const height = data.fontSize + 14
    const width = data.fontSize * data.text.length * 0.62 + paddingX * 2
    const fillProps = data.backgroundGradient
      ? gradientFillProps(data.background, data.backgroundGradientColor2, data.backgroundGradientDirection, width, height)
      : { fill: data.background }
    return (
      <Group>
        <Rect width={width} height={height} cornerRadius={height / 2} {...fillProps} />
        <Text
          text={data.text}
          fontSize={data.fontSize}
          fontStyle={data.fontStyle}
          fill={data.color}
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    )
  }

  return (
    <Text
      text={data.text}
      fontSize={data.fontSize}
      fontStyle={data.fontStyle}
      fill={data.color}
      padding={4}
      {...shadowProps}
    />
  )
}
