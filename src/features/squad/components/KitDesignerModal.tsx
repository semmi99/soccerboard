import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { updateTeamKit, type Team, type TeamKitPatch } from '../../../lib/supabase/squad'

type KitPattern = 'solid' | 'stripes' | 'hoops'
type Side = 'home' | 'away'

const KIT_COLORS: { label: string; value: string }[] = [
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

const PATTERNS: { id: KitPattern; label: string }[] = [
  { id: 'solid', label: 'Einfarbig' },
  { id: 'stripes', label: 'Streifen' },
  { id: 'hoops', label: 'Ringel' },
]

function kitPreviewStyle(pattern: KitPattern, color1: string, color2: string): React.CSSProperties {
  if (pattern === 'solid') return { background: color1 }
  if (pattern === 'stripes') {
    return {
      background: `repeating-linear-gradient(90deg, ${color1} 0 8px, ${color2} 8px 16px)`,
    }
  }
  return {
    background: `repeating-linear-gradient(0deg, ${color1} 0 8px, ${color2} 8px 16px)`,
  }
}

function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {KIT_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`h-7 w-7 shrink-0 rounded-full border-2 transition-transform ${
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

function SideEditor({
  title,
  pattern,
  color1,
  color2,
  onPattern,
  onColor1,
  onColor2,
}: {
  title: string
  pattern: KitPattern
  color1: string
  color2: string
  onPattern: (p: KitPattern) => void
  onColor1: (c: string) => void
  onColor2: (c: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-pitch-700 bg-pitch-800/60 p-3.5">
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 shrink-0 rounded-full border-2 border-white/30"
          style={kitPreviewStyle(pattern, color1, color2)}
        />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>

      <div className="flex gap-1.5">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPattern(p.id)}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
              pattern === p.id
                ? 'border-violet-accent bg-violet-accent/20 text-white'
                : 'border-pitch-600 text-white/60 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-white/50">
          {pattern === 'solid' ? 'Farbe' : 'Farbe 1'}
        </span>
        <ColorSwatchPicker value={color1} onChange={onColor1} />
      </div>

      {pattern !== 'solid' && (
        <div>
          <span className="mb-1 block text-xs font-medium text-white/50">Farbe 2</span>
          <ColorSwatchPicker value={color2} onChange={onColor2} />
        </div>
      )}
    </div>
  )
}

export function KitDesignerModal({
  team,
  onClose,
  onSaved,
}: {
  team: Team
  onClose: () => void
  onSaved: (team: Team) => void
}) {
  const [homePattern, setHomePattern] = useState(team.home_kit_pattern as KitPattern)
  const [homeColor1, setHomeColor1] = useState(team.home_kit_color1)
  const [homeColor2, setHomeColor2] = useState(team.home_kit_color2)
  const [awayPattern, setAwayPattern] = useState(team.away_kit_pattern as KitPattern)
  const [awayColor1, setAwayColor1] = useState(team.away_kit_color1)
  const [awayColor2, setAwayColor2] = useState(team.away_kit_color2)
  const [chipScale, setChipScale] = useState(team.chip_scale)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      const patch: TeamKitPatch = {
        homeKitPattern: homePattern,
        homeKitColor1: homeColor1,
        homeKitColor2: homeColor2,
        awayKitPattern: awayPattern,
        awayKitColor1: awayColor1,
        awayKitColor2: awayColor2,
        chipScale,
      }
      const updated = await updateTeamKit(team.id, patch)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setIsSaving(false)
    }
  }

  const side: Record<Side, { pattern: KitPattern; color1: string; color2: string }> = {
    home: { pattern: homePattern, color1: homeColor1, color2: homeColor2 },
    away: { pattern: awayPattern, color1: awayColor1, color2: awayColor2 },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-pitch-700 bg-pitch-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-sm font-semibold text-white">Kit-Design: {team.name}</h2>
        <p className="mb-4 text-xs text-white/50">
          Farbe &amp; Muster für Heim- und Auswärts-Spieler-Chips dieses Teams.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SideEditor
            title="Heim"
            pattern={side.home.pattern}
            color1={side.home.color1}
            color2={side.home.color2}
            onPattern={setHomePattern}
            onColor1={setHomeColor1}
            onColor2={setHomeColor2}
          />
          <SideEditor
            title="Auswärts"
            pattern={side.away.pattern}
            color1={side.away.color1}
            color2={side.away.color2}
            onPattern={setAwayPattern}
            onColor1={setAwayColor1}
            onColor2={setAwayColor2}
          />
        </div>

        <label className="mt-4 flex flex-col gap-1.5 text-sm">
          <span className="flex justify-between font-medium text-white/70">
            <span>Chip-Größe</span>
            <span className="text-white/50">{chipScale.toFixed(2)}×</span>
          </span>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.05}
            value={chipScale}
            onChange={(e) => setChipScale(Number(e.target.value))}
            className="accent-violet-accent"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button type="button" loading={isSaving} onClick={() => void handleSave()}>
            Speichern
          </Button>
        </div>
      </div>
    </div>
  )
}
