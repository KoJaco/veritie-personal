-- Helper for tenant-scoped RLS policies.
-- SECURITY DEFINER avoids recursion when policies on `users` reference account_id.

CREATE OR REPLACE FUNCTION public.current_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_id FROM public.users WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION public.current_account_id() IS
  'Returns the account_id for the authenticated Supabase user (auth.users.id = users.id).';
