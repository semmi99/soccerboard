import { supabase } from './client'
import type { Json, Tables, TablesInsert } from '../../types/database.types'

export type TrainingSessionRow = Tables<'training_sessions'>

export interface SessionItem {
  exerciseId: string
  /** Snapshotted at add-time — survives the source exercise later being
   * renamed or deleted, since a past/printed session shouldn't silently
   * change or break. */
  name: string
  category: string
  durationMin: number
}

export interface TrainingSession {
  id: string
  name: string
  items: SessionItem[]
}

function fromRow(row: TrainingSessionRow): TrainingSession {
  return {
    id: row.id,
    name: row.name,
    items: (row.items as unknown as SessionItem[]) ?? [],
  }
}

export async function listTrainingSessions(orgId: string): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(fromRow)
}

export async function createTrainingSession(input: {
  orgId: string
  name: string
  items: SessionItem[]
}): Promise<TrainingSession> {
  const insert: TablesInsert<'training_sessions'> = {
    org_id: input.orgId,
    name: input.name,
    items: input.items as unknown as Json,
  }
  const { data, error } = await supabase.from('training_sessions').insert(insert).select('*').single()
  if (error) throw error
  return fromRow(data)
}

export async function updateTrainingSession(
  id: string,
  patch: { name?: string; items?: SessionItem[] },
): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from('training_sessions')
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.items !== undefined ? { items: patch.items as unknown as Json } : {}),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteTrainingSession(id: string): Promise<void> {
  const { error } = await supabase.from('training_sessions').delete().eq('id', id)
  if (error) throw error
}
