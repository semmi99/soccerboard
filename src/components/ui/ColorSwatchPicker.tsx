import { useEffect, useState } from 'react'

export const SWATCH_COLORS: { label: string; value: string }[] = [
  { label: 'Schwarz', value: '#111827' },
  { label: 'Blau', value: '#2563eb' },
  { label: 'Dunkelgrün', value: '#14532d' },
  { label: 'Fuchsia', value: '#d946ef' },
  { label: 'Hellblau', value: '#38bdf8' },
  { label: 'Hellgrün', value: '#22c55e' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Rot', value: '#ef4444' },
  { label: 'Weiß', value: '#f8fafc' },
  { label: 'Gelb', value: '#eab308' },
]

const CUSTOM_PALETTE_KEY = 'tacticboard:customColors'
const CUSTOM_PALETTE_MAX = 10

/** A small custom color palette (up to 10 colors), saved in this browser
 * only — not synced across devices, but needs no backend round-trip for
 * what's a minor convenience. Oldest entry drops off once the 11th is
 * added (simple FIFO, no "pin favorites" concept). Shared by every
 * ColorSwatchPicker instance in the app (team kits, shapes, arrows, ...)
 * since a color saved while picking a kit color is just as useful when
 * picking an arrow color later. */
function useCustomColorPalette(): [string[], (color: string) => void, (color: string) => void] {
  const [colors, setColors] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PALETTE_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PALETTE_KEY, JSON.stringify(colors))
    } catch {
      // Storage unavailable (private browsing, quota) — the palette just
      // won't persist across reloads; not worth surfacing to the user.
    }
  }, [colors])

  function addColor(color: string) {
    setColors((prev) => {
      const withoutDupe = prev.filter((c) => c.toLowerCase() !== color.toLowerCase())
      const next = [...withoutDupe, color]
      return next.length > CUSTOM_PALETTE_MAX ? next.slice(next.length - CUSTOM_PALETTE_MAX) : next
    })
  }

  function removeColor(color: string) {
    setColors((prev) => prev.filter((c) => c.toLowerCase() !== color.toLowerCase()))
  }

  return [colors, addColor, removeColor]
}

export function ColorSwatchPicker({
  value,
  onChange,
  size = 'md',
  colors,
}: {
  value: string
  onChange: (color: string) => void
  size?: 'sm' | 'md'
  colors?: string[]
}) {
  const dimension = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'
  const options = colors
    ? colors.map((value) => ({ label: value, value }))
    : SWATCH_COLORS
  const [customColors, addCustomColor, removeCustomColor] = useCustomColorPalette()

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`${dimension} shrink-0 rounded-full border-2 transition-transform ${
            value.toLowerCase() === c.value.toLowerCase()
              ? 'scale-110 border-violet-accent-bright'
              : 'border-white/20 hover:border-white/50'
          }`}
          style={{ backgroundColor: c.value }}
        />
      ))}
      {customColors.map((c) => (
        <div key={c} className="group relative">
          <button
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={`${dimension} shrink-0 rounded-full border-2 transition-transform ${
              value.toLowerCase() === c.toLowerCase()
                ? 'scale-110 border-violet-accent-bright'
                : 'border-white/20 hover:border-white/50'
            }`}
            style={{ backgroundColor: c }}
          />
          <button
            type="button"
            title="Entfernen"
            onClick={(e) => {
              e.stopPropagation()
              removeCustomColor(c)
            }}
            className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-pitch-950 text-[8px] leading-none text-white/70 ring-1 ring-white/30 hover:text-white group-hover:flex"
          >
            ×
          </button>
        </div>
      ))}
      <label
        title="Eigene Farbe wählen & speichern"
        className={`${dimension} relative flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-white/30 text-xs text-white/60 hover:border-white/60 hover:text-white`}
      >
        +
        <input
          type="color"
          value={value}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            onChange(e.target.value)
            addCustomColor(e.target.value)
          }}
        />
      </label>
    </div>
  )
}
