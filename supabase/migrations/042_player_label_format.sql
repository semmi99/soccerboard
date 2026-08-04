-- Board-wide choice for how a player chip's name label is shown: the full
-- "First Last" string (wraps if too wide), just the last name, or first/
-- last forced onto their own line each.
alter table public.projects
  add column player_label_format text not null default 'full'
    check (player_label_format in ('full', 'lastName', 'twoLine'));
