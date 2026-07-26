-- Per-user language preference (de/en), so a signed-in user's chosen
-- language follows their account across devices instead of only living in
-- browser localStorage. Nullable: unset falls back to the browser/
-- localStorage-detected language client-side.
alter table public.profiles
  add column locale text;

alter table public.profiles
  add constraint profiles_locale_check
  check (locale is null or locale in ('de', 'en'));
