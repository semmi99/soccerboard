import { supabase } from './client'
import type { Tables } from '../../types/database.types'

export type PlatformOrg = Tables<'organizations'>
export type PlatformProfile = Tables<'profiles'>

export async function listAllOrganizations(): Promise<PlatformOrg[]> {
  const { data, error } = await supabase.from('organizations').select('*').order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function listAllProfiles(): Promise<PlatformProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function updateOrgFreeOverride(orgId: string, freeOverride: boolean): Promise<PlatformOrg> {
  const { data, error } = await supabase
    .from('organizations')
    .update({ free_override: freeOverride })
    .eq('id', orgId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateAnyProfileRole(profileId: string, role: string): Promise<PlatformProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function setUserPassword(userId: string, newPassword: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('admin-set-password', {
    body: { userId, newPassword },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
}
