-- Goalkeeper kit (one shared kit per team, not split home/away like outfield
-- players — matches how a keeper's shirt actually works in practice).
alter table public.teams
  add column gk_kit_pattern text not null default 'solid'
    check (gk_kit_pattern in ('solid', 'stripes', 'hoops')),
  add column gk_kit_color1 text not null default '#eab308',
  add column gk_kit_color2 text not null default '#111827';

-- Per-player photo, uploaded by the coach and shown as a small badge on
-- that player's chip in the editor (in addition to / instead of the org
-- logo badge). Same pattern as the org-logos bucket in 005, but
-- namespaced by org id so RLS can scope writes without needing a join
-- from storage.objects to players/teams.
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

create policy "player_photos_own_org_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "player_photos_own_org_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "player_photos_own_org_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  )
  with check (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );

create policy "player_photos_own_org_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] = private.current_org_id()::text
  );
