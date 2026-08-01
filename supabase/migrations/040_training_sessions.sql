-- A training session is an ORDERED list of exercises picked from the
-- exercises library, each given its own duration for this particular
-- session (the same drill can run 10 minutes one day and 20 the next, so
-- duration lives on the session item, not the exercise itself). Items are
-- snapshotted (id/name/category/durationMin) rather than foreign-keyed
-- row-by-row, same flattened-jsonb approach as exercises/formations —
-- a session is only ever loaded/edited whole, never queried item-by-item,
-- and a snapshot survives the source exercise later being renamed/deleted.
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  items jsonb not null default '[]'::jsonb, -- { exerciseId, name, category, durationMin }[]
  created_at timestamptz not null default now()
);

create index training_sessions_org_id_idx on public.training_sessions (org_id);

alter table public.training_sessions enable row level security;

create policy "training_sessions_all_own_org" on public.training_sessions
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());
