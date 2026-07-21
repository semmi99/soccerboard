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
  subscription_valid_until?: string | null
  free_override?: boolean | null
}): TierLimits {
  if (org.free_override) return PRO_TIER_LIMITS
  if (org.subscription_tier === 'free') return FREE_TIER_LIMITS
  // Re-verified against the actual last payment on every check (see
  // stripe-webhook's invoice.payment_succeeded handler) rather than trusting
  // subscription_tier alone — protects against a missed/delayed
  // cancellation webhook granting unpaid access past the paid-for window.
  const stillPaid = Boolean(org.subscription_valid_until) && new Date(org.subscription_valid_until!) > new Date()
  return stillPaid ? PRO_TIER_LIMITS : FREE_TIER_LIMITS
}
