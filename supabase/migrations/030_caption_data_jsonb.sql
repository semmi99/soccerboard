-- The frame caption grew into a richer structure (multiple badges, each
-- with its own color/gradient/position, plus a resizable/movable/
-- gradient-capable title card) that no longer fits cleanly as a handful of
-- flat columns. A single jsonb blob (matching how frame_objects.data and
-- exercises.data already store their own structured shapes) replaces the
-- caption_badge/title/subtitle/badge_color/x/y columns going forward; those
-- older columns are left in place (unused) rather than dropped, since a
-- handful of existing rows may still have simple captions in them.
alter table public.frames add column if not exists caption_data jsonb;
