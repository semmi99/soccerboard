import { useEffect, useRef, useState } from 'react'
import { Circle, Group, Image as KonvaImage, Rect, Shape, Text } from 'react-konva'
import Konva from 'konva'
import { TEAM_COLORS } from '../../constants'
import type { KitConfig, MarkerShape, PlayerChipData } from '../../types'
import { useEditorStore } from '../../store/editorStore'

const CHIP_R = 18
// The fill content (pattern rects / crest image) is drawn slightly larger
// than CHIP_R so the shirt clip's sleeve tips (which reach ~1.05·CHIP_R)
// are fully covered — otherwise a sliver at each sleeve tip would show
// nothing instead of the kit color. Harmless for the circle clip, which
// crops back down to CHIP_R regardless.
const FILL_HALF = CHIP_R * 1.1
const GK_FALLBACK: KitConfig = { pattern: 'solid', color1: '#eab308', color2: '#111827' }

/** Traces a simplified jersey silhouette (collar notch + short sleeves)
 * into any context with a canvas-2D-like path API — used both as a Group's
 * clipFunc (Konva.Context) and inside a Shape's sceneFunc (plain
 * CanvasRenderingContext2D) for the matching stroke outline. Sized so its
 * overall footprint (±1.05·r wide, ±1·r/1·r tall) roughly matches the
 * circle marker's own 2r×2r box, so switching shapes doesn't throw off chip
 * spacing on a packed formation. */
function traceShirtPath(ctx: { moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void; quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => void; closePath: () => void }, r: number) {
  const collarHalf = 0.22 * r
  const shoulderY = -r
  const sleeveTipX = 1.05 * r
  const sleeveTipY = -0.6 * r
  const sleeveInX = 0.8 * r
  const sleeveInY = -0.05 * r
  const bodyX = 0.75 * r
  const bodyTopY = -0.15 * r
  const bodyBottomY = 1.0 * r
  const corner = 0.15 * r

  ctx.moveTo(-collarHalf, shoulderY)
  ctx.lineTo(-0.55 * r, shoulderY)
  ctx.lineTo(-sleeveTipX, sleeveTipY)
  ctx.lineTo(-sleeveInX, sleeveInY)
  ctx.lineTo(-bodyX, bodyTopY)
  ctx.lineTo(-bodyX, bodyBottomY - corner)
  ctx.quadraticCurveTo(-bodyX, bodyBottomY, -bodyX + corner, bodyBottomY)
  ctx.lineTo(bodyX - corner, bodyBottomY)
  ctx.quadraticCurveTo(bodyX, bodyBottomY, bodyX, bodyBottomY - corner)
  ctx.lineTo(bodyX, bodyTopY)
  ctx.lineTo(sleeveInX, sleeveInY)
  ctx.lineTo(sleeveTipX, sleeveTipY)
  ctx.lineTo(0.55 * r, shoulderY)
  ctx.lineTo(collarHalf, shoulderY)
  ctx.quadraticCurveTo(0, -0.65 * r, -collarHalf, shoulderY)
  ctx.closePath()
}

function clipToMarkerShape(ctx: Konva.Context, shape: MarkerShape) {
  ctx.beginPath()
  if (shape === 'shirt') traceShirtPath(ctx, CHIP_R)
  else ctx.arc(0, 0, CHIP_R, 0, Math.PI * 2, false)
}

/** Stroke-only outline matching whichever shape the fill was clipped to —
 * a plain Circle for 'circle' (unchanged from before), a custom Shape
 * tracing the same jersey path for 'shirt'. */
function MarkerOutline({ shape }: { shape: MarkerShape }) {
  if (shape === 'shirt') {
    return (
      <Shape
        sceneFunc={(context, konvaShape) => {
          context.beginPath()
          traceShirtPath(context, CHIP_R)
          context.closePath()
          context.fillStrokeShape(konvaShape)
        }}
        stroke="#ffffff"
        strokeWidth={2}
        shadowColor="#000000"
        shadowBlur={6}
        shadowOffsetY={3}
        shadowOpacity={0.45}
      />
    )
  }
  return (
    <Circle
      radius={CHIP_R}
      stroke="#ffffff"
      strokeWidth={2}
      shadowColor="#000000"
      shadowBlur={6}
      shadowOffsetY={3}
      shadowOpacity={0.45}
    />
  )
}

