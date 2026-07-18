-- Adds a per-project toggle for tactical zone/channel grid lines, and a new
-- dark/orange pitch color theme (generic dark analytics look, no branding).
alter table public.projects
  add column show_zone_lines boolean not null default false;

alter table public.projects drop constraint projects_pitch_design_check;
alter table public.projects
  add constraint projects_pitch_design_check
  check (pitch_design in ('classic_green', 'night_navy', 'dark_orange'));
