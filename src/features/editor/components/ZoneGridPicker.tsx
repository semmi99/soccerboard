import { useEffect, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import {
  createZoneGrid,
  deleteZoneGrid,
  listZoneGrids,
  type ZoneGrid,
} from '../../../lib/supabase/zoneGrids'
import type { ZoneGridLine, ZoneGridStyle } from '../types'
import { Button } from '../../../components/ui/Button'

const selectClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'
const inputClass =
  'rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent'

export function ZoneGridPicker() {
  const organization = useAuthStore((s) => s.organization)
  const zoneGridStyle = useEditorStore((s) => s.zoneGridStyle)
  const zoneGridCustomId = useEditorStore((s) => s.zoneGridCustomId)
  const setZoneGridStyle = useEditorStore((s) => s.setZoneGridStyle)
  const setZoneGridCustomId = useEditorStore((s) => s.setZoneGridCustomId)
  const setZoneGridCustomLines = useEditorStore((s) => s.setZoneGridCustomLines)

  const [grids, setGrids] = useState<ZoneGrid[]>([])
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    if (!organization) return
    listZoneGrids(organization.id)
      .then(setGrids)
      .catch(() => setGrids([]))
  }, [organization])

  // Whichever custom grid is selected needs its lines resolved into the
  // store so Pitch (rendered elsewhere) can draw them — mirrors how teamKit
  // is resolved from teamId in TeamSquadPanel.
  useEffect(() => {
    if (zoneGridStyle !== 'custom' || !zoneGridCustomId) {
      setZoneGridCustomLines([])
      return
    }
    const grid = grids.find((g) => g.id === zoneGridCustomId)
    setZoneGridCustomLines(grid?.lines ?? [])
  }, [zoneGridStyle, zoneGridCustomId, grids, setZoneGridCustomLines])

  function handleSelectChange(value: string) {
    if (value.startsWith('custom:')) {
      setZoneGridStyle('custom')
      setZoneGridCustomId(value.slice('custom:'.length))
    } else {
      setZoneGridStyle(value as ZoneGridStyle)
      setZoneGridCustomId(null)
    }
  }

  async function handleDelete() {
    if (!zoneGridCustomId) return
    if (!window.confirm('Dieses eigene Zonenraster löschen?')) return
    await deleteZoneGrid(zoneGridCustomId)
    setGrids((gs) => gs.filter((g) => g.id !== zoneGridCustomId))
    setZoneGridStyle('none')
    setZoneGridCustomId(null)
  }

  const selectedValue =
    zoneGridStyle === 'custom' && zoneGridCustomId ? `custom:${zoneGridCustomId}` : zoneGridStyle

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-white/60">Zonenraster</span>
        <select
          className={selectClass}
          value={selectedValue}
          onChange={(e) => handleSelectChange(e.target.value)}
        >
          <option value="none">Kein Raster</option>
          <option value="thirds_channels">Drittel &amp; Kanäle</option>
          <option value="guardiola">Guardiola (Positionsspiel)</option>
          {grids.length > 0 && (
            <optgroup label="Eigene">
              {grids.map((g) => (
                <option key={g.id} value={`custom:${g.id}`}>
                  {g.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <div className="flex gap-1.5">
        <Button variant="secondary" className="flex-1" onClick={() => setShowEditor(true)}>
          + Eigenes Raster
        </Button>
        {zoneGridStyle === 'custom' && zoneGridCustomId && (
          <Button variant="danger" onClick={() => void handleDelete()}>
            Löschen
          </Button>
        )}
      </div>

      {showEditor && organization && (
        <ZoneGridEditorModal
          orgId={organization.id}
          onClose={() => setShowEditor(false)}
          onCreated={(grid) => {
            setGrids((gs) => [...gs, grid])
            setZoneGridStyle('custom')
            setZoneGridCustomId(grid.id)
          }}
        />
      )}
    </div>
  )
}

function ZoneGridEditorModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string
  onClose: () => void
  onCreated: (grid: ZoneGrid) => void
}) {
  const [name, setName] = useState('')
  const [lines, setLines] = useState<ZoneGridLine[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addLine(orientation: 'vertical' | 'horizontal') {
    setLines((ls) => [...ls, { orientation, position: 0.5 }])
  }

  function updatePosition(index: number, position: number) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, position } : l)))
  }

  function removeLine(index: number) {
    setLines((ls) => ls.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!name.trim() || lines.length === 0) return
    setIsSaving(true)
    setError(null)
    try {
      const grid = await createZoneGrid({ orgId, name: name.trim(), lines })
      onCreated(grid)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-pitch-700 bg-pitch-900 p-6 shadow-2xl">
        <h2 className="mb-1 text-sm font-semibold text-white">Eigenes Zonenraster</h2>
        <p className="mb-4 text-xs text-white/50">
          Linien hinzufügen und positionieren, dann benennen und speichern.
        </p>

        <label className="mb-3 flex flex-col gap-1 text-xs">
          <span className="font-medium text-white/60">Name</span>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Mein 3er-Raster"
          />
        </label>

        <div className="flex flex-col gap-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-pitch-700 p-2">
              <span className="w-16 shrink-0 text-xs text-white/60">
                {l.orientation === 'vertical' ? 'Vertikal' : 'Horizontal'}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(l.position * 100)}
                onChange={(e) => updatePosition(i, Number(e.target.value) / 100)}
                className="flex-1"
              />
              <span className="w-10 shrink-0 text-right text-xs text-white/50">
                {Math.round(l.position * 100)}%
              </span>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="shrink-0 text-red-400 hover:text-red-300"
                title="Linie entfernen"
              >
                ×
              </button>
            </div>
          ))}
          {lines.length === 0 && (
            <p className="text-xs text-white/40">Noch keine Linien — füge unten welche hinzu.</p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => addLine('vertical')}>
            + Vertikale Linie
          </Button>
          <Button variant="secondary" onClick={() => addLine('horizontal')}>
            + Horizontale Linie
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button
            type="button"
            loading={isSaving}
            disabled={!name.trim() || lines.length === 0}
            onClick={() => void handleSave()}
          >
            Speichern
          </Button>
        </div>
      </div>
    </div>
  )
}
