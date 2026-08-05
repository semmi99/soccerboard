import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import {
  createPitchDesign,
  deletePitchDesign,
  listPitchDesigns,
  type CustomPitchDesign,
} from '../../../lib/supabase/pitchDesigns'
import type { PitchDesign } from '../types'
import { Button } from '../../../components/ui/Button'
import { ColorSwatchPicker } from '../../../components/ui/ColorSwatchPicker'

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'
const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'

const PRESET_DESIGNS: PitchDesign[] = [
  'classic_green',
  'night_navy',
  'dark_orange',
  'turquoise',
  'royal_blue',
  'maroon',
  'light_gray',
  'brand_blue',
]

export function PitchDesignPicker() {
  const { t } = useTranslation('editor')
  const organization = useAuthStore((s) => s.organization)
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const pitchDesignCustomId = useEditorStore((s) => s.pitchDesignCustomId)
  const setPitchDesign = useEditorStore((s) => s.setPitchDesign)
  const setPitchDesignCustomId = useEditorStore((s) => s.setPitchDesignCustomId)
  const setPitchDesignCustomColors = useEditorStore((s) => s.setPitchDesignCustomColors)

  const [designs, setDesigns] = useState<CustomPitchDesign[]>([])
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    if (!organization) return
    listPitchDesigns(organization.id)
      .then(setDesigns)
      .catch(() => setDesigns([]))
  }, [organization])

  // Whichever custom design is selected needs its colors resolved into the
  // store so Pitch (rendered elsewhere) can draw them — mirrors how teamKit
  // is resolved from teamId in TeamSquadPanel.
  useEffect(() => {
    if (pitchDesign !== 'custom' || !pitchDesignCustomId) {
      setPitchDesignCustomColors(null)
      return
    }
    const design = designs.find((d) => d.id === pitchDesignCustomId)
    setPitchDesignCustomColors(
      design ? { grassA: design.grassA, grassB: design.grassB, line: design.lineColor } : null,
    )
  }, [pitchDesign, pitchDesignCustomId, designs, setPitchDesignCustomColors])

  function handleSelectChange(value: string) {
    if (value.startsWith('custom:')) {
      setPitchDesign('custom')
      setPitchDesignCustomId(value.slice('custom:'.length))
    } else {
      setPitchDesign(value as PitchDesign)
      setPitchDesignCustomId(null)
    }
  }

  async function handleDelete() {
    if (!pitchDesignCustomId) return
    if (!window.confirm(t('pitchDesignPicker.deleteConfirm'))) return
    await deletePitchDesign(pitchDesignCustomId)
    setDesigns((ds) => ds.filter((d) => d.id !== pitchDesignCustomId))
    setPitchDesign('classic_green')
    setPitchDesignCustomId(null)
  }

  const selectedValue =
    pitchDesign === 'custom' && pitchDesignCustomId ? `custom:${pitchDesignCustomId}` : pitchDesign

  return (
    <div className="flex flex-col gap-1.5">
      <select className={selectClass} value={selectedValue} onChange={(e) => handleSelectChange(e.target.value)}>
        {PRESET_DESIGNS.map((d) => (
          <option key={d} value={d}>
            {t(`properties.field.designOptions.${d}`)}
          </option>
        ))}
        {designs.length > 0 && (
          <optgroup label={t('pitchDesignPicker.customGroup')}>
            {designs.map((d) => (
              <option key={d.id} value={`custom:${d.id}`}>
                {d.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <div className="flex gap-1.5">
        <Button variant="secondary" className="flex-1" onClick={() => setShowEditor(true)}>
          {t('pitchDesignPicker.addCustom')}
        </Button>
        {pitchDesign === 'custom' && pitchDesignCustomId && (
          <Button variant="danger" onClick={() => void handleDelete()}>
            {t('common:actions.delete')}
          </Button>
        )}
      </div>

      {showEditor && organization && (
        <PitchDesignEditorModal
          orgId={organization.id}
          onClose={() => setShowEditor(false)}
          onCreated={(design) => {
            setDesigns((ds) => [...ds, design])
            setPitchDesign('custom')
            setPitchDesignCustomId(design.id)
          }}
        />
      )}
    </div>
  )
}

function PitchDesignEditorModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string
  onClose: () => void
  onCreated: (design: CustomPitchDesign) => void
}) {
  const { t } = useTranslation('editor')
  const [name, setName] = useState('')
  const [grassA, setGrassA] = useState('#1e7d32')
  const [grassB, setGrassB] = useState('#1a6b2b')
  const [lineColor, setLineColor] = useState('#f8fafc')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      const design = await createPitchDesign({ orgId, name: name.trim(), grassA, grassB, lineColor })
      onCreated(design)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pitchDesignPicker.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  // Portal to <body>: opened from inside the properties sidebar, whose
  // mobile drawer is CSS-transformed — that creates a new containing block
  // for `position: fixed` descendants, so without a portal this modal gets
  // clipped to the sidebar's own width instead of the full viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-pitch-700 bg-pitch-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-sm font-semibold text-white">{t('pitchDesignPicker.editorTitle')}</h2>
        <p className="mb-4 text-xs text-white/50">{t('pitchDesignPicker.editorDescription')}</p>

        <label className="mb-3 flex flex-col gap-1 text-xs">
          <span className="font-medium text-white/60">{t('pitchDesignPicker.nameLabel')}</span>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('pitchDesignPicker.namePlaceholder')}
          />
        </label>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-white/60">{t('pitchDesignPicker.grassALabel')}</span>
            <ColorSwatchPicker size="sm" value={grassA} onChange={setGrassA} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-white/60">{t('pitchDesignPicker.grassBLabel')}</span>
            <ColorSwatchPicker size="sm" value={grassB} onChange={setGrassB} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-white/60">{t('pitchDesignPicker.lineColorLabel')}</span>
            <ColorSwatchPicker size="sm" value={lineColor} onChange={setLineColor} />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="button" loading={isSaving} disabled={!name.trim()} onClick={() => void handleSave()}>
            {t('common:actions.save')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
