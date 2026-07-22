import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '../store/editorStore'
import { PITCH_STAGE_SIZE, getCropOriginX, getCroppedStageSize } from '../constants'
import { useElementSize } from '../hooks/useElementSize'
import { Pitch } from './Pitch'
import { ObjectRenderer } from '../objects/ObjectRenderer'
import { ConnectorShape } from '../objects/shapes/Connector'
import { ConnectorZoneShape } from '../objects/shapes/PlayerZone'
import { findConnectorZones } from '../objects/shapes/connectorZones'
import { FrameCaptionOverlay } from '../objects/shapes/FrameCaptionOverlay'
import type { FrameObject } from '../types'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Cubic ease-in-out: a touch smoother/slower off the start and into the end
// than a quadratic curve, closer to what motion-design tools use by default.
// Trivial to evaluate for an arbitrary t in [0, 1] (Konva.Easings functions
// instead take (t, from, delta, duration)).
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2
}

// A multi-frame sequence is one continuous motion, not N separate hops —
// easing in AND out of every single transition brings velocity to zero at
// every intermediate keyframe, which is exactly what reads as "choppy"
// across a longer sequence. Only the very first transition eases in from
// rest and only the very last eases out to rest; everything in between
// keeps moving at constant speed through the keyframe instead of pausing.
function easeInCubic(t: number) {
  return t * t * t
}
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}
function linear(t: number) {
  return t
}
function easingForTransition(isFirst: boolean, isLast: boolean) {
  if (isFirst && isLast) return easeInOut
  if (isFirst) return easeInCubic
  if (isLast) return easeOutCubic
  return linear
}

interface MoveSpec {
  node: Konva.Group
  fromX: number
  fromY: number
  toX: number
  toY: number
  fromRotation: number
  toRotation: number
  fromScale: number
  toScale: number
  // Quadratic-bezier control point (stage coords) — set only when the
  // object's motion-guide handle was dragged into a bend; otherwise the
  // move stays a straight lerp (undefined), unchanged from before.
  bendX?: number
  bendY?: number
}

/** Evaluates a point along the straight line (no bend) or quadratic bezier
 * (bend set) at t in [0, 1] — shared by the live tween and the guide's own
 * preview curve so they always agree on the same path. */
function pointOnMotionPath(
  t: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  bendX?: number,
  bendY?: number,
) {
  if (bendX === undefined || bendY === undefined) {
    return { x: fromX + (toX - fromX) * t, y: fromY + (toY - fromY) * t }
  }
  const mt = 1 - t
  return {
    x: mt * mt * fromX + 2 * mt * t * bendX + t * t * toX,
    y: mt * mt * fromY + 2 * mt * t * bendY + t * t * toY,
  }
}

interface FadeSpec {
  node: Konva.Group
  from: number
  to: number
  fromScale: number
  toScale: number
}

interface ConnectorSyncSpec {
  line: Konva.Line
  label: Konva.Group | null
  fromId: string
  toId: string
}

interface PolygonSyncSpec {
  line: Konva.Line
  ids: string[]
}

interface ArrowPointsSpec {
  arrowLine: Konva.Arrow
  label: Konva.Group | null
  fromPoints: number[]
  toPoints: number[]
}

/** Drives every animated property of a single frame transition (object
 * positions, enter/exit fades, connector lines) from one shared elapsed-time
 * value each animation frame, instead of many independent Konva.Tween
 * instances. This is what actually guarantees everything stays in lockstep —
 * separate tweens merely tend to agree, this makes it structural. */
