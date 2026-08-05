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

-- Should succeed (own tenant read)
SELECT id FROM roles
WHERE account_id = public.current_account_id()
LIMIT 1;

SELECT id, role FROM users WHERE id = auth.uid();
