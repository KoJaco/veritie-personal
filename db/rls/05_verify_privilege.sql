/*
 * Post-apply verification for 04_policies_privilege.sql
 *
 * HOW TO RUN (Supabase SQL editor):
 * 1. List app users: SELECT id, email, account_id FROM public.users LIMIT 5;
 * 2. Replace REPLACE_WITH_USERS_ID below with a real public.users.id (auth uid).
 * 3. Run this entire script.
 *
 * Do NOT run as service_role — RLS is bypassed and you will get NOT NULL /
 * constraint errors instead of permission denied.
 *
 * Expected: NOTICE lines "PASS: ... denied" for each write; final SELECT PASS.
 */

-- ▼ Replace with a real public.users.id (same as auth.users.id)
SELECT set_config(
  'request.jwt.claim.sub',
  'REPLACE_WITH_USERS_ID',
  true
);
SET ROLE authenticated;

-- Diagnostics (should show your user id and account id)
SELECT
  auth.uid() AS jwt_user_id,
  public.current_account_id() AS current_account_id,
  current_user AS current_role,
  (SELECT account_id FROM public.users WHERE id = auth.uid()) AS users_account_id;

DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_role_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      'auth.uid() is NULL. Replace REPLACE_WITH_USERS_ID in set_config() with a real public.users.id.';
  END IF;

  SELECT account_id INTO v_account_id
  FROM public.users
  WHERE id = v_user_id;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION
      'No public.users row for auth.uid() = %. Pick a user that exists in public.users.',
      v_user_id;
  END IF;

  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION
      'Running as % which bypasses RLS. Script must run with SET ROLE authenticated after set_config.',
      current_user;
  END IF;

  RAISE NOTICE 'Verifying privilege denials for user % account %', v_user_id, v_account_id;

  -- audit_logs INSERT
  BEGIN
    INSERT INTO public.audit_logs (account_id, action, target_type)
    VALUES (v_account_id, 'phase6-verify', 'account');
    RAISE EXCEPTION 'FAIL: audit_logs INSERT succeeded (should be denied by RLS)';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: audit_logs INSERT denied';
  END;

  -- roles UPDATE
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE account_id = v_account_id
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE NOTICE 'SKIP: roles UPDATE (no role row in tenant)';
  ELSE
    BEGIN
      UPDATE public.roles SET name = name WHERE id = v_role_id;
      RAISE EXCEPTION 'FAIL: roles UPDATE succeeded (should be denied by RLS)';
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'PASS: roles UPDATE denied';
    END;
  END IF;

  -- users UPDATE (privilege escalation)
  BEGIN
    UPDATE public.users SET role = 'owner' WHERE id = v_user_id;
    RAISE EXCEPTION 'FAIL: users UPDATE succeeded (should be denied by RLS)';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: users UPDATE denied';
  END;

  -- users INSERT
  BEGIN
    INSERT INTO public.users (id, email, provider, account_id)
    VALUES (v_user_id, 'verify@example.com', 'google', v_account_id);
    RAISE EXCEPTION 'FAIL: users INSERT succeeded (should be denied by RLS)';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: users INSERT denied';
  END;

  -- usage_counters INSERT
  BEGIN
    INSERT INTO public.usage_counters (account_id, period_start, period_end, source)
    VALUES (
      v_account_id,
      now(),
      now() + interval '1 day',
      'phase6-verify'
    );
    RAISE EXCEPTION 'FAIL: usage_counters INSERT succeeded (should be denied by RLS)';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: usage_counters INSERT denied';
  END;

  -- usage_events INSERT
  BEGIN
    INSERT INTO public.usage_events (account_id, usage_type, quantity, job_id)
    VALUES (v_account_id, 'phase6-verify', 1, 'job_phase6_verify');
    RAISE EXCEPTION 'FAIL: usage_events INSERT succeeded (should be denied by RLS)';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: usage_events INSERT denied';
  END;

  -- usage_metrics INSERT
  BEGIN
    INSERT INTO public.usage_metrics (user_id, metric_type)
    VALUES (v_user_id, 'phase6-verify');
    RAISE EXCEPTION 'FAIL: usage_metrics INSERT succeeded (should be denied by RLS)';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: usage_metrics INSERT denied';
  END;

  -- usage_metrics UPDATE
  BEGIN
    UPDATE public.usage_metrics SET metric_type = metric_type
    WHERE user_id = v_user_id;
    IF NOT FOUND THEN
      RAISE NOTICE 'SKIP: usage_metrics UPDATE (no row for user)';
    ELSE
      RAISE EXCEPTION 'FAIL: usage_metrics UPDATE succeeded (should be denied by RLS)';
    END IF;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: usage_metrics UPDATE denied';
  END;

  -- SELECT sanity (should not raise)
  PERFORM 1 FROM public.roles WHERE account_id = v_account_id LIMIT 1;
  PERFORM 1 FROM public.users WHERE id = v_user_id;
  PERFORM 1 FROM public.usage_counters WHERE account_id = v_account_id LIMIT 1;
  PERFORM 1 FROM public.usage_metrics WHERE user_id = v_user_id LIMIT 1;

  RAISE NOTICE 'PASS: tenant SELECT checks completed';
  RAISE NOTICE 'Done — review PASS/SKIP lines above; any FAIL means privilege SQL is not applied correctly.';
END $$;
