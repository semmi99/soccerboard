-- Platform-wide superadmin: full read/write access to every organization's
-- members (not just your own org), plus a per-org "comp/unlimited" override
-- so a coach account can be marked as never hitting free-tier limits.
--
-- is_platform_admin is intentionally NEVER settable through the normal
-- client-facing profiles UPDATE policies — a BEFORE UPDATE trigger pins it
-- to its previous value on every row update coming through PostgREST, so
-- granting it can only ever happen via a direct SQL statement run by us
-- (e.g. through the Supabase MCP tools), never through the app itself.
alter table public.profiles add column is_platform_admin boolean not null default false;
alter table public.organizations add column free_override boolean not null default false;

create or replace function private.pin_is_platform_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_platform_admin = old.is_platform_admin;
  return new;
end;
$$;

create trigger profiles_pin_is_platform_admin
before update on public.profiles
for each row execute function private.pin_is_platform_admin();

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false)
$$;

grant execute on function private.is_platform_admin() to authenticated;

-- Full cross-org visibility/management for platform admins, additive to the
-- existing same-org policies (Postgres OR's multiple permissive policies).
create policy "profiles_all_platform_admin" on public.profiles
  for all
  using (private.is_platform_admin())
  with check (private.is_platform_admin());

create policy "organizations_all_platform_admin" on public.organizations
  for all
  using (private.is_platform_admin())
  with check (private.is_platform_admin());
