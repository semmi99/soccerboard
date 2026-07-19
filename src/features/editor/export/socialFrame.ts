/** Shared geometry/painting helpers for the 9:16 "Social Story" export
 * format (Instagram/TikTok Reels & Stories), used by both the static image
 * export and the video export so they composite identically. */

export const SOCIAL_WIDTH = 1080
export const SOCIAL_HEIGHT = 1920

export function paintSocialBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, SOCIAL_HEIGHT)
  gradient.addColorStop(0, '#145f89')
  gradient.addColorStop(1, '#0a2e45')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SOCIAL_WIDTH, SOCIAL_HEIGHT)
}

/** Fits the pitch stage's content into the story canvas, leaving room at the
 * top for a title/branding area and at the bottom so a frame caption isn't
 * cramped against the edge. */
export function computeSocialFitRect(contentWidth: number, contentHeight: number) {
  const marginX = SOCIAL_WIDTH * 0.06
  const marginTop = SOCIAL_HEIGHT * 0.13
  const marginBottom = SOCIAL_HEIGHT * 0.1
  const maxW = SOCIAL_WIDTH - marginX * 2
  const maxH = SOCIAL_HEIGHT - marginTop - marginBottom
  const scale = Math.min(maxW / contentWidth, maxH / contentHeight)
  const w = contentWidth * scale
  const h = contentHeight * scale
  const x = (SOCIAL_WIDTH - w) / 2
  const y = marginTop + (maxH - h) / 2
  return { x, y, w, h }
}

export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Logo konnte nicht geladen werden.'))
    img.src = url
  })
}

export function drawSocialLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const boxSize = 84
  const margin = 32
  const ratio = Math.min(boxSize / img.width, boxSize / img.height)
  const w = img.width * ratio
  const h = img.height * ratio
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
  ctx.shadowBlur = 14
  ctx.drawImage(img, margin, margin, w, h)
  ctx.restore()
}
