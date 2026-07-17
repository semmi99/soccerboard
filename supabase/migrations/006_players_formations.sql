-- Phase B2: squad management + formations.

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  jersey_number int,
  position text,
  secondary_position text,
  birth_date date,
  nationality text,
  strong_foot text check (strong_foot in ('Links', 'Rechts', 'Beidfüßig')),
  height_cm int,
  weight_kg int,
  phone text,
  email text,
  notes text,
  photo_url text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index players_team_id_idx on public.players (team_id);

-- Custom formations a coach saves for reuse. Built-in presets (4-4-2, 4-3-3, ...)
-- are plain client-side constants, not stored here.
create table public.formations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  formation_type text not null,
  positions jsonb not null default '[]'::jsonb, -- [{ role, x, y }], x/y normalized 0..1
  created_at timestamptz not null default now()
);

create index formations_org_id_idx on public.formations (org_id);

-- A frame can optionally snap to a saved formation; applying one auto-positions
-- the frame's player chips (handled client-side, this just remembers the link).
alter table public.frames add column formation_id uuid references public.formations (id) on delete set null;

-- Linking a placed player_chip to a real squad player (for name/number lookups,
-- attendance-aware rosters, etc. in later phases).
alter table public.frame_objects add column player_id uuid references public.players (id) on delete set null;

alter table public.players enable row level security;
alter table public.formations enable row level security;

create policy "players_all_own_org" on public.players
  for all
  using (
    exists (
      select 1 from public.teams t
      where t.id = players.team_id
        and t.org_id = private.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.teams t
      where t.id = players.team_id
        and t.org_id = private.current_org_id()
    )
  );

create policy "formations_all_own_org" on public.formations
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());
