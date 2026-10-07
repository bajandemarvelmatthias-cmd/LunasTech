-- Nickname, and personal info captured at email sign-up (decision-log.md #33).
-- profiles.nickname: optional, shown in the account menu instead of the full name.
-- handle_new_user now also reads first_name, last_name, birthday and nickname
-- from the sign-up metadata the app sends, so a new account's Profile page is
-- already filled in. Google metadata (given_name, family_name) still works.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists nickname text;

alter table public.profiles
  drop constraint if exists profiles_nickname_length;

alter table public.profiles
  add constraint profiles_nickname_length check (char_length(nickname) <= 50);

-- Users change only these columns on their own row (role and learning_level stay locked).
revoke update on public.profiles from authenticated;
grant update (display_name, first_name, last_name, birthday, nickname) on public.profiles to authenticated;

-- Sign-up metadata is typed by the user (or sent straight to the auth API), so
-- every value is trimmed, length-limited and checked. A bad value is dropped
-- rather than blocking the sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text := nullif(btrim(coalesce(v_meta ->> 'first_name', v_meta ->> 'given_name')), '');
  v_last text := nullif(btrim(coalesce(v_meta ->> 'last_name', v_meta ->> 'family_name')), '');
  v_full text := nullif(btrim(coalesce(v_meta ->> 'full_name', v_meta ->> 'name')), '');
  v_nick text := nullif(btrim(v_meta ->> 'nickname'), '');
  v_bday date;
begin
  begin
    v_bday := (nullif(btrim(v_meta ->> 'birthday'), ''))::date;
    if v_bday < date '1900-01-01' or v_bday > current_date then
      v_bday := null;
    end if;
  exception when others then
    v_bday := null;
  end;

  v_first := left(v_first, 100);
  v_last := left(v_last, 100);

  insert into public.profiles (id, first_name, last_name, birthday, nickname, display_name)
  values (
    new.id,
    v_first,
    v_last,
    v_bday,
    left(v_nick, 50),
    coalesce(nullif(btrim(concat_ws(' ', v_first, v_last)), ''), v_full)
  );
  return new;
end;
$$;
