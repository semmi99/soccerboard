import { supabase } from './client'
import type { Tables, TablesInsert, Json } from '../../types/database.types'
import type { ZoneGridLine } from '../../features/editor/types'

export type ZoneGridRow = Tables<'zone_grids'>

export interface ZoneGrid {
  id: string
  name: string
  lines: ZoneGridLine[]
}

function fromRow(row: ZoneGridRow): ZoneGrid {
  return {
    id: row.id,
    name: row.name,
    lines: (row.lines as unknown as ZoneGridLine[]) ?? [],
  }
}

export async function listZoneGrids(orgId: string): Promise<ZoneGrid[]> {
  const { data, error } = await supabase
    .from('zone_grids')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  if (error) throw error
  return data.map(fromRow)
}

export async function createZoneGrid(input: {
  orgId: string
  name: string
  lines: ZoneGridLine[]
}): Promise<ZoneGrid> {
  const insert: TablesInsert<'zone_grids'> = {
    org_id: input.orgId,
    name: input.name,
    lines: input.lines as unknown as Json,
  }
  const { data, error } = await supabase.from('zone_grids').insert(insert).select('*').single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteZoneGrid(id: string): Promise<void> {
  const { error } = await supabase.from('zone_grids').delete().eq('id', id)
  if (error) throw error
}
