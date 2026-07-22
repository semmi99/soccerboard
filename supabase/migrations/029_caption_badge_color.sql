-- The frame-caption badge gets its own configurable color (previously
-- hardcoded red in the client) alongside the existing caption_x/caption_y
-- position columns, which are now used to store the badge's own draggable
-- offset rather than sitting unused.
alter table public.frames add column if not exists caption_badge_color text;
