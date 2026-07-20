import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { ColorSwatchPicker } from '../../../components/ui/ColorSwatchPicker'
import type { TeamKitPatch } from '../../../lib/supabase/squad'
import type { KitPattern } from '../../editor/types'

type Side = 'home' | 'away' | 'gk'

const PATTERNS: { id: KitPattern; label: string }[] = [
  { id: 'solid', label: 'Einfarbig' },
  { id: 'stripes', label: 'Streifen' },
  { id: 'hoops', label: 'Ringel' },
  { id: 'sash', label: 'Schrägband' },
  { id: 'split', label: 'Geteilt' },
  { id: 'collar', label: 'Kragen' },
]

function kitPreviewStyle(pattern: KitPattern, color1: string, color2: string): React.CSSProperties {
  switch (pattern) {
    case 'solid':
      return { background: color1 }
    case 'stripes':
      return { background: `repeating-linear-gradient(90deg, ${color1} 0 8px, ${color2} 8px 16px)` }
    case 'hoops':
      return { background: `repeating-linear-gradient(0deg, ${color1} 0 8px, ${color2} 8px 16px)` }
    case 'sash':
      return {
        background: `linear-gradient(135deg, ${color1} 0%, ${color1} 38%, ${color2} 38%, ${color2} 62%, ${color1} 62%, ${color1} 100%)`,
      }
    case 'split':
      return { background: `linear-gradient(90deg, ${color1} 50%, ${color2} 50%)` }
    case 'collar':
      return {
        background: `linear-gradient(180deg, ${color2} 0%, ${color2} 28%, ${color1} 28%, ${color1} 100%)`,
      }
  }
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

      <div className="flex flex-wrap gap-1.5">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPattern(p.id)}
            className={`flex-1 basis-[calc(33.333%-0.25rem)] rounded-md border px-2 py-1.5 text-xs transition-colors ${
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
  title,
  description,
  initial,
  onClose,
  onSave,
}: {
  title: string
  description?: string
  initial: TeamKitPatch
  onClose: () => void
  onSave: (patch: TeamKitPatch) => Promise<void> | void
}) {
  const [homePattern, setHomePattern] = useState(initial.homeKitPattern)
  const [homeColor1, setHomeColor1] = useState(initial.homeKitColor1)
  const [homeColor2, setHomeColor2] = useState(initial.homeKitColor2)
  const [awayPattern, setAwayPattern] = useState(initial.awayKitPattern)
  const [awayColor1, setAwayColor1] = useState(initial.awayKitColor1)
  const [awayColor2, setAwayColor2] = useState(initial.awayKitColor2)
  const [gkPattern, setGkPattern] = useState(initial.gkKitPattern)
  const [gkColor1, setGkColor1] = useState(initial.gkKitColor1)
  const [gkColor2, setGkColor2] = useState(initial.gkKitColor2)
  const [chipScale, setChipScale] = useState(initial.chipScale)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      await onSave({
        homeKitPattern: homePattern,
        homeKitColor1: homeColor1,
        homeKitColor2: homeColor2,
        awayKitPattern: awayPattern,
        awayKitColor1: awayColor1,
        awayKitColor2: awayColor2,
        gkKitPattern: gkPattern,
        gkKitColor1: gkColor1,
        gkKitColor2: gkColor2,
        chipScale,
      })
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
    gk: { pattern: gkPattern, color1: gkColor1, color2: gkColor2 },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-pitch-700 bg-pitch-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-sm font-semibold text-white">{title}</h2>
        <p className="mb-4 text-xs text-white/50">
          {description ?? 'Farbe & Muster für Heim-, Auswärts- und Torwart-Spieler-Chips.'}
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
          <SideEditor
            title="Torwart"
            pattern={side.gk.pattern}
            color1={side.gk.color1}
            color2={side.gk.color2}
            onPattern={setGkPattern}
            onColor1={setGkColor1}
            onColor2={setGkColor2}
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
