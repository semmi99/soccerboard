-- Adds three more generic (non-branded) kit patterns to the designer:
-- sash (diagonal band), split (vertical halves), collar (accent trim).
alter table public.teams drop constraint teams_home_kit_pattern_check;
alter table public.teams
  add constraint teams_home_kit_pattern_check
  check (home_kit_pattern in ('solid', 'stripes', 'hoops', 'sash', 'split', 'collar'));

alter table public.teams drop constraint teams_away_kit_pattern_check;
alter table public.teams
  add constraint teams_away_kit_pattern_check
  check (away_kit_pattern in ('solid', 'stripes', 'hoops', 'sash', 'split', 'collar'));

alter table public.teams drop constraint teams_gk_kit_pattern_check;
alter table public.teams
  add constraint teams_gk_kit_pattern_check
  check (gk_kit_pattern in ('solid', 'stripes', 'hoops', 'sash', 'split', 'collar'));
