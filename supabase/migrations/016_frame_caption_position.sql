-- Lets the frame caption block (badge/title/subtitle) be dragged to a
-- custom position in the editor instead of always sitting bottom-left.
alter table public.frames add column caption_x double precision;
alter table public.frames add column caption_y double precision;
