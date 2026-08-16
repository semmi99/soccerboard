import { supabase } from './client'

export interface ApiFootballTeam {
  id: number
  name: string
  country: string
  logoUrl: string
}

export interface ApiFootballPlayer {
  apiPlayerId: number
  name: string
  number: number | null
  position: string | null
  photoUrl: string | null
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
