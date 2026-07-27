import { useEffect, useRef } from 'react'
import type { QuoteCardData } from '../types'
import { QUOTE_FONT_STACKS } from '../types'
import { computeQuoteCardLayout } from '../objects/shapes/QuoteCard'

interface Props {
  data: QuoteCardData
  /** Top-left corner of the quote card, in screen (viewport) pixels. */
  originX: number
  originY: number
  rotationDeg: number
  /** Combined object scale × stage zoom, so the overlay's fonts/positions
   * line up with the Konva Text nodes it's sitting on top of. */
  visualScale: number
  onCommit: (patch: { headingText: string; bodyText: string }) => void
  onClose: () => void
}

const fieldStyleBase: React.CSSProperties = {
  position: 'absolute',
  background: 'transparent',
  border: '1px dashed rgba(59, 130, 246, 0.7)',
  borderRadius: 2,
  resize: 'none',
  outline: 'none',
  padding: 0,
  pointerEvents: 'auto',
  overflow: 'hidden',
  lineHeight: 1.15,
}

/** Two HTML textareas positioned directly over a quote card's heading/body
 * text on the Konva stage, so the user can type in place — Enter inserts a
 * real newline (native textarea behavior, no key handling needed for that).
 * Clicking/tabbing between the two fields keeps the overlay open; focus
 * leaving both commits the text and closes it. */
export function QuoteCardEditOverlay({
  data,
  originX,
  originY,
  rotationDeg,
  visualScale,
  onCommit,
  onClose,
}: Props) {
  const headingRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const layout = computeQuoteCardLayout(data)

  useEffect(() => {
    headingRef.current?.focus()
    headingRef.current?.select()
  }, [])

  function commitAndClose() {
    onCommit({
      headingText: headingRef.current?.value ?? data.headingText,
      bodyText: bodyRef.current?.value ?? data.bodyText,
    })
    onClose()
  }

  return (
    <div
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null
        if (next && e.currentTarget.contains(next)) return
        commitAndClose()
      }}
      style={{
        position: 'fixed',
        left: originX,
        top: originY,
        width: data.width * visualScale,
        height: data.height * visualScale,
        transform: `rotate(${rotationDeg}deg)`,
        transformOrigin: 'top left',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <textarea
        ref={headingRef}
        defaultValue={data.headingText}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur()
        }}
        style={{
          ...fieldStyleBase,
          left: layout.pad * visualScale,
          top: layout.headingY * visualScale,
          width: layout.headingBoxWidth * visualScale,
          height: layout.headingBoxHeight * visualScale,
          fontSize: data.headingFontSize * visualScale,
          fontFamily: QUOTE_FONT_STACKS[data.headingFontFamily],
          fontWeight: 'bold',
          color: data.headingColor,
          textAlign: 'center',
        }}
      />
      <textarea
        ref={bodyRef}
        defaultValue={data.bodyText}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur()
        }}
        style={{
          ...fieldStyleBase,
          left: layout.pad * visualScale,
          top: layout.bodyY * visualScale,
          width: (data.width - layout.pad * 2) * visualScale,
          height: (data.height - layout.bodyY - layout.pad) * visualScale,
          fontSize: data.bodyFontSize * visualScale,
          fontFamily: QUOTE_FONT_STACKS[data.bodyFontFamily],
          fontWeight: 'bold',
          fontStyle: 'italic',
          color: data.bodyColor,
          textAlign: data.bodyAlign ?? 'left',
        }}
      />
    </div>
  )
}
