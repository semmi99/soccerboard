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
  const beginHistoryCheckpoint = useEditorStore((s) => s.beginHistoryCheckpoint)
  const isPlaying = useEditorStore((s) => s.isPlaying)

  const tier = useAuthStore((s) => s.organization?.subscription_tier ?? 'free')
  const maxFrames = limitsForTier(tier).maxFrames
  const activeFrame = frames[activeFrameIndex]

  return (
    <footer className="flex h-24 shrink-0 items-center gap-3 border-t border-pitch-700 bg-pitch-900 px-4">
      <div className="flex flex-1 items-center gap-2 overflow-x-auto py-2">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            className={`group relative flex h-14 w-20 shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border text-xs transition-colors ${
              index === activeFrameIndex
                ? 'border-violet-accent bg-violet-accent/20 text-white'
                : 'border-pitch-600 bg-pitch-800 text-white/60 hover:border-pitch-500'
            }`}
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
              className="w-20 rounded-md border border-pitch-600 bg-pitch-800 px-2 py-1 text-xs text-white outline-none focus:border-violet-accent"
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
            disabled={frames.length >= maxFrames}
            onClick={() => duplicateFrame(activeFrameIndex, maxFrames)}
          >
            Frame duplizieren
          </Button>
        </div>
      )}
    </footer>
  )
}
