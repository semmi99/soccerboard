-- Team crest/badge, uploaded by the coach and shown on every player chip of
-- that team INSTEAD of the kit colors (a badge doesn't have a home/away
-- variant, so it's stored once per team, not per kit side).
alter table public.teams add column crest_url text;

-- Same pattern as the player-photos bucket in 008: public bucket, writes
-- scoped by org id folder prefix so RLS doesn't need a join to teams.
insert into storage.buckets (id, name, public)
values ('team-crests', 'team-crests', true)
on conflict (id) do nothing;

create policy "team_crests_own_org_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'team-crests'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "team_crests_own_org_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'team-crests'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "team_crests_own_org_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'team-crests'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  )
  with check (
    bucket_id = 'team-crests'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "team_crests_own_org_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'team-crests'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );
