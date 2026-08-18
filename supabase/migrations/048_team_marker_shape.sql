alter table public.teams
  add column marker_shape text not null default 'circle'
  check (marker_shape in ('circle', 'shirt'));
