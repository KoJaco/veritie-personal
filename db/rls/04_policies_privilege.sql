/*
 * Privilege-scoped RLS: tenant SELECT on sensitive tables;
 * deny direct authenticated writes.
 *
 * Requires: 00_helpers.sql, 01_enable_rls.sql, 02_policies_identity.sql applied first.
 * App server writes use DATABASE_URL (bypasses RLS). This blocks publishable key + user JWT mutations.
 *
 * Idempotent: safe to re-apply (drops tenant and *_select policies before recreate).
 */

-- roles
DROP POLICY IF EXISTS roles_tenant ON public.roles;
DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- role_users
DROP POLICY IF EXISTS role_users_tenant ON public.role_users;
DROP POLICY IF EXISTS role_users_select ON public.role_users;
CREATE POLICY role_users_select ON public.role_users
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR role_id IN (
      SELECT id FROM public.roles
      WHERE account_id = public.current_account_id()
    )
  );

-- permissions
DROP POLICY IF EXISTS permissions_tenant ON public.permissions;
DROP POLICY IF EXISTS permissions_select ON public.permissions;
CREATE POLICY permissions_select ON public.permissions
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- permission_roles
DROP POLICY IF EXISTS permission_roles_tenant ON public.permission_roles;
DROP POLICY IF EXISTS permission_roles_select ON public.permission_roles;
CREATE POLICY permission_roles_select ON public.permission_roles
  FOR SELECT TO authenticated
  USING (
    role_id IN (
      SELECT id FROM public.roles
      WHERE account_id = public.current_account_id()
    )
  );

-- user_invitations
DROP POLICY IF EXISTS user_invitations_tenant ON public.user_invitations;
DROP POLICY IF EXISTS user_invitations_select ON public.user_invitations;
CREATE POLICY user_invitations_select ON public.user_invitations
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- audit_logs
DROP POLICY IF EXISTS audit_logs_tenant ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- notifications
DROP POLICY IF EXISTS notifications_tenant ON public.notifications;
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- credit_balances
DROP POLICY IF EXISTS credit_balances_tenant ON public.credit_balances;
DROP POLICY IF EXISTS credit_balances_select ON public.credit_balances;
CREATE POLICY credit_balances_select ON public.credit_balances
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- credit_ledger
DROP POLICY IF EXISTS credit_ledger_tenant ON public.credit_ledger;
DROP POLICY IF EXISTS credit_ledger_select ON public.credit_ledger;
CREATE POLICY credit_ledger_select ON public.credit_ledger
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- usage_counters
DROP POLICY IF EXISTS usage_counters_tenant ON public.usage_counters;
DROP POLICY IF EXISTS usage_counters_select ON public.usage_counters;
CREATE POLICY usage_counters_select ON public.usage_counters
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- usage_events
DROP POLICY IF EXISTS usage_events_tenant ON public.usage_events;
DROP POLICY IF EXISTS usage_events_select ON public.usage_events;
CREATE POLICY usage_events_select ON public.usage_events
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- usage_metrics (billing/ops telemetry — server pooler writes only)
DROP POLICY IF EXISTS usage_metrics_tenant ON public.usage_metrics;
DROP POLICY IF EXISTS usage_metrics_select ON public.usage_metrics;
CREATE POLICY usage_metrics_select ON public.usage_metrics
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT id FROM public.users
      WHERE account_id = public.current_account_id()
    )
  );

-- subscriptions
DROP POLICY IF EXISTS subscriptions_tenant ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT TO authenticated
  USING (account_id = public.current_account_id());

-- subscription_items
DROP POLICY IF EXISTS subscription_items_tenant ON public.subscription_items;
DROP POLICY IF EXISTS subscription_items_select ON public.subscription_items;
CREATE POLICY subscription_items_select ON public.subscription_items
  FOR SELECT TO authenticated
  USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions
      WHERE account_id = public.current_account_id()
    )
  );

-- accounts: read own tenant; mutations via server pooler only
DROP POLICY IF EXISTS accounts_update ON public.accounts;
DROP POLICY IF EXISTS accounts_delete ON public.accounts;

-- users: deny JWT updates/inserts (role, account_id, etc. via server pooler only)
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
