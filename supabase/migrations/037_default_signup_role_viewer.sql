-- New solo signups (no matching invite, so a brand-new org is created)
-- start as 'viewer' instead of 'admin' — they can no longer self-promote
-- or invite teammates, that now has to be granted manually (by a platform
-- admin) via the existing role-management tools. Invited members already
-- get whatever role the invite specified, unchanged.
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
    values (new.id, new_org_id, new.raw_user_meta_data ->> 'full_name', 'viewer', new.email);
  end if;

  return new;
end;
$$;
