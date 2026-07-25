import { Group, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { CaptionBadge, FrameCaption, FrameCaptionCard } from '../../types'

const MIN_CARD_WIDTH = 140
const MIN_CARD_HEIGHT = 44
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

function TitleCard({
  card,
  interactive,
  onDragEnd,
  onResize,
}: {
  card: FrameCaptionCard
  interactive: boolean
  onDragEnd: (x: number, y: number) => void
  onResize?: (width: number, height: number) => void
}) {
  const titleFontSize = card.titleFontSize ?? 20
  const subtitleFontSize = card.subtitleFontSize ?? 12
  const titleHeight = card.title ? titleFontSize + 10 : 0
  const subtitleHeight = card.subtitle ? subtitleFontSize + 8 : 0
  const cardPadY = 14
  const autoHeight = cardPadY * 2 + titleHeight + subtitleHeight
  const cardHeight = card.cardHeight ?? autoHeight
  const fillProps = card.gradient
    ? gradientFillProps(card.background, card.background2, card.gradientDirection, card.cardWidth, cardHeight)
    : { fill: card.background }

  return (
    <Group
      x={card.cardX}
      y={card.cardY}
      draggable={interactive}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => onDragEnd(e.target.x(), e.target.y())}
    >
      <Rect width={card.cardWidth} height={cardHeight} cornerRadius={8} shadowColor="black" shadowBlur={12} shadowOpacity={0.35} {...fillProps} />
      {card.title && (
        <Text
          text={card.title}
          x={16}
          y={cardPadY}
          width={card.cardWidth - 32}
          fontSize={titleFontSize}
          fontStyle="bold"
          fill={card.titleColor ?? '#0f172a'}
          wrap="word"
          listening={false}
        />
      )}
      {card.subtitle && (
        <Text
          text={card.subtitle}
          x={16}
          y={cardPadY + titleHeight}
          width={card.cardWidth - 32}
          fontSize={subtitleFontSize}
          fill={card.subtitleColor ?? '#475569'}
          wrap="word"
          listening={false}
        />
      )}
      {interactive && onResize && (
        <Rect
          x={card.cardWidth - RESIZE_HANDLE_SIZE / 2}
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
            const height = Math.max(MIN_CARD_HEIGHT, e.target.y() + RESIZE_HANDLE_SIZE / 2)
            onResize(width, height)
          }}
          onDragEnd={(e: KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true
          }}
        />
      )}
    </Group>
  )
}

/** A short "broadcast graphic" story beat over the current frame — one or
 * more draggable badge pills plus zero or more title cards, styled after the
 * callout cards tactical-analysis explainer reels use to narrate a sequence
 * beat by beat. Rendered in plain stage coordinates (not inside the pitch's
 * crop/orientation transform) so default positions are stable regardless of
 * pitch design or crop, though badges and cards can all be dragged anywhere. */
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
  onCardDragEnd?: (cardId: string, x: number, y: number) => void
  onCardResize?: (cardId: string, width: number, height: number) => void
}) {
  if (!caption || (caption.badges.length === 0 && caption.cards.length === 0)) return null

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
      {caption.cards.map((card) => (
        <TitleCard
          key={card.id}
          card={card}
          interactive={interactive}
          onDragEnd={(x, y) => onCardDragEnd?.(card.id, x, y)}
          onResize={onCardResize ? (width, height) => onCardResize(card.id, width, height) : undefined}
        />
      ))}
    </>
  )
}
