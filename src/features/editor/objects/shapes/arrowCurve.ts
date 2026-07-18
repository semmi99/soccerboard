import type { ArrowData } from '../../types'

/** How far the curve's midpoint is offset perpendicular to the straight
 * line between start and end. Falls back to the offset implied by the
 * arrow's stored points (for curved arrows created before this was a
 * user-adjustable value) or a sensible default. */
export function getCurveOffset(data: ArrowData): number {
  if (typeof data.curveOffset === 'number') return data.curveOffset
  const p = data.points
  if (p.length >= 6) {
    const x0 = p[0]!
    const y0 = p[1]!
    const xm = p[2]!
    const ym = p[3]!
    const x1 = p[p.length - 2]!
    const y1 = p[p.length - 1]!
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const midX = (x0 + x1) / 2
    const midY = (y0 + y1) / 2
    return (xm - midX) * nx + (ym - midY) * ny
  }
  return -40
}

/** Recomputes the 3-point [start, mid, end] array a curved Arrow renders
 * from, using only the start/end anchors plus the current curve offset —
 * so adjusting the offset always bends the same underlying line rather
 * than accumulating drift across edits. */
export function computeCurvedPoints(data: ArrowData): number[] {
  const p = data.points
  if (p.length < 4) return p
  const x0 = p[0]!
  const y0 = p[1]!
  const x1 = p[p.length - 2]!
  const y1 = p[p.length - 1]!
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const offset = getCurveOffset(data)
  const midX = (x0 + x1) / 2 + nx * offset
  const midY = (y0 + y1) / 2 + ny * offset
  return [x0, y0, midX, midY, x1, y1]
}
