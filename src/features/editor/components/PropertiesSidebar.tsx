import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import type {
  ArrowData,
  BallData,
  ConnectorData,
  EquipmentData,
  EquipmentKind,
  FieldCrop,
  FrameObject,
  LineStyle,
  PitchDesign,
  PitchOrientation,
  PlayerChipData,
  QuoteCardData,
  QuoteFontFamily,
  ShapeData,
  TextData,
} from '../types'
import { Button } from '../../../components/ui/Button'
import { TeamSquadPanel } from './TeamSquadPanel'
import { ZoneGridPicker } from './ZoneGridPicker'
import { EQUIPMENT_DEFAULT_COLORS } from '../objects/shapes/Equipment'
import { ColorSwatchPicker } from '../../../components/ui/ColorSwatchPicker'
import { getCurveOffset } from '../objects/shapes/arrowCurve'
import { addArrowMidpoint } from '../objects/shapes/arrowPoints'

const LINE_STYLE_VALUES: LineStyle[] = ['solid', 'dashed', 'dotted']
const ALIGN_VALUES: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right']

const FONT_SIZE_PRESET_VALUES = [
  { key: 'small', size: 14 },
  { key: 'medium', size: 22 },
  { key: 'large', size: 34 },
  { key: 'huge', size: 52 },
] as const

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-white/60">{label}</span>
      {children}
    </label>
  )
}

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'
const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'

