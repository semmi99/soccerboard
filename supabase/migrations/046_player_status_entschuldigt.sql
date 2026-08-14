-- Widen the training_session_players status check to add "entschuldigt"
-- (excused) alongside aktiv/individuell/krank.
alter table public.training_session_players drop constraint training_session_players_status_check;
alter table public.training_session_players
  add constraint training_session_players_status_check
  check (status in ('aktiv', 'individuell', 'krank', 'entschuldigt'));
