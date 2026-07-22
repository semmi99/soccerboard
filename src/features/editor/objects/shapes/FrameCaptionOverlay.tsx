import { Group, Rect, Text } from 'react-konva'
import type { FrameCaption } from '../../types'

const CARD_X = 24
const CARD_Y = 28
const CARD_WIDTH = 300
const PAD_X = 16

/** A short "broadcast graphic" story beat over the current frame — an
 * eyebrow badge, a bold headline, and an optional supporting line — styled
 * after the callout cards tactical-analysis explainer reels use to narrate
 * a sequence beat by beat. Rendered in plain stage coordinates (not inside
 * the pitch's crop/orientation transform) so it always sits top-left
 * regardless of pitch design or crop. */
export function FrameCaptionOverlay({ caption }: { caption: FrameCaption | null | undefined }) {
  if (!caption || (!caption.badge && !caption.title && !caption.subtitle)) return null

  const badgeHeight = caption.badge ? 22 : 0
  const badgeGap = caption.badge ? 8 : 0
  const titleHeight = caption.title ? 30 : 0
  const subtitleHeight = caption.subtitle ? 20 : 0
  const cardPadY = 14
  const cardHeight = cardPadY * 2 + titleHeight + subtitleHeight

  return (
    <Group x={CARD_X} y={CARD_Y} listening={false}>
      {caption.badge && (
        <Group y={0}>
          <Rect width={caption.badge.length * 7.5 + 20} height={badgeHeight} fill="#ef4444" cornerRadius={4} />
          <Text
            text={caption.badge.toUpperCase()}
            x={10}
            y={5}
            fontSize={11}
            fontStyle="bold"
            fill="#ffffff"
            letterSpacing={0.5}
          />
        </Group>
      )}
      {(caption.title || caption.subtitle) && (
        <Group y={badgeHeight + badgeGap}>
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
    </Group>
  )
}