/** The label is stored as one "First Last" string (see TeamSquadPanel) with
 * no structured first/last fields of its own — splitting at the LAST space
 * treats everything before it as the first name (so multi-word first names
 * like "Ben Luca" still work) and the final word as the last name. Applies
 * only to `lastName`/`twoLine` formats; `full` renders the string as-is. */
function formatPlayerLabel(label: string, format: 'full' | 'lastName' | 'twoLine'): string {
  if (format === 'full') return label
  const trimmed = label.trim()
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace === -1) return trimmed
  const first = trimmed.slice(0, lastSpace)
  const last = trimmed.slice(lastSpace + 1)
  return format === 'lastName' ? last : `${first}\n${last}`
}

/** Pulsing glow ring behind a highlighted chip — its radius/opacity oscillate
 * on a Konva.Animation tied to the shape's own layer, so it keeps pulsing
 * continuously (including while recording video export) without React
 * re-rendering every frame. */
function HighlightRing() {
  const ref = useRef<Konva.Circle>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const phase = (Math.sin(frame.time / 350) + 1) / 2 // 0..1
      node.radius(CHIP_R + 4 + phase * 9)
      node.opacity(0.85 - phase * 0.6)
    }, node.getLayer())
    anim.start()
    return () => {
      anim.stop()
    }
  }, [])

  return (
    <Circle
      ref={ref}
      radius={CHIP_R + 4}
      stroke="#ffe100"
      strokeWidth={3}
      listening={false}
    />
  )
}

function KitPatternContent({ kit }: { kit: KitConfig }) {
  switch (kit.pattern) {
    case 'stripes':
      return (
        <>
          {Array.from({ length: 5 }, (_, i) => {
            const w = (FILL_HALF * 2) / 5
            return (
              <Rect
                key={i}
                x={-FILL_HALF + i * w}
                y={-FILL_HALF}
                width={w}
                height={FILL_HALF * 2}
                fill={i % 2 === 0 ? kit.color1 : kit.color2}
              />
            )
          })}
        </>
      )
    case 'hoops':
      return (
        <>
          {Array.from({ length: 4 }, (_, i) => {
            const h = (FILL_HALF * 2) / 4
            return (
              <Rect
                key={i}
                x={-FILL_HALF}
                y={-FILL_HALF + i * h}
                width={FILL_HALF * 2}
                height={h}
                fill={i % 2 === 0 ? kit.color1 : kit.color2}
              />
            )
          })}
        </>
      )
    case 'sash':
      return (
        <>
          <Rect x={-FILL_HALF} y={-FILL_HALF} width={FILL_HALF * 2} height={FILL_HALF * 2} fill={kit.color1} />
          <Rect
            x={0}
            y={0}
            offsetX={FILL_HALF * 1.5}
            offsetY={FILL_HALF * 0.45}
            width={FILL_HALF * 3}
            height={FILL_HALF * 0.9}
            rotation={45}
            fill={kit.color2}
          />
        </>
      )
    case 'split':
      return (
        <>
          <Rect x={-FILL_HALF} y={-FILL_HALF} width={FILL_HALF} height={FILL_HALF * 2} fill={kit.color1} />
          <Rect x={0} y={-FILL_HALF} width={FILL_HALF} height={FILL_HALF * 2} fill={kit.color2} />
        </>
      )
    case 'collar':
      return (
        <>
          <Rect x={-FILL_HALF} y={-FILL_HALF} width={FILL_HALF * 2} height={FILL_HALF * 2} fill={kit.color1} />
          <Rect x={-FILL_HALF} y={-FILL_HALF} width={FILL_HALF * 2} height={FILL_HALF * 0.6} fill={kit.color2} />
        </>
      )
    case 'solid':
    default:
      return <Rect x={-FILL_HALF} y={-FILL_HALF} width={FILL_HALF * 2} height={FILL_HALF * 2} fill={kit.color1} />
  }
}

function useHtmlImage(url: string | null | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!url) {
      setImg(null)
      return
    }
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => setImg(image)
    image.src = url
    return () => {
      image.onload = null
    }
  }, [url])
  return img
}

function CrestFill({ url, shape }: { url: string; shape: MarkerShape }) {
  const img = useHtmlImage(url)
  return (
    <>
      <Group clipFunc={(ctx) => clipToMarkerShape(ctx, shape)}>
        <Rect x={-FILL_HALF} y={-FILL_HALF} width={FILL_HALF * 2} height={FILL_HALF * 2} fill="#1f2937" />
        {img && (
          <KonvaImage
            image={img}
            x={-FILL_HALF}
            y={-FILL_HALF}
            width={FILL_HALF * 2}
            height={FILL_HALF * 2}
          />
        )}
      </Group>
      <MarkerOutline shape={shape} />
    </>
  )
}

