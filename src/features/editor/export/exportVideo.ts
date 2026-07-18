import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'

export interface VideoRecordingResult {
  blob: Blob
  mimeType: string
  extension: 'mp4' | 'webm'
}

const CANDIDATE_MIME_TYPES = [
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

function pickMimeType(): string {
  const supported = CANDIDATE_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
  return supported ?? 'video/webm'
}

/** Records the frame-sequence playback as a video by compositing every
 * Konva layer onto a single off-screen canvas each animation tick and
 * feeding that canvas into MediaRecorder via captureStream — a real
 * screen-recording of the same animation the "Abspielen" button drives,
 * not a separately re-rendered export path. True MP4 (H.264) is used
 * when the browser's MediaRecorder supports it; otherwise this falls
 * back to WebM (Chrome/Firefox today only record MP4 in newer versions). */
export function recordFramesAsVideo(stage: Konva.Stage, fps = 30): Promise<VideoRecordingResult> {
  const { frames } = useEditorStore.getState()
  if (frames.length < 2) {
    return Promise.reject(new Error('Mindestens 2 Frames für ein Video nötig.'))
  }
  if (useEditorStore.getState().isPlaying) {
    return Promise.reject(new Error('Wiedergabe läuft bereits.'))
  }

  const width = stage.width()
  const height = stage.height()
  const mergeCanvas = document.createElement('canvas')
  mergeCanvas.width = width
  mergeCanvas.height = height
  const ctx = mergeCanvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas wird nicht unterstützt.'))

  function compositeOnce() {
    ctx!.clearRect(0, 0, width, height)
    for (const layer of stage.getLayers()) {
      // Konva doesn't expose the layer's raw canvas element publicly, but
      // this is the standard, widely-used way to grab it for compositing.
      const layerCanvas = (layer.getCanvas() as unknown as { _canvas: HTMLCanvasElement })._canvas
      ctx!.drawImage(layerCanvas, 0, 0, width, height)
    }
  }

  compositeOnce()

  const canvasWithStream = mergeCanvas as HTMLCanvasElement & {
    captureStream: (fps?: number) => MediaStream
  }
  const stream = canvasWithStream.captureStream(fps)
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  let compositing = true
  function loop() {
    if (!compositing) return
    compositeOnce()
    requestAnimationFrame(loop)
  }

  return new Promise((resolve, reject) => {
    recorder.onerror = (e) => {
      compositing = false
      reject(e)
    }
    recorder.onstop = () => {
      compositing = false
      const blob = new Blob(chunks, { type: mimeType })
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
      resolve({ blob, mimeType, extension })
    }

    recorder.start()
    requestAnimationFrame(loop)

    const store = useEditorStore.getState()
    store.setActiveFrameIndex(0)
    store.setIsPlaying(true)

    const unsubscribe = useEditorStore.subscribe((state) => {
      if (!state.isPlaying) {
        unsubscribe()
        // One extra frame's worth of delay so the final composited frame
        // (last object positions after the transition settles) is flushed
        // into the recording before we stop it.
        setTimeout(() => recorder.stop(), 150)
      }
    })
  })
}

export function downloadVideo(result: VideoRecordingResult, fileName: string) {
  const url = URL.createObjectURL(result.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.${result.extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
