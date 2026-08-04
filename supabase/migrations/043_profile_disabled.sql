-- Tracks whether an admin has deactivated a user's account. The actual
-- login block is enforced by Supabase Auth itself (banned_until, set by
-- the admin-set-banned Edge Function using the service-role key) — this
-- column just mirrors that state so the client can show/toggle it without
-- needing service-role access to read auth.users.
alter table public.profiles
  add column disabled boolean not null default false;