function KitFill({ kit, shape }: { kit: KitConfig; shape: MarkerShape }) {
  return (
    <>
      <Group clipFunc={(ctx) => clipToMarkerShape(ctx, shape)}>
        <KitPatternContent kit={kit} />
      </Group>
      <MarkerOutline shape={shape} />
    </>
  )
}

export function PlayerChipShape({ data }: { data: PlayerChipData }) {
  const teamKit = useEditorStore((s) => s.teamKit)
  const playerPhotos = useEditorStore((s) => s.playerPhotos)
  const playerLabelFormat = useEditorStore((s) => s.playerLabelFormat)
  const customKit: KitConfig | undefined = data.color
    ? { pattern: 'solid', color1: data.color, color2: data.color }
    : undefined
  const kit: KitConfig =
    customKit ??
    (data.isGoalkeeper
      ? (teamKit?.gk ?? GK_FALLBACK)
      : teamKit
        ? teamKit[data.team]
        : { pattern: 'solid', color1: TEAM_COLORS[data.team], color2: TEAM_COLORS[data.team] })
  const markerShape: MarkerShape = teamKit?.markerShape ?? 'circle'

  return (
    <Group>
      {data.highlighted && <HighlightRing />}
      {(() => {
        const photoUrl = data.showPhoto && data.playerId ? playerPhotos[data.playerId] : undefined
        // A per-chip custom color is a more specific override than the
        // team-wide crest, so it wins over the crest — but a linked
        // player's own photo (opted into explicitly) still wins over both.
        const crestUrl = customKit ? undefined : data.team === 'home' ? teamKit?.homeCrestUrl : teamKit?.awayCrestUrl
        const fillUrl = photoUrl ?? crestUrl
        return fillUrl ? (
          <CrestFill url={fillUrl} shape={markerShape} />
        ) : (
          <KitFill kit={kit} shape={markerShape} />
        )
      })()}
      <Text
        text={data.displayText !== undefined ? data.displayText : String(data.number)}
        fontSize={15}
        fontStyle="bold"
        fill={data.numberColor ?? '#ffffff'}
        width={36}
        height={36}
        offsetX={18}
        offsetY={18}
        align="center"
        verticalAlign="middle"
        listening={false}
        shadowColor="#000000"
        shadowBlur={3}
        shadowOpacity={0.6}
      />
      {data.label && (
        <Text
          text={formatPlayerLabel(data.label, playerLabelFormat)}
          fontSize={16}
          fontStyle="bold"
          fill={data.labelColor ?? '#ffffff'}
          width={110}
          offsetX={55}
          y={22}
          align="center"
          lineHeight={1.15}
          listening={false}
          shadowColor="#000000"
          shadowBlur={3}
          shadowOpacity={0.7}
        />
      )}
      {data.tagText && <PlayerTag text={data.tagText} color={data.tagColor} textColor={data.tagTextColor} />}
    </Group>
  )
}

/** Short tactical-action callout ("PRESS", "COVER", "JOCKEY", ...) sitting
 * above the chip — moves with it automatically since it's part of the same
 * Group, unlike the auto-computed offside label which is positioned
 * separately in EditorCanvas. With no `color`, renders as plain text (the
 * lighter "COVER" look); with one, as a solid pill (the "PRESS" look). */
function PlayerTag({
  text,
  color,
  textColor,
}: {
  text: string
  color: string | null | undefined
  textColor: string | undefined
}) {
  const width = Math.max(48, text.length * 7 + 16)
  return (
    <Group y={-34} listening={false}>
      {color && (
        <Rect
          x={-width / 2}
          y={-10}
          width={width}
          height={20}
          fill={color}
          cornerRadius={4}
          opacity={0.92}
        />
      )}
      <Text
        text={text}
        x={-width / 2}
        y={-10}
        width={width}
        height={20}
        align="center"
        verticalAlign="middle"
        fontSize={11}
        fontStyle="bold"
        fill={textColor ?? '#ffffff'}
        shadowColor="#000000"
        shadowBlur={color ? 0 : 3}
        shadowOpacity={0.7}
      />
    </Group>
  )
}
