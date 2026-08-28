import { supabase } from './client'

export interface ApiFootballTeam {
  id: number
  name: string
  logoUrl: string
  /** Nur bei der Team-Suche vorhanden — Fixtures liefern kein Land pro Team. */
  country?: string
}

export interface ApiFootballPlayer {
  apiPlayerId: number
  name: string
  number: number | null
  position: string | null
  photoUrl: string | null
}

export interface ApiFootballFixture {
  id: number
  date: string
  leagueName: string
  home: ApiFootballTeam
  away: ApiFootballTeam
}

/** API-Football only returns 4 broad English position categories — map them
 * to German so imported squads match the rest of the app's vocabulary. */
const POSITION_DE: Record<string, string> = {
  Goalkeeper: 'Torwart',
  Defender: 'Abwehr',
  Midfielder: 'Mittelfeld',
  Attacker: 'Sturm',
}

export function translateApiFootballPosition(position: string | null): string | null {
  if (!position) return position
  return POSITION_DE[position] ?? position
}

export async function searchApiFootballTeams(query: string): Promise<ApiFootballTeam[]> {
  const { data, error } = await supabase.functions.invoke<{ teams?: ApiFootballTeam[]; error?: string }>(
    'import-api-football-squad',
    { body: { action: 'search', query } },
  )
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.teams ?? []
}

export async function getApiFootballSquad(teamId: number): Promise<ApiFootballPlayer[]> {
  const { data, error } = await supabase.functions.invoke<{ players?: ApiFootballPlayer[]; error?: string }>(
    'import-api-football-squad',
    { body: { action: 'squad', teamId } },
  )
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.players ?? []
}

export async function getApiFootballFixtures(teamId: number): Promise<ApiFootballFixture[]> {
  const { data, error } = await supabase.functions.invoke<{ fixtures?: ApiFootballFixture[]; error?: string }>(
    'import-api-football-squad',
    { body: { action: 'fixtures', teamId } },
  )
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.fixtures ?? []
}

export interface ApiFootballLineupPlayer {
  apiPlayerId: number
  name: string
  number: number | null
  /** "row:col" (e.g. "4:2") — row 1 is the goalkeeper, higher rows are more
   * advanced; unset for a bench player that isn't spatially positioned. */
  grid: string | null
}

export interface ApiFootballTeamLineup {
  formation: string | null
  startXI: ApiFootballLineupPlayer[]
  substitutes: ApiFootballLineupPlayer[]
}

export interface ApiFootballFixtureLineups {
  /** null when this fixture's lineup hasn't been published yet (typical
   * for anything more than ~1 hour before kickoff) rather than an error —
   * the fixture itself is real, there's just nothing to place yet. */
  home: ApiFootballTeamLineup | null
  away: ApiFootballTeamLineup | null
}

export async function getApiFootballLineups(
  fixtureId: number,
  homeTeamId: number,
  awayTeamId: number,
): Promise<ApiFootballFixtureLineups> {
  const { data, error } = await supabase.functions.invoke<ApiFootballFixtureLineups & { error?: string }>(
    'import-api-football-squad',
    { body: { action: 'lineups', fixtureId, homeTeamId, awayTeamId } },
  )
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return { home: data?.home ?? null, away: data?.away ?? null }
}
