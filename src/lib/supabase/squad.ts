import { supabase } from './client'
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.types'

export type Team = Tables<'teams'>
export type Player = Tables<'players'>

export async function listTeams(orgId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('org_id', orgId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createTeam(input: {
  orgId: string
  name: string
  ageGroup: string
  season: string
}): Promise<Team> {
  const insert: TablesInsert<'teams'> = {
    org_id: input.orgId,
    name: input.name,
    age_group: input.ageGroup || null,
    season: input.season || null,
  }
  const { data, error } = await supabase.from('teams').insert(insert).select('*').single()
  if (error) throw error
  return data
}

export async function listPlayers(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export interface PlayerFormValues {
  teamId: string
  firstName: string
  lastName: string
  jerseyNumber: number | null
  position: string
  secondaryPosition: string
  strongFoot: string
  birthDate: string
  nationality: string
  phone: string
  email: string
  notes: string
}

function toInsert(values: PlayerFormValues): TablesInsert<'players'> {
  return {
    team_id: values.teamId,
    first_name: values.firstName,
    last_name: values.lastName,
    jersey_number: values.jerseyNumber,
    position: values.position || null,
    secondary_position: values.secondaryPosition || null,
    strong_foot: values.strongFoot || null,
    birth_date: values.birthDate || null,
    nationality: values.nationality || null,
    phone: values.phone || null,
    email: values.email || null,
    notes: values.notes || null,
  }
}

export async function createPlayer(values: PlayerFormValues): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert(toInsert(values))
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updatePlayer(id: string, values: PlayerFormValues): Promise<Player> {
  const update: TablesUpdate<'players'> = toInsert(values)
  const { data, error } = await supabase
    .from('players')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}
