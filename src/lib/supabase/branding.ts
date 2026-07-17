import { supabase } from './client'

export async function uploadOrgLogo(orgId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${orgId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('org-logos')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('org-logos').getPublicUrl(path)
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', orgId)
  if (updateError) throw updateError

  return logoUrl
}
