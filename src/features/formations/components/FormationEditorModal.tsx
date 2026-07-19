import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import type { FormationPosition } from '../presets'

const VIEW_W = 100
const VIEW_H = 140
const DRAG_THRESHOLD = 3 // px in viewBox units; below this a pointer up counts as a click, not a drag

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export function FormationEditorModal({
  title,
  defaultName,
  defaultFormationType,
  initialPositions,
  onCancel,
  onSave,
}: {
  title: string
  defaultName: string
  defaultFormationType: string
  initialPositions: FormationPosition[]
  onCancel: () => void
  onSave: (input: { name: string; formationType: string; positions: FormationPosition[] }) => Promise<void>
}) {
  const [name, setName] = useState(defaultName)
  const [positions, setPositions] = useState<FormationPosition[]>(initialPositions)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const dragState = useRef<{ index: number; startX: number; startY: number; moved: boolean } | null>(null)

  function toViewBoxPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * VIEW_W
    const y = ((clientY - rect.top) / rect.height) * VIEW_H
    return { x, y }
  }

  function handlePitchClick(e: ReactPointerEvent<SVGSVGElement>) {
    // A drag that just finished on a marker already handled itself via the
    // marker's own pointerup; this only fires for clicks on empty pitch.
    if (dragState.current) return
    const { x, y } = toViewBoxPoint(e.clientX, e.clientY)
    const position: FormationPosition = {
      role: String(positions.length + 1),
      x: clamp01(x / VIEW_W),
      y: clamp01(1 - y / VIEW_H),
    }
    setPositions((prev) => [...prev, position])
    setSelectedIndex(positions.length)
  }

  function handleMarkerPointerDown(index: number, e: ReactPointerEvent<SVGCircleElement>) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = toViewBoxPoint(e.clientX, e.clientY)
    dragState.current = { index, startX: x, startY: y, moved: false }
  }

  function handleMarkerPointerMove(e: ReactPointerEvent<SVGCircleElement>) {
    const drag = dragState.current
    if (!drag) return
    const { x, y } = toViewBoxPoint(e.clientX, e.clientY)
    if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) > DRAG_THRESHOLD) {
      drag.moved = true
    }
    if (drag.moved) {
      setPositions((prev) =>
        prev.map((p, i) => (i === drag.index ? { ...p, x: clamp01(x / VIEW_W), y: clamp01(1 - y / VIEW_H) } : p)),
      )
    }
  }

  function handleMarkerPointerUp(index: number, e: ReactPointerEvent<SVGCircleElement>) {
    const drag = dragState.current
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (drag && !drag.moved) {
      setSelectedIndex(index)
    }
    // Clear on next tick so the pitch's own click handler (which fires right
    // after pointerup for the same interaction) can see it was a drag.
    setTimeout(() => {
      dragState.current = null
    }, 0)
  }

  function updateSelectedRole(role: string) {
    if (selectedIndex === null) return
    setPositions((prev) => prev.map((p, i) => (i === selectedIndex ? { ...p, role } : p)))
  }

  function removeSelected() {
    if (selectedIndex === null) return
    setPositions((prev) => prev.filter((_, i) => i !== selectedIndex))
    setSelectedIndex(null)
  }

  async function handleSubmit() {
    setIsSaving(true)
    setError(null)
    try {
      await onSave({ name, formationType: defaultFormationType, positions })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
      setIsSaving(false)
    }
  }

  const selected = selectedIndex !== null ? positions[selectedIndex] : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-pitch-700 bg-pitch-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <span className="text-xs text-white/40">{positions.length} Positionen</span>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-white/70">Name</span>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-pitch-600 bg-pitch-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-accent"
          />
        </label>

        <div className="flex gap-4">
          <div className="aspect-[5/7] w-64 shrink-0 select-none">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="h-full w-full cursor-crosshair rounded-md"
              onPointerUp={handlePitchClick}
            >
              <rect x={1} y={1} width={98} height={138} fill="#123a1e" stroke="#ffffff40" strokeWidth={1} />
              <line x1={1} y1={70} x2={99} y2={70} stroke="#ffffff40" strokeWidth={1} />
              <circle cx={50} cy={70} r={12} fill="none" stroke="#ffffff40" strokeWidth={1} />
              {positions.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x * VIEW_W}
                    cy={(1 - p.y) * VIEW_H}
                    r={6}
                    fill={i === selectedIndex ? '#38b6f0' : '#1c8dc9'}
                    stroke="#ffffff"
                    strokeWidth={i === selectedIndex ? 2 : 1}
                    className="cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => handleMarkerPointerDown(i, e)}
                    onPointerMove={handleMarkerPointerMove}
                    onPointerUp={(e) => handleMarkerPointerUp(i, e)}
                  />
                  <text
                    x={p.x * VIEW_W}
                    y={(1 - p.y) * VIEW_H + 2.5}
                    fontSize={5}
                    fill="#ffffff"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {p.role}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <p className="text-xs text-white/40">
              Auf das Feld klicken fügt eine neue Position hinzu. Marker ziehen zum Verschieben, anklicken zum
              Auswählen.
            </p>
            {selected ? (
              <div className="flex flex-col gap-2 rounded-lg border border-pitch-600 bg-pitch-800 p-3">
                <label className="flex flex-col gap-1.5 text-xs">
                  <span className="font-medium text-white/60">Rolle / Kürzel</span>
                  <input
                    value={selected.role}
                    onChange={(e) => updateSelectedRole(e.target.value)}
                    className="rounded-md border border-pitch-600 bg-pitch-900 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent"
                  />
                </label>
                <Button variant="danger" className="self-start" onClick={removeSelected}>
                  Position löschen
                </Button>
              </div>
            ) : (
              <p className="text-xs text-white/30">Keine Position ausgewählt.</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-pitch-700 pt-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button
            type="button"
            loading={isSaving}
            disabled={!name.trim() || positions.length === 0}
            onClick={() => void handleSubmit()}
          >
            Speichern
          </Button>
        </div>
      </div>
    </div>
  )
}
