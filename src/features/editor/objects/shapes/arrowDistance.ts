import { PITCH_LOGICAL } from '../../constants'

/** Converts a flat [x1,y1,x2,y2,...] path's length from logical pitch units
 * into meters, using the project's real-world pitch dimensions. The x-axis
 * (logical width) always maps to the pitch length, the y-axis (logical
 * height) to the pitch width — object coordinates are stored in that
 * full-pitch space regardless of orientation/crop (see EditorCanvas), so
 * this holds consistently everywhere a path can be drawn (arrows,
 * connectors, ...).
 *
 * `scale` is the object's own resize factor (Transformer/scale handle) — an
 * arrow's raw `data.points` are in unscaled local units, but what's actually
 * drawn (and what the real-world distance should reflect) is that multiplied
 * by the object's scale, same as Konva renders it. Connectors don't have a
 * scale of their own, so it defaults to 1. */
export function computePathDistanceMeters(
  points: number[],
  pitchLengthM: number,
  pitchWidthM: number,
  scale = 1,
): number {
  const scaleX = (pitchLengthM / PITCH_LOGICAL.width) * scale
  const scaleY = (pitchWidthM / PITCH_LOGICAL.height) * scale

  let meters = 0
  for (let i = 0; i < points.length - 2; i += 2) {
    const dx = (points[i + 2]! - points[i]!) * scaleX
    const dy = (points[i + 3]! - points[i + 1]!) * scaleY
    meters += Math.hypot(dx, dy)
  }
  return meters
}

/** Centroid of a flat [x1,y1,x2,y2,...] point path — used to place a
 * distance label near the middle of an arrow or connector. */
export function midpointOf(points: number[]): { x: number; y: number } {
  let sx = 0
  let sy = 0
  const n = points.length / 2
  for (let i = 0; i < points.length; i += 2) {
    sx += points[i]!
    sy += points[i + 1]!
  }
  return { x: sx / n, y: sy / n }
}
