import type { FieldCrop, PitchOrientation } from './types'

export const PITCH_LOGICAL = { width: 1000, height: 650 } as const

export const PITCH_STAGE_SIZE: Record<PitchOrientation, { width: number; height: number }> = {
  horizontal: { width: 1000, height: 650 },
  vertical: { width: 650, height: 1000 },
}

export const TEAM_COLORS = {
  home: '#3b82f6',
  away: '#ef4444',
} as const

const CROP_FRACTIONS: Record<FieldCrop, number> = {
  full: 1,
  half: 0.5,
  three_quarter: 0.75,
  third: 1 / 3,
}

/** How much of the pitch's length (goal-to-goal axis) the crop shows, in
 * logical units. */
export function getCropLength(crop: FieldCrop): number {
  return PITCH_LOGICAL.width * CROP_FRACTIONS[crop]
}

/** Where the visible slice starts along the length axis — crops always
 * show the last portion (the "attacking end"), so the origin is the
 * remainder of the pitch that's cropped away. This is also the shift
 * needed to translate between the cropped stage's local coordinates and
 * the full-pitch coordinate space object positions are stored in. */
export function getCropOriginX(crop: FieldCrop): number {
  return PITCH_LOGICAL.width - getCropLength(crop)
}

/** The stage size for a cropped view: the length axis (width for
 * horizontal orientation, height for vertical, since vertical rotates the
 * pitch 90°) is shrunk to the crop's length; breadth stays full. */
export function getCroppedStageSize(
  orientation: PitchOrientation,
  crop: FieldCrop,
): { width: number; height: number } {
  const cropLength = getCropLength(crop)
  return orientation === 'horizontal'
    ? { width: cropLength, height: PITCH_LOGICAL.height }
    : { width: PITCH_LOGICAL.height, height: cropLength }
}
