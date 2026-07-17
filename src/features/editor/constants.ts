import type { PitchOrientation } from './types'

export const PITCH_LOGICAL = { width: 1000, height: 650 } as const

export const PITCH_STAGE_SIZE: Record<PitchOrientation, { width: number; height: number }> = {
  horizontal: { width: 1000, height: 650 },
  vertical: { width: 650, height: 1000 },
}

export const TEAM_COLORS = {
  home: '#3b82f6',
  away: '#ef4444',
} as const
