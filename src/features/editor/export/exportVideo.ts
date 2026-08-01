import Konva from 'konva'
import i18n from '../../../lib/i18n'
import { useEditorStore } from '../store/editorStore'
import {
  SOCIAL_HEIGHT,
  SOCIAL_WIDTH,
  computePlainFitRect,
  computeSocialFitRect,
  drawSocialLogo,
  loadImageElement,
  paintPlainBackground,
  paintSocialBackground,
} from './socialFrame'
import { computeSequenceStats } from './sequenceStats'

export interface VideoRecordingResult {
  blob: Blob
  mimeType: string
  extension: 'mp4' | 'webm'
}

export interface RecordVideoOptions {
  fps?: number
  /** Composite into a 1080x1920 (9:16) frame with brand background + logo
   * watermark instead of recording the stage at its native size. */
  social?: boolean
  logoUrl?: string | null
  /** Appends a few seconds of a generated recap card (pass count, frame
   * count, total distance covered) after the sequence finishes playing. */
  recap?: boolean
}

const RECAP_DURATION_MS = 3200

/** Builds the recap card as a plain Konva layer added directly to the
 * stage — the export records whatever the stage's own layers composite
 * each tick (see `compositeOnce` below), so this needs no separate
 * rendering path to show up in the recording. */
function buildRecapLayer(stage: Konva.Stage): Konva.Layer {
  const { frames, pitchLengthM, pitchWidthM, projectTitle } = useEditorStore.getState()
  const stats = computeSequenceStats(frames, pitchLengthM, pitchWidthM)

  const w = stage.width()
  const h = stage.height()
  const cardW = Math.min(w * 0.82, 380)
  const cardX = (w - cardW) / 2
  const rowH = 46
  const rows: { label: string; value: string }[] = [
    { label: i18n.t('editor:exportInternal.recap.frames'), value: String(stats.frameCount) },
    { label: i18n.t('editor:exportInternal.recap.passesRuns'), value: String(stats.passCount) },
    { label: i18n.t('editor:exportInternal.recap.totalDistance'), value: `${Math.round(stats.totalDistanceM)} m` },
  ]
  // A before/after comparison — same idea as a broadcast graphic's payoff
  // card comparing two outcomes side by side — only earns its place when
  // the numbers actually shifted over the sequence; an unchanged ratio
  // (or no players at all) has nothing worth comparing.
  const showRatioCompare =
    stats.startRatio.home + stats.startRatio.away > 0 &&
    stats.endRatio.home + stats.endRatio.away > 0 &&
    (stats.startRatio.home !== stats.endRatio.home || stats.startRatio.away !== stats.endRatio.away)
  const compareH = showRatioCompare ? 92 : 0
  const cardH = 56 + rows.length * rowH + compareH + 20
  const cardY = (h - cardH) / 2

  const layer = new Konva.Layer()
  layer.add(
    new Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: 'rgba(8, 14, 24, 0.72)' }),
    new Konva.Rect({
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      fill: '#ffffff',
      cornerRadius: 14,
      shadowColor: 'black',
      shadowBlur: 24,
      shadowOpacity: 0.4,
    }),
    new Konva.Text({
      x: cardX + 22,
      y: cardY + 18,
      width: cardW - 44,
      text: 'ZUSAMMENFASSUNG',
      fontSize: 12,
      fontStyle: 'bold',
      fill: '#94a3b8',
      letterSpacing: 1,
    }),
    new Konva.Text({
      x: cardX + 22,
      y: cardY + 34,
      width: cardW - 44,
      text: projectTitle || 'Spielzug',
      fontSize: 18,
      fontStyle: 'bold',
      fill: '#0f172a',
    }),
  )
  rows.forEach((row, i) => {
    const y = cardY + 66 + i * rowH
    layer.add(
      new Konva.Text({ x: cardX + 22, y: y + 10, width: cardW * 0.6, text: row.label, fontSize: 11, fill: '#64748b' }),
      new Konva.Text({
        x: cardX + cardW - 22 - 140,
        y: y,
        width: 140,
        align: 'right',
        text: row.value,
        fontSize: 26,
        fontStyle: 'bold',
        fill: '#0f172a',
      }),
    )
  })

  if (showRatioCompare) {
    const compareY = cardY + 56 + rows.length * rowH + 8
    const half = (cardW - 44) / 2
    const columns: { label: string; ratio: { home: number; away: number } }[] = [
      { label: 'START', ratio: stats.startRatio },
      { label: 'ENDE', ratio: stats.endRatio },
    ]
    layer.add(
      new Konva.Line({
        points: [cardX + cardW / 2, compareY + 6, cardX + cardW / 2, compareY + compareH - 14],
        stroke: '#e2e8f0',
        strokeWidth: 1,
      }),
    )
    columns.forEach((col, i) => {
      const x = cardX + 22 + i * half
      layer.add(
        new Konva.Text({
          x,
          y: compareY,
          width: half - 10,
          align: 'center',
          text: col.label,
          fontSize: 11,
          fontStyle: 'bold',
          fill: '#64748b',
          letterSpacing: 1,
        }),
        new Konva.Text({
          x,
          y: compareY + 20,
          width: half - 10,
          align: 'center',
          text: `${col.ratio.home} v ${col.ratio.away}`,
          fontSize: 30,
          fontStyle: 'bold',
          fill: '#0f172a',
        }),
      )
    })
  }

  return layer
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
 * back to WebM (Chrome/Firefox today only record MP4 in newer versions).
 *
 * With `social: true`, each tick is instead composited into a 1080x1920
 * frame (brand background + centered pitch + logo watermark) for a
 * ready-to-post Instagram/TikTok Story or Reel. */
