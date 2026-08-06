/*
 * Post-apply verification for 04_policies_privilege.sql
 *
 * Run in Supabase SQL editor while authenticated as a test user JWT
 * (use "Run as" with a user session, or connect via publishable key + JWT).
 * Service role / pooler bypass RLS — these checks are NOT valid with DATABASE_URL.
 *
 * Expected: INSERT/UPDATE below fail; SELECT succeeds for own tenant.
 */

-- Should fail (permission denied)
INSERT INTO audit_logs (account_id, action)
VALUES (public.current_account_id(), 'phase6-verify');

UPDATE roles SET name = name
WHERE account_id = public.current_account_id();

UPDATE users SET role = 'owner' WHERE id = auth.uid();

INSERT INTO users (id, email, provider, account_id)
VALUES (auth.uid(), 'verify@example.com', 'google', public.current_account_id());

INSERT INTO usage_counters (account_id, period_start, period_end, source)
VALUES (
  public.current_account_id(),
  now(),
  now() + interval '1 day',
  'phase6-verify'
);

INSERT INTO usage_events (account_id, usage_type, quantity, job_id)
VALUES (
  public.current_account_id(),
  'phase6-verify',
  1,
  'job_phase6_verify'
);

INSERT INTO usage_metrics (user_id, metric_type)
VALUES (auth.uid(), 'phase6-verify');

UPDATE usage_metrics SET metric_type = metric_type
WHERE user_id = auth.uid();

-- Should succeed (own tenant read)
SELECT id FROM roles
WHERE account_id = public.current_account_id()
LIMIT 1;

SELECT id, role FROM users WHERE id = auth.uid();

SELECT id FROM usage_counters
WHERE account_id = public.current_account_id()
LIMIT 1;

SELECT id FROM usage_metrics
WHERE user_id = auth.uid()
LIMIT 1;
