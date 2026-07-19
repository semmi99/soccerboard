-- Adds more pitch color designs and a "field crop" setting (full pitch /
-- half / three-quarter / last third) for zoomed-in corner-kick diagrams.
alter table public.projects drop constraint projects_pitch_design_check;
alter table public.projects
  add constraint projects_pitch_design_check
  check (pitch_design in (
    'classic_green', 'night_navy', 'dark_orange',
    'turquoise', 'royal_blue', 'maroon', 'light_gray'
  ));

alter table public.projects
  add column field_crop text not null default 'full'
  check (field_crop in ('full', 'half', 'three_quarter', 'third'));
