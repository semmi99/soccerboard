import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { ColorSwatchPicker } from '../../../components/ui/ColorSwatchPicker'
import type { TeamKitPatch } from '../../../lib/supabase/squad'
import type { KitPattern } from '../../editor/types'

type Side = 'home' | 'away' | 'gk'

const PATTERN_VALUES: KitPattern[] = ['solid', 'stripes', 'hoops', 'sash', 'split', 'collar']

/** Built-in generic kit templates — an original "9011 Soccer" badge (not a
 * real club's crest) sets the home look with one click; away stays a plain
 * complementary color with no crest, same convention as a linked real
 * team (crest only ever badges the home side, never the opponent). */
const KIT_TEMPLATES: {
  id: string
  nameKey: string
  swatch: string
  home: { pattern: KitPattern; color1: string; color2: string; crestUrl: string }
  away: { pattern: KitPattern; color1: string; color2: string }
  gk: { pattern: KitPattern; color1: string; color2: string }
}[] = [
  {
    id: '9011-blue',
    nameKey: 'kitDesignerModal.templates.blue',
    swatch: '/kit-templates/9011-blue.svg',
    home: { pattern: 'solid', color1: '#0f3d59', color2: '#0f3d59', crestUrl: '/kit-templates/9011-blue.svg' },
    away: { pattern: 'solid', color1: '#f5f5f5', color2: '#f5f5f5' },
    gk: { pattern: 'solid', color1: '#eab308', color2: '#111827' },
  },
  {
    id: '9011-red',
    nameKey: 'kitDesignerModal.templates.red',
    swatch: '/kit-templates/9011-red.svg',
    home: { pattern: 'solid', color1: '#b91c1c', color2: '#b91c1c', crestUrl: '/kit-templates/9011-red.svg' },
    away: { pattern: 'solid', color1: '#f5f5f5', color2: '#f5f5f5' },
    gk: { pattern: 'solid', color1: '#eab308', color2: '#111827' },
  },
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
  allowTemplates,
  onClose,
  onSave,
}: {
  title: string
  description?: string
  initial: TeamKitPatch
  /** Show the built-in "9011 Soccer" template quick-picks — only for a
   * project's own custom kit, never for a real linked team (which has its
   * own separate identity/crest via the Squad page). */
  allowTemplates?: boolean
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
  const [awayCrestUrl, setAwayCrestUrl] = useState(initial.awayCrestUrl ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyTemplate(tpl: (typeof KIT_TEMPLATES)[number]) {
    setHomePattern(tpl.home.pattern)
    setHomeColor1(tpl.home.color1)
    setHomeColor2(tpl.home.color2)
    setAwayPattern(tpl.away.pattern)
    setAwayColor1(tpl.away.color1)
    setAwayColor2(tpl.away.color2)
    setGkPattern(tpl.gk.pattern)
    setGkColor1(tpl.gk.color1)
    setGkColor2(tpl.gk.color2)
    setHomeCrestUrl(tpl.home.crestUrl)
    setAwayCrestUrl(null)
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

        {allowTemplates && (
          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-medium text-white/50">
              {t('kitDesignerModal.templatesLabel')}
            </span>
            <div className="flex gap-2">
              {KIT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="flex flex-1 items-center gap-2 rounded-lg border border-pitch-600 bg-pitch-800/60 p-2 text-left text-xs text-white/70 transition-colors hover:border-violet-accent hover:text-white"
                >
                  <img src={tpl.swatch} alt="" className="h-8 w-8 shrink-0 rounded-full" />
                  {t(tpl.nameKey)}
                </button>
              ))}
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
