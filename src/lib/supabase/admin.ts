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
