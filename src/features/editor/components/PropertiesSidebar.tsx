import { useState, type ChangeEvent, type ReactNode } from 'react'
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

const LINE_STYLES: { value: LineStyle; label: string }[] = [
  { value: 'solid', label: 'Durchgezogen' },
  { value: 'dashed', label: 'Gestrichelt' },
  { value: 'dotted', label: 'Gepunktet' },
]

const FONT_SIZE_PRESETS = [
  { label: 'Klein', size: 14 },
  { label: 'Mittel', size: 22 },
  { label: 'Groß', size: 34 },
  { label: 'Riesig', size: 52 },
]

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
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const orientation = useEditorStore((s) => s.orientation)
  const showPitchMarkings = useEditorStore((s) => s.showPitchMarkings)
  const fieldCrop = useEditorStore((s) => s.fieldCrop)
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const pitchWidthM = useEditorStore((s) => s.pitchWidthM)
  const setPitchDesign = useEditorStore((s) => s.setPitchDesign)
  const setOrientation = useEditorStore((s) => s.setOrientation)
  const setShowPitchMarkings = useEditorStore((s) => s.setShowPitchMarkings)
  const setFieldCrop = useEditorStore((s) => s.setFieldCrop)
  const setPitchLengthM = useEditorStore((s) => s.setPitchLengthM)
  const setPitchWidthM = useEditorStore((s) => s.setPitchWidthM)
  const setLastConnectorColor = useEditorStore((s) => s.setLastConnectorColor)
  const selection = useEditorStore((s) => s.selection)
  const activeFrameIndex = useEditorStore((s) => s.activeFrameIndex)
  const frames = useEditorStore((s) => s.frames)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)
  const updateObjectLive = useEditorStore((s) => s.updateObjectLive)
  const applyEquipmentStyleToAll = useEditorStore((s) => s.applyEquipmentStyleToAll)
  const removeSelected = useEditorStore((s) => s.removeSelected)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const bringToFront = useEditorStore((s) => s.bringToFront)
  const sendToBack = useEditorStore((s) => s.sendToBack)

  const frame = frames[activeFrameIndex]
  const selectedObject: FrameObject | undefined = frame?.objects.find(
    (o) => o.id === selection[0],
  )

  const [isTeamPanelOpen, setIsTeamPanelOpen] = useState(true)
  const [isFieldPanelOpen, setIsFieldPanelOpen] = useState(true)

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
          Feld
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base font-bold text-white/70">
            {isFieldPanelOpen ? '−' : '+'}
          </span>
        </button>
        {isFieldPanelOpen && (
        <div className="flex flex-col gap-2">
          <Field label="Design">
            <select
              className={selectClass}
              value={pitchDesign}
              onChange={(e) => setPitchDesign(e.target.value as PitchDesign)}
            >
              <option value="classic_green">Klassisch Grün</option>
              <option value="night_navy">Stadion bei Nacht</option>
              <option value="dark_orange">Dunkel (Orange)</option>
              <option value="turquoise">Türkis</option>
              <option value="royal_blue">Königsblau</option>
              <option value="maroon">Bordeaux</option>
              <option value="light_gray">Hellgrau (Druck)</option>
              <option value="brand_blue">9011 Soccer Blau</option>
            </select>
          </Field>
          <Field label="Ausrichtung">
            <select
              className={selectClass}
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as PitchOrientation)}
            >
              <option value="vertical">Hochformat</option>
              <option value="horizontal">Querformat</option>
            </select>
          </Field>
          <Field label="Feldausschnitt">
            <select
              className={selectClass}
              value={fieldCrop}
              onChange={(e) => setFieldCrop(e.target.value as FieldCrop)}
            >
              <option value="full">Ganzes Feld</option>
              <option value="half">Hälfte</option>
              <option value="three_quarter">Dreiviertel</option>
              <option value="third">Letztes Drittel (Eckball)</option>
            </select>
          </Field>
          <ZoneGridPicker />
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="accent-violet-accent"
              checked={showPitchMarkings}
              onChange={(e) => setShowPitchMarkings(e.target.checked)}
            />
            Spielfeldmarkierungen anzeigen
          </label>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Field label="Länge (m)">
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
              <Field label="Breite (m)">
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
          <p className="text-[11px] text-white/40">
            Echte Feldmaße — wird genutzt, um Pass-/Laufdistanzen in Metern anzuzeigen.
          </p>
        </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setIsTeamPanelOpen((v) => !v)}
          className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-white/40 hover:text-white/70"
        >
          Team &amp; Kader
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base font-bold text-white/70">
            {isTeamPanelOpen ? '−' : '+'}
          </span>
        </button>
        {isTeamPanelOpen && <TeamSquadPanel />}
      </div>

      {selection.length > 1 && (
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {selection.length} Objekte ausgewählt
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="secondary" onClick={duplicateSelected}>
              Duplizieren
            </Button>
            <Button variant="danger" onClick={removeSelected}>
              Löschen
            </Button>
          </div>
        </div>
      )}

      {selection.length === 1 && selectedObject && (
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Eigenschaften
          </h3>

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
              onCheckpoint={beginHistoryCheckpoint}
              onChange={(patch) => updateData<Extract<FrameObject, { objectType: 'arrow' }>>(patch)}
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
              Nach vorne
            </Button>
            <Button variant="secondary" onClick={() => sendToBack(selectedObject.id)}>
              Nach hinten
            </Button>
            <Button variant="secondary" onClick={duplicateSelected}>
              Duplizieren
            </Button>
            <Button variant="danger" onClick={removeSelected}>
              Löschen
            </Button>
          </div>
        </div>
      )}

      {selection.length === 0 && (
        <p className="text-xs text-white/40">
          Wähle ein Objekt auf dem Feld aus, um seine Eigenschaften zu bearbeiten.
        </p>
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
  return (
    <div className="flex flex-col gap-2">
      {data.playerId && (
        <p className="rounded-md bg-violet-accent/10 px-2 py-1.5 text-xs text-violet-accent-bright">
          Verknüpft mit Kaderspieler
        </p>
      )}
      <Field label="Team">
        <select
          className={selectClass}
          value={data.team}
          onChange={(e) => {
            onCheckpoint()
            onChange({ team: e.target.value as 'home' | 'away' })
          }}
        >
          <option value="home">Heim</option>
          <option value="away">Auswärts</option>
        </select>
      </Field>
      <Field label="Rückennummer">
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
      <Field label="Anzeige im Chip">
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
            Statt Rückennummer eigenen Text zeigen
          </label>
          {data.displayText !== undefined && (
            <input
              type="text"
              maxLength={4}
              placeholder="z.B. A, leer lassen für nichts"
              className={inputClass}
              value={data.displayText}
              onFocus={onCheckpoint}
              onChange={(e) => onChange({ displayText: e.target.value })}
            />
          )}
        </div>
      </Field>
      <Field label="Label (optional)">
        <input
          type="text"
          className={inputClass}
          value={data.label}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </Field>
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
        Hervorheben (blinkt in diesem Frame)
      </label>
    </div>
  )
}

function ArrowFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: ArrowData
  onCheckpoint: () => void
  onChange: (patch: Partial<ArrowData>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Field label="Farbe">
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
      <Field label="Linienstil">
        <select
          className={selectClass}
          value={data.lineStyle}
          onChange={(e) => {
            onCheckpoint()
            onChange({ lineStyle: e.target.value as LineStyle })
          }}
        >
          {LINE_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Strichstärke (${data.strokeWidth}px)`}>
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
        <Field label={`Kurvenradius (${getCurveOffset(data)}px)`}>
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
        Pfeilspitze anzeigen
      </label>
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
        Distanz anzeigen (m)
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
        Leuchteffekt (weicher Farbkanal entlang der Linie)
      </label>
      {data.shape !== 'curved' && data.bendable !== false && (
        <Button
          variant="secondary"
          onClick={() => {
            onCheckpoint()
            onChange({ points: addArrowMidpoint(data) })
          }}
        >
          Ziehpunkt hinzufügen
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
  return (
    <div className="flex flex-col gap-2">
      <Field label="Füllfarbe">
        <ColorSwatchPicker
          value={rgbaToHex(data.fill)}
          onChange={(color) => {
            onCheckpoint()
            onChange({ fill: hexToRgba(color, 0.4) })
          }}
        />
      </Field>
      <Field label="Farbverlauf (z.B. Heatmap)">
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
            Statt flacher Füllfarbe ein Farbverlauf von der Mitte nach außen
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
                <option value="radial">Radial (von der Mitte)</option>
                <option value="linear">Linear (links nach rechts)</option>
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
                Zweifarbiger Verlauf (statt Verblassen ins Transparente)
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
      <Field label="Rahmen">
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
            Rahmen anzeigen
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
                {LINE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </Field>
      <Field label={`Breite (${data.width}px)`}>
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
      <Field label={`Höhe (${data.height}px)`}>
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
      <Field label={`Deckkraft (${Math.round(data.opacity * 100)}%)`}>
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
  return (
    <div className="flex flex-col gap-2">
      <Field label="Text">
        <input
          type="text"
          className={inputClass}
          value={data.text}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </Field>
      <Field label={`Schriftgröße (${data.fontSize}px)`}>
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
        {FONT_SIZE_PRESETS.map((preset) => (
          <button
            key={preset.label}
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
            {preset.label}
          </button>
        ))}
      </div>
      <Field label="Farbe">
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
      <Field label="Stil">
        <select
          className={selectClass}
          value={data.fontStyle}
          onChange={(e) => {
            onCheckpoint()
            onChange({ fontStyle: e.target.value as TextData['fontStyle'] })
          }}
        >
          <option value="normal">Normal</option>
          <option value="bold">Fett</option>
          <option value="italic">Kursiv</option>
        </select>
      </Field>
      <Field label="Hintergrund (Badge-Stil)">
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
                Farbverlauf statt flacher Füllung
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
                    <option value="radial">Radial (von der Mitte)</option>
                    <option value="linear">Linear (links nach rechts)</option>
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
                    Zweifarbiger Verlauf (statt Verblassen ins Transparente)
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
      <Field label="Schatten (Lesbarkeit auf dem Feld)">
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

function ConnectorFields({
  data,
  onCheckpoint,
  onChange,
}: {
  data: ConnectorData
  onCheckpoint: () => void
  onChange: (patch: Partial<ConnectorData>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Field label="Farbe">
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
      <Field label="Linienstil">
        <select
          className={selectClass}
          value={data.lineStyle}
          onChange={(e) => {
            onCheckpoint()
            onChange({ lineStyle: e.target.value as LineStyle })
          }}
        >
          {LINE_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Strichstärke (${data.strokeWidth}px)`}>
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
        Distanz anzeigen (m)
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
        Leuchteffekt (weicher Farbkanal entlang der Linie)
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
  const color = data.color ?? EQUIPMENT_DEFAULT_COLORS[data.kind as EquipmentKind]
  return (
    <div className="flex flex-col gap-2">
      <Field label="Farbe">
        <ColorSwatchPicker
          value={color}
          colors={EQUIPMENT_COLOR_CHOICES}
          onChange={(c) => {
            onCheckpoint()
            onChange({ color: c })
          }}
        />
      </Field>
      <Field label={`Größe (${Math.round(scale * 100)}%)`}>
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
      <Field label={`Winkel (${Math.round(rotation)}°)`}>
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
        Auf alle dieser Art anwenden
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
  return (
    <div className="flex flex-col gap-2">
      <Field label="Farbe">
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