function runTransition(
  layer: Konva.Layer | null,
  durationSec: number,
  moves: MoveSpec[],
  fades: FadeSpec[],
  connectors: ConnectorSyncSpec[],
  zones: PolygonSyncSpec[],
  arrows: ArrowPointsSpec[],
  nodeRefs: Record<string, Konva.Group>,
  ease: (t: number) => number,
) {
  return new Promise<void>((resolve) => {
    let settled = false
    const durationMs = durationSec * 1000
    const start = performance.now()

    function applyProgress(eased: number) {
      for (const m of moves) {
        const p = pointOnMotionPath(eased, m.fromX, m.fromY, m.toX, m.toY, m.bendX, m.bendY)
        m.node.x(p.x)
        m.node.y(p.y)
        m.node.rotation(m.fromRotation + (m.toRotation - m.fromRotation) * eased)
        const s = m.fromScale + (m.toScale - m.fromScale) * eased
        m.node.scaleX(s)
        m.node.scaleY(s)
      }
      for (const f of fades) {
        f.node.opacity(f.from + (f.to - f.from) * eased)
        const s = f.fromScale + (f.toScale - f.fromScale) * eased
        f.node.scaleX(s)
        f.node.scaleY(s)
      }
      for (const c of connectors) {
        const fromNode = nodeRefs[c.fromId]
        const toNode = nodeRefs[c.toId]
        if (fromNode && toNode) {
          const linePoints = [fromNode.x(), fromNode.y(), toNode.x(), toNode.y()]
          c.line.points(linePoints)
          if (c.label) {
            c.label.position({ x: (linePoints[0]! + linePoints[2]!) / 2, y: (linePoints[1]! + linePoints[3]!) / 2 })
            // Same reasoning as the arrow's distance label: the number only
            // matches what's drawn at rest, so it dips out while the
            // endpoints are actively moving instead of showing a stale value.
            c.label.opacity(eased < 0.5 ? 1 - eased * 2 : (eased - 0.5) * 2)
          }
        }
      }
      for (const z of zones) {
        const nodes = z.ids.map((id) => nodeRefs[id]).filter((n): n is Konva.Group => Boolean(n))
        if (nodes.length === z.ids.length) {
          z.line.points(nodes.flatMap((n) => [n.x(), n.y()]))
        }
      }
      for (const a of arrows) {
        a.arrowLine.points(
          a.fromPoints.map((v, i) => v + (a.toPoints[i]! - v) * eased),
        )
        // The distance label's own number only makes sense for the settled
        // start/end shape — while the path itself is actively reshaping mid-
        // transition, showing a label that doesn't match what's drawn reads
        // as broken rather than animated, so it dips out and back in instead.
        if (a.label) a.label.opacity(eased < 0.5 ? 1 - eased * 2 : (eased - 0.5) * 2)
      }
    }

    function applyFinal() {
      for (const m of moves) {
        m.node.setAttrs({ x: m.toX, y: m.toY, rotation: m.toRotation, scaleX: m.toScale, scaleY: m.toScale })
      }
      for (const f of fades) {
        f.node.opacity(f.to)
        f.node.scaleX(f.toScale)
        f.node.scaleY(f.toScale)
      }
      for (const c of connectors) {
        const fromNode = nodeRefs[c.fromId]
        const toNode = nodeRefs[c.toId]
        if (fromNode && toNode) {
          const linePoints = [fromNode.x(), fromNode.y(), toNode.x(), toNode.y()]
          c.line.points(linePoints)
          if (c.label) {
            c.label.position({ x: (linePoints[0]! + linePoints[2]!) / 2, y: (linePoints[1]! + linePoints[3]!) / 2 })
            c.label.opacity(1)
          }
        }
      }
      for (const z of zones) {
        const nodes = z.ids.map((id) => nodeRefs[id]).filter((n): n is Konva.Group => Boolean(n))
        if (nodes.length === z.ids.length) {
          z.line.points(nodes.flatMap((n) => [n.x(), n.y()]))
        }
      }
      for (const a of arrows) {
        a.arrowLine.points(a.toPoints)
        if (a.label) a.label.opacity(1)
      }
    }

    function settle() {
      if (settled) return
      settled = true
      clearTimeout(timerId)
      anim.stop()
      applyFinal()
      resolve()
    }

    const anim = new Konva.Animation(() => {
      const raw = Math.min(1, (performance.now() - start) / durationMs)
      applyProgress(ease(raw))
      if (raw >= 1) settle()
    }, layer)

    anim.start()

    // The definitive "this transition is over" signal is a plain timer, not
    // a requestAnimationFrame tick — rAF can stall for a long stretch (a
    // backgrounded tab, a throttled compositor, a busy main thread), and
    // waiting on it to eventually notice `raw >= 1` used to leave playback
    // hanging well past the configured duration (previously papered over by
    // a fallback timer set 500ms *after* that same unreliable point). A
    // setTimeout for exactly `durationMs` keeps the frame-to-frame timing
    // accurate regardless of rAF health; the animation above still renders
    // the smoothest interpolation it can manage in the meantime, and
    // applyFinal() snaps everything to its exact resting value the instant
    // the timer fires.
    const timerId = setTimeout(settle, durationMs)
  })
}

interface PlaybackOverlay {
  entering: FrameObject[]
  exiting: FrameObject[]
}

const EMPTY_OVERLAY: PlaybackOverlay = { entering: [], exiting: [] }

/** Editor-only "where did this come from" guide: a dashed path from a
 * player/ball's previous-frame position to its position in the active
 * frame, with a draggable handle that bends it (used both as a live
 * preview here and, once dragged, as the actual playback path via
 * `motionBend`). Only ever rendered for the current selection, so it
 * disappears the same way the Transformer does — selection is cleared
 * before every export/recording, never baked into an image or video. */
