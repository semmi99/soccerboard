import { supabase } from './client'

export async function uploadBoardImage(orgId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${orgId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('board-images')
    .upload(path, file, { cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('board-images').getPublicUrl(path)
  return data.publicUrl
}

/** Reads the file's natural pixel size before upload, so the placed object
 * can start at the right aspect ratio instead of a fixed square. */
export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild konnte nicht gelesen werden'))
    }
    img.src = url
  })
}
