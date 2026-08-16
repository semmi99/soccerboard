import { supabase } from './client'
import type { Json, Tables, TablesInsert, TablesUpdate } from '../../types/database.types'
import type { KitPattern } from '../../features/editor/types'
import {
  getApiFootballSquad,
  translateApiFootballPosition,
  type ApiFootballFixture,
  type ApiFootballPlayer,
  type ApiFootballTeam,
} from './apiFootball'
import { extractCrestColors } from './extractCrestColors'

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

/** Buckets a free-text position string into the tactical Tor/Abwehr/
 * Mittelfeld/Sturm grouping — matches on keywords so it works for both the
 * manual position vocabulary (Innenverteidigung, Offensives Mittelfeld, ...)
 * and the generic API-Football import labels (Abwehr, Mittelfeld, Sturm). */
export function positionGroup(position: string | null): number {
  if (!position) return 4
  const p = position.toLowerCase()
  if (p.includes('tor')) return 0
  if (p.includes('verteidig') || p.includes('abwehr')) return 1
  if (p.includes('mittelfeld')) return 2
  if (p.includes('flügel') || p.includes('stürmer') || p.includes('sturm')) return 3
  return 4
}

/** Position (Tor→Abwehr→Mittelfeld→Sturm→ohne) → Rückennummer → Name, in
 * dieser Reihenfolge als Tiebreaker — die Standard-Kaderreihenfolge überall,
 * wo Spieler positionsbezogen aufgelistet werden. */
export function comparePlayersByPosition(a: Player, b: Player): number {
  const groupDiff = positionGroup(a.position) - positionGroup(b.position)
  if (groupDiff !== 0) return groupDiff
  const aNum = a.jersey_number
  const bNum = b.jersey_number
  if (aNum != null && bNum != null && aNum !== bNum) return aNum - bNum
  if (aNum != null && bNum == null) return -1
  if (aNum == null && bNum != null) return 1
  return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
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
  /** Nur beim API-Football-Import gesetzt — zeigt direkt auf deren gehostetes
   * Bild, kein Umweg über uploadPlayerPhoto (das ist nur für eigene
   * File-Uploads). Optional, damit das reguläre Spielerformular unverändert bleibt. */
  photoUrl?: string | null
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
    ...(values.photoUrl !== undefined ? { photo_url: values.photoUrl } : {}),
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

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id)
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
 * directly on insert instead of a follow-up update per player. The team
 * takes the club's real name (no suffix), its crest, and a home kit color
 * pair sampled from that crest (API-Football has no kit-color data of its
 * own) — matches the look of manually created teams instead of an
 * obviously-imported-looking placeholder.
 *
 * onProgress is optional UI feedback for the (potentially 20-30 player,
 * one-request-per-player) import loop — there's no bulk-insert endpoint
 * wrapping createPlayer, so a full-squad import can take several seconds. */
async function importOneApiFootballTeam(
  orgId: string,
  apiTeam: ApiFootballTeam,
  players: ApiFootballPlayer[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportApiFootballSquadResult> {
  const { data: existing, error: existingError } = await supabase
    .from('teams')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', apiTeam.name)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) {
    throw new Error(`„${apiTeam.name}“ wurde bereits importiert. Team löschen, um erneut zu importieren.`)
  }

  let team = await createTeam({ orgId, name: apiTeam.name, ageGroup: '', season: '' })

  if (apiTeam.logoUrl) {
    const colors = await extractCrestColors(apiTeam.logoUrl)
    const { data: updated, error: kitError } = await supabase
      .from('teams')
      .update({ crest_url: apiTeam.logoUrl, home_kit_color1: colors.primary, home_kit_color2: colors.secondary })
      .eq('id', team.id)
      .select('*')
      .single()
    if (kitError) throw kitError
    team = updated
  }

  let done = 0
  for (const p of players) {
    const { firstName, lastName } = splitApiFootballName(p.name)
    await createPlayer({
      teamId: team.id,
      firstName,
      lastName,
      jerseyNumber: p.number,
      position: translateApiFootballPosition(p.position) ?? '',
      secondaryPosition: '',
      strongFoot: '',
      birthDate: '',
      nationality: '',
      phone: '',
      email: '',
      notes: '',
      attributes: {},
      photoUrl: p.photoUrl,
    })
    done += 1
    onProgress?.(done, players.length)
  }

  return { team, playerCount: players.length }
}

export async function importApiFootballSquad(
  orgId: string,
  apiTeam: ApiFootballTeam,
  players: ApiFootballPlayer[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportApiFootballSquadResult> {
  return importOneApiFootballTeam(orgId, apiTeam, players, onProgress)
}

export interface ImportApiFootballFixtureResult {
  home: ImportApiFootballSquadResult
  away: ImportApiFootballSquadResult
}

/** Imports both sides of a fixture in one go — fetches each squad, then
 * reuses importOneApiFootballTeam for both, so a scouted upcoming or recent
 * match lands as two ready-to-use teams instead of two separate manual
 * searches. onProgress reports combined progress across both squads. */
export async function importApiFootballFixture(
  orgId: string,
  fixture: ApiFootballFixture,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportApiFootballFixtureResult> {
  const [homePlayers, awayPlayers] = await Promise.all([
    getApiFootballSquad(fixture.home.id),
    getApiFootballSquad(fixture.away.id),
  ])
  const total = homePlayers.length + awayPlayers.length
  let done = 0

  const home = await importOneApiFootballTeam(orgId, fixture.home, homePlayers, (d) => {
    onProgress?.(done + d, total)
  })
  done += homePlayers.length

  const away = await importOneApiFootballTeam(orgId, fixture.away, awayPlayers, (d) => {
    onProgress?.(done + d, total)
  })

  return { home, away }
}
