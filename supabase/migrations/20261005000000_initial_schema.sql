-- Initial schema. Approved 2026-10-05 (docs/foundation/decision-log.md #2, #3, #4).
-- Clients never write scores, attempts or learning_level directly. They call
-- start_simulation() and submit_answer(); those functions do all scoring.
-- Not run or tested yet: run it in the Supabase SQL editor and report any error.

-- ---------- Types ----------
create type public.app_role as enum ('user', 'admin');
create type public.publish_status as enum ('draft', 'published');
create type public.guide_kind as enum ('small_fix', 'major_repair');

-- ---------- Tables ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role public.app_role not null default 'user',
  learning_level integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.device_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.symptoms (
  id uuid primary key default gen_random_uuid(),
  device_type_id uuid not null references public.device_types (id) on delete cascade,
  name text not null,
  unique (device_type_id, name)
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  symptom_id uuid not null references public.symptoms (id) on delete restrict,
  title text not null,
  kind public.guide_kind not null,
  status public.publish_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.guide_steps (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  instruction text not null,
  unique (guide_id, position)
);

create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides (id) on delete cascade,
  title text not null,
  status public.publish_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.simulation_steps (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations (id) on delete cascade,
  position integer not null check (position > 0),
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  correct_option integer not null check (correct_option >= 0),
  feedback text not null,
  unique (simulation_id, position),
  check (correct_option < jsonb_array_length(options))
);

create table public.simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  simulation_id uuid not null references public.simulations (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  passed boolean
);

create table public.step_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulation_attempts (id) on delete cascade,
  simulation_step_id uuid not null references public.simulation_steps (id) on delete cascade,
  tries integer not null default 1 check (tries between 1 and 2),
  points integer check (points in (0, 1, 2)),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (attempt_id, simulation_step_id)
);

create table public.guide_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  guide_id uuid not null references public.guides (id) on delete cascade,
  last_step_position integer not null default 1 check (last_step_position > 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

-- ---------- Indexes on foreign keys ----------
create index on public.symptoms (device_type_id);
create index on public.guides (symptom_id);
create index on public.guides (status);
create index on public.simulations (guide_id);
create index on public.simulation_attempts (user_id);
create index on public.simulation_attempts (simulation_id);
create index on public.step_results (attempt_id);
create index on public.guide_progress (guide_id);

-- ---------- Starting data (from project-brief.md: phones, tablets, computers) ----------
insert into public.device_types (name) values ('Phone'), ('Tablet'), ('Computer');

-- ---------- Automation: profile is created on signup ----------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Admin check (security definer avoids recursion in profile policies) ----------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------- Row level security ----------
alter table public.profiles enable row level security;
alter table public.device_types enable row level security;
alter table public.symptoms enable row level security;
alter table public.guides enable row level security;
alter table public.guide_steps enable row level security;
alter table public.simulations enable row level security;
alter table public.simulation_steps enable row level security;
alter table public.simulation_attempts enable row level security;
alter table public.step_results enable row level security;
alter table public.guide_progress enable row level security;

-- profiles: read own (admin reads all); users may change display_name only
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

-- device_types, symptoms: signed-in users read, admin writes
create policy device_types_select on public.device_types for select to authenticated using (true);
create policy device_types_admin on public.device_types for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy symptoms_select on public.symptoms for select to authenticated using (true);
create policy symptoms_admin on public.symptoms for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- guides: users read published, admin reads and writes all
create policy guides_select on public.guides for select to authenticated
  using (status = 'published' or public.is_admin());
create policy guides_admin on public.guides for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy guide_steps_select on public.guide_steps for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.guides g where g.id = guide_id and g.status = 'published')
  );
create policy guide_steps_admin on public.guide_steps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- simulations: visible only when both the simulation and its guide are published
create policy simulations_select on public.simulations for select to authenticated
  using (
    public.is_admin()
    or (
      status = 'published'
      and exists (select 1 from public.guides g where g.id = guide_id and g.status = 'published')
    )
  );
create policy simulations_admin on public.simulations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy simulation_steps_select on public.simulation_steps for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.simulations s
      join public.guides g on g.id = s.guide_id
      where s.id = simulation_id and s.status = 'published' and g.status = 'published'
    )
  );
create policy simulation_steps_admin on public.simulation_steps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Answers stay hidden: signed-in users cannot read correct_option or feedback.
-- submit_answer() reads them. Admins read them through admin_simulation_steps().
revoke select on public.simulation_steps from authenticated;
grant select (id, simulation_id, position, prompt, options) on public.simulation_steps to authenticated;
grant insert, update, delete on public.simulation_steps to authenticated;

-- attempts and results: read own only; written by start_simulation() and submit_answer() (no client write policy)
create policy attempts_select on public.simulation_attempts for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy step_results_select on public.step_results for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.simulation_attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  );