export function PropertiesSidebar() {
  const { t } = useTranslation('editor')
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const orientation = useEditorStore((s) => s.orientation)
  const showPitchMarkings = useEditorStore((s) => s.showPitchMarkings)
  const showMovementTrails = useEditorStore((s) => s.showMovementTrails)
  const fieldCrop = useEditorStore((s) => s.fieldCrop)
  const fieldMirrored = useEditorStore((s) => s.fieldMirrored)
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const pitchWidthM = useEditorStore((s) => s.pitchWidthM)
  const setPitchDesign = useEditorStore((s) => s.setPitchDesign)
  const setOrientation = useEditorStore((s) => s.setOrientation)
  const setShowPitchMarkings = useEditorStore((s) => s.setShowPitchMarkings)
  const setShowMovementTrails = useEditorStore((s) => s.setShowMovementTrails)
  const setFieldCrop = useEditorStore((s) => s.setFieldCrop)
  const setFieldMirrored = useEditorStore((s) => s.setFieldMirrored)
  const setPitchLengthM = useEditorStore((s) => s.setPitchLengthM)
  const setPitchWidthM = useEditorStore((s) => s.setPitchWidthM)
  const setLastConnectorColor = useEditorStore((s) => s.setLastConnectorColor)
  const selection = useEditorStore((s) => s.selection)
  const activeFrameIndex = useEditorStore((s) => s.activeFrameIndex)
  const frames = useEditorStore((s) => s.frames)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)
  const updateObjectLive = useEditorStore((s) => s.updateObjectLive)
  const applyEquipmentStyleToAll = useEditorStore((s) => s.applyEquipmentStyleToAll)
  const setSelectedLocked = useEditorStore((s) => s.setSelectedLocked)
  const removeSelected = useEditorStore((s) => s.removeSelected)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const addRatioBadgeFromSelection = useEditorStore((s) => s.addRatioBadgeFromSelection)
  const bringToFront = useEditorStore((s) => s.bringToFront)
  const sendToBack = useEditorStore((s) => s.sendToBack)

  const frame = frames[activeFrameIndex]
  const selectedObject: FrameObject | undefined = frame?.objects.find(
    (o) => o.id === selection[0],
  )

  const [isTeamPanelOpen, setIsTeamPanelOpen] = useState(true)
  const [isFieldPanelOpen, setIsFieldPanelOpen] = useState(true)

  // Selecting an object collapses the Feld/Team & Kader sections so its own
  // properties are reachable without scrolling past both — especially
  // painful on a tablet's shorter viewport. Deliberately one-way: deselecting
  // does NOT force them back open, since that fought a manually-collapsed
  // section every time selection emptied out (e.g. after clicking empty
  // canvas) even though the user never touched the +/− toggle. Only fires on
  // the none→some transition, so re-selecting a different object while one
  // is already selected doesn't re-collapse a section the user just
  // reopened by hand.
  const hadSelectionRef = useRef(false)
  useEffect(() => {
    const hasSelection = selection.length > 0
    if (hasSelection && !hadSelectionRef.current) {
      setIsFieldPanelOpen(false)
      setIsTeamPanelOpen(false)
    }
    hadSelectionRef.current = hasSelection
  }, [selection.length])

  function updateData<T extends FrameObject>(patch: Partial<T['data']>) {
    if (!selectedObject) return
    updateObjectLive(selectedObject.id, { data: { ...selectedObject.data, ...patch } } as Partial<FrameObject>)
  }

  return (
    <aside className="flex w-64 flex-col gap-5 overflow-y-auto border-l border-pitch-700 bg-pitch-900 p-4">
      <div>
        <button
          type="button"
          onClick={() => setIsFieldPanelOpen((v) => !v)}
          className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-white/40 hover:text-white/70"
        >
          {t('properties.field.title')}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base font-bold text-white/70">
            {isFieldPanelOpen ? '−' : '+'}
          </span>
        </button>
        {isFieldPanelOpen && (
        <div className="flex flex-col gap-2">
          <Field label={t('properties.field.design')}>
            <select
              className={selectClass}
              value={pitchDesign}
              onChange={(e) => setPitchDesign(e.target.value as PitchDesign)}
            >
              <option value="classic_green">{t('properties.field.designOptions.classic_green')}</option>
              <option value="night_navy">{t('properties.field.designOptions.night_navy')}</option>
              <option value="dark_orange">{t('properties.field.designOptions.dark_orange')}</option>
              <option value="turquoise">{t('properties.field.designOptions.turquoise')}</option>
              <option value="royal_blue">{t('properties.field.designOptions.royal_blue')}</option>
              <option value="maroon">{t('properties.field.designOptions.maroon')}</option>
              <option value="light_gray">{t('properties.field.designOptions.light_gray')}</option>
              <option value="brand_blue">{t('properties.field.designOptions.brand_blue')}</option>
            </select>
          </Field>
          <Field label={t('properties.field.orientation')}>
            <select
              className={selectClass}
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as PitchOrientation)}
            >
              <option value="vertical">{t('properties.field.orientationOptions.vertical')}</option>
              <option value="horizontal">{t('properties.field.orientationOptions.horizontal')}</option>
            </select>
          </Field>
          <Field label={t('properties.field.crop')}>
            <select
              className={selectClass}
              value={fieldCrop}
              onChange={(e) => setFieldCrop(e.target.value as FieldCrop)}
            >
              <option value="full">{t('properties.field.cropOptions.full')}</option>
              <option value="half">{t('properties.field.cropOptions.half')}</option>
              <option value="three_quarter">{t('properties.field.cropOptions.three_quarter')}</option>
              <option value="third">{t('properties.field.cropOptions.third')}</option>
            </select>
          </Field>
          <label
            className={`flex items-center gap-2 text-xs ${
              fieldCrop === 'full' ? 'text-white/30' : 'text-white/70'
            }`}
          >
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={fieldMirrored}
              disabled={fieldCrop === 'full'}
              onChange={(e) => setFieldMirrored(e.target.checked)}
            />
            {t('properties.field.mirrorField')}
          </label>
          <ZoneGridPicker />
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={showPitchMarkings}
              onChange={(e) => setShowPitchMarkings(e.target.checked)}
            />
            {t('properties.field.showMarkings')}
          </label>
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={showMovementTrails}
              onChange={(e) => setShowMovementTrails(e.target.checked)}
            />
            {t('properties.field.showMovementTrails')}
          </label>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Field label={t('properties.field.lengthM')}>
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} w-full`}
                  value={pitchLengthM}
                  onChange={(e) => setPitchLengthM(Number(e.target.value) || 105)}
                />
              </Field>
            </div>
            <div className="min-w-0 flex-1">
              <Field label={t('properties.field.widthM')}>
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} w-full`}
                  value={pitchWidthM}
                  onChange={(e) => setPitchWidthM(Number(e.target.value) || 68)}
                />
              </Field>
            </div>
          </div>
          <p className="text-[11px] text-white/40">{t('properties.field.dimensionsNote')}</p>
        </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setIsTeamPanelOpen((v) => !v)}
          className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-white/40 hover:text-white/70"
        >
          {t('properties.team.title')}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base font-bold text-white/70">
            {isTeamPanelOpen ? '−' : '+'}
          </span>
        </button>
        {isTeamPanelOpen && <TeamSquadPanel />}
      </div>


      {selection.length > 1 && (
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {t('properties.multiSelect.title', { count: selection.length })}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="secondary" onClick={() => setSelectedLocked(true)}>
              {t('properties.multiSelect.lock')}
            </Button>
            <Button variant="secondary" onClick={() => setSelectedLocked(false)}>
              {t('properties.multiSelect.unlock')}
            </Button>
            <Button variant="secondary" onClick={duplicateSelected}>
              {t('common:actions.duplicate')}
            </Button>
            <Button variant="danger" onClick={removeSelected}>
              {t('common:actions.delete')}
            </Button>
          </div>
          {(frame?.objects.filter((o) => o.objectType === 'player_chip' && selection.includes(o.id)).length ?? 0) >=
            2 && (
            <Button variant="secondary" className="mt-1.5 w-full" onClick={addRatioBadgeFromSelection}>
              {t('properties.multiSelect.createRatioBadge')}
            </Button>
          )}
        </div>
      )}

      {selection.length === 1 && selectedObject && (
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {t('properties.singleSelect.title')}
          </h3>

          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={selectedObject.locked ?? false}
              onChange={(e) =>
                updateObjectLive(selectedObject.id, { locked: e.target.checked } as Partial<FrameObject>)
              }
            />
            {t('properties.singleSelect.locked')}
          </label>

          {selectedObject.objectType === 'player_chip' && (
            <PlayerChipFields
              data={selectedObject.data}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'player_chip' }>>(patch)}
            />
          )}

          {selectedObject.objectType === 'arrow' && (
            <ArrowFields
              data={selectedObject.data}
              rotation={selectedObject.rotation}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'arrow' }>>(patch)}
              onChangeRotation={(rotation) => updateObjectLive(selectedObject.id, { rotation } as Partial<FrameObject>)}
            />
          )}

          {selectedObject.objectType === 'shape' && (
            <ShapeFields
              data={selectedObject.data}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'shape' }>>(patch)}
            />
          )}

          {selectedObject.objectType === 'text' && (
            <TextFields
              data={selectedObject.data}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'text' }>>(patch)}
            />
          )}

          {selectedObject.objectType === 'quote_card' && (
            <QuoteCardFields
              data={selectedObject.data}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'quote_card' }>>(patch)}
            />
          )}

          {selectedObject.objectType === 'training_equipment' && (
            <EquipmentFields
              data={selectedObject.data}
              scale={selectedObject.scale}
              rotation={selectedObject.rotation}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'training_equipment' }>>(patch)}
              onChangeTop={(patch) => updateObjectLive(selectedObject.id, patch as Partial<FrameObject>)}
              onApplyToAll={(patch) => applyEquipmentStyleToAll(selectedObject.data.kind, patch)}
            />
          )}

          {selectedObject.objectType === 'connector' && (
            <ConnectorFields
              data={selectedObject.data}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => {
                if (patch.color) setLastConnectorColor(patch.color)
                updateData<Extract<FrameObject, { objectType: 'connector' }>>(patch)
              }}
            />
          )}

          {selectedObject.objectType === 'ball' && (
            <BallFields
              data={selectedObject.data}
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'ball' }>>(patch)}
            />
          )}

          <div className="flex flex-wrap gap-1.5 border-t border-pitch-700 pt-3">
            <Button variant="secondary" onClick={() => bringToFront(selectedObject.id)}>
              {t('properties.singleSelect.bringToFront')}
            </Button>
            <Button variant="secondary" onClick={() => sendToBack(selectedObject.id)}>
              {t('properties.singleSelect.sendToBack')}
            </Button>
            <Button variant="secondary" onClick={duplicateSelected}>
              {t('common:actions.duplicate')}
            </Button>
            <Button variant="danger" onClick={removeSelected}>
              {t('common:actions.delete')}
            </Button>
          </div>
        </div>
      )}

      {selection.length === 0 && (
        <p className="text-xs text-white/40">{t('properties.emptyState')}</p>
      )}
    </aside>
  )
}

function PlayerChipFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: PlayerChipData
  onCheckpoint: () => void
  onChange: (patch: Partial<PlayerChipData>) => void
}) {
  const { t } = useTranslation('editor')
  const playerPhotos = useEditorStore((s) => s.playerPhotos)
  const photoUrl = data.playerId ? playerPhotos[data.playerId] : undefined
  return (
    <div className="flex flex-col gap-2">
      {data.playerId && (
        <p className="rounded-md bg-violet-accent/10 px-2 py-1.5 text-xs text-violet-accent-bright">
          {t('properties.playerChip.linked')}
        </p>
      )}
      {data.playerId && (
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            className="accent-violet-accent"
            checked={Boolean(data.showPhoto)}
            disabled={!photoUrl}
            onChange={(e) => {
              onCheckpoint()
              onChange({ showPhoto: e.target.checked })
            }}
          />
          {photoUrl ? t('properties.playerChip.showPhoto') : t('properties.playerChip.showPhotoNoPhoto')}
        </label>
      )}
      <Field label={t('properties.playerChip.team')}>
        <select
          className={selectClass}
          value={data.team}
          onChange={(e) => {
            onCheckpoint()
            onChange({ team: e.target.value as 'home' | 'away' })
          }}
        >
          <option value="home">{t('properties.playerChip.teamHome')}</option>
          <option value="away">{t('properties.playerChip.teamAway')}</option>
        </select>
      </Field>
      <Field label={t('properties.playerChip.chipColor')}>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={Boolean(data.color)}
              onChange={(e) => {
                onCheckpoint()
                onChange({ color: e.target.checked ? (data.color ?? '#f97316') : null })
              }}
            />
            {t('properties.playerChip.useCustomColor')}
          </label>
          {data.color && (
            <ColorSwatchPicker
              size="sm"
              value={data.color}
              onChange={(c) => {
                onCheckpoint()
                onChange({ color: c })
              }}
            />
          )}
        </div>
      </Field>
      <Field label={t('properties.playerChip.jerseyNumber')}>
        <input
          type="number"
          className={inputClass}
          value={data.number}
          onFocus={onCheckpoint}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange({ number: Number(e.target.value) })
          }
        />
      </Field>
      <Field label={t('properties.playerChip.chipDisplay')}>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={data.displayText !== undefined}
              onChange={(e) => {
                onCheckpoint()
                onChange({ displayText: e.target.checked ? '' : undefined })
              }}
            />
            {t('properties.playerChip.useCustomText')}
          </label>
          {data.displayText !== undefined && (
            <input
              type="text"
              maxLength={4}
              placeholder={t('properties.playerChip.customTextPlaceholder')}
              className={inputClass}
              value={data.displayText}
              onFocus={onCheckpoint}
              onChange={(e) => onChange({ displayText: e.target.value })}
            />
          )}
        </div>
      </Field>
      <Field label={t('properties.playerChip.numberColor')}>
        <ColorSwatchPicker
          size="sm"
          value={data.numberColor ?? '#ffffff'}
          onChange={(c) => {
            onCheckpoint()
            onChange({ numberColor: c })
          }}
        />
      </Field>
      <Field label={t('properties.playerChip.labelOptional')}>
        <input
          type="text"
          className={inputClass}
          value={data.label}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </Field>
      {data.label && (
        <Field label={t('properties.playerChip.labelColor')}>
          <ColorSwatchPicker
            size="sm"
            value={data.labelColor ?? '#ffffff'}
            onChange={(c) => {
              onCheckpoint()
              onChange({ labelColor: c })
            }}
          />
        </Field>
      )}
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.highlighted ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ highlighted: e.target.checked })
          }}
        />
        {t('properties.playerChip.highlight')}
      </label>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.offsideReference ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ offsideReference: e.target.checked })
          }}
        />
        {t('properties.playerChip.offsideReference')}
      </label>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.offsideTarget ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ offsideTarget: e.target.checked })
          }}
        />
        {t('properties.playerChip.offsideTarget')}
      </label>
    </div>
  )
}

