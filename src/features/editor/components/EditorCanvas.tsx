import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Layer, Stage, Transformer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '../store/editorStore'
import { PITCH_STAGE_SIZE } from '../constants'
import { useElementSize } from '../hooks/useElementSize'
import { Pitch } from './Pitch'
import { ObjectRenderer } from '../objects/ObjectRenderer'
import { ConnectorShape } from '../objects/shapes/Connector'
import type { FrameObject } from '../types'

function tweenObjectTo(node: Konva.Group, target: FrameObject, durationSec: number) {
  return new Promise<void>((resolve) => {
    let settled = false

    const tween = new Konva.Tween({
      node,
      duration: durationSec,
      x: target.x,
      y: target.y,
      rotation: target.rotation,
      scaleX: target.scale,
      scaleY: target.scale,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        if (settled) return
        settled = true
        clearTimeout(fallbackId)
        resolve()
      },
    })
    tween.play()

    // Safety net: if the tab is backgrounded (rAF throttled/paused) or the
    // tween otherwise never fires onFinish, snap to the final values instead
    // of leaving playback stuck on this frame forever.
    const fallbackId = setTimeout(
      () => {
        if (settled) return
        settled = true
        tween.destroy()
        node.setAttrs({
          x: target.x,
          y: target.y,
          rotation: target.rotation,
          scaleX: target.scale,
          scaleY: target.scale,
        })
        resolve()
      },
      durationSec * 1000 + 500,
    )
  })
}

function fadeNodeTo(node: Konva.Group | undefined, targetOpacity: number, durationSec: number) {
  if (!node) return null
  return new Promise<void>((resolve) => {
    let settled = false

    const tween = new Konva.Tween({
      node,
      duration: durationSec,
      opacity: targetOpacity,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        if (settled) return
        settled = true
        clearTimeout(fallbackId)
        resolve()
      },
    })
    tween.play()

    const fallbackId = setTimeout(
      () => {
        if (settled) return
        settled = true
        tween.destroy()
        node.opacity(targetOpacity)
        resolve()
      },
      durationSec * 1000 + 500,
    )
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
  const sortedObjects = [...visibleObjects].sort((a, b) => a.zIndex - b.zIndex)
  const enteringIds = new Set(playbackOverlay.entering.map((o) => o.id))

  const trRef = useRef<Konva.Transformer>(null)
  const objectsLayerRef = useRef<Konva.Layer>(null)
  const nodeRefs = useRef<Record<string, Konva.Group>>({})
  const connectorRefs = useRef<Record<string, Konva.Line>>({})

  const logical = PITCH_STAGE_SIZE[orientation]
  const scale =
    size.width > 0 && size.height > 0
      ? Math.min(size.width / logical.width, size.height / logical.height)
      : 1

  const registerRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodeRefs.current[id] = node
    else delete nodeRefs.current[id]
  }, [])

  const registerConnectorRef = useCallback((id: string, node: Konva.Line | null) => {
    if (node) connectorRefs.current[id] = node
    else delete connectorRefs.current[id]
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

        const positionTweens = toFrame.objects
          .map((toObj) => {
            const node = nodeRefs.current[toObj.id]
            const fromObj = fromFrame.objects.find((o) => o.id === toObj.id)
            if (!node || !fromObj) return null
            return tweenObjectTo(node, toObj, durationSec)
          })
          .filter((p): p is Promise<void> => Boolean(p))

        const fadeTweens = [
          ...entering.map((o) => fadeNodeTo(nodeRefs.current[o.id], 1, durationSec)),
          ...exiting.map((o) => fadeNodeTo(nodeRefs.current[o.id], 0, durationSec)),
        ].filter((p): p is Promise<void> => Boolean(p))

        // Connectors that persist across both frames need their line glued
        // to their endpoints' live (tweened) node positions on every
        // animation frame — otherwise they only "catch up" once the frame
        // boundary flips and React re-renders from the new frame data.
        const connectorsToSync = toFrame.objects.filter(
          (o): o is Extract<FrameObject, { objectType: 'connector' }> =>
            o.objectType === 'connector' && fromIds.has(o.id),
        )
        const anim = connectorsToSync.length
          ? new Konva.Animation(() => {
              for (const connector of connectorsToSync) {
                const line = connectorRefs.current[connector.id]
                const fromNode = nodeRefs.current[connector.data.fromId]
                const toNode = nodeRefs.current[connector.data.toId]
                if (!line || !fromNode || !toNode) continue
                line.points([fromNode.x(), fromNode.y(), toNode.x(), toNode.y()])
              }
            }, objectsLayerRef.current)
          : null
        anim?.start()

        await Promise.all([...positionTweens, ...fadeTweens])
        anim?.stop()
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
    if (pos) addObjectAt(pos.x, pos.y)
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
          <Pitch design={pitchDesign} orientation={orientation} />
        </Layer>
        <Layer ref={objectsLayerRef}>
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
                onDragMove={handleDragMove}
                onDragEnd={handleDragMove}
                onTransformEnd={handleTransformEnd}
                registerRef={registerRef}
                initialOpacity={enteringIds.has(object.id) ? 0 : 1}
              />
            )
          })}
          <Transformer
            ref={trRef}
            onTransformStart={handleTransformStart}
            rotateEnabled
            keepRatio
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>
    </div>
  )
}
