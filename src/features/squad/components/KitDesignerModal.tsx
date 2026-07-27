import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { ColorSwatchPicker } from '../../../components/ui/ColorSwatchPicker'
import type { TeamKitPatch } from '../../../lib/supabase/squad'
import type { KitPattern } from '../../editor/types'

type Side = 'home' | 'away' | 'gk'

const PATTERN_VALUES: KitPattern[] = ['solid', 'stripes', 'hoops', 'sash', 'split', 'collar']

/** Generates an original circular "9011 Soccer" badge (never a real club's
 * crest) as an inline data-URI SVG, recolored to whatever the user picks —
 * a generic branded look for a project's own custom kit, not tied to any
 * fixed preset. */
function crestBadgeDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="${color}" stroke="#f2a73b" stroke-width="3"/>
    <circle cx="50" cy="50" r="41" fill="none" stroke="#ffe100" stroke-width="1" opacity="0.5"/>
    <g transform="translate(50,34)">
      <circle r="11" fill="#ffffff" stroke="${color}" stroke-width="0.8"/>
      <polygon points="0,-5.5 5.2,-1.7 3.2,4.4 -3.2,4.4 -5.2,-1.7" fill="${color}"/>
    </g>
    <text x="50" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="21" fill="#ffe100">9011</text>
    <text x="50" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="9" letter-spacing="2" fill="#ffffff">SOCCER</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

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
  const { t } = useTranslation('editor')
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
        {PATTERN_VALUES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onPattern(v)}
            className={`flex-1 basis-[calc(33.333%-0.25rem)] rounded-md border px-2 py-1.5 text-xs transition-colors ${
              pattern === v
                ? 'border-violet-accent bg-violet-accent/20 text-white'
                : 'border-pitch-600 text-white/60 hover:text-white'
            }`}
          >
            {t(`kitDesignerModal.patterns.${v}`)}
          </button>
        ))}
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-white/50">
          {pattern === 'solid' ? t('kitDesignerModal.color') : t('kitDesignerModal.color1')}
        </span>
        <ColorSwatchPicker value={color1} onChange={onColor1} />
      </div>

      {pattern !== 'solid' && (
        <div>
          <span className="mb-1 block text-xs font-medium text-white/50">{t('kitDesignerModal.color2')}</span>
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
  allowCrestColorPicker,
  onClose,
  onSave,
}: {
  title: string
  description?: string
  initial: TeamKitPatch
  /** Show the "9011 Soccer" badge color picker — only for a project's own
   * custom kit, never for a real linked team (which has its own separate
   * identity/crest via the Squad page). */
  allowCrestColorPicker?: boolean
  onClose: () => void
  onSave: (patch: TeamKitPatch) => Promise<void> | void
}) {
  const { t } = useTranslation(['editor', 'common'])
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
  const [homeCrestUrl, setHomeCrestUrl] = useState(initial.homeCrestUrl ?? null)
  // Away never gets a crest through this modal (see `applyCrestColor`) — only
  // ever set via the separate manual upload in TeamSquadPanel — so it's
  // round-tripped to `onSave` unchanged, with no setter of its own here.
  const [awayCrestUrl] = useState(initial.awayCrestUrl ?? null)
  const [crestColor, setCrestColor] = useState(initial.homeCrestUrl ? initial.homeKitColor1 : '#145f89')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyCrestColor(color: string) {
    setCrestColor(color)
    setHomePattern('solid')
    setHomeColor1(color)
    setHomeColor2(color)
    setHomeCrestUrl(crestBadgeDataUrl(color))
  }

  function removeCrest() {
    setHomeCrestUrl(null)
  }

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
        homeCrestUrl,
        awayCrestUrl,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('kitDesignerModal.saveFailed'))
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
          {description ?? t('kitDesignerModal.defaultDescription')}
        </p>

        {allowCrestColorPicker && (
          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-medium text-white/50">
              {t('kitDesignerModal.crestColorLabel')}
            </span>
            <div className="flex items-center gap-3">
              <img
                src={homeCrestUrl ?? crestBadgeDataUrl(crestColor)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full"
              />
              <div className="flex-1">
                <ColorSwatchPicker value={crestColor} onChange={applyCrestColor} />
              </div>
              {homeCrestUrl && (
                <button
                  type="button"
                  onClick={removeCrest}
                  className="shrink-0 text-xs text-white/40 hover:text-red-400"
                >
                  {t('kitDesignerModal.removeCrest')}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SideEditor
            title={t('kitDesignerModal.home')}
            pattern={side.home.pattern}
            color1={side.home.color1}
            color2={side.home.color2}
            onPattern={setHomePattern}
            onColor1={setHomeColor1}
            onColor2={setHomeColor2}
          />
          <SideEditor
            title={t('kitDesignerModal.away')}
            pattern={side.away.pattern}
            color1={side.away.color1}
            color2={side.away.color2}
            onPattern={setAwayPattern}
            onColor1={setAwayColor1}
            onColor2={setAwayColor2}
          />
          <SideEditor
            title={t('kitDesignerModal.goalkeeper')}
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
            <span>{t('kitDesignerModal.chipSize')}</span>
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
            {t('common:actions.cancel')}
          </Button>
          <Button type="button" loading={isSaving} onClick={() => void handleSave()}>
            {t('common:actions.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
