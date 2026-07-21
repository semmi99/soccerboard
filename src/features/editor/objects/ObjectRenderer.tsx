import { useEffect, useRef } from 'react'
import { Circle, Group } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { FrameObject } from '../types'
import { PlayerChipShape } from './shapes/PlayerChip'
import { ArrowShape } from './shapes/Arrow'
import { ShapeItem } from './shapes/ShapeItem'
import { TextItem } from './shapes/TextItem'
import { EquipmentShape } from './shapes/Equipment'
import { BallShape } from './shapes/Ball'

function renderContent(object: FrameObject) {
  switch (object.objectType) {
    case 'player_chip':
      return <PlayerChipShape data={object.data} />
    case 'arrow':
      return <ArrowShape data={object.data} scale={object.scale} />
    case 'shape':
      return <ShapeItem data={object.data} />
    case 'text':
      return <TextItem data={object.data} />
    case 'training_equipment':
      return <EquipmentShape data={object.data} />
    case 'ball':
      return <BallShape data={object.data} />
  }
}

/** Small draggable handles at each of a straight/polyline arrow's points —
 * shown only while selected — so a pass/run can be bent into an arbitrary
 * path by hand instead of relying on a fixed curve formula. Rendered as
 * siblings inside the same (already x/y/rotation/scale-transformed) Group
 * as the arrow itself, so handle positions line up with `data.points`
 * without any extra coordinate math. */
function ArrowPointHandles({
  points,
  scale,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  points: number[]
  scale: number
  onDragStart: () => void
  onDragMove: (pairIndex: number, x: number, y: number) => void
  onDragEnd: () => void
}) {
  const safeScale = Math.max(scale, 0.2)
  const radius = 6 / safeScale
  const strokeWidth = 1.5 / safeScale

  const pairs: { x: number; y: number }[] = []
  for (let i = 0; i < points.length; i += 2) {
    pairs.push({ x: points[i]!, y: points[i + 1]! })
  }

  return (
    <>
      {pairs.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={radius}
          fill="#ffe100"
          stroke="#0f3d59"
          strokeWidth={strokeWidth}
          draggable
          onDragStart={(e: KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true
            onDragStart()
          }}
          onDragMove={(e: KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true
            onDragMove(i, e.target.x(), e.target.y())
          }}
          onDragEnd={(e: KonvaEventObject<DragEvent>) => {
            e.cancelBubble = true
            onDragEnd()
          }}
          onClick={(e: KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true
          }}
        />
      ))}
    </>
  )
}

interface Props {
  object: FrameObject
  isSelected: boolean
  interactive: boolean
  onSelect: (id: string, additive: boolean) => void
  onDragStart: () => void
  onObjectDragStart?: (id: string) => void
  onDragMove: (id: string, x: number, y: number) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, patch: Partial<FrameObject>) => void
  onDoubleClick?: (id: string) => void
  onArrowPointsChange?: (id: string, points: number[]) => void
  registerRef: (id: string, node: Konva.Group | null) => void
  initialOpacity?: number
  initialScaleFactor?: number
}

export function ObjectRenderer({
  object,
  isSelected,
  interactive,
  onSelect,
  onDragStart,
  onObjectDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
  onArrowPointsChange,
  registerRef,
  initialOpacity,
  initialScaleFactor,
}: Props) {
  const groupRef = useRef<Konva.Group>(null)

  useEffect(() => {
    registerRef(object.id, groupRef.current)
    return () => registerRef(object.id, null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.id])

  function handleTransformEnd() {
    const node = groupRef.current
    if (!node) return

    // Shapes support independent width/height instead of a single uniform
    // scale factor, so a free 4-corner resize can actually stretch them
    // non-uniformly. The resize is folded into the shape's own data and the
    // node's scale is reset to 1 so it doesn't get double-applied on the
    // next render.
    if (object.objectType === 'shape') {
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      node.scaleX(1)
      node.scaleY(1)
      const data = {
        ...object.data,
        width: Math.max(8, object.data.width * scaleX),
        height: Math.max(8, object.data.height * scaleY),
      }
      onTransformEnd(object.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scale: 1,
        data,
      } as Partial<FrameObject>)
      return
    }

    // Training equipment keeps its usual uniform `scale` (from the "Größe"
    // slider) as a baseline, but a free corner-drag can additionally stretch
    // width/height independently — that extra non-uniform ratio is folded
    // into the equipment's own scaleX/scaleY instead of the shared scale, so
    // pulling a cone longer doesn't also puff it out sideways.
    if (object.objectType === 'training_equipment') {
      const baseScale = object.scale || 1
      const dragRatioX = node.scaleX() / baseScale
      const dragRatioY = node.scaleY() / baseScale
      node.scaleX(baseScale)
      node.scaleY(baseScale)
      const prevScaleX = object.data.scaleX ?? 1
      const prevScaleY = object.data.scaleY ?? 1
      onTransformEnd(object.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scale: baseScale,
        data: {
          ...object.data,
          scaleX: prevScaleX * dragRatioX,
          scaleY: prevScaleY * dragRatioY,
        },
      } as Partial<FrameObject>)
      return
    }

    onTransformEnd(object.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scale: node.scaleX(),
    })
  }

  const showArrowHandles =
    object.objectType === 'arrow' && object.data.shape !== 'curved' && isSelected && interactive

  function handleArrowPointDragMove(pairIndex: number, x: number, y: number) {
    if (object.objectType !== 'arrow' || !onArrowPointsChange) return
    const points = [...object.data.points]
    points[pairIndex * 2] = x
    points[pairIndex * 2 + 1] = y
    onArrowPointsChange(object.id, points)
  }

  // Konva arms a drag on every draggable node under the pointer at mousedown,
  // not just the topmost hit — with the point handle AND its parent object
  // Group both draggable, the Group would otherwise hijack the drag and move
  // the whole arrow instead of just the one point. Toggling the Group's own
  // draggable flag off for the duration of a handle drag is the reliable fix.
  function handleArrowPointDragStart() {
    groupRef.current?.draggable(false)
    onDragStart()
  }

  function handleArrowPointDragEnd() {
    groupRef.current?.draggable(interactive)
  }

  return (
    <Group
      ref={groupRef}
      x={object.x}
      y={object.y}
      rotation={object.rotation}
      scaleX={object.scale * (initialScaleFactor ?? 1)}
      scaleY={object.scale * (initialScaleFactor ?? 1)}
      opacity={initialOpacity ?? 1}
      draggable={interactive}
      onClick={(e: KonvaEventObject<MouseEvent>) => {
        if (!interactive) return
        e.cancelBubble = true
        onSelect(object.id, e.evt.shiftKey)
      }}
      onTap={(e: KonvaEventObject<TouchEvent>) => {
        if (!interactive) return
        e.cancelBubble = true
        onSelect(object.id, false)
      }}
      onDblClick={() => onDoubleClick?.(object.id)}
      onDragStart={() => {
        onDragStart()
        onObjectDragStart?.(object.id)
      }}
      onDragMove={(e) => onDragMove(object.id, e.target.x(), e.target.y())}
      onDragEnd={(e) => onDragEnd(object.id, e.target.x(), e.target.y())}
      onTransformEnd={handleTransformEnd}
    >
      {renderContent(object)}
      {showArrowHandles && object.objectType === 'arrow' && (
        <ArrowPointHandles
          points={object.data.points}
          scale={object.scale}
          onDragStart={handleArrowPointDragStart}
          onDragMove={handleArrowPointDragMove}
          onDragEnd={handleArrowPointDragEnd}
        />
      )}
    </Group>
  )
}
