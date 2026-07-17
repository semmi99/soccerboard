import { supabase } from './client'
import type { Json, Tables, TablesInsert } from '../../types/database.types'
import type { EditorFrame, FrameObject, ObjectType, PitchDesign, PitchOrientation } from '../../features/editor/types'

export interface ProjectSummary {
  id: string
  title: string
  type: string
  thumbnailUrl: string | null
  updatedAt: string
}

function rowToFrameObject(row: Tables<'frame_objects'>): FrameObject {
  return {
    id: row.id,
    objectType: row.object_type as ObjectType,
    x: row.x,
    y: row.y,
    rotation: row.rotation,
    scale: row.scale,
    zIndex: row.z_index,
    // The jsonb `data` column was written by this same client, so it is
    // trusted to match the shape implied by `object_type`.
    data: row.data as FrameObject['data'],
  } as FrameObject
}

export async function listProjects(orgId: string): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, type, thumbnail_url, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    thumbnailUrl: p.thumbnail_url,
    updatedAt: p.updated_at,
  }))
}

export async function countProjects(orgId: string): Promise<number> {
  const { count, error } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (error) throw error
  return count ?? 0
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export interface LoadedProject {
  id: string
  title: string
  pitchDesign: PitchDesign
  orientation: PitchOrientation
  teamId: string | null
  frames: EditorFrame[]
}

export async function loadProject(id: string): Promise<LoadedProject> {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, pitch_design, orientation, team_id')
    .eq('id', id)
    .single()
  if (projectError) throw projectError

  const { data: frameRows, error: framesError } = await supabase
    .from('frames')
    .select('id, duration_ms, order_index')
    .eq('project_id', id)
    .order('order_index', { ascending: true })
  if (framesError) throw framesError

  const frameIds = frameRows.map((f) => f.id)
  const { data: objectRows, error: objectsError } =
    frameIds.length > 0
      ? await supabase.from('frame_objects').select('*').in('frame_id', frameIds)
      : { data: [] as Tables<'frame_objects'>[], error: null }
  if (objectsError) throw objectsError

  const frames: EditorFrame[] = frameRows.map((f) => ({
    id: f.id,
    durationMs: f.duration_ms,
    objects: objectRows.filter((o) => o.frame_id === f.id).map(rowToFrameObject),
  }))

  return {
    id: project.id,
    title: project.title,
    pitchDesign: project.pitch_design as PitchDesign,
    orientation: project.orientation as PitchOrientation,
    teamId: project.team_id,
    frames,
  }
}

export interface SaveProjectInput {
  projectId: string | null
  orgId: string
  createdBy: string
  title: string
  pitchDesign: PitchDesign
  orientation: PitchOrientation
  teamId: string | null
  frames: EditorFrame[]
}

export async function saveProject(input: SaveProjectInput): Promise<string> {
  const projectId = input.projectId ?? (await insertProjectRow(input)).id

  if (input.projectId) {
    const { error } = await supabase
      .from('projects')
      .update({
        title: input.title,
        pitch_design: input.pitchDesign,
        orientation: input.orientation,
        team_id: input.teamId,
      })
      .eq('id', projectId)
    if (error) throw error

    // Full-replace strategy for Phase 1: simplest correct approach for a
    // small per-project frame count; diffing/upserting can come later.
    const { error: deleteError } = await supabase
      .from('frames')
      .delete()
      .eq('project_id', projectId)
    if (deleteError) throw deleteError
  }

  await insertFramesAndObjects(projectId, input.frames)
  return projectId
}

async function insertProjectRow(
  input: SaveProjectInput,
): Promise<{ id: string }> {
  const insert: TablesInsert<'projects'> = {
    org_id: input.orgId,
    created_by: input.createdBy,
    title: input.title,
    type: 'tactic',
    pitch_design: input.pitchDesign,
    orientation: input.orientation,
    team_id: input.teamId,
  }
  const { data, error } = await supabase
    .from('projects')
    .insert(insert)
    .select('id')
    .single()
  if (error) throw error
  return data
}

async function insertFramesAndObjects(projectId: string, frames: EditorFrame[]) {
  if (frames.length === 0) return

  const frameInserts: TablesInsert<'frames'>[] = frames.map((f, index) => ({
    id: f.id,
    project_id: projectId,
    order_index: index,
    duration_ms: f.durationMs,
  }))
  const { error: framesError } = await supabase.from('frames').insert(frameInserts)
  if (framesError) throw framesError

  const objectInserts: TablesInsert<'frame_objects'>[] = frames.flatMap((f) =>
    f.objects.map((o) => ({
      id: o.id,
      frame_id: f.id,
      object_type: o.objectType,
      data: o.data as unknown as Json,
      player_id: o.objectType === 'player_chip' ? (o.data.playerId ?? null) : null,
      x: o.x,
      y: o.y,
      rotation: o.rotation,
      scale: o.scale,
      z_index: o.zIndex,
    })),
  )
  if (objectInserts.length === 0) return

  const { error: objectsError } = await supabase.from('frame_objects').insert(objectInserts)
  if (objectsError) throw objectsError
}
