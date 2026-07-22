import { Group, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { FrameCaption } from '../../types'

const CARD_X = 24
const CARD_Y = 58
const BADGE_DEFAULT_X = 24
const BADGE_DEFAULT_Y = 28
const CARD_WIDTH = 300
const PAD_X = 16

/** A short "broadcast graphic" story beat over the current frame — an
 * eyebrow badge, a bold headline, and an optional supporting line — styled
 * after the callout cards tactical-analysis explainer reels use to narrate
 * a sequence beat by beat. Rendered in plain stage coordinates (not inside
 * the pitch's crop/orientation transform) so it always sits top-left by
 * default regardless of pitch design or crop. The badge alone is
 * draggable — coaches point it at a specific spot on the pitch the same
 * way those reels drop a small pill label right next to the action,
 * instead of it always being stuck to the title card above. */
export function FrameCaptionOverlay({
  caption,
  interactive = true,
  onBadgeDragEnd,
}: {
  caption: FrameCaption | null | undefined
  interactive?: boolean
  onBadgeDragEnd?: (x: number, y: number) => void
}) {
  if (!caption || (!caption.badge && !caption.title && !caption.subtitle)) return null

  const badgeHeight = 22
  const titleHeight = caption.title ? 30 : 0
  const subtitleHeight = caption.subtitle ? 20 : 0
  const cardPadY = 14
  const cardHeight = cardPadY * 2 + titleHeight + subtitleHeight

  return (
    <>
      {caption.badge && (
        <Group
          x={caption.badgeX ?? BADGE_DEFAULT_X}
          y={caption.badgeY ?? BADGE_DEFAULT_Y}
          draggable={interactive}
          onDragEnd={(e: KonvaEventObject<DragEvent>) => onBadgeDragEnd?.(e.target.x(), e.target.y())}
        >
          <Rect
            width={caption.badge.length * 7.5 + 20}
            height={badgeHeight}
            fill={caption.badgeColor ?? '#ef4444'}
            cornerRadius={4}
          />
          <Text
            text={caption.badge.toUpperCase()}
            x={10}
            y={5}
            fontSize={11}
            fontStyle="bold"
            fill="#ffffff"
            letterSpacing={0.5}
            listening={false}
          />
        </Group>
      )}
      {(caption.title || caption.subtitle) && (
        <Group x={CARD_X} y={CARD_Y} listening={false}>
          <Rect
            width={CARD_WIDTH}
            height={cardHeight}
            fill="rgba(255,255,255,0.97)"
            cornerRadius={8}
            shadowColor="black"
            shadowBlur={12}
            shadowOpacity={0.35}
          />
          {caption.title && (
            <Text
              text={caption.title}
              x={PAD_X}
              y={cardPadY}
              width={CARD_WIDTH - PAD_X * 2}
              fontSize={20}
              fontStyle="bold"
              fill="#0f172a"
              wrap="word"
            />
          )}
          {caption.subtitle && (
            <Text
              text={caption.subtitle}
              x={PAD_X}
              y={cardPadY + titleHeight}
              width={CARD_WIDTH - PAD_X * 2}
              fontSize={12}
              fill="#475569"
              wrap="word"
            />
          )}
        </Group>
      )}
    </>
  )
}
