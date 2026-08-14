import type { EditorFrame } from '../editor/types'
import type { PlayerStatus, Schwerpunkt, Spielphase } from './types'
import type { SessionExerciseRef } from '../../lib/supabase/trainingSessions'

/** Bridges TrainingSessionEditor's in-progress form across the hard
 * navigation to /editor/new and back — sessionStorage instead of a store,
 * since it only needs to survive one route round-trip within the same tab
 * and should never leak into a later, unrelated session. */
const DRAFT_KEY = 'training:draftSession'
const PENDING_EXERCISE_KEY = 'training:pendingExercise'

export interface TrainingSessionDraft {
  sessionId: string | null
  teamId: string | null
  sessionNumber: number
  sessionDate: string
  schwerpunkt: Schwerpunkt
  spielphase: Spielphase
  unterphaseId: string | null
  prinzipId: string | null
  koerperlich: number
  physisch: number
  playerStatuses: Record<string, PlayerStatus>
  exercises: SessionExerciseRef[]
}

export function writeDraftSession(draft: TrainingSessionDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

/** Reads just the sessionId without consuming the draft — used by
 * TrainingPage to decide whether to land on the editor view instead of the
 * session list, before TrainingSessionEditor does the real (consuming)
 * read. Returns undefined when there is no pending draft at all. */
export function peekDraftSessionId(): string | null | undefined {
  const raw = sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return undefined
  try {
    return (JSON.parse(raw) as TrainingSessionDraft).sessionId
  } catch {
    return undefined
  }
}

export function readAndClearDraftSession(): TrainingSessionDraft | null {
  const raw = sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  sessionStorage.removeItem(DRAFT_KEY)
  try {
    return JSON.parse(raw) as TrainingSessionDraft
  } catch {
    return null
  }
}

export type PendingExercise = SessionExerciseRef & { frames: EditorFrame[] }

export function writePendingExercise(exercise: PendingExercise): void {
  sessionStorage.setItem(PENDING_EXERCISE_KEY, JSON.stringify(exercise))
}

export function readAndClearPendingExercise(): PendingExercise | null {
  const raw = sessionStorage.getItem(PENDING_EXERCISE_KEY)
  if (!raw) return null
  sessionStorage.removeItem(PENDING_EXERCISE_KEY)
  try {
    return JSON.parse(raw) as PendingExercise
  } catch {
    return null
  }
}