-- guide progress: users manage their own rows
create policy guide_progress_own on public.guide_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- Learning level (decision #4) ----------
-- Points: each passed simulation counts once (small fix 1, major repair 2), retakes do not add.
-- Level: 0 below 1 point, 1 at 1, 2 at 3, 3 at 6, 4 at 10 or more.
create function public.recalculate_learning_level(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_points integer;
  v_level integer;
begin
  select coalesce(sum(case g.kind when 'small_fix' then 1 else 2 end), 0)
    into v_points
  from (
    select distinct a.simulation_id
    from public.simulation_attempts a
    where a.user_id = p_user and a.passed
  ) d
  join public.simulations s on s.id = d.simulation_id
  join public.guides g on g.id = s.guide_id;

  v_level := case
    when v_points >= 10 then 4
    when v_points >= 6 then 3
    when v_points >= 3 then 2
    when v_points >= 1 then 1
    else 0
  end;

  update public.profiles set learning_level = v_level where id = p_user;
  return v_level;
end;
$$;

-- ---------- Start a simulation: reuses an unfinished attempt ----------
create function public.start_simulation(p_simulation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_attempt uuid;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  if not exists (
    select 1 from public.simulations s
    join public.guides g on g.id = s.guide_id
    where s.id = p_simulation_id and s.status = 'published' and g.status = 'published'
  ) then
    raise exception 'Simulation not available';
  end if;

  select id into v_attempt
  from public.simulation_attempts
  where user_id = v_user and simulation_id = p_simulation_id and completed_at is null
  order by started_at desc
  limit 1;

  if v_attempt is null then
    insert into public.simulation_attempts (user_id, simulation_id)
    values (v_user, p_simulation_id)
    returning id into v_attempt;
  end if;

  return v_attempt;
end;
$$;

-- ---------- Score a step (decision #4) ----------
-- Correct on try 1 = 2 points, on try 2 = 1 point. A second wrong answer reveals
-- the correct option and scores 0. A step must be resolved before the next one.
-- When every step is resolved the attempt completes: passed at 80% or more of
-- (steps x 2) points, then the learning level is recalculated.
create function public.submit_answer(p_attempt_id uuid, p_step_id uuid, p_chosen integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_sim uuid;
  v_completed timestamptz;
  v_step record;
  v_res record;
  v_tries integer;
  v_correct boolean;
  v_resolved boolean;
  v_points integer;
  v_steps integer;
  v_resolved_count integer;
  v_total integer;
  v_passed boolean;
  v_done boolean := false;
  v_level integer;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  select simulation_id, completed_at into v_sim, v_completed
  from public.simulation_attempts
  where id = p_attempt_id and user_id = v_user
  for update;

  if not found then
    raise exception 'Attempt not found';
  end if;
  if v_completed is not null then
    raise exception 'Attempt already completed';
  end if;

  select position, correct_option, feedback, jsonb_array_length(options) as n
    into v_step
  from public.simulation_steps
  where id = p_step_id and simulation_id = v_sim;

  if not found then
    raise exception 'Step not found in this simulation';
  end if;
  if p_chosen is null or p_chosen < 0 or p_chosen >= v_step.n then
    raise exception 'Invalid option';
  end if;

  if v_step.position > 1 and not exists (
    select 1
    from public.step_results r
    join public.simulation_steps s on s.id = r.simulation_step_id
    where r.attempt_id = p_attempt_id
      and s.simulation_id = v_sim
      and s.position = v_step.position - 1
      and r.resolved_at is not null
  ) then
    raise exception 'Finish the previous step first';
  end if;

  select * into v_res
  from public.step_results
  where attempt_id = p_attempt_id and simulation_step_id = p_step_id;

  if found and v_res.resolved_at is not null then
    raise exception 'Step already resolved';
  end if;

  v_tries := coalesce(v_res.tries, 0) + 1;
  v_correct := p_chosen = v_step.correct_option;
  v_resolved := v_correct or v_tries >= 2;
  v_points := case
    when v_correct and v_tries = 1 then 2
    when v_correct then 1
    when v_resolved then 0
    else null
  end;

  insert into public.step_results (attempt_id, simulation_step_id, tries, points, resolved_at)
  values (p_attempt_id, p_step_id, v_tries, v_points, case when v_resolved then now() end)
  on conflict (attempt_id, simulation_step_id)
  do update set tries = excluded.tries, points = excluded.points, resolved_at = excluded.resolved_at;

  if v_resolved then
    select count(*) into v_steps from public.simulation_steps where simulation_id = v_sim;
    select count(*), coalesce(sum(points), 0) into v_resolved_count, v_total
    from public.step_results
    where attempt_id = p_attempt_id and resolved_at is not null;

    if v_resolved_count = v_steps then
      v_done := true;
      v_passed := v_total * 5 >= v_steps * 2 * 4;
      update public.simulation_attempts
      set completed_at = now(), passed = v_passed
      where id = p_attempt_id;
      v_level := public.recalculate_learning_level(v_user);
    end if;
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'resolved', v_resolved,
    'points', v_points,
    'feedback', v_step.feedback,
    'correct_option', case when v_resolved then v_step.correct_option end,
    'attempt_completed', v_done,
    'passed', v_passed,
    'learning_level', v_level
  );
end;
$$;

-- ---------- Admin: read full simulation steps including answers ----------
create function public.admin_simulation_steps(p_simulation_id uuid)
returns setof public.simulation_steps
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.simulation_steps
  where simulation_id = p_simulation_id and public.is_admin()
  order by position;
$$;

-- ---------- Function access ----------
revoke execute on function public.recalculate_learning_level(uuid) from public, anon, authenticated;
revoke execute on function public.start_simulation(uuid) from public, anon;
revoke execute on function public.submit_answer(uuid, uuid, integer) from public, anon;
revoke execute on function public.admin_simulation_steps(uuid) from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.start_simulation(uuid) to authenticated;
grant execute on function public.submit_answer(uuid, uuid, integer) to authenticated;
grant execute on function public.admin_simulation_steps(uuid) to authenticated;
grant execute on function public.is_admin() to authenticated;
