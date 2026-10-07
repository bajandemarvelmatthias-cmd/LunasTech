-- Personal info on profiles (decision-log.md #32).
-- profiles: first_name, last_name, birthday. Users may edit these and
-- display_name on their own row. Google sign-ups get first and last name (and
-- display_name) filled from the Google account when the profile is created.
-- Existing users are backfilled from their sign-in metadata. Safe to run more
-- than once.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birthday date;

alter table public.profiles
  drop constraint if exists profiles_first_name_length,
  drop constraint if exists profiles_last_name_length,
  drop constraint if exists profiles_birthday_range;

alter table public.profiles
  add constraint profiles_first_name_length check (char_length(first_name) <= 100),
  add constraint profiles_last_name_length check (char_length(last_name) <= 100),
  add constraint profiles_birthday_range check (birthday >= date '1900-01-01');

-- Users change only these columns on their own row (role and learning_level stay locked).
revoke update on public.profiles from authenticated;
grant update (display_name, first_name, last_name, birthday) on public.profiles to authenticated;

-- Profile is created on signup. Google puts given_name / family_name / name in
-- the user metadata; email sign-ups have none, so those columns stay empty.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first text := nullif(btrim(new.raw_user_meta_data ->> 'given_name'), '');
  v_last text := nullif(btrim(new.raw_user_meta_data ->> 'family_name'), '');
  v_full text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), '');
begin
  insert into public.profiles (id, first_name, last_name, display_name)
  values (
    new.id,
    left(v_first, 100),
    left(v_last, 100),
    coalesce(nullif(btrim(concat_ws(' ', v_first, v_last)), ''), v_full)
  );
  return new;
end;
$$;

-- Backfill: existing Google users get their names; nothing already set is overwritten.
update public.profiles p
set
  first_name = coalesce(p.first_name, left(nullif(btrim(u.raw_user_meta_data ->> 'given_name'), ''), 100)),
  last_name = coalesce(p.last_name, left(nullif(btrim(u.raw_user_meta_data ->> 'family_name'), ''), 100)),
  display_name = coalesce(
    p.display_name,
    nullif(btrim(concat_ws(' ', u.raw_user_meta_data ->> 'given_name', u.raw_user_meta_data ->> 'family_name')), ''),
    nullif(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')), '')
  )
from auth.users u
where u.id = p.id;