function MotionGuide({
  fromX,
  fromY,
  toX,
  toY,
  bend,
  onDragStart,
  onBendChange,
  onReset,
}: {
  fromX: number
  fromY: number
  toX: number
  toY: number
  bend: [number, number] | null
  onDragStart: () => void
  onBendChange: (x: number, y: number) => void
  onReset: () => void
}) {
  const cx = bend ? bend[0] : (fromX + toX) / 2
  const cy = bend ? bend[1] : (fromY + toY) / 2
  const SEGMENTS = 24
  const points: number[] = []
  for (let i = 0; i <= SEGMENTS; i++) {
    const p = pointOnMotionPath(i / SEGMENTS, fromX, fromY, toX, toY, cx, cy)
    points.push(p.x, p.y)
  }

  return (
    <>
      <Line points={points} stroke="#ffe100" strokeWidth={2} dash={[6, 6]} opacity={0.85} listening={false} />
      <Circle
        x={fromX}
        y={fromY}
        radius={4}
        fill="#ffe100"
        opacity={0.6}
        listening={false}
      />
      <Circle
        x={cx}
        y={cy}
        radius={6}
        fill="#ffe100"
        stroke="#111827"
        strokeWidth={1.5}
        draggable
        onDragStart={onDragStart}
        onDragMove={(e) => onBendChange(e.target.x(), e.target.y())}
        onDragEnd={(e) => onBendChange(e.target.x(), e.target.y())}
        onDblClick={onReset}
        onDblTap={onReset}
      />
    </>
  )
}

