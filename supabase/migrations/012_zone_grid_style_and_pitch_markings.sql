-- Replaces the boolean show_zone_lines toggle with a zone_grid_style enum
-- (none / thirds_channels / guardiola) so multiple named zone-grid presets
-- can be offered, and adds an independent toggle to hide all pitch markings
-- (lines/boxes/circle) for a blank colored-pitch option.
alter table public.projects
  add column zone_grid_style text not null default 'none'
  check (zone_grid_style in ('none', 'thirds_channels', 'guardiola'));

update public.projects set zone_grid_style = 'thirds_channels' where show_zone_lines = true;

alter table public.projects drop column show_zone_lines;

alter table public.projects
  add column show_pitch_markings boolean not null default true;
