-- Timestamped per-player scouting notes — a running log rather than the
-- single overwritable `players.notes` free-text field, so a coach can
-- capture observations across multiple sessions/matches without losing
-- earlier ones (inspired by competitor apps' "player-specific notes"
-- feature for scouts).

create table public.player_notes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index player_notes_player_id_idx on public.player_notes (player_id, created_at desc);

alter table public.player_notes enable row level security;

create policy "player_notes_all_own_org" on public.player_notes
  for all
  using (
    exists (
      select 1 from public.players p
      join public.teams t on t.id = p.team_id
      where p.id = player_notes.player_id
        and t.org_id = private.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.players p
      join public.teams t on t.id = p.team_id
      where p.id = player_notes.player_id
        and t.org_id = private.current_org_id()
    )
  );
