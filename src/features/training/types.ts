export const SCHWERPUNKT_OPTIONS = [
  'Technik',
  'Taktik',
  'Athletik',
  'Kondition',
  'Koordination',
] as const
export type Schwerpunkt = (typeof SCHWERPUNKT_OPTIONS)[number]

export const SPIELPHASE_OPTIONS = [
  'Ballbesitz',
  'Ballbesitz-Übergang',
  'Gegen Ballbesitz',
  'Gegen-Ballbesitz-Übergang',
] as const
export type Spielphase = (typeof SPIELPHASE_OPTIONS)[number]

export const PLAYER_STATUS_OPTIONS = ['aktiv', 'individuell', 'krank'] as const
export type PlayerStatus = (typeof PLAYER_STATUS_OPTIONS)[number]
