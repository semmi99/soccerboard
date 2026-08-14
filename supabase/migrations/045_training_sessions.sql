-- Training-session planner (admin-only v1). Deliberate do-over of the
-- fully-removed 040/041 attempt: a normalized schema instead of a loose
-- items jsonb blob. Unterphase/Prinzip are org-managed taxonomies the
-- admin creates themselves (same shape as zone_grids/pitch_designs), not
-- fixed lists baked into a check constraint like schwerpunkt/spielphase.

create table public.training_unterphasen (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.training_prinzipien (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  session_number int not null,
  session_date date not null,
  schwerpunkt text not null check (schwerpunkt in
    ('Technik', 'Taktik', 'Athletik', 'Kondition', 'Koordination')),
  spielphase text not null check (spielphase in
    ('Ballbesitz', 'Ballbesitz-Übergang', 'Gegen Ballbesitz', 'Gegen-Ballbesitz-Übergang')),
  unterphase_id uuid references public.training_unterphasen (id) on delete set null,
  prinzip_id uuid references public.training_prinzipien (id) on delete set null,
  koerperlich int check (koerperlich between 1 and 10),
  physisch int check (physisch between 1 and 10),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  status text not null default 'aktiv' check (status in ('aktiv', 'individuell', 'krank')),
  created_at timestamptz not null default now()
);

create table public.training_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index training_unterphasen_org_id_idx on public.training_unterphasen (org_id);
create index training_prinzipien_org_id_idx on public.training_prinzipien (org_id);
create index training_sessions_org_id_idx on public.training_sessions (org_id);
create index training_sessions_team_id_idx on public.training_sessions (team_id);
create index training_session_players_session_id_idx on public.training_session_players (session_id);
create index training_session_exercises_session_id_idx on public.training_session_exercises (session_id);

alter table public.training_unterphasen enable row level security;
alter table public.training_prinzipien enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_session_players enable row level security;
alter table public.training_session_exercises enable row level security;

create policy "training_unterphasen_all_own_org" on public.training_unterphasen
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

create policy "training_prinzipien_all_own_org" on public.training_prinzipien
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

create policy "training_sessions_all_own_org" on public.training_sessions
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

create policy "training_session_players_all_own_org" on public.training_session_players
  for all
  using (exists (
    select 1 from public.training_sessions s
    where s.id = training_session_players.session_id
      and s.org_id = private.current_org_id()
  ))
  with check (exists (
    select 1 from public.training_sessions s
    where s.id = training_session_players.session_id
      and s.org_id = private.current_org_id()
  ));

create policy "training_session_exercises_all_own_org" on public.training_session_exercises
  for all
  using (exists (
    select 1 from public.training_sessions s
    where s.id = training_session_exercises.session_id
      and s.org_id = private.current_org_id()
  ))
  with check (exists (
    select 1 from public.training_sessions s
    where s.id = training_session_exercises.session_id
      and s.org_id = private.current_org_id()
  ));
