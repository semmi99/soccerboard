-- Org-scoped user management: lets an org admin see and invite teammates.
--
-- A true "create arbitrary Supabase Auth user" action needs the service-role
-- key, which must never live in a client app — so instead this models an
-- invite: an admin registers an email (+ role) ahead of time, and when
-- someone signs up with that exact email, the existing signup-bootstrap
-- trigger joins them into the inviting org (with the invited role) instead
-- of spinning up a brand-new organization for them.

-- profiles.email, denormalized from auth.users, so the client can list an
-- org's members without needing direct (RLS-unsafe) access to auth.users.
alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null default 'coach' check (role in ('admin', 'coach', 'viewer')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index org_invites_org_id_idx on public.org_invites (org_id);
create index org_invites_email_idx on public.org_invites (lower(email));

-- Same hardening as current_org_id() (see 002_harden_functions.sql): lives in
-- `private` so PostgREST never exposes it as a directly callable RPC route.
create function private.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
$$;

grant execute on function private.is_org_admin() to authenticated;

alter table public.org_invites enable row level security;

create policy "org_invites_admin_all" on public.org_invites
  for all
  using (org_id = private.current_org_id() and private.is_org_admin())
  with check (org_id = private.current_org_id() and private.is_org_admin());

-- Was select-own-row-only, which made it impossible for an admin to see
-- their own org's other members at all.
drop policy "profiles_select_own" on public.profiles;
create policy "profiles_select_own_org" on public.profiles
  for select using (org_id = private.current_org_id());

-- Lets an admin change a teammate's role (still can't touch other orgs).
create policy "profiles_update_admin" on public.profiles
  for update
  using (private.is_org_admin() and org_id = private.current_org_id())
  with check (org_id = private.current_org_id());

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org_id uuid;
  matched_invite record;
begin
  select * into matched_invite
    from public.org_invites
    where lower(email) = lower(new.email) and accepted_at is null
    order by created_at desc
    limit 1;

  if matched_invite.id is not null then
    insert into public.profiles (id, org_id, full_name, role, email)
    values (new.id, matched_invite.org_id, new.raw_user_meta_data ->> 'full_name', matched_invite.role, new.email);

    update public.org_invites set accepted_at = now() where id = matched_invite.id;
  else
    insert into public.organizations (name, subscription_tier)
    values (
      coalesce(new.raw_user_meta_data ->> 'org_name', split_part(new.email, '@', 1) || E'’s Team'),
      'free'
    )
    returning id into new_org_id;

    insert into public.profiles (id, org_id, full_name, role, email)
    values (new.id, new_org_id, new.raw_user_meta_data ->> 'full_name', 'admin', new.email);
  end if;

  return new;
end;
$$;
