-- Storage bucket for club/org logos, uploaded by a coach and shown on their
-- own players' chips in the editor. Public read (logos aren't sensitive and
-- this lets the client render them directly via a public URL); writes are
-- restricted to members of the org the file is namespaced under.

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- storage.buckets has RLS enabled with no default policies, so without this
-- the storage API can't even see the bucket exists for API calls made with a
-- user JWT (bucket listing, and the internal lookups upload/upsert do).
create policy "buckets_select_authenticated" on storage.buckets
  for select to authenticated
  using (true);

-- No public SELECT policy on storage.objects: a public bucket already serves
-- objects via their public URL without one. A broad SELECT policy would let
-- any client list every file in the bucket (flagged by the security advisor).
-- Authenticated users still get scoped SELECT below, which upsert needs to
-- detect the pre-existing row it's about to overwrite.

create policy "org_logos_own_org_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "org_logos_own_org_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "org_logos_own_org_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  )
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "org_logos_own_org_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );
