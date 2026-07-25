import { supabase } from './client'
import type { Tables, TablesInsert } from '../../types/database.types'

export type OrgMember = Tables<'profiles'>
export type OrgInvite = Tables<'org_invites'>
export type OrgRole = 'admin' | 'coach' | 'viewer'

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function updateMemberRole(profileId: string, role: OrgRole): Promise<OrgMember> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listPendingInvites(orgId: string): Promise<OrgInvite[]> {
  const { data, error } = await supabase
    .from('org_invites')
    .select('*')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function inviteMember(input: {
  orgId: string
  email: string
  role: OrgRole
  invitedBy: string
}): Promise<OrgInvite> {
  const insert: TablesInsert<'org_invites'> = {
    org_id: input.orgId,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    invited_by: input.invitedBy,
  }
  const { data, error } = await supabase.from('org_invites').insert(insert).select('*').single()
  if (error) throw error
  return data
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('org_invites').delete().eq('id', inviteId)
  if (error) throw error
}

/** Fully removes a member's account (not just their org membership) via the
 * org-remove-member Edge Function — deleting the auth user cascades to
 * their profile row, so there's nothing left to clean up client-side. */
export async function removeMember(userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('org-remove-member', {
    body: { userId },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
}
