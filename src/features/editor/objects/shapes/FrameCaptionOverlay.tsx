import { Group, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { CaptionBadge, FrameCaption } from '../../types'

const MIN_CARD_WIDTH = 140
const RESIZE_HANDLE_SIZE = 12

function hexToRgbTriplet(hex: string): [number, number, number] {
  const clean = hex.startsWith('#') ? hex : '#ef4444'
  return [parseInt(clean.slice(1, 3), 16), parseInt(clean.slice(3, 5), 16), parseInt(clean.slice(5, 7), 16)]
}

/** Same gradient recipe as ShapeItem/TextItem — radial (centered) or linear
 * (left edge to right edge), fading to transparent unless a second color is
 * given. Duplicated locally rather than shared, matching how those two
 * files each already keep their own copy. */
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
        return [0, `rgba(${r}, ${g}, ${b}, 0.95)`, 1, `rgba(${r2}, ${g2}, ${b2}, 0.9)`]
      })()
    : [0, `rgba(${r}, ${g}, ${b}, 0.95)`, 1, `rgba(${r}, ${g}, ${b}, 0.7)`]
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

function BadgePill({
  badge,
  interactive,
  onDragEnd,
}: {
  badge: CaptionBadge
  interactive: boolean
  onDragEnd: (x: number, y: number) => void
}) {
  const height = 22
  const width = badge.text.length * 7.5 + 20
  const fillProps = badge.gradient
    ? gradientFillProps(badge.color, badge.color2, badge.gradientDirection, width, height)
    : { fill: badge.color }
  return (
    <Group x={badge.x} y={badge.y} draggable={interactive} onDragEnd={(e: KonvaEventObject<DragEvent>) => onDragEnd(e.target.x(), e.target.y())}>
      <Rect width={width} height={height} cornerRadius={4} {...fillProps} />
      <Text
        text={badge.text.toUpperCase()}
        x={10}
        y={5}
        fontSize={11}
        fontStyle="bold"
        fill="#ffffff"
        letterSpacing={0.5}
        listening={false}
      />
    </Group>
  )
}

/** A short "broadcast graphic" style story beat over the current frame — one
 * or more draggable badge pills plus a title card, styled after the callout
 * cards tactical-analysis explainer reels use to narrate a sequence beat by
 * beat. Rendered in plain stage coordinates (not inside the pitch's crop/
 * orientation transform) so its default position is stable regardless of
 * pitch design or crop, though both the badges and the card can be dragged
 * anywhere. */
export function FrameCaptionOverlay({
  caption,
  interactive = true,
  onBadgeDragEnd,
  onCardDragEnd,
  onCardResize,
}: {
  caption: FrameCaption | null | undefined
  interactive?: boolean
  onBadgeDragEnd?: (badgeId: string, x: number, y: number) => void
  onCardDragEnd?: (x: number, y: number) => void
  onCardResize?: (width: number) => void
}) {
  if (!caption || (caption.badges.length === 0 && !caption.title && !caption.subtitle)) return null

  const titleHeight = caption.title ? 30 : 0
  const subtitleHeight = caption.subtitle ? 20 : 0
  const cardPadY = 14
  const cardHeight = cardPadY * 2 + titleHeight + subtitleHeight
  const cardFillProps = caption.gradient
    ? gradientFillProps(caption.background, caption.background2, caption.gradientDirection, caption.cardWidth, cardHeight)
    : { fill: caption.background }

  return (
    <>
      {caption.badges.map((badge) => (
        <BadgePill
          key={badge.id}
          badge={badge}
          interactive={interactive}
          onDragEnd={(x, y) => onBadgeDragEnd?.(badge.id, x, y)}
        />
      ))}
      {(caption.title || caption.subtitle) && (
        <Group
          x={caption.cardX}
          y={caption.cardY}
          draggable={interactive}
          onDragEnd={(e: KonvaEventObject<DragEvent>) => onCardDragEnd?.(e.target.x(), e.target.y())}
        >
          <Rect width={caption.cardWidth} height={cardHeight} cornerRadius={8} shadowColor="black" shadowBlur={12} shadowOpacity={0.35} {...cardFillProps} />
          {caption.title && (
            <Text
              text={caption.title}
              x={16}
              y={cardPadY}
              width={caption.cardWidth - 32}
              fontSize={20}
              fontStyle="bold"
              fill="#0f172a"
              wrap="word"
              listening={false}
            />
          )}
          {caption.subtitle && (
            <Text
              text={caption.subtitle}
              x={16}
              y={cardPadY + titleHeight}
              width={caption.cardWidth - 32}
              fontSize={12}
              fill="#475569"
              wrap="word"
              listening={false}
            />
          )}
          {interactive && onCardResize && (
            <Rect
              x={caption.cardWidth - RESIZE_HANDLE_SIZE / 2}
              y={cardHeight - RESIZE_HANDLE_SIZE / 2}
              width={RESIZE_HANDLE_SIZE}
              height={RESIZE_HANDLE_SIZE}
              fill="#3b82f6"
              cornerRadius={2}
              draggable
              onDragStart={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true
              }}
              onDragMove={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true
                const width = Math.max(MIN_CARD_WIDTH, e.target.x() + RESIZE_HANDLE_SIZE / 2)
                onCardResize(width)
                e.target.y(cardHeight - RESIZE_HANDLE_SIZE / 2)
              }}
              onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true
              }}
            />
          )}
        </Group>
      )}
    </>
  )
}
