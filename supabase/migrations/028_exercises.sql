-- Reusable training-exercise templates: a saved multi-frame sequence (same
-- shape as a project's frames/frame_objects, just flattened into one jsonb
-- blob instead of normalized rows since a template is never queried/edited
-- frame-by-frame server-side — only ever loaded whole into the editor and
-- appended to whatever project is currently open) that a coach can build
-- once and reuse across many training sessions, same pattern as formations
-- and zone_grids.
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  category text not null default 'Allgemein',
  description text,
  data jsonb not null default '[]'::jsonb, -- EditorFrame[] (id, durationMs, objects)
  created_at timestamptz not null default now()
);

create index exercises_org_id_idx on public.exercises (org_id);

alter table public.exercises enable row level security;

create policy "exercises_all_own_org" on public.exercises
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());
