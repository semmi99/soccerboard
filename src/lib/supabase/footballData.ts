import { supabase } from './client'
import type { ApiFootballPlayer, ApiFootballTeam } from './apiFootball'

export interface FootballDataCompetition {
  code: string
  name: string
  area: string
  emblemUrl: string | null
}

/** football-data.org uses granular English position labels (not just the
 * 4 broad API-Football buckets) — map the common ones to the same German
 * vocabulary so imported squads look consistent regardless of provider.
 * Unmapped/unexpected labels pass through unchanged rather than disappearing. */
const POSITION_DE: Record<string, string> = {
  Goalkeeper: 'Torwart',
  'Centre-Back': 'Abwehr',
  'Left-Back': 'Abwehr',
  'Right-Back': 'Abwehr',
  Defence: 'Abwehr',
  'Defensive Midfield': 'Mittelfeld',
  'Central Midfield': 'Mittelfeld',
  'Attacking Midfield': 'Mittelfeld',
  Midfield: 'Mittelfeld',
  'Left Midfield': 'Mittelfeld',
  'Right Midfield': 'Mittelfeld',
  'Left Winger': 'Sturm',
  'Right Winger': 'Sturm',
  'Centre-Forward': 'Sturm',
  Offence: 'Sturm',
}

export function translateFootballDataPosition(position: string | null): string | null {
  if (!position) return position
  return POSITION_DE[position] ?? position
}

async function invoke<T>(action: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(
    'import-football-data-squad',
    { body: { action, ...params } },
  )
  if (error) throw error
  if ((data as { error?: string } | undefined)?.error) throw new Error((data as { error: string }).error)
  return data as T
}

export async function listFootballDataCompetitions(): Promise<FootballDataCompetition[]> {
  const data = await invoke<{ competitions: FootballDataCompetition[] }>('competitions', {})
  return data.competitions ?? []
}

export async function listFootballDataTeams(competitionCode: string): Promise<ApiFootballTeam[]> {
  const data = await invoke<{ teams: { id: number; name: string; crestUrl: string | null }[] }>('teams', {
    competitionCode,
  })
  return (data.teams ?? []).map((t) => ({ id: t.id, name: t.name, logoUrl: t.crestUrl ?? '' }))
}

export interface FootballDataSquad {
  team: ApiFootballTeam
  players: ApiFootballPlayer[]
}

export async function getFootballDataSquad(teamId: number): Promise<FootballDataSquad> {
  const data = await invoke<{
    team: { id: number; name: string; crestUrl: string | null }
    players: { apiPlayerId: number; name: string; number: number | null; position: string | null }[]
  }>('team', { teamId })
  return {
    team: { id: data.team.id, name: data.team.name, logoUrl: data.team.crestUrl ?? '' },
    players: (data.players ?? []).map((p) => ({
      ...p,
      // Translated here (German) rather than left for the shared import
      // helper — that helper's own translateApiFootballPosition only knows
      // API-Football's 4 English buckets, so a football-data.org label like
      // "Centre-Back" would otherwise pass through untranslated.
      position: translateFootballDataPosition(p.position),
      // football-data.org doesn't provide player photos — the shared import
      // helper already treats a missing photoUrl as "no photo", same as any
      // manually added player.
      photoUrl: null,
    })),
  }
}
