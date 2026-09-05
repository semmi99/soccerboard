import { supabase } from './client'
import type { Json, Tables, TablesInsert, TablesUpdate } from '../../types/database.types'
import type { FrameObject, KitPattern, MarkerShape, PlayerChipData } from '../../features/editor/types'
import { PITCH_STAGE_SIZE } from '../../features/editor/constants'
import {
  getApiFootballLineups,
  getApiFootballSquad,
  translateApiFootballPosition,
  type ApiFootballFixture,
  type ApiFootballLineupPlayer,
  type ApiFootballPlayer,
  type ApiFootballTeam,
} from './apiFootball'
import { extractCrestColors } from './extractCrestColors'
import { saveProject } from './projects'

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
  markerShape: MarkerShape
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
    marker_shape: patch.markerShape,
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

/** A single timestamped scouting-log entry, as opposed to the single
 * overwritable `players.notes` free-text field — several of these can
 * accumulate over multiple sessions/matches for the same player. */
export interface PlayerNote {
  id: string
  playerId: string
  authorId: string | null
  authorName: string | null
  content: string
  createdAt: string
}

export async function listPlayerNotes(playerId: string): Promise<PlayerNote[]> {
  const { data, error } = await supabase
    .from('player_notes')
    .select('id, player_id, author_id, content, created_at, profiles(full_name)')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((n) => ({
    id: n.id,
    playerId: n.player_id,
    authorId: n.author_id,
    authorName: (n.profiles as { full_name: string | null } | null)?.full_name ?? null,
    content: n.content,
    createdAt: n.created_at,
  }))
}

export async function addPlayerNote(playerId: string, authorId: string, content: string): Promise<PlayerNote> {
  const { data, error } = await supabase
    .from('player_notes')
    .insert({ player_id: playerId, author_id: authorId, content })
    .select('id, player_id, author_id, content, created_at, profiles(full_name)')
    .single()
  if (error) throw error
  return {
    id: data.id,
    playerId: data.player_id,
    authorId: data.author_id,
    authorName: (data.profiles as { full_name: string | null } | null)?.full_name ?? null,
    content: data.content,
    createdAt: data.created_at,
  }
}