const ROTATION_PRESETS = [0, 90, 180, 270, 360]

function ArrowFields({
  data,
  rotation,
  onCheckpoint,
  onChange,
  onChangeRotation,
}: {
  data: ArrowData
  rotation: number
  onCheckpoint: () => void
  onChange: (patch: Partial<ArrowData>) => void
  onChangeRotation: (rotation: number) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col gap-2">
      <Field label={t('properties.arrow.angle', { deg: Math.round(rotation) })}>
        <div className="flex flex-col gap-1.5">
          <input
            type="range"
            min={0}
            max={360}
            className="w-full"
            value={rotation}
            onFocus={onCheckpoint}
            onChange={(e) => onChangeRotation(Number(e.target.value))}
          />
          <div className="flex gap-1.5">
            {ROTATION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onCheckpoint()
                  onChangeRotation(preset)
                }}
                className={`flex-1 rounded-md border px-1.5 py-1 text-[11px] transition-colors ${
                  rotation === preset
                    ? 'border-violet-accent bg-violet-accent/20 text-white'
                    : 'border-pitch-600 bg-pitch-800 text-white/60 hover:border-violet-accent/50'
                }`}
              >
                {preset}°
              </button>
            ))}
          </div>
        </div>
      </Field>
      <Field label={t('properties.shared.color')}>
        <div className="flex flex-col gap-1.5">
          <ColorSwatchPicker
            size="sm"
            value={data.color}
            onChange={(c) => {
              onCheckpoint()
              onChange({ color: c })
            }}
          />
          <input
            type="color"
            className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
            value={data.color}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </div>
      </Field>
      <Field label={t('properties.shared.lineStyle')}>
        <select
          className={selectClass}
          value={data.lineStyle}
          onChange={(e) => {
            onCheckpoint()
            onChange({ lineStyle: e.target.value as LineStyle })
          }}
        >
          {LINE_STYLE_VALUES.map((v) => (
            <option key={v} value={v}>
              {t(`properties.lineStyles.${v}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('properties.shared.strokeWidth', { px: data.strokeWidth })}>
        <input
          type="range"
          min={1}
          max={10}
          className="w-full"
          value={data.strokeWidth}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
        />
      </Field>
      {data.shape === 'curved' && (
        <Field label={t('properties.arrow.curveRadius', { px: getCurveOffset(data) })}>
          <input
            type="range"
            min={-150}
            max={150}
            step={5}
            className="w-full"
            value={getCurveOffset(data)}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ curveOffset: Number(e.target.value) })}
          />
        </Field>
      )}
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.showArrowhead ?? true}
          onChange={(e) => {
            onCheckpoint()
            onChange({ showArrowhead: e.target.checked })
          }}
        />
        {t('properties.arrow.showArrowhead')}
      </label>
      {(data.showArrowhead ?? true) && (
        <label className="flex items-center gap-2 pl-5 text-xs text-white/70">
          <input
            type="checkbox"
            className="accent-violet-accent"
            checked={data.arrowheadStart ?? false}
            onChange={(e) => {
              onCheckpoint()
              onChange({ arrowheadStart: e.target.checked })
            }}
          />
          {t('properties.arrow.arrowheadBothEnds')}
        </label>
      )}
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.showDistance ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ showDistance: e.target.checked })
          }}
        />
        {t('properties.shared.showDistance')}
      </label>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.glow ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ glow: e.target.checked })
          }}
        />
        {t('properties.shared.glow')}
      </label>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.blocked ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ blocked: e.target.checked })
          }}
        />
        {t('properties.arrow.blocked')}
      </label>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.dribble ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ dribble: e.target.checked })
          }}
        />
        {t('properties.arrow.dribble')}
      </label>
      {data.shape !== 'curved' && (
        <>
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={data.spaceBehind ?? false}
              onChange={(e) => {
                onCheckpoint()
                onChange({ spaceBehind: e.target.checked })
              }}
            />
            {t('properties.arrow.spaceBehind')}
          </label>
          {data.spaceBehind && (
            <label className="flex items-center gap-2 pl-5 text-xs text-white/70">
              <input
                type="checkbox"
                className="accent-violet-accent"
                checked={data.spaceBehindShowLabel ?? true}
                onChange={(e) => {
                  onCheckpoint()
                  onChange({ spaceBehindShowLabel: e.target.checked })
                }}
              />
              {t('properties.arrow.spaceBehindShowLabel')}
            </label>
          )}
        </>
      )}
      {data.shape !== 'curved' && data.bendable !== false && (
        <Button
          variant="secondary"
          onClick={() => {
            onCheckpoint()
            onChange({ points: addArrowMidpoint(data) })
          }}
        >
          {t('properties.arrow.addDragPoint')}
        </Button>
      )}
    </div>
  )
}

function ShapeFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: ShapeData
  onCheckpoint: () => void
  onChange: (patch: Partial<ShapeData>) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col gap-2">
      <Field label={t('properties.shape.fillColor')}>
        <ColorSwatchPicker
          value={rgbaToHex(data.fill)}
          onChange={(color) => {
            onCheckpoint()
            onChange({ fill: hexToRgba(color, 0.4) })
          }}
        />
      </Field>
      <Field label={t('properties.shape.gradientHeading')}>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={Boolean(data.gradientColor)}
              onChange={(e) => {
                onCheckpoint()
                onChange({ gradientColor: e.target.checked ? rgbaToHex(data.fill) : null })
              }}
            />
            {t('properties.shared.gradientInsteadOfFlat')}
          </label>
          {data.gradientColor && (
            <>
              <ColorSwatchPicker
                value={data.gradientColor}
                onChange={(color) => {
                  onCheckpoint()
                  onChange({ gradientColor: color })
                }}
              />
              <select
                className={selectClass}
                value={data.gradientDirection ?? 'radial'}
                onChange={(e) => {
                  onCheckpoint()
                  onChange({ gradientDirection: e.target.value as 'radial' | 'linear' })
                }}
              >
                <option value="radial">{t('properties.shared.gradientRadial')}</option>
                <option value="linear">{t('properties.shared.gradientLinear')}</option>
              </select>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  className="accent-violet-accent"
                  checked={Boolean(data.gradientColor2)}
                  onChange={(e) => {
                    onCheckpoint()
                    onChange({ gradientColor2: e.target.checked ? data.stroke : null })
                  }}
                />
                {t('properties.shared.twoColorGradient')}
              </label>
              {data.gradientColor2 && (
                <ColorSwatchPicker
                  value={data.gradientColor2}
                  onChange={(color) => {
                    onCheckpoint()
                    onChange({ gradientColor2: color })
                  }}
                />
              )}
            </>
          )}
        </div>
      </Field>
      <Field label={t('properties.shared.border')}>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={!data.noBorder}
              onChange={(e) => {
                onCheckpoint()
                onChange({ noBorder: !e.target.checked })
              }}
            />
            {t('properties.shape.showBorder')}
          </label>
          {!data.noBorder && (
            <>
              <ColorSwatchPicker
                value={data.stroke}
                onChange={(color) => {
                  onCheckpoint()
                  onChange({ stroke: color })
                }}
              />
              <select
                className={selectClass}
                value={data.lineStyle}
                onChange={(e) => {
                  onCheckpoint()
                  onChange({ lineStyle: e.target.value as LineStyle })
                }}
              >
                {LINE_STYLE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {t(`properties.lineStyles.${v}`)}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </Field>
      <Field label={t('properties.shape.width', { px: data.width })}>
        <input
          type="range"
          min={20}
          max={300}
          className="w-full"
          value={data.width}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ width: Number(e.target.value) })}
        />
      </Field>
      <Field label={t('properties.shape.height', { px: data.height })}>
        <input
          type="range"
          min={20}
          max={300}
          className="w-full"
          value={data.height}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ height: Number(e.target.value) })}
        />
      </Field>
      <Field label={t('properties.shape.opacity', { percent: Math.round(data.opacity * 100) })}>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          className="w-full"
          value={data.opacity}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </Field>
    </div>
  )
}

function TextFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: TextData
  onCheckpoint: () => void
  onChange: (patch: Partial<TextData>) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col gap-2">
      <Field label={t('properties.text.textLabel')}>
        <input
          type="text"
          className={inputClass}
          value={data.text}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </Field>
      <Field label={t('properties.shared.fontSize', { px: data.fontSize })}>
        <input
          type="range"
          min={10}
          max={64}
          className="w-full"
          value={data.fontSize}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        />
      </Field>
      <div className="flex gap-1.5">
        {FONT_SIZE_PRESET_VALUES.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => {
              onCheckpoint()
              onChange({ fontSize: preset.size })
            }}
            className={`flex-1 rounded-md border px-1.5 py-1 text-[11px] transition-colors ${
              data.fontSize === preset.size
                ? 'border-violet-accent bg-violet-accent/20 text-white'
                : 'border-pitch-600 bg-pitch-800 text-white/60 hover:border-violet-accent/50'
            }`}
          >
            {t(`properties.fontSizePresets.${preset.key}`)}
          </button>
        ))}
      </div>
      <Field label={t('properties.shared.color')}>
        <div className="flex flex-col gap-1.5">
          <ColorSwatchPicker
            size="sm"
            value={data.color}
            onChange={(c) => {
              onCheckpoint()
              onChange({ color: c })
            }}
          />
          <input
            type="color"
            className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
            value={data.color}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </div>
      </Field>
      <Field label={t('properties.text.styleLabel')}>
        <select
          className={selectClass}
          value={data.fontStyle}
          onChange={(e) => {
            onCheckpoint()
            onChange({ fontStyle: e.target.value as TextData['fontStyle'] })
          }}
        >
          <option value="normal">{t('properties.text.styleNormal')}</option>
          <option value="bold">{t('properties.text.styleBold')}</option>
          <option value="italic">{t('properties.text.styleItalic')}</option>
        </select>
      </Field>
      <Field label={t('properties.text.backgroundBadge')}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!data.background}
            onChange={(e) => {
              onCheckpoint()
              onChange({ background: e.target.checked ? (data.background ?? '#ffe100') : undefined })
            }}
          />
          {data.background && (
            <div className="flex flex-1 flex-col gap-1.5">
              <ColorSwatchPicker
                size="sm"
                value={data.background}
                onChange={(c) => {
                  onCheckpoint()
                  onChange({ background: c })
                }}
              />
              <input
                type="color"
                className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
                value={data.background}
                onFocus={onCheckpoint}
                onChange={(e) => onChange({ background: e.target.value })}
              />
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  className="accent-violet-accent"
                  checked={Boolean(data.backgroundGradient)}
                  onChange={(e) => {
                    onCheckpoint()
                    onChange({ backgroundGradient: e.target.checked })
                  }}
                />
                {t('properties.shared.gradientInsteadOfFlat')}
              </label>
              {data.backgroundGradient && (
                <>
                  <select
                    className={selectClass}
                    value={data.backgroundGradientDirection ?? 'radial'}
                    onChange={(e) => {
                      onCheckpoint()
                      onChange({ backgroundGradientDirection: e.target.value as 'radial' | 'linear' })
                    }}
                  >
                    <option value="radial">{t('properties.shared.gradientRadial')}</option>
                    <option value="linear">{t('properties.shared.gradientLinear')}</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      className="accent-violet-accent"
                      checked={Boolean(data.backgroundGradientColor2)}
                      onChange={(e) => {
                        onCheckpoint()
                        onChange({ backgroundGradientColor2: e.target.checked ? data.color : null })
                      }}
                    />
                    {t('properties.shared.twoColorGradient')}
                  </label>
                  {data.backgroundGradientColor2 && (
                    <ColorSwatchPicker
                      size="sm"
                      value={data.backgroundGradientColor2}
                      onChange={(color) => {
                        onCheckpoint()
                        onChange({ backgroundGradientColor2: color })
                      }}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Field>
      <Field label={t('properties.text.shadow')}>
        <input
          type="checkbox"
          checked={!!data.shadow}
          onChange={(e) => {
            onCheckpoint()
            onChange({ shadow: e.target.checked })
          }}
        />
      </Field>
    </div>
  )
}

const QUOTE_FONT_VALUES: QuoteFontFamily[] = [
  'system',
  'georgia',
  'times',
  'arial_black',
  'impact',
  'trebuchet',
  'courier',
]

function FontFamilySelect({
  value,
  onCheckpoint,
  onChange,
}: {
  value: QuoteFontFamily
  onCheckpoint: () => void
  onChange: (v: QuoteFontFamily) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <select
      className={selectClass}
      value={value}
      onChange={(e) => {
        onCheckpoint()
        onChange(e.target.value as QuoteFontFamily)
      }}
    >
      {QUOTE_FONT_VALUES.map((v) => (
        <option key={v} value={v}>
          {t(`properties.quoteCard.fontOptions.${v}`)}
        </option>
      ))}
    </select>
  )
}

function QuoteCardFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: QuoteCardData
  onCheckpoint: () => void
  onChange: (patch: Partial<QuoteCardData>) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-md border border-pitch-700 p-2">
        <span className="text-xs font-medium text-white/60">{t('properties.quoteCard.headingSection')}</span>
        <Field label={t('properties.quoteCard.textLabel')}>
          <input
            type="text"
            className={inputClass}
            value={data.headingText}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ headingText: e.target.value })}
          />
        </Field>
        <Field label={t('properties.shared.fontFamily')}>
          <FontFamilySelect
            value={data.headingFontFamily}
            onCheckpoint={onCheckpoint}
            onChange={(v) => onChange({ headingFontFamily: v })}
          />
        </Field>
        <Field label={t('properties.shared.fontSize', { px: data.headingFontSize })}>
          <input
            type="range"
            min={10}
            max={40}
            className="w-full"
            value={data.headingFontSize}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ headingFontSize: Number(e.target.value) })}
          />
        </Field>
        <Field label={t('properties.shared.color')}>
          <ColorSwatchPicker
            size="sm"
            value={data.headingColor}
            onChange={(c) => {
              onCheckpoint()
              onChange({ headingColor: c })
            }}
          />
        </Field>
        <Field label={t('properties.shared.textAlign')}>
          <div className="flex gap-1.5">
            {ALIGN_VALUES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onCheckpoint()
                  onChange({ headingAlign: v })
                }}
                className={`flex-1 rounded-md border px-1.5 py-1 text-[11px] transition-colors ${
                  (data.headingAlign ?? 'center') === v
                    ? 'border-violet-accent bg-violet-accent/20 text-white'
                    : 'border-pitch-600 bg-pitch-800 text-white/60 hover:border-violet-accent/50'
                }`}
              >
                {t(`properties.shared.textAlignOptions.${v}`)}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            className="accent-violet-accent"
            checked={Boolean(data.headingGradient)}
            onChange={(e) => {
              onCheckpoint()
              onChange({ headingGradient: e.target.checked })
            }}
          />
          {t('properties.shared.gradientInsteadOfFlat')}
        </label>
        {data.headingGradient && (
          <>
            <select
              className={selectClass}
              value={data.headingGradientDirection ?? 'radial'}
              onChange={(e) => {
                onCheckpoint()
                onChange({ headingGradientDirection: e.target.value as 'radial' | 'linear' })
              }}
            >
              <option value="radial">{t('properties.shared.gradientRadial')}</option>
              <option value="linear">{t('properties.shared.gradientLinear')}</option>
            </select>
            <ColorSwatchPicker
              size="sm"
              value={data.headingColor2 ?? data.headingColor}
              onChange={(c) => {
                onCheckpoint()
                onChange({ headingColor2: c })
              }}
            />
          </>
        )}
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            className="accent-violet-accent"
            checked={Boolean(data.headingBoxEnabled)}
            onChange={(e) => {
              onCheckpoint()
              onChange({ headingBoxEnabled: e.target.checked })
            }}
          />
          {t('properties.quoteCard.boxAroundHeading')}
        </label>
        {data.headingBoxEnabled && (
          <div className="flex flex-col gap-1.5 pl-5">
            <Field label={t('properties.quoteCard.boxBackground')}>
              <ColorSwatchPicker
                size="sm"
                value={data.headingBoxBackground ?? '#ffffff'}
                onChange={(c) => {
                  onCheckpoint()
                  onChange({ headingBoxBackground: c })
                }}
              />
            </Field>
            <Field label={t('properties.quoteCard.boxBorder')}>
              <ColorSwatchPicker
                size="sm"
                value={data.headingBoxBorderColor ?? '#ef4444'}
                onChange={(c) => {
                  onCheckpoint()
                  onChange({ headingBoxBorderColor: c })
                }}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-pitch-700 p-2">
        <span className="text-xs font-medium text-white/60">{t('properties.quoteCard.bodySection')}</span>
        <Field label={t('properties.quoteCard.textLabel')}>
          <textarea
            className={`${inputClass} min-h-16`}
            value={data.bodyText}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ bodyText: e.target.value })}
          />
        </Field>
        <Field label={t('properties.shared.fontFamily')}>
          <FontFamilySelect
            value={data.bodyFontFamily}
            onCheckpoint={onCheckpoint}
            onChange={(v) => onChange({ bodyFontFamily: v })}
          />
        </Field>
        <Field label={t('properties.shared.fontSize', { px: data.bodyFontSize })}>
          <input
            type="range"
            min={12}
            max={48}
            className="w-full"
            value={data.bodyFontSize}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ bodyFontSize: Number(e.target.value) })}
          />
        </Field>
        <Field label={t('properties.shared.color')}>
          <ColorSwatchPicker
            size="sm"
            value={data.bodyColor}
            onChange={(c) => {
              onCheckpoint()
              onChange({ bodyColor: c })
            }}
          />
        </Field>
        <Field label={t('properties.shared.textAlign')}>
          <div className="flex gap-1.5">
            {ALIGN_VALUES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onCheckpoint()
                  onChange({ bodyAlign: v })
                }}
                className={`flex-1 rounded-md border px-1.5 py-1 text-[11px] transition-colors ${
                  (data.bodyAlign ?? 'left') === v
                    ? 'border-violet-accent bg-violet-accent/20 text-white'
                    : 'border-pitch-600 bg-pitch-800 text-white/60 hover:border-violet-accent/50'
                }`}
              >
                {t(`properties.shared.textAlignOptions.${v}`)}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-pitch-700 p-2">
        <span className="text-xs font-medium text-white/60">{t('properties.quoteCard.cardSection')}</span>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={!!data.background}
            onChange={(e) => {
              onCheckpoint()
              onChange({ background: e.target.checked ? (data.background ?? '#ffffff') : null })
            }}
          />
          {t('properties.shared.background')}
        </label>
        {data.background && (
          <>
            <ColorSwatchPicker
              size="sm"
              value={data.background}
              onChange={(c) => {
                onCheckpoint()
                onChange({ background: c })
              }}
            />
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                className="accent-violet-accent"
                checked={Boolean(data.backgroundGradient)}
                onChange={(e) => {
                  onCheckpoint()
                  onChange({ backgroundGradient: e.target.checked })
                }}
              />
              {t('properties.shared.gradientInsteadOfFlat')}
            </label>
            {data.backgroundGradient && (
              <>
                <select
                  className={selectClass}
                  value={data.backgroundGradientDirection ?? 'radial'}
                  onChange={(e) => {
                    onCheckpoint()
                    onChange({ backgroundGradientDirection: e.target.value as 'radial' | 'linear' })
                  }}
                >
                  <option value="radial">{t('properties.shared.gradientRadial')}</option>
                  <option value="linear">{t('properties.shared.gradientLinear')}</option>
                </select>
                <ColorSwatchPicker
                  size="sm"
                  value={data.background2 ?? data.background}
                  onChange={(c) => {
                    onCheckpoint()
                    onChange({ background2: c })
                  }}
                />
              </>
            )}
          </>
        )}
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={!!data.borderColor}
            onChange={(e) => {
              onCheckpoint()
              onChange({ borderColor: e.target.checked ? (data.borderColor ?? '#0f172a') : null })
            }}
          />
          {t('properties.shared.border')}
        </label>
        {data.borderColor && (
          <ColorSwatchPicker
            size="sm"
            value={data.borderColor}
            onChange={(c) => {
              onCheckpoint()
              onChange({ borderColor: c })
            }}
          />
        )}
      </div>
    </div>
  )
}

function ConnectorFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: ConnectorData
  onCheckpoint: () => void
  onChange: (patch: Partial<ConnectorData>) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col gap-2">
      <Field label={t('properties.shared.color')}>
        <div className="flex flex-col gap-1.5">
          <ColorSwatchPicker
            size="sm"
            value={data.color}
            onChange={(c) => {
              onCheckpoint()
              onChange({ color: c })
            }}
          />
          <input
            type="color"
            className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
            value={data.color}
            onFocus={onCheckpoint}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </div>
      </Field>
      <Field label={t('properties.shared.lineStyle')}>
        <select
          className={selectClass}
          value={data.lineStyle}
          onChange={(e) => {
            onCheckpoint()
            onChange({ lineStyle: e.target.value as LineStyle })
          }}
        >
          {LINE_STYLE_VALUES.map((v) => (
            <option key={v} value={v}>
              {t(`properties.lineStyles.${v}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('properties.shared.strokeWidth', { px: data.strokeWidth })}>
        <input
          type="range"
          min={1}
          max={6}
          step={0.5}
          className="w-full"
          value={data.strokeWidth}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
        />
      </Field>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.showDistance ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ showDistance: e.target.checked })
          }}
        />
        {t('properties.shared.showDistance')}
      </label>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input
          type="checkbox"
          className="accent-violet-accent"
          checked={data.glow ?? false}
          onChange={(e) => {
            onCheckpoint()
            onChange({ glow: e.target.checked })
          }}
        />
        {t('properties.shared.glow')}
      </label>
    </div>
  )
}

