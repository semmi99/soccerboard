import { computePathDistanceMeters } from '../objects/shapes/arrowDistance'
import type { EditorFrame } from '../types'

export interface SequenceStats {
  frameCount: number
  passCount: number
  totalDistanceM: number
  /** Home-vs-away player count in the first and last frame — the recap
   * card's "before/after" comparison (e.g. a numbers-down moment at the
   * start recovering to numbers-even by the end). */
  startRatio: { home: number; away: number }
  endRatio: { home: number; away: number }
}

function countByTeam(frame: EditorFrame | undefined): { home: number; away: number } {
  if (!frame) return { home: 0, away: 0 }
  let home = 0
  let away = 0
  for (const obj of frame.objects) {
    if (obj.objectType !== 'player_chip') continue
    if (obj.data.team === 'home') home++
    else away++
  }
  return { home, away }
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
  return {
    frameCount: frames.length,
    passCount: distanceById.size,
    totalDistanceM,
    startRatio: countByTeam(frames[0]),
    endRatio: countByTeam(frames[frames.length - 1]),
  }
}