export async function deletePlayerNote(id: string): Promise<void> {
  const { error } = await supabase.from('player_notes').delete().eq('id', id)
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
  players: Player[]
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
  const createdPlayers: Player[] = []
  for (const p of players) {
    const { firstName, lastName } = splitApiFootballName(p.name)
    const created = await createPlayer({
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
    createdPlayers.push(created)
    done += 1
    onProgress?.(done, players.length)
  }

  return { team, playerCount: players.length, players: createdPlayers }
}

export async function importApiFootballSquad(
  orgId: string,
  apiTeam: ApiFootballTeam,
  players: ApiFootballPlayer[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportApiFootballSquadResult> {
  return importOneApiFootballTeam(orgId, apiTeam, players, onProgress)
}

function parseGrid(grid: string | null): { row: number; col: number } | null {
  const m = grid?.match(/^(\d+):(\d+)$/)
  return m ? { row: Number(m[1]), col: Number(m[2]) } : null
}

/** Matches an API-Football lineup entry to the just-imported, already-
 * persisted Player row for the same person — the lineup and squad
 * endpoints are separate API-Football calls with no shared local id, so
 * jersey number (reliable — squads rarely reuse a number mid-season) is
 * tried first, falling back to a last-name match for the rare case a
 * lineup shows a number the squad list didn't have. */
function matchPersistedPlayer(persisted: Player[], ref: { number: number | null; name: string }): Player | undefined {
  if (ref.number != null) {
    const byNumber = persisted.find((p) => p.jersey_number === ref.number)
    if (byNumber) return byNumber
  }
  const { lastName } = splitApiFootballName(ref.name)
  if (!lastName) return undefined
  return persisted.find((p) => p.last_name.toLowerCase() === lastName.toLowerCase())
}

/** Converts a lineup's startXI into fractional formation coordinates using
 * the same 0..1 "own goal → opponent goal" / "left → right" convention as
 * PRESET_FORMATIONS (see src/features/formations/presets.ts), computed
 * from each player's API-Football grid ("row:col") instead of a fixed
 * preset — row 1 (the goalkeeper) sits deepest, higher rows push forward;
 * within a row, players are spread evenly left-to-right in column order. */
function lineupToFormationPositions(
  startXI: ApiFootballLineupPlayer[],
): Map<number, { x: number; y: number; isGoalkeeper: boolean }> {
  const rows = new Map<number, ApiFootballLineupPlayer[]>()
  for (const p of startXI) {
    const row = parseGrid(p.grid)?.row ?? 1
    const bucket = rows.get(row)
    if (bucket) bucket.push(p)
    else rows.set(row, [p])
  }
  const rowNumbers = [...rows.keys()].sort((a, b) => a - b)
  const maxRow = Math.max(...rowNumbers, 1)

  const result = new Map<number, { x: number; y: number; isGoalkeeper: boolean }>()
  for (const row of rowNumbers) {
    const playersInRow = [...rows.get(row)!].sort((a, b) => (parseGrid(a.grid)?.col ?? 1) - (parseGrid(b.grid)?.col ?? 1))
    const y = maxRow > 1 ? 0.06 + ((row - 1) / (maxRow - 1)) * 0.4 : 0.06
    playersInRow.forEach((p, i) => {
      const x = playersInRow.length > 1 ? 0.12 + (i / (playersInRow.length - 1)) * 0.76 : 0.5
      result.set(p.apiPlayerId, { x, y, isGoalkeeper: row === 1 })
    })
  }
  return result
}

export interface FixtureBoardImportResult {
  projectId: string
  homeTeam: Team
  awayTeam: Team
}

/** Imports both sides of a fixture AND creates a new project with the real
 * published starting-XI lineup already placed on the pitch — substitutes
 * aren't placed as chips, but since they're part of the same imported
 * squad, the editor's own squad panel already shows every player not
 * currently on the pitch as bench (see SquadPanel's `bench` filter), so
 * they show up there automatically with no separate tracking needed.
 *
 * Known gap: a project only links ONE team (`teamId`), so only the HOME
 * side's substitutes are reachable from the squad panel while this
 * project is open — the away roster still exists as a normal team on the
 * Kader page, just not simultaneously bench-visible alongside the home
 * side. Throws if the lineup isn't published yet (common until shortly
 * before kickoff) — the rosters are still imported as normal teams by
 * then, nothing is lost, there's just nothing to place. */
export async function importFixtureToBoard(
  orgId: string,
  createdBy: string,
  fixture: ApiFootballFixture,
  onProgress?: (done: number, total: number) => void,
): Promise<FixtureBoardImportResult> {
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

  const lineups = await getApiFootballLineups(fixture.id, fixture.home.id, fixture.away.id)
  if (!lineups.home?.startXI.length || !lineups.away?.startXI.length) {
    throw new Error(
      `Kader importiert, aber für „${fixture.home.name} vs ${fixture.away.name}“ ist noch keine Aufstellung veröffentlicht.`,
    )
  }

  const homePositions = lineupToFormationPositions(lineups.home.startXI)
  const awayPositions = lineupToFormationPositions(lineups.away.startXI)
  const stage = PITCH_STAGE_SIZE.horizontal

  function placeSide(
    startXI: ApiFootballLineupPlayer[],
    positions: Map<number, { x: number; y: number; isGoalkeeper: boolean }>,
    persisted: Player[],
    team: 'home' | 'away',
    zIndexStart: number,
  ): FrameObject[] {
    return startXI.flatMap((p, i) => {
      const pos = positions.get(p.apiPlayerId)
      if (!pos) return []
      const player = matchPersistedPlayer(persisted, p)
      // Away sits in the mirror image of home's own "own goal → opponent
      // goal" axis, so the two sides face each other across the pitch
      // instead of both advancing toward the same end.
      const formationY = team === 'home' ? pos.y : 1 - pos.y
      const data: PlayerChipData = {
        team,
        number: p.number ?? 0,
        label: player ? `${player.first_name} ${player.last_name}` : p.name,
        playerId: player?.id,
        isGoalkeeper: pos.isGoalkeeper,
      }
      const chip: FrameObject = {
        id: crypto.randomUUID(),
        x: formationY * stage.width,
        y: pos.x * stage.height,
        rotation: 0,
        scale: 1,
        zIndex: zIndexStart + i,
        objectType: 'player_chip',
        data,
      }
      return [chip]
    })
  }

  const chips = [
    ...placeSide(lineups.home.startXI, homePositions, home.players, 'home', 0),
    ...placeSide(lineups.away.startXI, awayPositions, away.players, 'away', lineups.home.startXI.length),
  ]

  const projectId = await saveProject({
    projectId: null,
    orgId,
    createdBy,
    title: `${fixture.home.name} vs ${fixture.away.name}`,
    pitchDesign: 'classic_green',
    pitchDesignCustomId: null,
    orientation: 'horizontal',
    teamId: home.team.id,
    zoneGridStyle: 'none',
    zoneGridCustomId: null,
    showPitchMarkings: true,
    showMovementTrails: false,
    playerLabelFormat: 'lastName',
    fieldCrop: 'full',
    fieldMirrored: false,
    pitchLengthM: 105,
    pitchWidthM: 68,
    customKit: null,
    secondaryKit: null,
    activeKitSlot: 'primary',
    frames: [{ id: crypto.randomUUID(), durationMs: 1000, objects: chips }],
  })

  return { projectId, homeTeam: home.team, awayTeam: away.team }
}

export interface PastedSquadEntry {
  firstName: string
  lastName: string
  jerseyNumber: number | null
  position: string | null
}

/** Creates a team from a manually pasted squad list (see
 * parseTransfermarktPaste) — same duplicate-name guard as the API imports,
 * but no crest/kit-color step since there's no image URL to sample from a
 * paste; the admin uploads a crest afterward via the normal team controls
 * if they want one. */
export async function importPastedSquad(
  orgId: string,
  teamName: string,
  entries: PastedSquadEntry[],
): Promise<ImportApiFootballSquadResult> {
  const { data: existing, error: existingError } = await supabase
    .from('teams')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', teamName)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) {
    throw new Error(`„${teamName}“ existiert bereits. Team löschen oder anderen Namen wählen.`)
  }

  const team = await createTeam({ orgId, name: teamName, ageGroup: '', season: '' })

  const createdPlayers: Player[] = []
  for (const entry of entries) {
    const created = await createPlayer({
      teamId: team.id,
      firstName: entry.firstName,
      lastName: entry.lastName,
      jerseyNumber: entry.jerseyNumber,
      position: entry.position ?? '',
      secondaryPosition: '',
      strongFoot: '',
      birthDate: '',
      nationality: '',
      phone: '',
      email: '',
      notes: '',
      attributes: {},
    })
    createdPlayers.push(created)
  }

  return { team, playerCount: entries.length, players: createdPlayers }
}
