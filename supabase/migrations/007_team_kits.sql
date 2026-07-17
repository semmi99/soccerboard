-- Per-team kit design (pattern + colors for home/away chips, chip size),
-- so orgs can distinguish squads visually without using any licensed
-- club/league branding.
alter table public.teams
  add column home_kit_pattern text not null default 'solid'
    check (home_kit_pattern in ('solid', 'stripes', 'hoops')),
  add column home_kit_color1 text not null default '#3b82f6',
  add column home_kit_color2 text not null default '#1e3a8a',
  add column away_kit_pattern text not null default 'solid'
    check (away_kit_pattern in ('solid', 'stripes', 'hoops')),
  add column away_kit_color1 text not null default '#ef4444',
  add column away_kit_color2 text not null default '#7f1d1d',
  add column chip_scale numeric not null default 1.0
    check (chip_scale between 0.6 and 1.6);
