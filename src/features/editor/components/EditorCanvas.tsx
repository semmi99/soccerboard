import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Arrow, Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '../store/editorStore'
import { PITCH_LOGICAL, PITCH_STAGE_SIZE, getCropOriginX, getCroppedStageSize } from '../constants'
import { useElementSize } from '../hooks/useElementSize'
import { Pitch } from './Pitch'
import { ObjectRenderer } from '../objects/ObjectRenderer'
import { ConnectorShape } from '../objects/shapes/Connector'
import { ConnectorZoneShape } from '../objects/shapes/PlayerZone'
import { findConnectorZones } from '../objects/shapes/connectorZones'
import { QuoteCardEditOverlay } from './QuoteCardEditOverlay'
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

/** Always-on (when toggled), non-interactive counterpart to `MotionGuide` —
 * a plain light line from a player/ball's previous-frame position to its
 * current one, for every mover at once rather than just the selection, and
 * shown during playback too. No drag handle: purely a visual aid. */
function MovementTrail({
  fromX,
  fromY,
  toX,
  toY,
  bend,
}: {
  fromX: number
  fromY: number
  toX: number
  toY: number
  bend: [number, number] | null
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
    <Group listening={false}>
      <Line points={points} stroke="rgba(255,255,255,0.65)" strokeWidth={2} opacity={0.8} />
      <Circle x={fromX} y={fromY} radius={3} fill="rgba(255,255,255,0.65)" />
    </Group>
  )
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

export function EditorCanvas({ stageRef }: { stageRef: RefObject<Konva.Stage | null> }) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>()
  // A manual multiplier on top of the "fit the whole pitch in view" scale —
  // lets the pitch be rendered larger than the container (spilling over
  // into a scrollbar) instead of always being shrunk down to whatever fits,
  // which wasted a lot of screen space on wide monitors. Session-only, not
  // persisted with the project, same as how a map app's zoom isn't saved.
  const [zoom, setZoom] = useState(1)
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const orientation = useEditorStore((s) => s.orientation)
  const zoneGridStyle = useEditorStore((s) => s.zoneGridStyle)
  const zoneGridCustomLines = useEditorStore((s) => s.zoneGridCustomLines)
  const showPitchMarkings = useEditorStore((s) => s.showPitchMarkings)
  const showMovementTrails = useEditorStore((s) => s.showMovementTrails)
  const fieldCrop = useEditorStore((s) => s.fieldCrop)
  const fieldMirrored = useEditorStore((s) => s.fieldMirrored)
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const pitchWidthM = useEditorStore((s) => s.pitchWidthM)
  const frames = useEditorStore((s) => s.frames)
  const activeFrameIndex = useEditorStore((s) => s.activeFrameIndex)
  const tool = useEditorStore((s) => s.tool)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const addObjectAt = useEditorStore((s) => s.addObjectAt)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)
  const updateObjectLive = useEditorStore((s) => s.updateObjectLive)
  const setObjectPositions = useEditorStore((s) => s.setObjectPositions)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const connectorDraftFromId = useEditorStore((s) => s.connectorDraftFromId)
  const setConnectorDraftFromId = useEditorStore((s) => s.setConnectorDraftFromId)
  const addConnector = useEditorStore((s) => s.addConnector)
  const addFreehandObject = useEditorStore((s) => s.addFreehandObject)

  const frame = frames[activeFrameIndex] ?? frames[0]!
  const [playbackOverlay, setPlaybackOverlay] = useState<PlaybackOverlay>(EMPTY_OVERLAY)
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null)
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  )
  // Points collected for a pen stroke in progress (already in the same
  // crop-shifted object-space every other object's coordinates use), null
  // when not actively drawing one.
  const [freehandPoints, setFreehandPoints] = useState<number[] | null>(null)
  // Which quote-card object (if any) currently has its heading/body textarea
  // overlay open for direct in-place editing — see the QuoteCardEditor render
  // near the bottom of this component.
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)

  function handleObjectDoubleClick(id: string) {
    const object = frame.objects.find((o) => o.id === id)
    if (object?.objectType === 'quote_card') setEditingObjectId(id)
  }

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
      // Every connector forming this loop is a candidate for the fill color
      // — checking only the cycle's arbitrary "first" edge meant setting
      // loopFillColor on whichever segment the user actually had selected
      // often did nothing, since that segment could land anywhere in the
      // cycle. Any explicit loopFillColor along the loop wins; otherwise
      // fall back to the first edge's plain line color, matching how a
      // loop is realistically drawn with one consistent color already
      // (connector color is sticky across new connectors).
      const loopEdges = z.ids.map(
        (id, i): [string, string] => [id, z.ids[(i + 1) % z.ids.length]!],
      )
      const edgeConnectors = loopEdges
        .map(([a, b]) =>
          connectorObjects.find(
            (o) =>
              (o.data.fromId === a && o.data.toId === b) || (o.data.toId === a && o.data.fromId === b),
          ),
        )
        .filter((o): o is (typeof connectorObjects)[number] => Boolean(o))
      const explicitFill = edgeConnectors.find((o) => o.data.loopFillColor)?.data.loopFillColor
      return {
        key: z.key,
        points: points.flatMap((p) => [p.x, p.y]),
        color: explicitFill ?? edgeConnectors[0]?.data.color,
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

  const spaceBehindZones = sortedObjects
    .filter(
      (o): o is Extract<FrameObject, { objectType: 'arrow' }> =>
        o.objectType === 'arrow' && Boolean(o.data.spaceBehind),
    )
    .map((o) => {
      const pts = o.data.points
      const n = pts.length / 2
      // The Group these points render in applies x/y/rotation/scale (in that
      // order, no offset) — so a rotated line's true on-screen points must go
      // through the same rotation before they're usable, otherwise the
      // shaded zone lands wherever the UNROTATED points would have been.
      const rad = (o.rotation * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const absPoints = Array.from({ length: n }, (_, i) => {
        const lx = (pts[i * 2] ?? 0) * o.scale
        const ly = (pts[i * 2 + 1] ?? 0) * o.scale
        return {
          x: o.x + lx * cos - ly * sin,
          y: o.y + lx * sin + ly * cos,
        }
      })
      const lengthVals = absPoints.map((p) => (lengthAxis === 'y' ? p.y : p.x))
      const crossVals = absPoints.map((p) => (lengthAxis === 'y' ? p.x : p.y))
      const avgPos = lengthVals.reduce((a, b) => a + b, 0) / n
      const edge = avgPos < lengthSize / 2 ? 0 : lengthSize
      const depth = Math.abs(edge - avgPos)
      const meters = depth * (pitchLengthM / lengthSize)
      // The shaded zone hugs the line's own (possibly bent) path on one
      // side and the goal-line edge on the other — a flat rectangle at the
      // average depth used to let a bend that swings toward/away from goal
      // poke out past a straight-edged box instead of staying covered.
      const farSide = absPoints
        .slice()
        .reverse()
        .map((p) => (lengthAxis === 'y' ? { x: p.x, y: edge } : { x: edge, y: p.y }))
      const polygonPoints = [...absPoints, ...farSide].flatMap((p) => [p.x, p.y])
      const crossMin = Math.min(...crossVals)
      const crossMax = Math.max(...crossVals)
      const crossCenter = (crossMin + crossMax) / 2
      return {
        id: o.id,
        color: o.data.color,
        meters,
        points: polygonPoints,
        showLabel: o.data.spaceBehindShowLabel ?? true,
        // A double-headed dimension arrow spanning the same depth the "Xm"
        // label describes, so the measurement reads like an actual
        // measurement instead of a bare number floating in the zone.
        dimensionStart: lengthAxis === 'y' ? { x: crossCenter, y: avgPos } : { x: avgPos, y: crossCenter },
        dimensionEnd: lengthAxis === 'y' ? { x: crossCenter, y: edge } : { x: edge, y: crossCenter },
        labelPos:
          lengthAxis === 'y'
            ? { x: crossCenter, y: (avgPos + edge) / 2 }
            : { x: (avgPos + edge) / 2, y: crossCenter },
      }
    })

  // Training-zone size readout: a rectangle/circle shape with showAreaInfo
  // reports its real-world dimensions and, if one or more player chips sit
  // inside it, the resulting m²/player — the "space per player" figure
  // coaches use to judge a small-sided game's intensity (tighter space per
  // player skews toward duels/strength, more space toward running/speed).
  const shapeAreaLabels = sortedObjects
    .filter(
      (o): o is Extract<FrameObject, { objectType: 'shape' }> =>
        o.objectType === 'shape' && Boolean(o.data.showAreaInfo),
    )
    .map((o) => {
      const halfW = (o.data.width * o.scale) / 2
      const halfH = (o.data.height * o.scale) / 2
      const isCircle = o.data.kind === 'circle'
      const widthM = o.data.width * o.scale * (pitchLengthM / PITCH_LOGICAL.width)
      const heightM = o.data.height * o.scale * (pitchWidthM / PITCH_LOGICAL.height)
      const areaM2 = isCircle ? Math.PI * (widthM / 2) * (heightM / 2) : widthM * heightM

      const rad = (o.rotation * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const playerCount = frame.objects.filter((p) => {
        if (p.objectType !== 'player_chip') return false
        const dx0 = p.x - o.x
        const dy0 = p.y - o.y
        // Un-rotate the player's position into the shape's own local space
        // (inverse of the object's own rotation), same approach as the
        // space-behind zone above.
        const dx = dx0 * cos + dy0 * sin
        const dy = -dx0 * sin + dy0 * cos
        return isCircle ? (dx / halfW) ** 2 + (dy / halfH) ** 2 <= 1 : Math.abs(dx) <= halfW && Math.abs(dy) <= halfH
      }).length

      const localLabelY = -halfH - 14
      return {
        id: o.id,
        x: o.x + localLabelY * -sin,
        y: o.y + localLabelY * cos,
        text:
          playerCount > 0
            ? `${widthM.toFixed(1)}×${heightM.toFixed(1)}m · ${Math.round(areaM2 / playerCount)} m²/Spieler`
            : `${widthM.toFixed(1)}×${heightM.toFixed(1)}m`,
      }
    })

  // Offside check: the first player_chip marked as the offside reference
  // (the last outfield defender) sets the line; every opposing-team chip
  // then gets a live "Nicht abseits/Abseits by X.Xm" label. The attacking
  // direction isn't tracked explicitly anywhere in the data model, so —
  // same trick as the space-behind zone above — it's inferred from
  // whichever pitch edge the reference defender is nearer to: defenders
  // sit closer to their OWN goal than to the opponent's, regardless of how
  // the attackers happen to be scattered (averaging attacker positions,
  // the previous approach, broke as soon as one attacker sat deep — e.g. a
  // withdrawn midfielder — which skewed the average onto the wrong side).
  const offsideRef = visibleObjects.find(
    (o): o is Extract<FrameObject, { objectType: 'player_chip' }> =>
      o.objectType === 'player_chip' && Boolean(o.data.offsideReference),
  )
  const offsideLabels = (() => {
    if (!offsideRef) return []
    const opposingChips = visibleObjects.filter(
      (o): o is Extract<FrameObject, { objectType: 'player_chip' }> =>
        o.objectType === 'player_chip' && o.data.team !== offsideRef.data.team,
    )
    // If any opposing chip is marked as the offside target, only that one
    // (or those) gets the label — otherwise every opposing chip does, same
    // as before this was introduced.
    const targeted = opposingChips.filter((o) => o.data.offsideTarget)
    const attackers = targeted.length > 0 ? targeted : opposingChips
    if (attackers.length === 0) return []
    const refPos = lengthAxis === 'y' ? offsideRef.y : offsideRef.x
    const ownGoalEdge = refPos < lengthSize / 2 ? 0 : lengthSize
    const refDistToGoal = Math.abs(refPos - ownGoalEdge)
    return attackers.map((a) => {
      const pos = lengthAxis === 'y' ? a.y : a.x
      const distToGoal = Math.abs(pos - ownGoalEdge)
      const deltaM = Math.abs(distToGoal - refDistToGoal) * (pitchLengthM / lengthSize)
      const offside = distToGoal < refDistToGoal
      return {
        id: a.id,
        x: a.x,
        y: a.y,
        offside,
        text: `${offside ? 'Abseits' : 'Nicht abseits'} ${deltaM.toFixed(1)}m`,
      }
    })
  })()

  const trRef = useRef<Konva.Transformer>(null)
  const objectsLayerRef = useRef<Konva.Layer>(null)
  const nodeRefs = useRef<Record<string, Konva.Group>>({})
  const connectorRefs = useRef<Record<string, Konva.Line>>({})
  const zoneRefs = useRef<Record<string, Konva.Line>>({})

  const logical = getCroppedStageSize(orientation, fieldCrop)
  const fitScale =
    size.width > 0 && size.height > 0
      ? Math.min(size.width / logical.width, size.height / logical.height)
      : 1
  const scale = fitScale * zoom

  // Objects are stored in the full (uncropped) pitch's coordinate system.
  // When a crop is active, the stage itself only spans the cropped slice,
  // so the whole objects layer is shifted by the same amount the Pitch's
  // own rendering is (see Pitch.tsx) to keep them aligned — and the shift
  // is added back when translating a click into a stored position.
  const cropShift = getCropOriginX(fieldCrop, fieldMirrored)

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
      // Don't clear the selection yet — a plain click (no real drag) still
      // should, but a press-and-drag over empty pitch space starts a
      // marquee instead (resolved in handleStageMouseUp once we know which
      // one this gesture turned out to be).
      const pos = stageRef.current?.getRelativePointerPosition()
      if (pos) setMarqueeStart(pos)
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
    const objX = orientation === 'vertical' ? pos.x : pos.x + cropShift
    const objY = orientation === 'vertical' ? pos.y + cropShift : pos.y

    if (tool === 'pen') {
      setFreehandPoints([objX, objY])
      return
    }
    addObjectAt(objX, objY)
  }

  const MARQUEE_DRAG_THRESHOLD = 4
  // Minimum gap (in object-space units) between two consecutive recorded
  // pen points — keeps the stored path a reasonable size instead of one
  // point per pixel of mouse movement at typical drag speeds.
  const FREEHAND_MIN_SEGMENT = 4

  function handleStageMouseMove() {
    if (freehandPoints) {
      const pos = stageRef.current?.getRelativePointerPosition()
      if (!pos) return
      const objX = orientation === 'vertical' ? pos.x : pos.x + cropShift
      const objY = orientation === 'vertical' ? pos.y + cropShift : pos.y
      const lastX = freehandPoints[freehandPoints.length - 2]!
      const lastY = freehandPoints[freehandPoints.length - 1]!
      if (Math.hypot(objX - lastX, objY - lastY) >= FREEHAND_MIN_SEGMENT) {
        setFreehandPoints([...freehandPoints, objX, objY])
      }
      return
    }
    if (!marqueeStart) return
    const pos = stageRef.current?.getRelativePointerPosition()
    if (!pos) return
    const x = Math.min(marqueeStart.x, pos.x)
    const y = Math.min(marqueeStart.y, pos.y)
    const width = Math.abs(pos.x - marqueeStart.x)
    const height = Math.abs(pos.y - marqueeStart.y)
    setMarqueeRect(width > MARQUEE_DRAG_THRESHOLD || height > MARQUEE_DRAG_THRESHOLD ? { x, y, width, height } : null)
  }

  function handleStageMouseUp(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (freehandPoints) {
      addFreehandObject(freehandPoints, '#f0d878', 3)
      setFreehandPoints(null)
      return
    }
    if (!marqueeStart) return
    const rect = marqueeRect
    setMarqueeStart(null)
    setMarqueeRect(null)
    if (!rect) {
      // No real drag happened — treat it as the plain "click empty pitch to
      // deselect" gesture the marquee start pre-empted above.
      setSelection([])
      return
    }
    const ids = frame.objects
      .filter((o) => {
        const node = nodeRefs.current[o.id]
        if (!node) return false
        const box = node.getClientRect({ relativeTo: stageRef.current ?? undefined })
        return (
          box.x < rect.x + rect.width &&
          box.x + box.width > rect.x &&
          box.y < rect.y + rect.height &&
          box.y + box.height > rect.y
        )
      })
      .map((o) => o.id)
    const additive = 'evt' in e && 'shiftKey' in e.evt && e.evt.shiftKey
    setSelection(additive ? Array.from(new Set([...selection, ...ids])) : ids)
  }

  function handleDragStart() {
    beginHistoryCheckpoint()
  }

  // Snapshot of a group drag in progress: the dragged object's own starting
  // position (to derive how far the pointer has actually moved) plus every
  // OTHER selected, unlocked object's starting position — so the whole
  // selection can be shifted by the same delta instead of only the one
  // object Konva is actually dragging. Null outside of a drag.
  const dragAnchorRef = useRef<{
    id: string
    startX: number
    startY: number
    others: { id: string; startX: number; startY: number }[]
  } | null>(null)

  // A plain grab-and-drag (no prior click) never fires onSelect — Konva only
  // treats a gesture as a click if the pointer barely moved — so without
  // this, moving a player/ball straight from an unselected state would never
  // reveal its motion guide (below) at all. Only takes over the selection if
  // the object wasn't already part of it, so dragging one of several
  // selected chips together doesn't collapse the rest of the selection.
  function handleObjectDragStart(id: string) {
    let activeSelection = selection
    if (!selection.includes(id)) {
      const obj = frame.objects.find((o) => o.id === id)
      if (obj && (obj.objectType === 'player_chip' || obj.objectType === 'ball')) {
        setSelection([id])
      }
      activeSelection = [id]
    }

    const draggedObj = frame.objects.find((o) => o.id === id)
    if (!draggedObj) return
    dragAnchorRef.current = {
      id,
      startX: draggedObj.x,
      startY: draggedObj.y,
      others: activeSelection
        .filter((sid) => sid !== id)
        .map((sid) => frame.objects.find((o) => o.id === sid))
        .filter((o): o is FrameObject => o !== undefined && !o.locked)
        .map((o) => ({ id: o.id, startX: o.x, startY: o.y })),
    }
  }

  // Group-drag: when the dragged object is part of a multi-selection, every
  // other selected (unlocked) object is shifted by the same delta so the
  // whole selection moves together — e.g. right after a paste, which
  // selects everything it just added.
  function handleDragMove(id: string, x: number, y: number) {
    const anchor = dragAnchorRef.current
    if (anchor && anchor.id === id && anchor.others.length > 0) {
      const dx = x - anchor.startX
      const dy = y - anchor.startY
      setObjectPositions([
        { id, x, y },
        ...anchor.others.map((o) => ({ id: o.id, x: o.startX + dx, y: o.startY + dy })),
      ])
      return
    }
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

  // Optional, always-on version of the guide above: a light line from every
  // player/ball's previous-frame position to its current one (not just the
  // selection), toggled globally via `showMovementTrails` — including while
  // playing back, unlike the selection-only editing guide.
  const movementTrails =
    showMovementTrails && prevFrame
      ? visibleObjects
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
    selectedObjects.every(
      (o) => o.objectType === 'shape' || o.objectType === 'training_equipment' || o.objectType === 'quote_card',
    )

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
    <div className="relative h-full w-full">
    <div ref={containerRef} className="flex h-full w-full overflow-auto">
      <Stage
        ref={stageRef}
        width={logical.width * scale}
        height={logical.height * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
        onWheel={(e: KonvaEventObject<WheelEvent>) => {
          if (!e.evt.ctrlKey && !e.evt.metaKey) return
          e.evt.preventDefault()
          setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.evt.deltaY * 0.001)))
        }}
        className="m-auto rounded-lg shadow-2xl shadow-black/60"
      >
        <Layer>
          <Pitch
            design={pitchDesign}
            orientation={orientation}
            zoneGridStyle={zoneGridStyle}
            customGridLines={zoneGridCustomLines}
            showPitchMarkings={showPitchMarkings}
            fieldCrop={fieldCrop}
            fieldMirrored={fieldMirrored}
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
              <Line points={z.points} closed fill={hexToRgba(z.color, 0.16)} />
              {z.showLabel && (
                <>
                  <Arrow
                    points={[z.dimensionStart.x, z.dimensionStart.y, z.dimensionEnd.x, z.dimensionEnd.y]}
                    pointerAtBeginning
                    pointerLength={7}
                    pointerWidth={7}
                    fill={z.color}
                    stroke={z.color}
                    strokeWidth={1.5}
                    shadowColor="black"
                    shadowBlur={4}
                    shadowOpacity={0.6}
                  />
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
                </>
              )}
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
                // An image (e.g. the "trace over a photo" backdrop) can cover
                // the whole pitch — while a placement tool is active, clicks
                // on it should reach the Stage and place the new object
                // instead of just re-selecting the backdrop underneath.
                // Switching to "select" restores normal click/drag on it.
                listening={object.objectType !== 'image' || tool === 'select'}
                onSelect={handleObjectClick}
                onDragStart={handleDragStart}
                onObjectDragStart={handleObjectDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragMove}
                onTransformEnd={handleTransformEnd}
                onDoubleClick={handleObjectDoubleClick}
                onArrowPointsChange={handleArrowPointsChange}
                registerRef={registerRef}
                initialOpacity={enteringIds.has(object.id) ? 0 : 1}
                initialScaleFactor={enteringIds.has(object.id) ? 0.7 : 1}
                isEditingText={editingObjectId === object.id}
              />
            )
          })}
          {offsideLabels.map((l) => {
            const labelWidth = Math.max(84, l.text.length * 6.2 + 16)
            return (
              <Group key={`offside-${l.id}`} x={l.x} y={l.y - 46} listening={false}>
                <Rect
                  x={-labelWidth / 2}
                  y={-11}
                  width={labelWidth}
                  height={22}
                  fill={l.offside ? '#ef4444' : '#22c55e'}
                  cornerRadius={4}
                  opacity={0.92}
                />
                <Text
                  text={l.text}
                  x={-labelWidth / 2}
                  y={-11}
                  width={labelWidth}
                  height={22}
                  align="center"
                  verticalAlign="middle"
                  fontSize={10}
                  fontStyle="bold"
                  fill="#ffffff"
                />
              </Group>
            )
          })}
          {shapeAreaLabels.map((l) => {
            const labelWidth = Math.max(70, l.text.length * 5.6 + 14)
            return (
              <Group key={`area-info-${l.id}`} x={l.x} y={l.y} listening={false}>
                <Rect
                  x={-labelWidth / 2}
                  y={-10}
                  width={labelWidth}
                  height={20}
                  fill="rgba(15, 23, 42, 0.82)"
                  cornerRadius={4}
                />
                <Text
                  text={l.text}
                  x={-labelWidth / 2}
                  y={-10}
                  width={labelWidth}
                  height={20}
                  align="center"
                  verticalAlign="middle"
                  fontSize={10}
                  fontStyle="bold"
                  fill="#ffffff"
                />
              </Group>
            )
          })}
          {freehandPoints && freehandPoints.length >= 4 && (
            <Line
              points={freehandPoints}
              stroke="#f0d878"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
              listening={false}
            />
          )}
          {movementTrails.map((g) => (
            <MovementTrail
              key={`trail-${g.id}`}
              fromX={g.fromX}
              fromY={g.fromY}
              toX={g.toX}
              toY={g.toY}
              bend={g.bend}
            />
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
        {marqueeRect && (
          <Layer listening={false}>
            <Rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="rgba(124, 58, 237, 0.15)"
              stroke="#7c3aed"
              strokeWidth={1}
              dash={[4, 4]}
            />
          </Layer>
        )}
      </Stage>
      {editingObjectId &&
        (() => {
          const editingObject = frame.objects.find((o) => o.id === editingObjectId)
          const editingNode = nodeRefs.current[editingObjectId]
          if (!editingObject || editingObject.objectType !== 'quote_card' || !editingNode || !stageRef.current) {
            return null
          }
          const abs = editingNode.getAbsolutePosition()
          const containerRect = stageRef.current.container().getBoundingClientRect()
          return (
            <QuoteCardEditOverlay
              data={editingObject.data}
              originX={containerRect.left + abs.x * scale}
              originY={containerRect.top + abs.y * scale}
              rotationDeg={editingObject.rotation}
              visualScale={editingObject.scale * scale}
              onCommit={(patch) =>
                updateObjectLive(editingObject.id, { data: { ...editingObject.data, ...patch } } as Partial<FrameObject>)
              }
              onClose={() => setEditingObjectId(null)}
            />
          )
        })()}
    </div>
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-full border border-pitch-700 bg-pitch-900/90 px-1.5 py-1 shadow-lg">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white/70 hover:bg-pitch-800 hover:text-white"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="min-w-[3.5rem] rounded-full px-2 py-1 text-center text-xs text-white/70 hover:bg-pitch-800 hover:text-white"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white/70 hover:bg-pitch-800 hover:text-white"
        >
          +
        </button>
      </div>
    </div>
  )
}
