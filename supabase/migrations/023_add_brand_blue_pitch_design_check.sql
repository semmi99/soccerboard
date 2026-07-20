-- brand_blue was added as a selectable pitch design (task: landing-page-brand
-- pitch) but the check constraint was never updated, so saving any project
-- with it (now the default for every new project) would fail outright.
alter table public.projects drop constraint projects_pitch_design_check;
alter table public.projects
  add constraint projects_pitch_design_check
  check (pitch_design in (
    'classic_green', 'night_navy', 'dark_orange',
    'turquoise', 'royal_blue', 'maroon', 'light_gray', 'brand_blue'
  ));
