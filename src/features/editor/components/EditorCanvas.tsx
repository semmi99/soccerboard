import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Group, Layer, Stage, Transformer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '../store/editorStore'
import { getCropOriginX, getCroppedStageSize } from '../constants'
import { useElementSize } from '../hooks/useElementSize'
import { Pitch } from './Pitch'
import { ObjectRenderer } from '../objects/ObjectRenderer'
import { ConnectorShape } from '../objects/shapes/Connector'
import { PlayerZoneShape } from '../objects/shapes/PlayerZone'
import { FrameCaptionOverlay } from './FrameCaptionOverlay'
import type { FrameObject } from '../types'

// Cubic ease-in-out: a touch smoother/slower off the start and into the end
// than a quadratic curve, closer to what motion-design tools use by default.
// Trivial to evaluate for an arbitrary t in [0, 1] (Konva.Easings functions
// instead take (t, from, delta, duration)).
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2
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
  fromId: string
  toId: string
}

interface PolygonSyncSpec {
  line: Konva.Line
  ids: string[]
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
  nodeRefs: Record<string, Konva.Group>,
) {
  return new Promise<void>((resolve) => {
    let settled = false
    const durationMs = durationSec * 1000
    const start = performance.now()

    function settle() {
      if (settled) return
      settled = true
      clearTimeout(fallbackId)
      anim.stop()
      resolve()
    }

    const anim = new Konva.Animation(() => {
      const raw = Math.min(1, (performance.now() - start) / durationMs)
      const eased = easeInOut(raw)

      for (const m of moves) {
        m.node.x(m.fromX + (m.toX - m.fromX) * eased)
        m.node.y(m.fromY + (m.toY - m.fromY) * eased)
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
        if (fromNode && toNode) c.line.points([fromNode.x(), fromNode.y(), toNode.x(), toNode.y()])
      }
      for (const z of zones) {
        const nodes = z.ids.map((id) => nodeRefs[id]).filter((n): n is Konva.Group => Boolean(n))
        if (nodes.length === z.ids.length) {
          z.line.points(nodes.flatMap((n) => [n.x(), n.y()]))
        }
      }

      if (raw >= 1) settle()
    }, layer)

    anim.start()

    // Safety net: if the tab is backgrounded (rAF throttled/paused) and the
    // animation frame callback stalls, force-finish instead of leaving
    // playback stuck on this frame forever.
    const fallbackId = setTimeout(() => {
      if (settled) return
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
        if (fromNode && toNode) c.line.points([fromNode.x(), fromNode.y(), toNode.x(), toNode.y()])
      }
      for (const z of zones) {
        const nodes = z.ids.map((id) => nodeRefs[id]).filter((n): n is Konva.Group => Boolean(n))
        if (nodes.length === z.ids.length) {
          z.line.points(nodes.flatMap((n) => [n.x(), n.y()]))
        }
      }
      settle()
    }, durationMs + 500)
  })
}

interface PlaybackOverlay {
  entering: FrameObject[]
  exiting: FrameObject[]
}

const EMPTY_OVERLAY: PlaybackOverlay = { entering: [], exiting: [] }

