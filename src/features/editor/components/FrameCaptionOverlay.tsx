import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { FrameCaption } from '../types'

/** Lower-third caption overlay for the active frame — a step badge, bold
 * headline, and optional subline, matching the "coaching explainer" caption
 * style used in social-media tactics reels. Rendered as a plain Layer (not
 * wrapped in the objects Group's crop shift) so it stays anchored to the
 * visible viewport regardless of field crop or pitch orientation, and is
 * automatically included in PNG/video export since it's part of the same
 * Konva stage.
 *
 * The whole block (badge + title + subtitle) drags as one unit — its
 * position is stored per-frame (`caption.x`/`caption.y`) and defaults to the
 * bottom-left corner when unset. */
export function FrameCaptionOverlay({
  caption,
  stageWidth,
  stageHeight,
  draggable = false,
  onDragStart,
  onDragEnd,
}: {
  caption: FrameCaption
  stageWidth: number
  stageHeight: number
  draggable?: boolean
  onDragStart?: () => void
  onDragEnd?: (x: number, y: number) => void
}) {
  const padding = Math.max(20, stageWidth * 0.045)
  const maxWidth = stageWidth - padding * 2
  const titleFontSize = Math.max(20, stageWidth * 0.052)
  const subtitleFontSize = titleFontSize * 0.42
  const badgeFontSize = titleFontSize * 0.34
  const lineGap = titleFontSize * 0.3

  // Stack bottom-up: subtitle sits lowest, title above it, badge highest —
  // reserving two lines for the title so a slightly longer headline still
  // wraps without overlapping the line above it.
  let cursorBottom = -padding
  const subtitleY = cursorBottom - subtitleFontSize * 1.3
  if (caption.subtitle) cursorBottom = subtitleY - lineGap

  const titleY = cursorBottom - titleFontSize * 1.25 * 2
  cursorBottom = titleY - lineGap

  const badgeHeight = badgeFontSize + 10
  const badgeY = cursorBottom - badgeHeight

  function setCursor(stage: Konva.Stage | null, cursor: string) {
    const container = stage?.container()
    if (container) container.style.cursor = cursor
  }

  return (
    <Group
      x={caption.x ?? 0}
      y={caption.y ?? stageHeight}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => onDragEnd?.(e.target.x(), e.target.y())}
      onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
        if (draggable) setCursor(e.target.getStage(), 'move')
      }}
      onMouseLeave={(e: KonvaEventObject<MouseEvent>) => setCursor(e.target.getStage(), 'default')}
    >
      {draggable && (
        <Rect x={0} y={badgeY - 10} width={stageWidth} height={20 - badgeY} fill="#000000" opacity={0.0001} />
      )}
      {caption.badge && (
        <Group y={badgeY}>
          <Rect
            x={padding}
            y={0}
            width={badgeFontSize * caption.badge.length * 0.62 + 20}
            height={badgeHeight}
            cornerRadius={badgeHeight / 2}
            fill="#ffe100"
          />
          <Text
            x={padding}
            y={0}
            width={badgeFontSize * caption.badge.length * 0.62 + 20}
            height={badgeHeight}
            text={caption.badge.toUpperCase()}
            fontSize={badgeFontSize}
            fontStyle="bold"
            fill="#0f3d59"
            align="center"
            verticalAlign="middle"
            letterSpacing={0.5}
          />
        </Group>
      )}
      <Text
        x={padding}
        y={titleY}
        width={maxWidth}
        text={caption.title}
        fontSize={titleFontSize}
        fontStyle="bold"
        fill="#ffffff"
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.85}
        wrap="word"
      />
      {caption.subtitle && (
        <Text
          x={padding}
          y={subtitleY}
          width={maxWidth}
          text={caption.subtitle}
          fontSize={subtitleFontSize}
          fill="rgba(255, 255, 255, 0.75)"
          shadowColor="#000000"
          shadowBlur={6}
          shadowOpacity={0.8}
          wrap="word"
        />
      )}
    </Group>
  )
}
