-- A second, independently-saved kit set per project ("Eigenes Team" /
-- "Gegner") so a coach sketching an opponent's shape doesn't have to
-- reconfigure colors every time they switch which side they're drawing —
-- one click swaps which slot is currently in effect (see
-- editorStore's swapKitSlot).
alter table public.projects
  add column secondary_kit_override jsonb null,
  add column active_kit_slot text not null default 'primary'
    check (active_kit_slot in ('primary', 'secondary'));
