import { supabase } from './client'
import type { Tables, TablesInsert, Json } from '../../types/database.types'
import type { FormationPosition } from '../../features/formations/presets'

export type FormationRow = Tables<'formations'>

export interface Formation {
  id: string
  name: string
  formationType: string
  positions: FormationPosition[]
}

function fromRow(row: FormationRow): Formation {
  return {
    id: row.id,
    name: row.name,
    formationType: row.formation_type,
    positions: (row.positions as unknown as FormationPosition[]) ?? [],
  }
}

export async function listFormations(orgId: string): Promise<Formation[]> {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  if (error) throw error
  return data.map(fromRow)
}

export async function createFormation(input: {
  orgId: string
  name: string
  formationType: string
  positions: FormationPosition[]
}): Promise<Formation> {
  const insert: TablesInsert<'formations'> = {
    org_id: input.orgId,
    name: input.name,
    formation_type: input.formationType,
    positions: input.positions as unknown as Json,
  }
  const { data, error } = await supabase.from('formations').insert(insert).select('*').single()
  if (error) throw error
  return fromRow(data)
}

export async function updateFormation(
  id: string,
  input: { name: string; positions: FormationPosition[] },
): Promise<Formation> {
  const { data, error } = await supabase
    .from('formations')
    .update({ name: input.name, positions: input.positions as unknown as Json })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteFormation(id: string): Promise<void> {
  const { error } = await supabase.from('formations').delete().eq('id', id)
  if (error) throw error
}