const EQUIPMENT_COLOR_CHOICES = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#111827', '#f5f5f5']

function EquipmentFields({
  data,
  scale,
  rotation,
  onCheckpoint,
  onChange,
  onChangeTop,
  onApplyToAll,
}: {
  data: EquipmentData
  scale: number
  rotation: number
  onCheckpoint: () => void
  onChange: (patch: Partial<EquipmentData>) => void
  onChangeTop: (patch: { scale?: number; rotation?: number }) => void
  onApplyToAll: (patch: { color?: string; scale?: number; rotation?: number }) => void
}) {
  const { t } = useTranslation('editor')
  const color = data.color ?? EQUIPMENT_DEFAULT_COLORS[data.kind as EquipmentKind]
  return (
    <div className="flex flex-col gap-2">
      <Field label={t('properties.shared.color')}>
        <ColorSwatchPicker
          value={color}
          colors={EQUIPMENT_COLOR_CHOICES}
          onChange={(c) => {
            onCheckpoint()
            onChange({ color: c })
          }}
        />
      </Field>
      <Field label={t('properties.equipment.size', { percent: Math.round(scale * 100) })}>
        <input
          type="range"
          min={0.4}
          max={2.5}
          step={0.05}
          className="w-full"
          value={scale}
          onFocus={onCheckpoint}
          onChange={(e) => onChangeTop({ scale: Number(e.target.value) })}
        />
      </Field>
      <Field label={t('properties.equipment.angle', { deg: Math.round(rotation) })}>
        <input
          type="range"
          min={0}
          max={359}
          className="w-full"
          value={rotation}
          onFocus={onCheckpoint}
          onChange={(e) => onChangeTop({ rotation: Number(e.target.value) })}
        />
      </Field>
      <Button
        variant="secondary"
        onClick={() => {
          onCheckpoint()
          onApplyToAll({ color, scale, rotation })
        }}
      >
        {t('properties.equipment.applyToAll')}
      </Button>
    </div>
  )
}

function BallFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: BallData
  onCheckpoint: () => void
  onChange: (patch: Partial<BallData>) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col gap-2">
      <Field label={t('properties.shared.color')}>
        <ColorSwatchPicker
          value={data.color ?? '#f5f5f0'}
          colors={['#f5f5f0', '#ef4444', '#facc15', '#22c55e', '#3b82f6', '#111827']}
          onChange={(c) => {
            onCheckpoint()
            onChange({ color: c })
          }}
        />
      </Field>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function rgbaToHex(rgba: string) {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgba)
  if (!match) return '#7c3aed'
  const [, r, g, b] = match
  return `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`
}
