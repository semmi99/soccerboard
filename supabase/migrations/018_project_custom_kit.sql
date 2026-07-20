-- Kit colors chosen when no real team is linked to a project — there's no
-- team row to hang the kit config off of, so it's stored on the project.
alter table public.projects add column kit_override jsonb;
