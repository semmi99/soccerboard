import { useRef, useState, type RefObject } from 'react'
import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { limitsForTier } from '../../../lib/limits'
import { exportStageAsImage, type ExportFormat } from '../export/exportImage'
import { Button } from '../../../components/ui/Button'

const RESOLUTION_OPTIONS = [
  { pixelRatio: 1, label: 'Standard (1x)' },
  { pixelRatio: 2, label: 'Hoch (2x, ~1080p)' },
  { pixelRatio: 3, label: 'Sehr hoch (3x)' },
  { pixelRatio: 4, label: 'Maximal (4x, ~4K)' },
]

export function ExportMenu({ stageRef }: { stageRef: RefObject<Konva.Stage | null> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [pixelRatio, setPixelRatio] = useState(2)
  const containerRef = useRef<HTMLDivElement>(null)

  const projectTitle = useEditorStore((s) => s.projectTitle)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const organization = useAuthStore((s) => s.organization)

  const maxPixelRatio = organization
    ? limitsForTier(organization.subscription_tier).maxExportPixelRatio
    : 2
  const availableResolutions = RESOLUTION_OPTIONS.filter((r) => r.pixelRatio <= maxPixelRatio)

  function handleExport() {
    const stage = stageRef.current
    if (!stage) return

    const hadSelection = selection.length > 0
    if (hadSelection) setSelection([])

    // Let the Transformer detach and redraw before we snapshot the stage,
    // otherwise the selection handles end up baked into the exported image.
    // A macrotask (not requestAnimationFrame) so this fires even if the tab
    // is backgrounded or otherwise not actively compositing frames.
    setTimeout(() => {
      exportStageAsImage(stage, {
        format,
        pixelRatio,
        fileName: projectTitle.trim() || 'tacticboard-projekt',
      })
      setIsOpen(false)
    }, 0)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button variant="secondary" onClick={() => setIsOpen((v) => !v)}>
        Exportieren
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-pitch-700 bg-pitch-900 p-4 shadow-2xl">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-white/60">Format</span>
              <select
                className="rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent"
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
              >
                <option value="png">PNG (verlustfrei, transparent)</option>
                <option value="jpg">JPG (kleinere Datei)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-white/60">Auflösung</span>
              <select
                className="rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent"
                value={pixelRatio}
                onChange={(e) => setPixelRatio(Number(e.target.value))}
              >
                {availableResolutions.map((r) => (
                  <option key={r.pixelRatio} value={r.pixelRatio}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            {maxPixelRatio < 4 && (
              <p className="text-[11px] text-white/40">
                Free-Tier: Export bis {maxPixelRatio}x. Für 4K auf Pro upgraden.
              </p>
            )}

            <Button onClick={handleExport} className="w-full">
              Herunterladen
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
