export interface FormationPosition {
  role: string
  x: number // 0..1, left to right
  y: number // 0..1, own goal (0) to opponent goal (1)
}

export interface FormationPreset {
  type: string
  name: string
  positions: FormationPosition[]
}

export const PRESET_FORMATIONS: FormationPreset[] = [
  {
    type: '4-4-2',
    name: '4-4-2',
    positions: [
      { role: 'TW', x: 0.5, y: 0.05 },
      { role: 'RV', x: 0.85, y: 0.25 },
      { role: 'IV', x: 0.62, y: 0.2 },
      { role: 'IV', x: 0.38, y: 0.2 },
      { role: 'LV', x: 0.15, y: 0.25 },
      { role: 'RM', x: 0.85, y: 0.55 },
      { role: 'ZM', x: 0.62, y: 0.5 },
      { role: 'ZM', x: 0.38, y: 0.5 },
      { role: 'LM', x: 0.15, y: 0.55 },
      { role: 'ST', x: 0.62, y: 0.8 },
      { role: 'ST', x: 0.38, y: 0.8 },
    ],
  },
  {
    type: '4-3-3',
    name: '4-3-3',
    positions: [
      { role: 'TW', x: 0.5, y: 0.05 },
      { role: 'RV', x: 0.85, y: 0.25 },
      { role: 'IV', x: 0.62, y: 0.2 },
      { role: 'IV', x: 0.38, y: 0.2 },
      { role: 'LV', x: 0.15, y: 0.25 },
      { role: 'ZM', x: 0.7, y: 0.5 },
      { role: 'ZM', x: 0.5, y: 0.45 },
      { role: 'ZM', x: 0.3, y: 0.5 },
      { role: 'RF', x: 0.85, y: 0.75 },
      { role: 'ST', x: 0.5, y: 0.85 },
      { role: 'LF', x: 0.15, y: 0.75 },
    ],
  },
  {
    type: '4-2-3-1',
    name: '4-2-3-1',
    positions: [
      { role: 'TW', x: 0.5, y: 0.05 },
      { role: 'RV', x: 0.85, y: 0.25 },
      { role: 'IV', x: 0.62, y: 0.2 },
      { role: 'IV', x: 0.38, y: 0.2 },
      { role: 'LV', x: 0.15, y: 0.25 },
      { role: 'ZDM', x: 0.62, y: 0.42 },
      { role: 'ZDM', x: 0.38, y: 0.42 },
      { role: 'ZOM', x: 0.5, y: 0.6 },
      { role: 'RF', x: 0.82, y: 0.65 },
      { role: 'LF', x: 0.18, y: 0.65 },
      { role: 'ST', x: 0.5, y: 0.85 },
    ],
  },
  {
    type: '3-5-2',
    name: '3-5-2',
    positions: [
      { role: 'TW', x: 0.5, y: 0.05 },
      { role: 'IV', x: 0.7, y: 0.2 },
      { role: 'IV', x: 0.5, y: 0.18 },
      { role: 'IV', x: 0.3, y: 0.2 },
      { role: 'RM', x: 0.9, y: 0.45 },
      { role: 'ZM', x: 0.65, y: 0.48 },
      { role: 'ZM', x: 0.5, y: 0.42 },
      { role: 'ZM', x: 0.35, y: 0.48 },
      { role: 'LM', x: 0.1, y: 0.45 },
      { role: 'ST', x: 0.6, y: 0.8 },
      { role: 'ST', x: 0.4, y: 0.8 },
    ],
  },
]
