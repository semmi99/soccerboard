import { supabase } from './client'
import type { Tables, TablesInsert } from '../../types/database.types'

export type Unterphase = Tables<'training_unterphasen'>
export type Prinzip = Tables<'training_prinzipien'>

export async function listUnterphasen(orgId: string): Promise<Unterphase[]> {
  const { data, error } = await supabase
    .from('training_unterphasen')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createUnterphase(orgId: string, name: string): Promise<Unterphase> {
  const insert: TablesInsert<'training_unterphasen'> = { org_id: orgId, name }
  const { data, error } = await supabase
    .from('training_unterphasen')
    .insert(insert)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteUnterphase(id: string): Promise<void> {
  const { error } = await supabase.from('training_unterphasen').delete().eq('id', id)
  if (error) throw error
}

export async function listPrinzipien(orgId: string): Promise<Prinzip[]> {
  const { data, error } = await supabase
    .from('training_prinzipien')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createPrinzip(orgId: string, name: string): Promise<Prinzip> {
  const insert: TablesInsert<'training_prinzipien'> = { org_id: orgId, name }
  const { data, error } = await supabase
    .from('training_prinzipien')
    .insert(insert)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deletePrinzip(id: string): Promise<void> {
  const { error } = await supabase.from('training_prinzipien').delete().eq('id', id)
  if (error) throw error
}
