import type Konva from 'konva'

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
