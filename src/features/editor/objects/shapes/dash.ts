import type { LineStyle } from '../../types'

export function dashForLineStyle(style: LineStyle): number[] | undefined {
  if (style === 'dashed') return [12, 8]
  if (style === 'dotted') return [2, 7]
  return undefined
}
