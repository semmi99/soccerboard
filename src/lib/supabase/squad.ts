import { supabase } from './client'
import type { Tables, TablesInsert, TablesUpdate } from '../../types/database.types'
import type { KitPattern } from '../../features/editor/types'

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

export interface TeamKitPatch {
  homeKitPattern: KitPattern
  homeKitColor1: string
  homeKitColor2: string
  awayKitPattern: KitPattern
  awayKitColor1: string
  awayKitColor2: string
  gkKitPattern: KitPattern
  gkKitColor1: string
  gkKitColor2: string
  chipScale: number
}

export async function updateTeamKit(teamId: string, patch: TeamKitPatch): Promise<Team> {
  const update: TablesUpdate<'teams'> = {
    home_kit_pattern: patch.homeKitPattern,
    home_kit_color1: patch.homeKitColor1,
    home_kit_color2: patch.homeKitColor2,
    away_kit_pattern: patch.awayKitPattern,
    away_kit_color1: patch.awayKitColor1,
    away_kit_color2: patch.awayKitColor2,
    gk_kit_pattern: patch.gkKitPattern,
    gk_kit_color1: patch.gkKitColor1,
    gk_kit_color2: patch.gkKitColor2,
    chip_scale: patch.chipScale,
  }
  const { data, error } = await supabase
    .from('teams')
    .update(update)
    .eq('id', teamId)
    .select('*')
    .single()
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

export async function uploadTeamCrest(orgId: string, teamId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${orgId}/${teamId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('team-crests')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('team-crests').getPublicUrl(path)
  const crestUrl = `${data.publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('teams')
    .update({ crest_url: crestUrl })
    .eq('id', teamId)
  if (updateError) throw updateError

  return crestUrl
}

export async function removeTeamCrest(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').update({ crest_url: null }).eq('id', teamId)
  if (error) throw error
}

export async function uploadPlayerPhoto(orgId: string, playerId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${orgId}/${playerId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('player-photos')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
  const photoUrl = `${data.publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('players')
    .update({ photo_url: photoUrl })
    .eq('id', playerId)
  if (updateError) throw updateError

  return photoUrl
}