export function EditorCanvas({ stageRef }: { stageRef: RefObject<Konva.Stage | null> }) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>()
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const orientation = useEditorStore((s) => s.orientation)
  const zoneGridStyle = useEditorStore((s) => s.zoneGridStyle)
  const showPitchMarkings = useEditorStore((s) => s.showPitchMarkings)
  const fieldCrop = useEditorStore((s) => s.fieldCrop)
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
  const polygonDraftIds = useEditorStore((s) => s.polygonDraftIds)
  const setPolygonDraftIds = useEditorStore((s) => s.setPolygonDraftIds)
  const addPlayerZone = useEditorStore((s) => s.addPlayerZone)
  const setFrameCaption = useEditorStore((s) => s.setFrameCaption)

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
  const sortedObjects = [...visibleObjects].sort((a, b) => a.zIndex - b.zIndex)
  const enteringIds = new Set(playbackOverlay.entering.map((o) => o.id))

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
    // Bendable straight/polyline arrows get their own point-drag handles
    // (see ArrowPointHandles in ObjectRenderer) sitting right at the shape's
    // corners — the Transformer's resize anchors would land almost exactly
    // on top of them and hijack the drag, silently resizing/collapsing the
    // arrow instead of moving a point. Curved arrows have no such handles
    // and still rely on the Transformer normally.
    const nodes = selection
      .filter((id) => {
        const obj = frame.objects.find((o) => o.id === id)
        return !(obj?.objectType === 'arrow' && obj.data.shape !== 'curved')
      })
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
        const durationSec = Math.max(fromFrame.durationMs, 50) / 1000

        const fromIds = new Set(fromFrame.objects.map((o) => o.id))
        const toIds = new Set(toFrame.objects.map((o) => o.id))
        const entering = toFrame.objects.filter((o) => !fromIds.has(o.id))
        const exiting = fromFrame.objects.filter((o) => !toIds.has(o.id))

        // Mount entering objects (at opacity 0, see initialOpacity below) and
        // keep exiting ones mounted past the frame boundary so both can be
        // tweened instead of popping in/out abruptly.
        setPlaybackOverlay({ entering, exiting })
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (cancelled) return

        const moves: MoveSpec[] = toFrame.objects
          .map((toObj) => {
            const node = nodeRefs.current[toObj.id]
            const fromObj = fromFrame.objects.find((o) => o.id === toObj.id)
            if (!node || !fromObj) return null
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
            return line ? { line, fromId: o.data.fromId, toId: o.data.toId } : null
          })
          .filter((c): c is ConnectorSyncSpec => Boolean(c))

        // Same idea as connectors: a player-zone polygon that persists across
        // both frames needs its points glued to the live (tweened) positions
        // of the player chips it references while the transition is in flight.
        const zones: PolygonSyncSpec[] = toFrame.objects
          .filter(
            (o): o is Extract<FrameObject, { objectType: 'player_zone' }> =>
              o.objectType === 'player_zone' && fromIds.has(o.id),
          )
          .map((o) => {
            const line = zoneRefs.current[o.id]
            return line ? { line, ids: o.data.playerIds } : null
          })
          .filter((z): z is PolygonSyncSpec => Boolean(z))

        await runTransition(objectsLayerRef.current, durationSec, moves, fades, connectors, zones, nodeRefs.current)
        if (cancelled) return

        useEditorStore.getState().setActiveFrameIndex(currentIndex + 1)
        setPlaybackOverlay(EMPTY_OVERLAY)
        await new Promise((resolve) => setTimeout(resolve, 0))
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
    if (tool === 'player_zone') {
      const clicked = frame.objects.find((o) => o.id === id)
      if (!clicked || clicked.objectType !== 'player_chip') return
      if (polygonDraftIds.length >= 3 && polygonDraftIds[0] === id) {
        addPlayerZone(polygonDraftIds)
        return
      }
      if (polygonDraftIds.includes(id)) return
      const next = [...polygonDraftIds, id]
      setPolygonDraftIds(next)
      setSelection(next)
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
    if (tool === 'player_zone') {
      setPolygonDraftIds([])
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

  // Shapes (zones/circles/rects/polygons) get free non-uniform corner
  // resizing since their width/height are independently meaningful; other
  // object kinds (chips, equipment, text, ball) keep proportional scaling
  // since they don't have separate width/height to resize into.
  const selectedObjects = selection
    .map((id) => frame.objects.find((o) => o.id === id))
    .filter((o): o is FrameObject => Boolean(o))
  const allShapesSelected =
    selectedObjects.length > 0 && selectedObjects.every((o) => o.objectType === 'shape')

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
            showPitchMarkings={showPitchMarkings}
            fieldCrop={fieldCrop}
          />
        </Layer>
        <Layer ref={objectsLayerRef}>
        <Group
          x={orientation === 'horizontal' ? -cropShift : 0}
          y={orientation === 'vertical' ? -cropShift : 0}
        >
          {sortedObjects.map((object) => {
            if (object.objectType === 'player_zone') {
              const points = object.data.playerIds
                .map((id) => visibleObjects.find((o) => o.id === id))
                .filter((o): o is FrameObject => Boolean(o))
              if (points.length !== object.data.playerIds.length) return null
              return (
                <PlayerZoneShape
                  key={object.id}
                  data={object.data}
                  points={points.flatMap((p) => [p.x, p.y])}
                  isSelected={selection.includes(object.id)}
                  onSelect={(additive) => handleSelect(object.id, additive)}
                  lineRef={(node) => registerZoneRef(object.id, node)}
                />
              )
            }
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
          <Transformer
            ref={trRef}
            onTransformStart={handleTransformStart}
            rotateEnabled
            keepRatio={!allShapesSelected}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
            }
          />
        </Group>
        </Layer>
        {frame.caption && (
          <Layer>
            <FrameCaptionOverlay
              caption={frame.caption}
              stageWidth={logical.width}
              stageHeight={logical.height}
              draggable={!isPlaying}
              onDragStart={beginHistoryCheckpoint}
              onDragEnd={(x, y) =>
                setFrameCaption(activeFrameIndex, { ...frame.caption!, x, y })
              }
            />
          </Layer>
        )}
      </Stage>
    </div>
  )
}
