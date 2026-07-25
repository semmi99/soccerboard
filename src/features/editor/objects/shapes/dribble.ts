/** Turns a straight/bent/curved arrow's spine into a wavy "dribble" path —
 * the squiggly line coaches use to mark a player carrying the ball through
 * cones, matching the wavy sections in tactical-explainer graphics. Treats
 * `points` as a polyline (segments between consecutive points) regardless
 * of whether it came from a straight/bendable arrow or the curved shape's
 * own control points — good enough of an approximation since the wave
 * amplitude dominates the visual over Konva's subtle tension smoothing.
 * The wave tapers to zero near both ends so the arrowhead(s) still point
 * in the path's true direction instead of a wobbly last segment. */
export function computeDribblePoints(points: number[], amplitude: number, wavelength: number): number[] {
  const n = points.length / 2
  if (n < 2) return points

  const segLens: number[] = []
  let total = 0
  for (let i = 0; i < n - 1; i++) {
    const x0 = points[i * 2] ?? 0
    const y0 = points[i * 2 + 1] ?? 0
    const x1 = points[(i + 1) * 2] ?? 0
    const y1 = points[(i + 1) * 2 + 1] ?? 0
    const len = Math.hypot(x1 - x0, y1 - y0)
    segLens.push(len)
    total += len
  }
  if (total < 1) return points

  const step = Math.max(3, wavelength / 8)
  const taperDistance = wavelength * 0.5
  const out: number[] = []
  let segIndex = 0
  let segStart = 0

  for (let travelled = 0; travelled <= total; travelled += step) {
    while (segIndex < segLens.length - 1 && travelled > segStart + (segLens[segIndex] ?? 0)) {
      segStart += segLens[segIndex] ?? 0
      segIndex++
    }
    const segLen = segLens[segIndex] ?? 1
    const t = segLen > 0 ? (travelled - segStart) / segLen : 0
    const x0 = points[segIndex * 2] ?? 0
    const y0 = points[segIndex * 2 + 1] ?? 0
    const x1 = points[(segIndex + 1) * 2] ?? 0
    const y1 = points[(segIndex + 1) * 2 + 1] ?? 0
    const px = x0 + (x1 - x0) * t
    const py = y0 + (y1 - y0) * t
    const dx = x1 - x0
    const dy = y1 - y0
    const segLenSafe = Math.hypot(dx, dy) || 1
    const nx = -dy / segLenSafe
    const ny = dx / segLenSafe

    const taper = Math.min(travelled / taperDistance, (total - travelled) / taperDistance, 1)
    const wave = Math.sin((travelled / wavelength) * Math.PI * 2) * amplitude * Math.max(taper, 0)
    out.push(px + nx * wave, py + ny * wave)
  }

  out.push(points[points.length - 2] ?? 0, points[points.length - 1] ?? 0)
  return out
}
