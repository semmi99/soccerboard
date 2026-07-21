import { supabase } from './client'
import type { Json, Tables, TablesInsert } from '../../types/database.types'
import type { EditorFrame } from '../../features/editor/types'

export type ExerciseRow = Tables<'exercises'>

export interface Exercise {
  id: string
  name: string
  category: string
  description: string | null
  frames: EditorFrame[]
}

function fromRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    frames: (row.data as unknown as EditorFrame[]) ?? [],
  }
}

export async function listExercises(orgId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('org_id', orgId)
    .order('category', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data.map(fromRow)
}

export async function createExercise(input: {
  orgId: string
  name: string
  category: string
  description: string | null
  frames: EditorFrame[]
}): Promise<Exercise> {
  const insert: TablesInsert<'exercises'> = {
    org_id: input.orgId,
    name: input.name,
    category: input.category,
    description: input.description,
    data: input.frames as unknown as Json,
  }
  const { data, error } = await supabase.from('exercises').insert(insert).select('*').single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw error
}
