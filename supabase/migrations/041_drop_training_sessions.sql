-- The training-session planner feature (migration 040) is being removed —
-- didn't work the way it was meant to, and no other feature depends on
-- this table, so drop it entirely rather than leave dead schema around.
drop table if exists public.training_sessions;
