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
