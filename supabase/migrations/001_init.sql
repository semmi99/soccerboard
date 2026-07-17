-- TacticBoard Pro — Phase 1 (Editor MVP) schema
-- Core entities: organizations, profiles, teams, projects, frames, frame_objects.
-- players / formations / exercises / subscriptions are added in later migrations (B2/B3).

create extension if not exists "pgcrypto";

-- ORGANIZATIONS -------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  primary_color text not null default '#7c3aed',
  secondary_color text not null default '#0f0f1a',
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'club')),
  created_at timestamptz not null default now()
);

-- PROFILES (1:1 with auth.users) --------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'coach', 'viewer')),
  created_at timestamptz not null default now()
);

create index profiles_org_id_idx on public.profiles (org_id);

-- TEAMS -----------------------------------------------------------------------

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  age_group text,
  season text,
  created_at timestamptz not null default now()
);

create index teams_org_id_idx on public.teams (org_id);

-- PROJECTS ----------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  title text not null default 'Neues Projekt',
  type text not null default 'tactic' check (type in ('tactic', 'training', 'match')),
  thumbnail_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_org_id_idx on public.projects (org_id);
create index projects_team_id_idx on public.projects (team_id);

-- FRAMES ----------------------------------------------------------------------

create table public.frames (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  order_index int not null default 0,
  duration_ms int not null default 1000,
  created_at timestamptz not null default now()
);

create index frames_project_id_idx on public.frames (project_id);

-- FRAME_OBJECTS -----------------------------------------------------------

create table public.frame_objects (
  id uuid primary key default gen_random_uuid(),
  frame_id uuid not null references public.frames (id) on delete cascade,
  object_type text not null check (
    object_type in ('player_chip', 'arrow', 'shape', 'text', 'training_equipment', 'ball')
  ),
  data jsonb not null default '{}'::jsonb,
  x double precision not null default 0,
  y double precision not null default 0,
  rotation double precision not null default 0,
  scale double precision not null default 1,
  z_index int not null default 0,
  created_at timestamptz not null default now()
);

create index frame_objects_frame_id_idx on public.frame_objects (frame_id);

-- HELPER FUNCTIONS ------------------------------------------------------------

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- SIGNUP BOOTSTRAP: auto-create an organization + profile for every new user ---

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into public.organizations (name, subscription_tier)
  values (
    coalesce(new.raw_user_meta_data ->> 'org_name', split_part(new.email, '@', 1) || E'’s Team'),
    'free'
  )
  returning id into new_org_id;

  insert into public.profiles (id, org_id, full_name, role)
  values (new.id, new_org_id, new.raw_user_meta_data ->> 'full_name', 'admin');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY -----------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.projects enable row level security;
alter table public.frames enable row level security;
alter table public.frame_objects enable row level security;

create policy "org_select_own" on public.organizations
  for select using (id = public.current_org_id());

create policy "org_update_own" on public.organizations
  for update using (id = public.current_org_id());

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

create policy "teams_all_own_org" on public.teams
  for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "projects_all_own_org" on public.projects
  for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "frames_all_own_org" on public.frames
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = frames.project_id
        and p.org_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = frames.project_id
        and p.org_id = public.current_org_id()
    )
  );

create policy "frame_objects_all_own_org" on public.frame_objects
  for all
  using (
    exists (
      select 1 from public.frames f
      join public.projects p on p.id = f.project_id
      where f.id = frame_objects.frame_id
        and p.org_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.frames f
      join public.projects p on p.id = f.project_id
      where f.id = frame_objects.frame_id
        and p.org_id = public.current_org_id()
    )
  );
