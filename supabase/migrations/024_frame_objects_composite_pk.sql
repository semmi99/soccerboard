-- "Frame duplizieren" intentionally reuses the same frame_objects.id across
-- the source and duplicated frame (see cloneObject/duplicateFrame in
-- editorStore.ts) so an object's identity persists across frames and can be
-- matched for smooth tweening during playback. But frame_objects.id was the
-- sole primary key, so saving ANY project containing a duplicated frame
-- inserted two rows sharing the same id in one statement — a guaranteed
-- primary-key violation, failing every such save. The same id needs to be
-- insertable once per frame, so the key must include frame_id too.
alter table public.frame_objects drop constraint frame_objects_pkey;
alter table public.frame_objects add primary key (frame_id, id);
