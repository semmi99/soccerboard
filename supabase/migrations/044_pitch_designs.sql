-- Custom pitch designs a coach can create with their own grass/line colors
-- and save/reuse across projects — same shape as zone_grids (019).
create table public.pitch_designs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  grass_a text not null,
  grass_b text not null,
  line_color text not null,
  created_at timestamptz not null default now()
);

create index pitch_designs_org_id_idx on public.pitch_designs (org_id);

alter table public.pitch_designs enable row level security;

create policy "pitch_designs_all_own_org" on public.pitch_designs
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

alter table public.projects add column pitch_design_custom_id uuid references public.pitch_designs (id) on delete set null;

alter table public.projects drop constraint projects_pitch_design_check;
alter table public.projects
  add constraint projects_pitch_design_check
  check (pitch_design in (
    'classic_green', 'night_navy', 'dark_orange',
    'turquoise', 'royal_blue', 'maroon', 'light_gray', 'brand_blue', 'custom'
  ));