export async function recordFramesAsVideo(
  stage: Konva.Stage,
  options: RecordVideoOptions = {},
): Promise<VideoRecordingResult> {
  const { fps = 30, social = false, logoUrl = null, recap = false } = options
  const { frames, orientation } = useEditorStore.getState()
  if (frames.length < 2) {
    throw new Error(i18n.t('editor:exportInternal.minTwoFramesError'))
  }
  if (useEditorStore.getState().isPlaying) {
    throw new Error(i18n.t('editor:exportInternal.playbackAlreadyRunning'))
  }

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  // A portrait board's native stage isn't quite 9:16 (it follows the
  // pitch's own real-world proportions) — force the exact ratio here rather
  // than only offering it through the branded "social" export, so a plain
  // portrait video still drops straight into a Story/Reel slot. Landscape
  // boards keep their native size; 9:16 wouldn't fit that content anyway.
  const forcePortrait916 = !social && orientation === 'vertical'
  const width = social || forcePortrait916 ? SOCIAL_WIDTH : stageWidth
  const height = social || forcePortrait916 ? SOCIAL_HEIGHT : stageHeight
  const fitRect = social
    ? computeSocialFitRect(stageWidth, stageHeight)
    : forcePortrait916
      ? computePlainFitRect(stageWidth, stageHeight, SOCIAL_WIDTH, SOCIAL_HEIGHT)
      : null

  // Loaded once up front so each per-tick composite stays synchronous —
  // a failed/slow logo fetch just means no watermark, not a broken export.
  let logoImg: HTMLImageElement | null = null
  if (social && logoUrl) {
    try {
      logoImg = await loadImageElement(logoUrl)
    } catch {
      logoImg = null
    }
  }

  const mergeCanvas = document.createElement('canvas')
  mergeCanvas.width = width
  mergeCanvas.height = height
  const ctx = mergeCanvas.getContext('2d')
  if (!ctx) throw new Error(i18n.t('editor:exportInternal.canvasNotSupported'))

  function compositeOnce() {
    if (fitRect) {
      if (social) paintSocialBackground(ctx!)
      else paintPlainBackground(ctx!, width, height)
      for (const layer of stage.getLayers()) {
        const layerCanvas = (layer.getCanvas() as unknown as { _canvas: HTMLCanvasElement })._canvas
        ctx!.drawImage(layerCanvas, fitRect.x, fitRect.y, fitRect.w, fitRect.h)
      }
      if (social && logoImg) drawSocialLogo(ctx!, logoImg)
      return
    }
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
        setTimeout(() => {
          if (!recap) {
            recorder.stop()
            return
          }
          const recapLayer = buildRecapLayer(stage)
          stage.add(recapLayer)
          recapLayer.draw()
          setTimeout(() => {
            recapLayer.destroy()
            recorder.stop()
          }, RECAP_DURATION_MS)
        }, 150)
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
