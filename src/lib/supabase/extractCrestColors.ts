// Extrahiert die dominante(n) Farbe(n) aus einem Vereinswappen-Bild per Canvas-Pixelanalyse.
// API-Football liefert keine Trikot-/Vereinsfarben, nur das Logo — daher wird die Farbe
// direkt aus dem Wappen abgeleitet, statt immer die App-Standardfarbe zu verwenden.

interface ExtractedColors {
  primary: string
  secondary: string
}

const FALLBACK: ExtractedColors = { primary: '#3b82f6', secondary: '#1e3a8a' }

function quantize(v: number, step = 24) {
  return Math.round(v / step) * step
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`
}

export async function extractCrestColors(imageUrl: string): Promise<ExtractedColors> {
  try {
    const img = await loadImage(imageUrl)
    const canvas = document.createElement('canvas')
    const size = 64
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return FALLBACK
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)

    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!
      const a = data[i + 3]!
      if (a < 128) continue
      // Nahezu weiß, schwarz oder grau überspringen — meist Hintergrund/Kontur, keine Vereinsfarbe.
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const isNearWhite = min > 225
      const isNearBlack = max < 30
      const isGray = max - min < 18
      if (isNearWhite || isNearBlack || isGray) continue

      const key = `${quantize(r)}-${quantize(g)}-${quantize(b)}`
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
      bucket.count++
      bucket.r += r
      bucket.g += g
      bucket.b += b
      buckets.set(key, bucket)
    }

    const sorted = Array.from(buckets.values())
      .map((b) => ({ ...b, r: b.r / b.count, g: b.g / b.count, b_: b.b / b.count }))
      .sort((a, b) => b.count - a.count)

    if (sorted.length === 0) return FALLBACK

    const dominant = sorted[0]!
    const primary = toHex(dominant.r, dominant.g, dominant.b_)
    const secondEntry = sorted.find((c) => colorDistance(c, dominant) > 60)
    const secondary = secondEntry ? toHex(secondEntry.r, secondEntry.g, secondEntry.b_) : '#111827'

    return { primary, secondary }
  } catch {
    return FALLBACK
  }
}

function colorDistance(a: { r: number; g: number; b_: number }, b: { r: number; g: number; b_: number }) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b_ - b.b_)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
