import { computePathDistanceMeters } from '../objects/shapes/arrowDistance'
import type { EditorFrame } from '../types'

export interface SequenceStats {
  frameCount: number
  passCount: number
  totalDistanceM: number
}

/** Rolls a whole frame sequence up into a few headline numbers for the
 * video export's closing recap card — a pass/run drawn across several
 * frames (same arrow id, kept for a smooth tween) is only counted once,
 * using its most recent shape. */
export function computeSequenceStats(
  frames: EditorFrame[],
  pitchLengthM: number,
  pitchWidthM: number,
): SequenceStats {
  const distanceById = new Map<string, number>()
  for (const frame of frames) {
    for (const obj of frame.objects) {
      if (obj.objectType !== 'arrow') continue
      const meters = computePathDistanceMeters(obj.data.points, pitchLengthM, pitchWidthM, obj.scale)
      distanceById.set(obj.id, meters)
    }
  }
  const totalDistanceM = [...distanceById.values()].reduce((a, b) => a + b, 0)
  return { frameCount: frames.length, passCount: distanceById.size, totalDistanceM }
}
