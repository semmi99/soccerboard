-- New "image" frame object type — a user-uploaded picture placed on the
-- pitch (diagram, photo, logo), draggable/resizable like any other object.
alter table public.frame_objects drop constraint frame_objects_object_type_check;
alter table public.frame_objects add constraint frame_objects_object_type_check
  check (object_type in ('player_chip', 'arrow', 'shape', 'text', 'training_equipment', 'ball', 'connector', 'player_zone', 'image'));

-- Same pattern as team-crests (020) and player-photos (008): public bucket,
-- writes scoped by org id folder prefix.
insert into storage.buckets (id, name, public)
values ('board-images', 'board-images', true)
on conflict (id) do nothing;

create policy "board_images_own_org_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "board_images_own_org_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "board_images_own_org_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );
