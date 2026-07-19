import type Konva from 'konva'
import {
  SOCIAL_HEIGHT,
  SOCIAL_WIDTH,
  computeSocialFitRect,
  drawSocialLogo,
  loadImageElement,
  paintSocialBackground,
} from './socialFrame'

export type ExportFormat = 'png' | 'jpg'

export function exportStageAsImage(
  stage: Konva.Stage,
  options: { format: ExportFormat; pixelRatio: number; fileName: string },
) {
  const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png'
  const dataUrl = stage.toDataURL({
    mimeType,
    quality: options.format === 'jpg' ? 0.92 : undefined,
    pixelRatio: options.pixelRatio,
  })

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${options.fileName}.${options.format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** Composites the current stage into a 1080x1920 (9:16) canvas with a brand
 * background and an optional logo watermark — ready to post as an
 * Instagram/TikTok Story or Reel cover, instead of the pitch's native
 * (landscape/portrait-but-not-9:16) aspect ratio. */
export async function exportStageAsSocialImage(
  stage: Konva.Stage,
  options: { logoUrl?: string | null; fileName: string },
) {
  const sourceCanvas = stage.toCanvas({ pixelRatio: 2 })

  const output = document.createElement('canvas')
  output.width = SOCIAL_WIDTH
  output.height = SOCIAL_HEIGHT
  const ctx = output.getContext('2d')
  if (!ctx) throw new Error('Canvas wird nicht unterstützt.')

  paintSocialBackground(ctx)

  const rect = computeSocialFitRect(sourceCanvas.width, sourceCanvas.height)
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 30
  ctx.drawImage(sourceCanvas, rect.x, rect.y, rect.w, rect.h)
  ctx.restore()

  if (options.logoUrl) {
    try {
      const logo = await loadImageElement(options.logoUrl)
      drawSocialLogo(ctx, logo)
    } catch {
      // Logo is a nice-to-have watermark — a failed fetch shouldn't block export.
    }
  }

  const link = document.createElement('a')
  link.href = output.toDataURL('image/png')
  link.download = `${options.fileName}-story.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
