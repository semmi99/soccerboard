import { PITCH_LOGICAL } from '../../constants'
import type { ArrowData } from '../../types'

/** Converts an arrow's path length from logical pitch units into meters,
 * using the project's real-world pitch dimensions. The x-axis (logical
 * width) always maps to the pitch length, the y-axis (logical height) to
 * the pitch width — object coordinates are stored in that full-pitch space
 * regardless of orientation/crop (see EditorCanvas), so this holds
 * consistently everywhere an arrow can be drawn. */
export function computeArrowDistanceMeters(
  data: ArrowData,
  pitchLengthM: number,
  pitchWidthM: number,
): number {
  const scaleX = pitchLengthM / PITCH_LOGICAL.width
  const scaleY = pitchWidthM / PITCH_LOGICAL.height

  let meters = 0
  for (let i = 0; i < data.points.length - 2; i += 2) {
    const dx = (data.points[i + 2]! - data.points[i]!) * scaleX
    const dy = (data.points[i + 3]! - data.points[i + 1]!) * scaleY
    meters += Math.hypot(dx, dy)
  }
  return meters
}
