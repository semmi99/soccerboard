import type { ReactNode } from 'react'

/** Visually flags a spot where real business/legal data still needs to be
 * filled in before this page goes live — deliberately eye-catching so it
 * can't be missed and accidentally published as-is. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-dashed border-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 text-amber-300">
      [{children}]
    </span>
  )
}
