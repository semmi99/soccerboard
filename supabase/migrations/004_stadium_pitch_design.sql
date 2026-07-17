-- Adds the stadium bowl pitch design as a third option alongside classic_green/night_navy.
alter table public.projects drop constraint projects_pitch_design_check;
alter table public.projects
  add constraint projects_pitch_design_check
  check (pitch_design in ('classic_green', 'night_navy', 'stadium_bowl'));
