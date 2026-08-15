-- The training-session planner (045/046) is being removed — the user
-- tried it and wasn't happy with it. Drop everything it introduced,
-- including any sessions already saved.
drop table if exists public.training_session_players;
drop table if exists public.training_session_exercises;
drop table if exists public.training_sessions;
drop table if exists public.training_prinzipien;
drop table if exists public.training_unterphasen;
