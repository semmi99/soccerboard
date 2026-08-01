import { useEffect, useState } from 'react'
import { Image as KonvaImage, Rect } from 'react-konva'
import type { ImageData } from '../../types'

function useHtmlImage(url: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => setImg(image)
    image.src = url
    return () => {
      image.onload = null
    }
  }, [url])
  return img
}

export function ImageShape({ data }: { data: ImageData }) {
  const img = useHtmlImage(data.url)
  const w = data.width
  const h = data.height
  return img ? (
    <KonvaImage image={img} x={-w / 2} y={-h / 2} width={w} height={h} opacity={data.opacity ?? 1} />
  ) : (
    <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#1f2937" stroke="#475569" dash={[4, 4]} />
  )
}
