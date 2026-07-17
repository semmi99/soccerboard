import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { Layer, Stage, Transformer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useEditorStore } from '../store/editorStore'
import { PITCH_STAGE_SIZE } from '../constants'
import { useElementSize } from '../hooks/useElementSize'
import { Pitch } from './Pitch'
import { ObjectRenderer } from '../objects/ObjectRenderer'
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

  const frame = frames[activeFrameIndex] ?? frames[0]!
  const sortedObjects = [...frame.objects].sort((a, b) => a.zIndex - b.zIndex)

  const trRef = useRef<Konva.Transformer>(null)
  const nodeRefs = useRef<Record<string, Konva.Group>>({})

  const logical = PITCH_STAGE_SIZE[orientation]
  const scale =
    size.width > 0 && size.height > 0
      ? Math.min(size.width / logical.width, size.height / logical.height)
      : 1

  const registerRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodeRefs.current[id] = node
    else delete nodeRefs.current[id]
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

        const tweens = toFrame.objects
          .map((toObj) => {
            const node = nodeRefs.current[toObj.id]
            const fromObj = fromFrame.objects.find((o) => o.id === toObj.id)
            if (!node || !fromObj) return null
            return tweenObjectTo(node, toObj, durationSec)
          })
          .filter((p): p is Promise<void> => Boolean(p))

        await Promise.all(tweens)
        if (cancelled) return

        useEditorStore.getState().setActiveFrameIndex(currentIndex + 1)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      useEditorStore.getState().setIsPlaying(false)
    }

    run()
    return () => {
      cancelled = true
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

  function handleStageMouseDown(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    if (isPlaying) return
    const clickedOnEmpty = e.target === e.target.getStage()
    if (!clickedOnEmpty) return

    if (tool === 'select') {
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
        <Layer>
          {sortedObjects.map((object) => (
            <ObjectRenderer
              key={object.id}
              object={object}
              isSelected={selection.includes(object.id)}
              interactive={!isPlaying}
              onSelect={handleSelect}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragMove}
              onTransformEnd={handleTransformEnd}
              registerRef={registerRef}
            />
          ))}
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
