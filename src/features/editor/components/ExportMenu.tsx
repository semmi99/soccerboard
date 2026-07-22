import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { limitsForTier } from '../../../lib/limits'
import { exportStageAsImage, exportStageAsSocialImage, type ExportFormat } from '../export/exportImage'
import { downloadVideo, recordFramesAsVideo } from '../export/exportVideo'
import { Button } from '../../../components/ui/Button'

const RESOLUTION_OPTIONS = [
  { pixelRatio: 1, label: 'Standard (1x)' },
  { pixelRatio: 2, label: 'Hoch (2x, ~1080p)' },
  { pixelRatio: 3, label: 'Sehr hoch (3x)' },
  { pixelRatio: 4, label: 'Maximal (4x, ~4K)' },
]

type ExportKind = ExportFormat | 'video'

export function ExportMenu({ stageRef }: { stageRef: RefObject<Konva.Stage | null> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState<ExportKind>('png')
  const [pixelRatio, setPixelRatio] = useState(2)
  const [socialFormat, setSocialFormat] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Rendered through a portal (see below) so the dropdown always sits above
  // the whole app instead of getting clipped by an ancestor's overflow (the
  // header scrolls horizontally on narrow viewports, which was silently
  // cutting this menu off instead of showing it on top like every other
  // dropdown).
  useEffect(() => {
    if (!isOpen) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }, [isOpen])

  const projectTitle = useEditorStore((s) => s.projectTitle)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const frames = useEditorStore((s) => s.frames)
  const organization = useAuthStore((s) => s.organization)

  const maxPixelRatio = organization ? limitsForTier(organization).maxExportPixelRatio : 2
  const availableResolutions = RESOLUTION_OPTIONS.filter((r) => r.pixelRatio <= maxPixelRatio)
  const fileName = projectTitle.trim() || 'tacticboard-projekt'

  function handleExport() {
    const stage = stageRef.current
    if (!stage || format === 'video') return

    const hadSelection = selection.length > 0
    if (hadSelection) setSelection([])

    // Let the Transformer detach and redraw before we snapshot the stage,
    // otherwise the selection handles end up baked into the exported image.
    // A macrotask (not requestAnimationFrame) so this fires even if the tab
    // is backgrounded or otherwise not actively compositing frames.
    setTimeout(() => {
      if (socialFormat) {
        void exportStageAsSocialImage(stage, { logoUrl: organization?.logo_url, fileName }).then(
          () => setIsOpen(false),
        )
        return
      }
      exportStageAsImage(stage, {
        format,
        pixelRatio,
        fileName,
      })
      setIsOpen(false)
    }, 0)
  }

  async function handleExportVideo() {
    const stage = stageRef.current
    if (!stage) return
    setVideoError(null)
    if (selection.length > 0) setSelection([])
    setIsRecording(true)
    try {
      // Give the Transformer a tick to detach before recording starts.
      await new Promise((resolve) => setTimeout(resolve, 0))
      const result = await recordFramesAsVideo(stage, {
        social: socialFormat,
        logoUrl: organization?.logo_url,
      })
      downloadVideo(result, fileName)
      setIsOpen(false)
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Aufnahme fehlgeschlagen.')
    } finally {
      setIsRecording(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button variant="secondary" onClick={() => setIsOpen((v) => !v)}>
        Exportieren
      </Button>

      {isOpen && menuPos && createPortal(
        <div
          className="fixed z-50 w-64 rounded-lg border border-pitch-700 bg-pitch-900 p-4 shadow-2xl"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-white/60">Format</span>
              <select
                className="rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-accent"
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as ExportKind)
                  setVideoError(null)
                }}
              >
                <option value="png">PNG (verlustfrei, transparent)</option>
                <option value="jpg">JPG (kleinere Datei)</option>
                <option value="video">Video (MP4/WebM, Sequenz)</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                className="accent-violet-accent"
                checked={socialFormat}
                onChange={(e) => setSocialFormat(e.target.checked)}
              />
              Social Story (9:16, Hochformat + Logo)
            </label>

            {format === 'video' ? (
              <>
                <p className="text-[11px] text-white/40">
                  Spielt alle Frames einmal ab und nimmt die Wiedergabe als Video auf. Mindestens 2 Frames
                  nötig. Je nach Browser wird MP4 oder WebM erzeugt.
                </p>
                {frames.length < 2 && (
                  <p className="text-[11px] text-amber-400">Mindestens 2 Frames für ein Video nötig.</p>
                )}
                {videoError && <p className="text-[11px] text-red-400">{videoError}</p>}
                <Button
                  onClick={() => void handleExportVideo()}
                  loading={isRecording}
                  disabled={frames.length < 2}
                  className="w-full"
                >
                  {isRecording ? 'Aufnahme läuft…' : 'Video aufnehmen & herunterladen'}
                </Button>
              </>
            ) : (
              <>
                {socialFormat ? (
                  <p className="text-[11px] text-white/40">
                    Exportiert als 1080×1920 PNG mit 9011-Hintergrund und Vereinslogo, fertig für
                    Instagram/TikTok.
                  </p>
                ) : (
                  <>
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
                        Beobachter-Modus: Export bis {maxPixelRatio}x. Für 4K auf Trainer upgraden.
                      </p>
                    )}
                  </>
                )}

                <Button onClick={handleExport} className="w-full">
                  Herunterladen
                </Button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
