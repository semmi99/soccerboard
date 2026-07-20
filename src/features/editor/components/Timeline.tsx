import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { limitsForTier } from '../../../lib/limits'
import { Button } from '../../../components/ui/Button'

export function Timeline() {
  const frames = useEditorStore((s) => s.frames)
  const activeFrameIndex = useEditorStore((s) => s.activeFrameIndex)
  const setActiveFrameIndex = useEditorStore((s) => s.setActiveFrameIndex)
  const addFrame = useEditorStore((s) => s.addFrame)
  const removeFrame = useEditorStore((s) => s.removeFrame)
  const duplicateFrame = useEditorStore((s) => s.duplicateFrame)
  const setFrameDuration = useEditorStore((s) => s.setFrameDuration)
  const clearActiveFrame = useEditorStore((s) => s.clearActiveFrame)
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying)

  const tier = useAuthStore((s) => s.organization?.subscription_tier ?? 'free')
  const maxFrames = limitsForTier(tier).maxFrames
  const activeFrame = frames[activeFrameIndex]
  const canPlay = frames.length > 1

  function handlePlayToggle() {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    setActiveFrameIndex(0)
    setIsPlaying(true)
  }

  return (
    <footer className="flex shrink-0 flex-col border-t border-pitch-700 bg-pitch-900">
      <div className="flex h-24 items-center gap-3 px-4">
        <Button
          variant={isPlaying ? 'danger' : 'primary'}
          disabled={!canPlay}
          onClick={handlePlayToggle}
          title={canPlay ? 'Sequenz abspielen' : 'Mindestens 2 Frames für Wiedergabe nötig'}
          className="shrink-0"
        >
          {isPlaying ? 'Stop' : 'Abspielen'}
        </Button>

        <div className="flex flex-1 items-center gap-2 overflow-x-auto py-2">
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              className={`group relative flex h-14 w-20 shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border text-xs transition-colors ${
                index === activeFrameIndex
                  ? 'border-violet-accent bg-violet-accent/20 text-white'
                  : 'border-pitch-600 bg-pitch-800 text-white/60 hover:border-pitch-500'
              } ${isPlaying ? 'pointer-events-none opacity-60' : ''}`}
              onClick={() => setActiveFrameIndex(index)}
            >
              <span className="font-semibold">Frame {index + 1}</span>
              <span className="text-[10px] text-white/40">{frame.durationMs}ms</span>
              {frames.length > 1 && (
                <button
                  type="button"
                  title="Frame löschen"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFrame(index)
                  }}
                  className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white group-hover:flex"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={frames.length >= maxFrames || isPlaying}
            onClick={() => addFrame(maxFrames)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-pitch-600 text-lg text-white/40 hover:border-violet-accent hover:text-violet-accent-bright disabled:cursor-not-allowed disabled:opacity-40"
            title={frames.length >= maxFrames ? `Limit von ${maxFrames} Frames erreicht` : 'Frame hinzufügen'}
          >
            +
          </button>
        </div>

        {activeFrame && (
          <div className="flex shrink-0 items-center gap-2 border-l border-pitch-700 pl-3">
            <label className="flex items-center gap-1.5 text-xs text-white/60">
              Dauer
              <input
                type="number"
                min={100}
                step={100}
                disabled={isPlaying}
                className="w-20 rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1 text-xs text-white outline-none focus:border-violet-accent disabled:opacity-50"
                value={activeFrame.durationMs}
                onFocus={beginHistoryCheckpoint}
                onChange={(e) =>
                  setFrameDuration(activeFrameIndex, Number(e.target.value) || 100)
                }
              />
              ms
            </label>
            <Button
              variant="secondary"
              disabled={frames.length >= maxFrames || isPlaying}
              onClick={() => duplicateFrame(activeFrameIndex, maxFrames)}
            >
              Frame duplizieren
            </Button>
            <Button
              variant="danger"
              disabled={isPlaying || activeFrame.objects.length === 0}
              onClick={() => {
                if (window.confirm('Alle Objekte in diesem Frame löschen?')) clearActiveFrame()
              }}
              title="Alle Objekte in diesem Frame entfernen"
            >
              Board leeren
            </Button>
          </div>
        )}
      </div>
    </footer>
  )
}
