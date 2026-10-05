-- Smoke test for the initial schema (decisions #3 and #4).
-- Run it in the Supabase SQL editor AFTER the migration. It creates a fake
-- user and test content, checks scoring, hidden answers and admin rights,
-- then rolls everything back. Nothing is kept.
-- Result: "SMOKE TEST PASSED" in the messages, or an error naming what failed.
-- Written without being run (no database was available): if it errors on a
-- line that is not an assertion, the script itself may need a fix.

begin;

do $$
declare
  v_user uuid := gen_random_uuid();
  v_device uuid;
  v_symptom uuid;
  v_guide uuid;
  v_sim uuid;
  v_s1 uuid;
  v_s2 uuid;
  v_attempt uuid;
  v_attempt2 uuid;
  v_res jsonb;
  v_blocked boolean;
  v_n integer;
  v_level integer;
begin
  -- Setup as the database owner: user (profile comes from the trigger) and content.
  insert into auth.users (id, email) values (v_user, 'smoke-test@example.invalid');
  assert exists (select 1 from public.profiles where id = v_user), 'profile was not created on signup';

  select id into v_device from public.device_types where name = 'Phone';
  insert into public.symptoms (device_type_id, name) values (v_device, 'smoke symptom') returning id into v_symptom;
  insert into public.guides (symptom_id, title, kind, status)
    values (v_symptom, 'smoke guide', 'small_fix', 'published') returning id into v_guide;
  insert into public.simulations (guide_id, title, status)
    values (v_guide, 'smoke sim', 'published') returning id into v_sim;
  insert into public.simulation_steps (simulation_id, position, prompt, options, correct_option, feedback)
    values (v_sim, 1, 'q1', '["a","b","c"]', 1, 'f1') returning id into v_s1;
  insert into public.simulation_steps (simulation_id, position, prompt, options, correct_option, feedback)
    values (v_sim, 2, 'q2', '["a","b"]', 0, 'f2') returning id into v_s2;

  -- Act as the signed-in (non-admin) user.
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_user::text, true);
  execute 'set local role authenticated';

  -- Hidden answers: users cannot read correct_option or feedback.
  v_blocked := false;
  begin
    perform correct_option from public.simulation_steps limit 1;
  exception when insufficient_privilege then v_blocked := true;
  end;
  assert v_blocked, 'user could read correct_option';

  -- Users can read what they need and nothing about answers.
  select count(*) into v_n from public.simulation_steps where simulation_id = v_sim;
  assert v_n = 2, 'user could not read published simulation steps';

  -- Users cannot write content or promote themselves.
  v_blocked := false;
  begin
    insert into public.guides (symptom_id, title, kind) values (v_symptom, 'x', 'small_fix');
  exception when insufficient_privilege then v_blocked := true;
  end;
  assert v_blocked, 'non-admin could insert a guide';

  v_blocked := false;
  begin
    update public.profiles set role = 'admin' where id = v_user;
  exception when insufficient_privilege then v_blocked := true;
  end;
  assert v_blocked, 'user could change their own role';

  select count(*) into v_n from public.admin_simulation_steps(v_sim);
  assert v_n = 0, 'non-admin could read admin_simulation_steps';

  -- Attempt 1: step 2 first is refused; step 1 right (2 points); step 2 wrong then right (1 point) = 3 of 4 = not passed.
  v_attempt := public.start_simulation(v_sim);
  assert public.start_simulation(v_sim) = v_attempt, 'unfinished attempt was not reused';

  v_blocked := false;
  begin
    perform public.submit_answer(v_attempt, v_s2, 0);
  exception when others then v_blocked := true;
  end;
  assert v_blocked, 'step 2 was accepted before step 1';

  v_res := public.submit_answer(v_attempt, v_s1, 1);
  assert (v_res->>'correct')::boolean and (v_res->>'points')::integer = 2, 'first-try correct should score 2';

  v_res := public.submit_answer(v_attempt, v_s2, 1);
  assert not (v_res->>'correct')::boolean and not (v_res->>'resolved')::boolean, 'first wrong answer should not resolve';

  v_res := public.submit_answer(v_attempt, v_s2, 0);
  assert (v_res->>'points')::integer = 1, 'second-try correct should score 1';
  assert (v_res->>'attempt_completed')::boolean, 'attempt should complete after the last step';
  assert not (v_res->>'passed')::boolean, '3 of 4 points must not pass (needs 80%)';

  select learning_level into v_level from public.profiles where id = v_user;
  assert v_level = 0, 'level should stay 0 after a failed attempt';

  -- Attempt 2: both right first try = 4 of 4, passed; small fix = 1 point = level 1.
  v_attempt2 := public.start_simulation(v_sim);
  assert v_attempt2 <> v_attempt, 'a completed attempt must not be reused';
  perform public.submit_answer(v_attempt2, v_s1, 1);
  v_res := public.submit_answer(v_attempt2, v_s2, 0);
  assert (v_res->>'passed')::boolean, '4 of 4 points should pass';
  assert (v_res->>'learning_level')::integer = 1, 'one passed small fix should give level 1';

  -- Admin rights: promote the user as the owner, then check admin reads and writes.
  execute 'reset role';
  update public.profiles set role = 'admin' where id = v_user;
  execute 'set local role authenticated';

  select count(*) into v_n from public.admin_simulation_steps(v_sim);
  assert v_n = 2, 'admin could not read admin_simulation_steps';
  insert into public.guides (symptom_id, title, kind) values (v_symptom, 'admin draft', 'major_repair');

  execute 'reset role';
  raise notice 'SMOKE TEST PASSED';
end;
$$;

rollback;
