-- Allow the new 'quote_card' object type (freely-placeable heading + body
-- callout card) through the frame_objects.object_type check constraint.
alter table public.frame_objects
  drop constraint frame_objects_object_type_check;

alter table public.frame_objects
  add constraint frame_objects_object_type_check
  check (object_type = any (array[
    'player_chip'::text,
    'arrow'::text,
    'shape'::text,
    'text'::text,
    'training_equipment'::text,
    'ball'::text,
    'connector'::text,
    'player_zone'::text,
    'image'::text,
    'quote_card'::text
  ]));
