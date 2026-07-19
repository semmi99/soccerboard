create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (including anonymous website visitors) may submit the contact
-- form. There is intentionally no select policy: messages are only
-- readable via the Supabase dashboard (service role), not through the
-- public API.
create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert to anon, authenticated
  with check (true);
