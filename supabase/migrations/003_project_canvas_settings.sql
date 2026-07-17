-- Persist the editor's canvas-level settings (pitch design, orientation) on
-- the project row so they round-trip on save/load, same as frames/frame_objects.

alter table public.projects
  add column pitch_design text not null default 'classic_green'
    check (pitch_design in ('classic_green', 'night_navy')),
  add column orientation text not null default 'vertical'
    check (orientation in ('vertical', 'horizontal'));
