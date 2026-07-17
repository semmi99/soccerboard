-- Stadium bowl design removed (not achievable with a flat canvas surround
-- at the sizes this actually renders at). Migrate any saved projects back
-- to classic_green and drop it from the allowed values.
update public.projects set pitch_design = 'classic_green' where pitch_design = 'stadium_bowl';

alter table public.projects drop constraint projects_pitch_design_check;
alter table public.projects
  add constraint projects_pitch_design_check
  check (pitch_design in ('classic_green', 'night_navy'));
