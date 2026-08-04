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

/** Deactivates ("bans") or reactivates any user platform-wide — same
 * Edge Function as the org-scoped admin.ts version, just usable across
 * orgs since the caller here is always a platform admin. */
export async function setUserDisabled(userId: string, disabled: boolean): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('admin-set-banned', {
    body: { userId, disabled },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
}

/** Fully deletes any user platform-wide via the org-remove-member Edge
 * Function — it already grants a platform admin caller access to any
 * user, not just their own org's members. */
export async function deleteUser(userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('org-remove-member', {
    body: { userId },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
}
