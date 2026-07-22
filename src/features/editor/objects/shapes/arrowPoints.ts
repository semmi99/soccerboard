import type { ArrowData } from '../../types'

/** Inserts a new draggable bend point at the midpoint of the arrow's
 * longest segment, so repeatedly clicking "Punkt hinzufügen" progressively
 * refines the path instead of piling every new point into the same spot. */
export function addArrowMidpoint(data: ArrowData): number[] {
  const p = data.points
  if (p.length < 4) return p

  let bestIndex = 0
  let bestLength = -1
  for (let i = 0; i < p.length - 2; i += 2) {
    const dx = p[i + 2]! - p[i]!
    const dy = p[i + 3]! - p[i + 1]!
    const length = Math.hypot(dx, dy)
    if (length > bestLength) {
      bestLength = length
      bestIndex = i
    }
  }

  const midX = (p[bestIndex]! + p[bestIndex + 2]!) / 2
  const midY = (p[bestIndex + 1]! + p[bestIndex + 3]!) / 2
  const next = [...p]
  next.splice(bestIndex + 2, 0, midX, midY)
  return next
}

/** Dragging the start or end handle of a bendable arrow snaps every
 * interior point back onto the straight line between the (new) start and
 * end, instead of leaving them wherever they were relative to the old
 * endpoint — otherwise moving just the tip of an already-bent arrow bends
 * it further/differently instead of just repositioning it. Each interior
 * point's position along the line (found by projecting it onto the old
 * start–end line) is preserved, so re-bending is still a deliberate,
 * separate action (dragging an interior point itself). */
export function straightenInteriorPoints(
  points: number[],
  draggedIndex: number,
  newX: number,
  newY: number,
): number[] {
  const next = [...points]
  next[draggedIndex * 2] = newX
  next[draggedIndex * 2 + 1] = newY

  const n = points.length / 2
  if (n <= 2) return next

  const oldStartX = points[0]!
  const oldStartY = points[1]!
  const oldEndX = points[(n - 1) * 2]!
  const oldEndY = points[(n - 1) * 2 + 1]!
  const dx = oldEndX - oldStartX
  const dy = oldEndY - oldStartY
  const lenSq = dx * dx + dy * dy

  const newStartX = draggedIndex === 0 ? newX : oldStartX
  const newStartY = draggedIndex === 0 ? newY : oldStartY
  const newEndX = draggedIndex === n - 1 ? newX : oldEndX
  const newEndY = draggedIndex === n - 1 ? newY : oldEndY

  for (let i = 1; i < n - 1; i++) {
    const px = points[i * 2]!
    const py = points[i * 2 + 1]!
    const t = lenSq > 0 ? ((px - oldStartX) * dx + (py - oldStartY) * dy) / lenSq : i / (n - 1)
    next[i * 2] = newStartX + (newEndX - newStartX) * t
    next[i * 2 + 1] = newStartY + (newEndY - newStartY) * t
  }

  return next
}
