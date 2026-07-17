-- Harden helper functions flagged by the Supabase security advisor:
-- 1) mutable search_path on set_updated_at
-- 2) current_org_id/handle_new_user callable via PostgREST RPC as SECURITY DEFINER
--
-- Fix: pin search_path on every function, and move the two helpers that must
-- never be called directly by clients into a `private` schema, which
-- PostgREST does not expose as RPC routes (only `public` is exposed).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Drop dependent policies and the trigger before dropping the functions.
drop policy "org_select_own" on public.organizations;
drop policy "org_update_own" on public.organizations;
drop policy "teams_all_own_org" on public.teams;
drop policy "projects_all_own_org" on public.projects;
drop policy "frames_all_own_org" on public.frames;
drop policy "frame_objects_all_own_org" on public.frame_objects;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.current_org_id();

create function private.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

grant execute on function private.current_org_id() to authenticated;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org_id uuid;
begin
  insert into public.organizations (name, subscription_tier)
  values (
    coalesce(new.raw_user_meta_data ->> 'org_name', split_part(new.email, '@', 1) || E'’s Team'),
    'free'
  )
  returning id into new_org_id;

  insert into public.profiles (id, org_id, full_name, role)
  values (new.id, new_org_id, new.raw_user_meta_data ->> 'full_name', 'admin');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create policy "org_select_own" on public.organizations
  for select using (id = private.current_org_id());
create policy "org_update_own" on public.organizations
  for update using (id = private.current_org_id());

create policy "teams_all_own_org" on public.teams
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

create policy "projects_all_own_org" on public.projects
  for all
  using (org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

create policy "frames_all_own_org" on public.frames
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = frames.project_id
        and p.org_id = private.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = frames.project_id
        and p.org_id = private.current_org_id()
    )
  );

create policy "frame_objects_all_own_org" on public.frame_objects
  for all
  using (
    exists (
      select 1 from public.frames f
      join public.projects p on p.id = f.project_id
      where f.id = frame_objects.frame_id
        and p.org_id = private.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.frames f
      join public.projects p on p.id = f.project_id
      where f.id = frame_objects.frame_id
        and p.org_id = private.current_org_id()
    )
  );
