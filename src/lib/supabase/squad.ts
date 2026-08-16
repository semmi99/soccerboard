import { supabase } from './client'
import type { Json, Tables, TablesInsert, TablesUpdate } from '../../types/database.types'
import type { KitPattern } from '../../features/editor/types'
import type { ApiFootballPlayer } from './apiFootball'

export type Team = Tables<'teams'>
export type Player = Tables<'players'>

/** Five broad scouting-style categories, rated 1-5, saved into the
 * players table's existing (previously unused) `attributes` jsonb column —
 * a quick season-to-season development snapshot rather than a detailed
 * 20+ stat sheet, which would need real match/training data to back it up
 * honestly. */
export const PLAYER_ATTRIBUTE_KEYS = ['technique', 'tactics', 'physical', 'mental', 'pace'] as const
export type PlayerAttributeKey = (typeof PLAYER_ATTRIBUTE_KEYS)[number]
export type PlayerAttributes = Partial<Record<PlayerAttributeKey, number>>

/** Average of whichever attributes have actually been rated — null if none
 * have, so the UI can show "–" instead of a misleading 0. */
export function averagePlayerRating(attributes: unknown): number | null {
  const values = Object.values((attributes as PlayerAttributes) ?? {}).filter(
    (v): v is number => typeof v === 'number',
  )
  if (!values.length) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

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
  /** Only meaningful for a project's custom (no-team) kit — a linked real
   * team's crest lives on the `teams` row instead and isn't touched by this
   * patch. Lets a kit template set the crest alongside pattern/colors. */
  homeCrestUrl?: string | null
  awayCrestUrl?: string | null
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
  attributes: PlayerAttributes
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
    attributes: values.attributes as unknown as Json,
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

/** For a project with no linked team — the crest lives only in that
 * project's own kit_override (see saveProject), so unlike uploadTeamCrest
 * there's no `teams` row to update, just a public URL to hand back. */
export async function uploadCustomCrest(orgId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${orgId}/custom-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('team-crests')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('team-crests').getPublicUrl(path)
  return data.publicUrl
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

/** API-Football gives one "First Last" string — split on the last space so
 * multi-word first names (e.g. "Vinicius Junior" → wait, that's actually a
 * last name in their data; this is a best-effort heuristic, same as any
 * "paste a full name" flow) still land somewhere sensible rather than
 * failing outright. */
function splitApiFootballName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1]! }
}

export interface ImportApiFootballSquadResult {
  team: Team
  playerCount: number
}

/** Creates a brand-new team + its full squad from API-Football data —
 * reuses createTeam/createPlayer as-is, so the result is a completely
 * normal team, editable/deletable afterward exactly like any other. Photo
 * URLs already point at API-Football's own hosting, so they're written
 * directly instead of going through uploadPlayerPhoto (which is only for
 * user-supplied File uploads). */
export async function importApiFootballSquad(
  orgId: string,
  teamName: string,
  players: ApiFootballPlayer[],
): Promise<ImportApiFootballSquadResult> {
  const team = await createTeam({ orgId, name: `${teamName} (API-Football)`, ageGroup: '', season: '' })

  for (const p of players) {
    const { firstName, lastName } = splitApiFootballName(p.name)
    const created = await createPlayer({
      teamId: team.id,
      firstName,
      lastName,
      jerseyNumber: p.number,
      position: p.position ?? '',
      secondaryPosition: '',
      strongFoot: '',
      birthDate: '',
      nationality: '',
      phone: '',
      email: '',
      notes: '',
      attributes: {},
    })
    if (p.photoUrl) {
      const { error } = await supabase.from('players').update({ photo_url: p.photoUrl }).eq('id', created.id)
      if (error) throw error
    }
  }

  return { team, playerCount: players.length }
}
