import { Group, Rect, Text } from 'react-konva'
import type { QuoteCardData } from '../../types'
import { QUOTE_FONT_STACKS } from '../../types'

function hexToRgbTriplet(hex: string): [number, number, number] {
  const clean = hex.startsWith('#') ? hex : '#ef4444'
  return [parseInt(clean.slice(1, 3), 16), parseInt(clean.slice(3, 5), 16), parseInt(clean.slice(5, 7), 16)]
}

/** Same gradient recipe as ShapeItem/TextItem — radial (centered) or linear
 * (left edge to right edge), fading to transparent unless a second color is
 * given. Duplicated locally rather than shared, matching how those files
 * each already keep their own copy. */
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
        return [0, `rgba(${r}, ${g}, ${b}, 1)`, 1, `rgba(${r2}, ${g2}, ${b2}, 1)`]
      })()
    : [0, `rgba(${r}, ${g}, ${b}, 1)`, 1, `rgba(${r}, ${g}, ${b}, 0)`]
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

const PAD = 14
const HEADING_BOX_PAD_X = 10
const HEADING_BOX_PAD_Y = 5

/** Shared layout math so the in-place-editing textarea overlay (see
 * EditorCanvas) lines up exactly with where the Konva Text nodes render
 * below. */
export function computeQuoteCardLayout(data: QuoteCardData) {
  const headingBoxWidth = data.headingBoxEnabled
    ? Math.min(data.width - PAD * 2, data.headingFontSize * data.headingText.length * 0.62 + HEADING_BOX_PAD_X * 2)
    : data.width - PAD * 2
  const headingBoxHeight = data.headingFontSize + HEADING_BOX_PAD_Y * 2
  const headingY = PAD
  const bodyY = headingY + headingBoxHeight + (data.headingBoxEnabled ? 10 : 6)
  return { pad: PAD, headingBoxWidth, headingBoxHeight, headingY, bodyY }
}

/** A freely-placeable heading + body callout card, matching the look of
 * tactical-analysis explainer reels ("IF HE DIVES" / "MISS IT, AND IT'S
 * 3 v 0"). Text content is hidden while the object is being edited in-place
 * (see EditorCanvas's textarea overlay) so it isn't rendered twice. */
export function QuoteCard({ data, hideText }: { data: QuoteCardData; hideText?: boolean }) {
  const cardFillProps = data.background
    ? data.backgroundGradient
      ? gradientFillProps(data.background, data.background2, data.backgroundGradientDirection, data.width, data.height)
      : { fill: data.background }
    : {}

  const { headingBoxWidth, headingBoxHeight, headingY, bodyY } = computeQuoteCardLayout(data)

  return (
    <Group>
      <Rect
        width={data.width}
        height={data.height}
        cornerRadius={6}
        stroke={data.borderColor ?? undefined}
        strokeWidth={data.borderColor ? 2 : 0}
        {...cardFillProps}
      />
      {!hideText && (
        <>
          {data.headingBoxEnabled && (
            <Rect
              x={PAD}
              y={headingY}
              width={headingBoxWidth}
              height={headingBoxHeight}
              cornerRadius={4}
              fill={data.headingBoxBackground ?? '#ffffff'}
              stroke={data.headingBoxBorderColor ?? undefined}
              strokeWidth={data.headingBoxBorderColor ? 1.5 : 0}
            />
          )}
          <Text
            x={PAD}
            y={data.headingBoxEnabled ? headingY : headingY}
            width={data.headingBoxEnabled ? headingBoxWidth : data.width - PAD * 2}
            height={data.headingBoxEnabled ? headingBoxHeight : undefined}
            text={data.headingText}
            fontSize={data.headingFontSize}
            fontFamily={QUOTE_FONT_STACKS[data.headingFontFamily]}
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            wrap="word"
            fill={data.headingColor}
            {...(data.headingGradient
              ? gradientFillProps(
                  data.headingColor,
                  data.headingColor2,
                  data.headingGradientDirection,
                  headingBoxWidth,
                  headingBoxHeight,
                )
              : {})}
          />
          <Text
            x={PAD}
            y={bodyY}
            width={data.width - PAD * 2}
            height={data.height - bodyY - PAD}
            text={data.bodyText}
            fontSize={data.bodyFontSize}
            fontFamily={QUOTE_FONT_STACKS[data.bodyFontFamily]}
            fontStyle="bold italic"
            align={data.bodyAlign ?? 'left'}
            wrap="word"
            fill={data.bodyColor}
            {...(data.bodyGradient
              ? gradientFillProps(
                  data.bodyColor,
                  data.bodyColor2,
                  data.bodyGradientDirection,
                  data.width - PAD * 2,
                  data.height - bodyY - PAD,
                )
              : {})}
          />
        </>
      )}
    </Group>
  )
}