export function EditorCanvas({ stageRef }: { stageRef: RefObject<Konva.Stage | null> }) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>()
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const orientation = useEditorStore((s) => s.orientation)
  const zoneGridStyle = useEditorStore((s) => s.zoneGridStyle)
  const zoneGridCustomLines = useEditorStore((s) => s.zoneGridCustomLines)
  const showPitchMarkings = useEditorStore((s) => s.showPitchMarkings)
  const fieldCrop = useEditorStore((s) => s.fieldCrop)
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const frames = useEditorStore((s) => s.frames)
  const activeFrameIndex = useEditorStore((s) => s.activeFrameIndex)
  const tool = useEditorStore((s) => s.tool)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const addObjectAt = useEditorStore((s) => s.addObjectAt)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)
  const updateObjectLive = useEditorStore((s) => s.updateObjectLive)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const connectorDraftFromId = useEditorStore((s) => s.connectorDraftFromId)
  const setConnectorDraftFromId = useEditorStore((s) => s.setConnectorDraftFromId)
  const addConnector = useEditorStore((s) => s.addConnector)

  const frame = frames[activeFrameIndex] ?? frames[0]!
  const [playbackOverlay, setPlaybackOverlay] = useState<PlaybackOverlay>(EMPTY_OVERLAY)

  // While a frame transition is in flight, objects that only exist in the
  // target frame (entering) or only in the source frame (exiting) are kept
  // mounted alongside the current frame's own objects so they can fade in/
  // out instead of popping in or vanishing exactly at the frame boundary.
  const overlayIds = new Set([
    ...playbackOverlay.entering.map((o) => o.id),
    ...playbackOverlay.exiting.map((o) => o.id),
  ])
  const visibleObjects = [
    ...frame.objects.filter((o) => !overlayIds.has(o.id)),
    ...playbackOverlay.entering,
    ...playbackOverlay.exiting,
  ]
  // Rect/circle shapes (heatmap-style zone markers) always render behind
  // every other object, regardless of their own z-order — so a coach can
  // always drag a player (or anything else) on top of one instead of
  // having to remember to send it to back first.
  const isBackgroundShape = (o: FrameObject) =>
    o.objectType === 'shape' && (o.data.kind === 'rect' || o.data.kind === 'circle')
  const sortedObjects = [...visibleObjects].sort((a, b) => {
    const bucketDiff = Number(isBackgroundShape(a)) - Number(isBackgroundShape(b))
    return bucketDiff !== 0 ? -bucketDiff : a.zIndex - b.zIndex
  })
  const enteringIds = new Set(playbackOverlay.entering.map((o) => o.id))

  // Auto-highlight: whenever connectors form a closed loop between players
  // (e.g. 1-2-3-4-1), fill the enclosed area — derived fresh from the
  // connectors themselves every render, so it always matches exactly what's
  // connected instead of needing its own separately-drawn/maintained shape.
  const connectorObjects = visibleObjects.filter(
    (o): o is Extract<FrameObject, { objectType: 'connector' }> => o.objectType === 'connector',
  )
  const connectorEdges = connectorObjects.map((o): [string, string] => [o.data.fromId, o.data.toId])
  const connectorZones = findConnectorZones(connectorEdges)
    .map((z) => {
      const points = z.ids
        .map((id) => visibleObjects.find((o) => o.id === id))
        .filter((o): o is FrameObject => Boolean(o))
      if (points.length !== z.ids.length) return null
      // The zone's own color follows whichever connector forms its first
      // edge — loops are realistically drawn with one consistent color
      // already (connector color is sticky across new connectors), so this
      // just carries that same color into the derived fill instead of a
      // fixed one.
      const firstEdgeConnector = connectorObjects.find(
        (o) =>
          (o.data.fromId === z.ids[0] && o.data.toId === z.ids[1]) ||
          (o.data.toId === z.ids[0] && o.data.fromId === z.ids[1]),
      )
      return {
        key: z.key,
        points: points.flatMap((p) => [p.x, p.y]),
        color: firstEdgeConnector?.data.color,
      }
    })
    .filter((z): z is { key: string; points: number[]; color: string | undefined } => Boolean(z))

  // A defensive line ("Abwehrlinie") arrow shades the gap between itself and
  // whichever full-pitch edge is nearer along the length (goal-to-goal)
  // axis — vertical orientation runs that axis top-to-bottom, horizontal
  // left-to-right, matching how the pitch itself is laid out (see Pitch.tsx
  // and PITCH_STAGE_SIZE). Recomputed from the line's live position every
  // render, so dragging it updates the shaded depth immediately.
  const lengthAxis: 'x' | 'y' = orientation === 'vertical' ? 'y' : 'x'
  const fullStageSize = PITCH_STAGE_SIZE[orientation]
  const lengthSize = lengthAxis === 'y' ? fullStageSize.height : fullStageSize.width
  const widthSize = lengthAxis === 'y' ? fullStageSize.width : fullStageSize.height

  const spaceBehindZones = sortedObjects
    .filter(
      (o): o is Extract<FrameObject, { objectType: 'arrow' }> =>
        o.objectType === 'arrow' && Boolean(o.data.spaceBehind),
    )
    .map((o) => {
      const pts = o.data.points
      const n = pts.length / 2
      const avgLocal =
        (lengthAxis === 'y'
          ? pts.filter((_, i) => i % 2 === 1)
          : pts.filter((_, i) => i % 2 === 0)
        ).reduce((a, b) => a + b, 0) / n
      const anchor = lengthAxis === 'y' ? o.y : o.x
      const absPos = anchor + avgLocal * o.scale
      const edge = absPos < lengthSize / 2 ? 0 : lengthSize
      const depth = Math.abs(edge - absPos)
      const meters = depth * (pitchLengthM / lengthSize)
      const near = Math.min(absPos, edge)
      return {
        id: o.id,
        color: o.data.color,
        meters,
        rect:
          lengthAxis === 'y'
            ? { x: 0, y: near, width: widthSize, height: depth }
            : { x: near, y: 0, width: depth, height: widthSize },
        labelPos: lengthAxis === 'y' ? { x: widthSize / 2, y: (absPos + edge) / 2 } : { x: (absPos + edge) / 2, y: widthSize / 2 },
      }
    })

  // Offside check: the first player_chip marked as the offside reference
  // (the last outfield defender) sets the line; every opposing-team chip
  // then gets a live "Onside/Abseits by X.Xm" label. The attacking
  // direction isn't tracked explicitly anywhere in the data model, so it's
  // inferred from which side of the reference the opposing team is
  // predominantly sitting on — defenders naturally cluster near their own
  // goal, attackers push toward the other end.
  const offsideRef = visibleObjects.find(
    (o): o is Extract<FrameObject, { objectType: 'player_chip' }> =>
      o.objectType === 'player_chip' && Boolean(o.data.offsideReference),
  )
  const offsideLabels = (() => {
    if (!offsideRef) return []
    const attackers = visibleObjects.filter(
      (o): o is Extract<FrameObject, { objectType: 'player_chip' }> =>
        o.objectType === 'player_chip' && o.data.team !== offsideRef.data.team,
    )
    if (attackers.length === 0) return []
    const refPos = lengthAxis === 'y' ? offsideRef.y : offsideRef.x
    const avgAttackerPos =
      attackers.reduce((s, a) => s + (lengthAxis === 'y' ? a.y : a.x), 0) / attackers.length
    const dirSign = avgAttackerPos >= refPos ? 1 : -1
    return attackers.map((a) => {
      const pos = lengthAxis === 'y' ? a.y : a.x
      const deltaPx = (pos - refPos) * dirSign
      const deltaM = Math.abs(deltaPx) * (pitchLengthM / lengthSize)
      const offside = deltaPx > 0
      return {
        id: a.id,
        x: a.x,
        y: a.y,
        offside,
        text: `${offside ? 'Abseits' : 'Onside'} ${deltaM.toFixed(1)}m`,
      }
    })
  })()

  const trRef = useRef<Konva.Transformer>(null)
  const objectsLayerRef = useRef<Konva.Layer>(null)
  const nodeRefs = useRef<Record<string, Konva.Group>>({})
  const connectorRefs = useRef<Record<string, Konva.Line>>({})
  const zoneRefs = useRef<Record<string, Konva.Line>>({})

  const logical = getCroppedStageSize(orientation, fieldCrop)
  const scale =
    size.width > 0 && size.height > 0
      ? Math.min(size.width / logical.width, size.height / logical.height)
      : 1

  // Objects are stored in the full (uncropped) pitch's coordinate system.
  // When a crop is active, the stage itself only spans the cropped slice,
  // so the whole objects layer is shifted by the same amount the Pitch's
  // own rendering is (see Pitch.tsx) to keep them aligned — and the shift
  // is added back when translating a click into a stored position.
  const cropShift = getCropOriginX(fieldCrop)

  const registerRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodeRefs.current[id] = node
    else delete nodeRefs.current[id]
  }, [])

  const registerConnectorRef = useCallback((id: string, node: Konva.Line | null) => {
    if (node) connectorRefs.current[id] = node
    else delete connectorRefs.current[id]
  }, [])

  const registerZoneRef = useCallback((id: string, node: Konva.Line | null) => {
    if (node) zoneRefs.current[id] = node
    else delete zoneRefs.current[id]
  }, [])

  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    const nodes = selection
      .map((id) => nodeRefs.current[id])
      .filter((n): n is Konva.Group => Boolean(n))
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selection, frame.objects])

  useEffect(() => {
    if (!isPlaying) return
    let cancelled = false

    async function run() {
      while (!cancelled) {
        const state = useEditorStore.getState()
        const currentIndex = state.activeFrameIndex
        const currentFrames = state.frames
        if (currentIndex >= currentFrames.length - 1) break

        const fromFrame = currentFrames[currentIndex]!
        const toFrame = currentFrames[currentIndex + 1]!
        // The TARGET frame's own duration governs its transition, not the
        // source's — matching the natural "duplicate frame, adjust this
        // frame's duration" workflow, where the frame you just edited is the
        // one whose duration you expect to see take effect. The first
        // frame's duration is inherently unused either way (nothing
        // transitions into it), but leaving the LAST frame's duration dead
        // (the old behavior) is the case people actually hit and report as
        // "changing the duration does nothing."
        const durationSec = Math.max(toFrame.durationMs, 50) / 1000

        const fromIds = new Set(fromFrame.objects.map((o) => o.id))
        const toIds = new Set(toFrame.objects.map((o) => o.id))
        const entering = toFrame.objects.filter((o) => !fromIds.has(o.id))
        const exiting = fromFrame.objects.filter((o) => !toIds.has(o.id))

        // Mount entering objects (at opacity 0, see initialOpacity below) and
        // keep exiting ones mounted past the frame boundary so both can be
        // tweened instead of popping in/out abruptly. A rAF-based wait (not
        // setTimeout) keeps this yield as short as the browser's own paint
        // cycle instead of an arbitrary macrotask delay, so consecutive
        // frames' transitions read as one continuous motion rather than
        // hopping with a visible pause at each keyframe.
        setPlaybackOverlay({ entering, exiting })
        await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
        if (cancelled) return

        const moves: MoveSpec[] = toFrame.objects
          .map((toObj) => {
            const node = nodeRefs.current[toObj.id]
            const fromObj = fromFrame.objects.find((o) => o.id === toObj.id)
            if (!node || !fromObj) return null
            // A bend point only makes sense alongside actual displacement —
            // once a frame with a bend gets duplicated (keeping the same
            // position, and with it the same stored motionBend), applying
            // that bend to a zero-distance move would bow the object out
            // and back to the same spot for no visible reason instead of
            // just holding still.
            const hasMoved = fromObj.x !== toObj.x || fromObj.y !== toObj.y
            const bend =
              hasMoved &&
              (toObj.objectType === 'player_chip' || toObj.objectType === 'ball') &&
              toObj.data.motionBend
                ? toObj.data.motionBend
                : null
            return {
              node,
              fromX: fromObj.x,
              fromY: fromObj.y,
              toX: toObj.x,
              toY: toObj.y,
              fromRotation: fromObj.rotation,
              toRotation: toObj.rotation,
              fromScale: fromObj.scale,
              toScale: toObj.scale,
              ...(bend ? { bendX: bend[0], bendY: bend[1] } : {}),
            }
          })
          .filter((m): m is MoveSpec => Boolean(m))

        // Entering/exiting objects get a subtle scale-pop alongside the fade
        // (growing in from ~70% size, shrinking out to ~70%) instead of a
        // flat opacity crossfade — reads as a much livelier transition.
        const POP_SCALE = 0.7
        const fades: FadeSpec[] = [
          ...entering
            .map((o) => (nodeRefs.current[o.id] ? { node: nodeRefs.current[o.id]!, scale: o.scale } : null))
            .filter((f): f is { node: Konva.Group; scale: number } => Boolean(f))
            .map(({ node, scale }) => ({ node, from: 0, to: 1, fromScale: scale * POP_SCALE, toScale: scale })),
          ...exiting
            .map((o) => (nodeRefs.current[o.id] ? { node: nodeRefs.current[o.id]!, scale: o.scale } : null))
            .filter((f): f is { node: Konva.Group; scale: number } => Boolean(f))
            .map(({ node, scale }) => ({ node, from: 1, to: 0, fromScale: scale, toScale: scale * POP_SCALE })),
        ]

        // Connectors that persist across both frames need their line glued
        // to their endpoints' live (tweened) node positions on every
        // animation frame — otherwise they only "catch up" once the frame
        // boundary flips and React re-renders from the new frame data.
        const connectors: ConnectorSyncSpec[] = toFrame.objects
          .filter(
            (o): o is Extract<FrameObject, { objectType: 'connector' }> =>
              o.objectType === 'connector' && fromIds.has(o.id),
          )
          .map((o) => {
            const line = connectorRefs.current[o.id]
            if (!line) return null
            const label = line.getParent()?.findOne<Konva.Group>('.connector-distance-label') ?? null
            return { line, label, fromId: o.data.fromId, toId: o.data.toId }
          })
          .filter((c): c is ConnectorSyncSpec => Boolean(c))

        // Same idea as connectors: an auto-detected connector-loop zone that
        // persists across both frames needs its points glued to the live
        // (tweened) positions of the player chips it connects while the
        // transition is in flight. Only zones whose exact loop of players
        // exists in BOTH frames are synced — a newly formed or broken loop
        // just pops in/out with the rest of the frame's own render instead.
        const edgesOf = (frameObjects: FrameObject[]) =>
          frameObjects
            .filter((o): o is Extract<FrameObject, { objectType: 'connector' }> => o.objectType === 'connector')
            .map((o): [string, string] => [o.data.fromId, o.data.toId])
        const fromZoneKeys = new Set(findConnectorZones(edgesOf(fromFrame.objects)).map((z) => z.key))
        const zones: PolygonSyncSpec[] = findConnectorZones(edgesOf(toFrame.objects))
          .filter((z) => fromZoneKeys.has(z.key))
          .map((z) => {
            const line = zoneRefs.current[z.key]
            return line ? { line, ids: z.ids } : null
          })
          .filter((z): z is PolygonSyncSpec => Boolean(z))

        // An arrow's own path (points) isn't covered by `moves` — that only
        // tweens the object's whole-shape x/y/rotation/scale — so a bent or
        // reshaped arrow used to snap its line instantly to the next frame's
        // shape the moment playback crossed the frame boundary. Interpolating
        // the points directly here keeps the line itself smooth too.
        const arrows: ArrowPointsSpec[] = toFrame.objects
          .filter(
            (o): o is Extract<FrameObject, { objectType: 'arrow' }> =>
              o.objectType === 'arrow' && fromIds.has(o.id),
          )
          .map((o) => {
            const fromObj = fromFrame.objects.find((f) => f.id === o.id)
            if (!fromObj || fromObj.objectType !== 'arrow') return null
            const group = nodeRefs.current[o.id]
            const arrowLine = group?.findOne<Konva.Arrow>('.arrow-line') ?? null
            if (!arrowLine) return null
            const fromPoints = fromObj.data.points
            const toPoints = o.data.points
            if (fromPoints.length === toPoints.length && fromPoints.every((v, i) => v === toPoints[i])) {
              return null
            }
            // Reconcile differing point counts (e.g. a bend point added or
            // removed between frames) by holding the shorter path's last
            // point steady for the extra segment instead of crashing.
            const maxLen = Math.max(fromPoints.length, toPoints.length)
            const padded = (pts: number[]) =>
              pts.length === maxLen
                ? pts
                : [...pts, ...Array(maxLen - pts.length).fill(0).map((_, i) => pts[pts.length - 2 + (i % 2)]!)]
            const label = group?.findOne<Konva.Group>('.distance-label') ?? null
            return { arrowLine, label, fromPoints: padded(fromPoints), toPoints: padded(toPoints) }
          })
          .filter((a): a is ArrowPointsSpec => Boolean(a))

        const ease = easingForTransition(currentIndex === 0, currentIndex === currentFrames.length - 2)
        await runTransition(
          objectsLayerRef.current,
          durationSec,
          moves,
          fades,
          connectors,
          zones,
          arrows,
          nodeRefs.current,
          ease,
        )
        if (cancelled) return

        useEditorStore.getState().setActiveFrameIndex(currentIndex + 1)
        setPlaybackOverlay(EMPTY_OVERLAY)
        await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
      }
      useEditorStore.getState().setIsPlaying(false)
      setPlaybackOverlay(EMPTY_OVERLAY)
    }

    run()
    return () => {
      cancelled = true
      setPlaybackOverlay(EMPTY_OVERLAY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  function handleSelect(id: string, additive: boolean) {
    if (additive) {
      setSelection(
        selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id],
      )
    } else {
      setSelection([id])
    }
  }

  function handleObjectClick(id: string, additive: boolean) {
    if (tool === 'connector') {
      if (!connectorDraftFromId) {
        setConnectorDraftFromId(id)
        setSelection([id])
      } else if (connectorDraftFromId === id) {
        setConnectorDraftFromId(null)
        setSelection([])
      } else {
        addConnector(connectorDraftFromId, id)
      }
      return
    }
    handleSelect(id, additive)
  }

  function handleStageMouseDown(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (isPlaying) return
    const clickedOnEmpty = e.target === e.target.getStage()
    if (!clickedOnEmpty) return

    if (tool === 'select') {
      setSelection([])
      return
    }
    if (tool === 'connector') {
      setConnectorDraftFromId(null)
      setSelection([])
      return
    }
    const pos = stageRef.current?.getRelativePointerPosition()
    if (!pos) return
    // getRelativePointerPosition() is relative to the (possibly cropped)
    // stage; shift it back into the full-pitch coordinate space objects
    // are stored in (see the cropShift comment above).
    if (orientation === 'vertical') addObjectAt(pos.x, pos.y + cropShift)
    else addObjectAt(pos.x + cropShift, pos.y)
  }

  function handleDragStart() {
    beginHistoryCheckpoint()
  }

  // A plain grab-and-drag (no prior click) never fires onSelect — Konva only
  // treats a gesture as a click if the pointer barely moved — so without
  // this, moving a player/ball straight from an unselected state would never
  // reveal its motion guide (below) at all. Only takes over the selection if
  // the object wasn't already part of it, so dragging one of several
  // selected chips together doesn't collapse the rest of the selection.
  function handleObjectDragStart(id: string) {
    if (selection.includes(id)) return
    const obj = frame.objects.find((o) => o.id === id)
    if (obj && (obj.objectType === 'player_chip' || obj.objectType === 'ball')) {
      setSelection([id])
    }
  }

  function handleDragMove(id: string, x: number, y: number) {
    updateObjectLive(id, { x, y })
  }

  function handleTransformStart() {
    beginHistoryCheckpoint()
  }

  function handleTransformEnd(id: string, patch: Partial<FrameObject>) {
    updateObjectLive(id, patch)
  }

  function handleArrowPointsChange(id: string, points: number[]) {
    const obj = frame.objects.find((o) => o.id === id)
    if (!obj || obj.objectType !== 'arrow') return
    updateObjectLive(id, { data: { ...obj.data, points } } as Partial<FrameObject>)
  }

  function handleMotionBendChange(id: string, x: number, y: number) {
    const obj = frame.objects.find((o) => o.id === id)
    if (!obj || (obj.objectType !== 'player_chip' && obj.objectType !== 'ball')) return
    updateObjectLive(id, { data: { ...obj.data, motionBend: [x, y] } } as Partial<FrameObject>)
  }

  function handleMotionBendReset(id: string) {
    const obj = frame.objects.find((o) => o.id === id)
    if (!obj || (obj.objectType !== 'player_chip' && obj.objectType !== 'ball')) return
    beginHistoryCheckpoint()
    updateObjectLive(id, { data: { ...obj.data, motionBend: null } } as Partial<FrameObject>)
  }

  // Only for the current selection (mirrors the Transformer's own gating),
  // and only when moved from where it was in the previous frame — so this
  // never clutters the board and always disappears once selection is
  // cleared, exactly like the Transformer does before export/recording.
  const prevFrame = activeFrameIndex > 0 ? frames[activeFrameIndex - 1] : null
  const motionGuides =
    !isPlaying && prevFrame
      ? selection
          .map((id) => frame.objects.find((o) => o.id === id))
          .filter((o): o is FrameObject => Boolean(o))
          .filter(
            (o): o is Extract<FrameObject, { objectType: 'player_chip' | 'ball' }> =>
              o.objectType === 'player_chip' || o.objectType === 'ball',
          )
          .map((o) => {
            const prevObj = prevFrame.objects.find((p) => p.id === o.id)
            if (!prevObj || (prevObj.x === o.x && prevObj.y === o.y)) return null
            return {
              id: o.id,
              fromX: prevObj.x,
              fromY: prevObj.y,
              toX: o.x,
              toY: o.y,
              bend: o.data.motionBend ?? null,
            }
          })
          .filter((g): g is NonNullable<typeof g> => Boolean(g))
      : []

  // Shapes (zones/circles/rects/polygons) and training equipment get free
  // non-uniform corner resizing (independent width/height); other object
  // kinds (chips, text, ball) keep proportional scaling since they don't
  // have separate width/height to resize into.
  const selectedObjects = selection
    .map((id) => frame.objects.find((o) => o.id === id))
    .filter((o): o is FrameObject => Boolean(o))
  const allFreelyResizableSelected =
    selectedObjects.length > 0 &&
    selectedObjects.every((o) => o.objectType === 'shape' || o.objectType === 'training_equipment')

  // Bendable straight/polyline arrows get their own point-drag handles (see
  // ArrowPointHandles in ObjectRenderer) sitting right at the shape's own
  // corners — the Transformer's resize anchors would land almost exactly on
  // top of them and hijack the drag. Rotation doesn't have that conflict
  // (the rotate handle sits above the shape, not on its corners), so these
  // arrows stay attached to the Transformer for rotating, just with the
  // resize anchors hidden. Curved arrows have no point handles and keep the
  // normal full set.
  const hasBendableArrowSelected = selectedObjects.some(
    (o) => o.objectType === 'arrow' && o.data.shape !== 'curved',
  )

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <Stage
        ref={stageRef}
        width={logical.width * scale}
        height={logical.height * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        className="rounded-lg shadow-2xl shadow-black/60"
      >
        <Layer>
          <Pitch
            design={pitchDesign}
            orientation={orientation}
            zoneGridStyle={zoneGridStyle}
            customGridLines={zoneGridCustomLines}
            showPitchMarkings={showPitchMarkings}
            fieldCrop={fieldCrop}
          />
        </Layer>
        <Layer ref={objectsLayerRef}>
        <Group
          x={orientation === 'horizontal' ? -cropShift : 0}
          y={orientation === 'vertical' ? -cropShift : 0}
        >
          {connectorZones.map((z) => (
            <ConnectorZoneShape
              key={z.key}
              points={z.points}
              color={z.color}
              lineRef={(node) => registerZoneRef(z.key, node)}
            />
          ))}
          {spaceBehindZones.map((z) => (
            <Group key={`spacebehind-${z.id}`} listening={false}>
              <Rect {...z.rect} fill={hexToRgba(z.color, 0.16)} />
              <Text
                x={z.labelPos.x - 50}
                y={z.labelPos.y - 12}
                width={100}
                align="center"
                text={`${Math.round(z.meters)}m`}
                fontStyle="bold"
                fontSize={24}
                fill={z.color}
                shadowColor="black"
                shadowBlur={6}
                shadowOpacity={0.6}
              />
            </Group>
          ))}
          {sortedObjects.map((object) => {
            if (object.objectType === 'connector') {
              const from = visibleObjects.find((o) => o.id === object.data.fromId)
              const to = visibleObjects.find((o) => o.id === object.data.toId)
              if (!from || !to) return null
              return (
                <ConnectorShape
                  key={object.id}
                  data={object.data}
                  from={{ x: from.x, y: from.y }}
                  to={{ x: to.x, y: to.y }}
                  isSelected={selection.includes(object.id)}
                  onSelect={(additive) => handleSelect(object.id, additive)}
                  lineRef={(node) => registerConnectorRef(object.id, node)}
                />
              )
            }
            return (
              <ObjectRenderer
                key={object.id}
                object={object}
                isSelected={selection.includes(object.id)}
                interactive={!isPlaying}
                onSelect={handleObjectClick}
                onDragStart={handleDragStart}
                onObjectDragStart={handleObjectDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragMove}
                onTransformEnd={handleTransformEnd}
                onArrowPointsChange={handleArrowPointsChange}
                registerRef={registerRef}
                initialOpacity={enteringIds.has(object.id) ? 0 : 1}
                initialScaleFactor={enteringIds.has(object.id) ? 0.7 : 1}
              />
            )
          })}
          {offsideLabels.map((l) => (
            <Group key={`offside-${l.id}`} x={l.x} y={l.y - 46} listening={false}>
              <Rect
                x={-42}
                y={-11}
                width={84}
                height={22}
                fill={l.offside ? '#ef4444' : '#22c55e'}
                cornerRadius={4}
                opacity={0.92}
              />
              <Text
                text={l.text}
                x={-42}
                y={-11}
                width={84}
                height={22}
                align="center"
                verticalAlign="middle"
                fontSize={10}
                fontStyle="bold"
                fill="#ffffff"
              />
            </Group>
          ))}
          {motionGuides.map((g) => (
            <MotionGuide
              key={`motion-${g.id}`}
              fromX={g.fromX}
              fromY={g.fromY}
              toX={g.toX}
              toY={g.toY}
              bend={g.bend}
              onDragStart={beginHistoryCheckpoint}
              onBendChange={(x, y) => handleMotionBendChange(g.id, x, y)}
              onReset={() => handleMotionBendReset(g.id)}
            />
          ))}
          <Transformer
            ref={trRef}
            onTransformStart={handleTransformStart}
            rotateEnabled
            enabledAnchors={hasBendableArrowSelected ? [] : undefined}
            keepRatio={!allFreelyResizableSelected}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
            }
          />
        </Group>
        </Layer>
        <Layer listening={false}>
          <FrameCaptionOverlay caption={frame.caption} />
        </Layer>
      </Stage>
    </div>
  )
}
