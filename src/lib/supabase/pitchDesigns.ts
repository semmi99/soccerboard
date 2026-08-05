import { supabase } from './client'
import type { Tables, TablesInsert } from '../../types/database.types'

export type PitchDesignRow = Tables<'pitch_designs'>

export interface CustomPitchDesign {
  id: string
  name: string
  grassA: string
  grassB: string
  lineColor: string
}

function fromRow(row: PitchDesignRow): CustomPitchDesign {
  return {
    id: row.id,
    name: row.name,
    grassA: row.grass_a,
    grassB: row.grass_b,
    lineColor: row.line_color,
  }
}

export async function listPitchDesigns(orgId: string): Promise<CustomPitchDesign[]> {
  const { data, error } = await supabase
    .from('pitch_designs')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  if (error) throw error
  return data.map(fromRow)
}

export async function createPitchDesign(input: {
  orgId: string
  name: string
  grassA: string
  grassB: string
  lineColor: string
}): Promise<CustomPitchDesign> {
  const insert: TablesInsert<'pitch_designs'> = {
    org_id: input.orgId,
    name: input.name,
    grass_a: input.grassA,
    grass_b: input.grassB,
    line_color: input.lineColor,
  }
  const { data, error } = await supabase.from('pitch_designs').insert(insert).select('*').single()
  if (error) throw error
  return fromRow(data)
}

export async function deletePitchDesign(id: string): Promise<void> {
  const { error } = await supabase.from('pitch_designs').delete().eq('id', id)
  if (error) throw error
}
