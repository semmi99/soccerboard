-- Fix a pre-existing bug: the object_type check constraint never included
-- 'connector' or 'player_zone', even though both types have been in use in
-- the app for a while (saving either would fail with a DB constraint error).
alter table public.frame_objects drop constraint frame_objects_object_type_check;
alter table public.frame_objects add constraint frame_objects_object_type_check
  check (object_type in ('player_chip', 'arrow', 'shape', 'text', 'training_equipment', 'ball', 'connector', 'player_zone'));

-- Per-frame caption overlay (step badge + headline + subline), shown as a
-- lower-third on the pitch and included in PNG/video export.
alter table public.frames add column caption_badge text;
alter table public.frames add column caption_title text;
alter table public.frames add column caption_subtitle text;
