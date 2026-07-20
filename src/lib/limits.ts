export interface TierLimits {
  maxProjects: number
  maxFrames: number
  maxExportPixelRatio: number
}

export const FREE_TIER_LIMITS: TierLimits = {
  maxProjects: 1,
  maxFrames: 4,
  maxExportPixelRatio: 2, // ~1080p on a standard pitch canvas size
}

export const PRO_TIER_LIMITS: TierLimits = {
  maxProjects: Infinity,
  maxFrames: Infinity,
  maxExportPixelRatio: 4, // ~4K
}

export function limitsForTier(org: {
  subscription_tier: string
  free_override?: boolean | null
}): TierLimits {
  if (org.free_override) return PRO_TIER_LIMITS
  return org.subscription_tier === 'free' ? FREE_TIER_LIMITS : PRO_TIER_LIMITS
}
