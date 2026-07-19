-- Real-world pitch dimensions (meters), used to compute and display
-- pass/run distances for arrows. Defaults to a standard full-size pitch.
alter table public.projects add column pitch_length_m double precision not null default 105;
alter table public.projects add column pitch_width_m double precision not null default 68;
