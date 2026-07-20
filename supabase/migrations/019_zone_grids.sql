-- Custom zone-grid overlays a coach can draw, name, save, and delete for
-- reuse across projects — same shape as the existing formations table.
create table public.zone_grids (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  lines jsonb not null default '[]'::jsonb, -- [{ orientation: 'vertical'|'horizontal', position: 0..1 }]
  created_at timestamptz not null default now()
);

create index zone_grids_org_id_idx on public.zone_grids (org_id);

alter table public.zone_grids enable row level security;

create policy "zone_grids_all_own_org" on public.zone_grids
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

alter table public.projects add column zone_grid_custom_id uuid references public.zone_grids (id) on delete set null;
