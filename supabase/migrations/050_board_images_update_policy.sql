-- Project thumbnails are uploaded with a stable per-project path and
-- upsert:true (re-saving overwrites the same file), unlike every other
-- board-images upload so far which always used a fresh random path — so,
-- same as team-crests (020), an explicit update policy is needed alongside
-- the existing insert/select/delete ones.
create policy "board_images_own_org_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  )
  with check (
    bucket_id = 'board-images'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );
