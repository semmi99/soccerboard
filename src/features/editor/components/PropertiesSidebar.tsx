import type { ChangeEvent, ReactNode } from 'react'
import { useEditorStore } from '../store/editorStore'
import type {
  ArrowData,
  FrameObject,
  LineStyle,
  PitchDesign,
  PitchOrientation,
  PlayerChipData,
  ShapeData,
  TextData,
} from '../types'
import { Button } from '../../../components/ui/Button'

const LINE_STYLES: { value: LineStyle; label: string }[] = [
  { value: 'solid', label: 'Durchgezogen' },
  { value: 'dashed', label: 'Gestrichelt' },
  { value: 'dotted', label: 'Gepunktet' },
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
  const setPitchDesign = useEditorStore((s) => s.setPitchDesign)
  const setOrientation = useEditorStore((s) => s.setOrientation)
  const selection = useEditorStore((s) => s.selection)
  const activeFrameIndex = useEditorStore((s) => s.activeFrameIndex)
  const frames = useEditorStore((s) => s.frames)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)
  const updateObjectLive = useEditorStore((s) => s.updateObjectLive)
  const removeSelected = useEditorStore((s) => s.removeSelected)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const bringToFront = useEditorStore((s) => s.bringToFront)
  const sendToBack = useEditorStore((s) => s.sendToBack)

  const frame = frames[activeFrameIndex]
  const selectedObject: FrameObject | undefined = frame?.objects.find(
    (o) => o.id === selection[0],
  )

  function updateData<T extends FrameObject>(patch: Partial<T['data']>) {
    if (!selectedObject) return
    updateObjectLive(selectedObject.id, { data: { ...selectedObject.data, ...patch } } as Partial<FrameObject>)
  }

  return (
    <aside className="flex w-64 flex-col gap-5 overflow-y-auto border-l border-pitch-700 bg-pitch-900 p-4">
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
          Feld
        </h3>
        <div className="flex flex-col gap-2">
          <Field label="Design">
            <select
              className={selectClass}
              value={pitchDesign}
              onChange={(e) => setPitchDesign(e.target.value as PitchDesign)}
            >
              <option value="classic_green">Klassisch Grün</option>
              <option value="night_navy">Stadion bei Nacht</option>
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
        </div>
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
      <Field label="Label (optional)">
        <input
          type="text"
          className={inputClass}
          value={data.label}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </Field>
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
        <input
          type="color"
          className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
          value={data.color}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ color: e.target.value })}
        />
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
        <input
          type="color"
          className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
          value={rgbaToHex(data.fill)}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ fill: hexToRgba(e.target.value, 0.25) })}
        />
      </Field>
      <Field label="Rahmenfarbe">
        <input
          type="color"
          className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
          value={data.stroke}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ stroke: e.target.value })}
        />
      </Field>
      <Field label="Rahmenstil">
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
      {data.kind !== 'polygon' && (
        <>
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
        </>
      )}
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
          max={48}
          className="w-full"
          value={data.fontSize}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        />
      </Field>
      <Field label="Farbe">
        <input
          type="color"
          className="h-8 w-full rounded-md border border-pitch-600 bg-pitch-800"
          value={data.color}
          onFocus={onCheckpoint}
          onChange={(e) => onChange({ color: e.target.value })}
        />
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
