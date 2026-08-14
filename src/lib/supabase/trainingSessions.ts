import { supabase } from './client'
import type { Tables, TablesInsert } from '../../types/database.types'
import type { PlayerStatus, Schwerpunkt, Spielphase } from '../../features/training/types'

export interface TrainingSessionSummary {
  id: string
  sessionNumber: number
  sessionDate: string
  teamId: string
  teamName: string
  schwerpunkt: string
  spielphase: string
}

export async function listSessions(orgId: string): Promise<TrainingSessionSummary[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('id, session_number, session_date, schwerpunkt, spielphase, team_id, teams(name)')
    .eq('org_id', orgId)
    .order('session_date', { ascending: false })
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    sessionNumber: row.session_number,
    sessionDate: row.session_date,
    teamId: row.team_id,
    teamName: (row.teams as { name: string } | null)?.name ?? '',
    schwerpunkt: row.schwerpunkt,
    spielphase: row.spielphase,
  }))
}

export async function nextSessionNumber(teamId: string): Promise<number> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('session_number')
    .eq('team_id', teamId)
    .order('session_number', { ascending: false })
    .limit(1)
  if (error) throw error
  return (data[0]?.session_number ?? 0) + 1
}

export interface SessionPlayerStatus {
  playerId: string
  status: PlayerStatus
}

export interface SessionExerciseRef {
  exerciseId: string
  exerciseName: string
  exerciseCategory: string
  exerciseDescription: string | null
}

export interface LoadedTrainingSession {
  id: string
  teamId: string
  sessionNumber: number
  sessionDate: string
  schwerpunkt: Schwerpunkt
  spielphase: Spielphase
  unterphaseId: string | null
  prinzipId: string | null
  koerperlich: number | null
  physisch: number | null
  players: SessionPlayerStatus[]
  exercises: SessionExerciseRef[]
}

export async function loadSession(id: string): Promise<LoadedTrainingSession> {
  const { data: session, error: sessionError } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('id', id)
    .single()
  if (sessionError) throw sessionError

  const { data: playerRows, error: playersError } = await supabase
    .from('training_session_players')
    .select('player_id, status')
    .eq('session_id', id)
  if (playersError) throw playersError

  const { data: exerciseRows, error: exercisesError } = await supabase
    .from('training_session_exercises')
    .select('exercise_id, order_index, exercises(name, category, description)')
    .eq('session_id', id)
    .order('order_index', { ascending: true })
  if (exercisesError) throw exercisesError

  return {
    id: session.id,
    teamId: session.team_id,
    sessionNumber: session.session_number,
    sessionDate: session.session_date,
    schwerpunkt: session.schwerpunkt as Schwerpunkt,
    spielphase: session.spielphase as Spielphase,
    unterphaseId: session.unterphase_id,
    prinzipId: session.prinzip_id,
    koerperlich: session.koerperlich,
    physisch: session.physisch,
    players: playerRows.map((p) => ({
      playerId: p.player_id,
      status: p.status as PlayerStatus,
    })),
    exercises: exerciseRows.map((e) => {
      const exercise = e.exercises as { name: string; category: string; description: string | null } | null
      return {
        exerciseId: e.exercise_id,
        exerciseName: exercise?.name ?? '',
        exerciseCategory: exercise?.category ?? '',
        exerciseDescription: exercise?.description ?? null,
      }
    }),
  }
}

export interface SaveSessionInput {
  sessionId: string | null
  orgId: string
  teamId: string
  createdBy: string
  sessionNumber: number
  sessionDate: string
  schwerpunkt: Schwerpunkt
  spielphase: Spielphase
  unterphaseId: string | null
  prinzipId: string | null
  koerperlich: number | null
  physisch: number | null
  players: SessionPlayerStatus[]
  exerciseIds: string[]
}

export async function saveSession(input: SaveSessionInput): Promise<string> {
  const sessionFields = {
    org_id: input.orgId,
    team_id: input.teamId,
    session_number: input.sessionNumber,
    session_date: input.sessionDate,
    schwerpunkt: input.schwerpunkt,
    spielphase: input.spielphase,
    unterphase_id: input.unterphaseId,
    prinzip_id: input.prinzipId,
    koerperlich: input.koerperlich,
    physisch: input.physisch,
  }

  let sessionId = input.sessionId
  if (sessionId) {
    const { error } = await supabase
      .from('training_sessions')
      .update({ ...sessionFields, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) throw error

    const [{ error: deletePlayersError }, { error: deleteExercisesError }] = await Promise.all([
      supabase.from('training_session_players').delete().eq('session_id', sessionId),
      supabase.from('training_session_exercises').delete().eq('session_id', sessionId),
    ])
    if (deletePlayersError) throw deletePlayersError
    if (deleteExercisesError) throw deleteExercisesError
  } else {
    const insert: TablesInsert<'training_sessions'> = { ...sessionFields, created_by: input.createdBy }
    const { data, error } = await supabase
      .from('training_sessions')
      .insert(insert)
      .select('id')
      .single()
    if (error) throw error
    sessionId = data.id
  }

  if (input.players.length > 0) {
    const playerInserts: TablesInsert<'training_session_players'>[] = input.players.map((p) => ({
      session_id: sessionId!,
      player_id: p.playerId,
      status: p.status,
    }))
    const { error } = await supabase.from('training_session_players').insert(playerInserts)
    if (error) throw error
  }

  if (input.exerciseIds.length > 0) {
    const exerciseInserts: TablesInsert<'training_session_exercises'>[] = input.exerciseIds.map(
      (exerciseId, index) => ({
        session_id: sessionId!,
        exercise_id: exerciseId,
        order_index: index,
      }),
    )
    const { error } = await supabase.from('training_session_exercises').insert(exerciseInserts)
    if (error) throw error
  }

  return sessionId
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('training_sessions').delete().eq('id', id)
  if (error) throw error
}

export type TrainingSessionRow = Tables<'training_sessions'>
