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
  return (
    <div className="flex flex-wrap gap-1.5">
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
    </div>
  )
}
