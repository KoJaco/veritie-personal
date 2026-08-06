-- Identity / RBAC / billing RLS policies.
-- Requires: 00_helpers.sql, 01_enable_rls.sql

-- accounts
CREATE POLICY accounts_select ON public.accounts
  FOR SELECT TO authenticated
  USING (id = public.current_account_id());

CREATE POLICY accounts_update ON public.accounts
  FOR UPDATE TO authenticated
  USING (id = public.current_account_id())
  WITH CHECK (id = public.current_account_id());

CREATE POLICY accounts_delete ON public.accounts
  FOR DELETE TO authenticated
  USING (id = public.current_account_id());

-- users
CREATE POLICY users_select ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR account_id = public.current_account_id()
  );

CREATE POLICY users_update ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY users_insert ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- user_profiles
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_profiles_insert ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_preferences
CREATE POLICY user_preferences_select ON public.user_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_preferences_insert ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_preferences_update ON public.user_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- roles
CREATE POLICY roles_tenant ON public.roles
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- role_users
CREATE POLICY role_users_tenant ON public.role_users
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR role_id IN (
      SELECT id FROM public.roles
      WHERE account_id = public.current_account_id()
    )
  )
  WITH CHECK (
    role_id IN (
      SELECT id FROM public.roles
      WHERE account_id = public.current_account_id()
    )
  );

-- permissions
CREATE POLICY permissions_tenant ON public.permissions
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- permission_roles
CREATE POLICY permission_roles_tenant ON public.permission_roles
  FOR ALL TO authenticated
  USING (
    role_id IN (
      SELECT id FROM public.roles
      WHERE account_id = public.current_account_id()
    )
  )
  WITH CHECK (
    role_id IN (
      SELECT id FROM public.roles
      WHERE account_id = public.current_account_id()
    )
  );

-- user_invitations
CREATE POLICY user_invitations_tenant ON public.user_invitations
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- audit_logs
CREATE POLICY audit_logs_tenant ON public.audit_logs
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- notifications
CREATE POLICY notifications_tenant ON public.notifications
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- credit_balances
CREATE POLICY credit_balances_tenant ON public.credit_balances
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- credit_ledger
CREATE POLICY credit_ledger_tenant ON public.credit_ledger
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- usage_counters
CREATE POLICY usage_counters_tenant ON public.usage_counters
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- usage_events
CREATE POLICY usage_events_tenant ON public.usage_events
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- usage_metrics
CREATE POLICY usage_metrics_tenant ON public.usage_metrics
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT id FROM public.users
      WHERE account_id = public.current_account_id()
    )
  )
  WITH CHECK (user_id = auth.uid());

-- subscriptions
CREATE POLICY subscriptions_tenant ON public.subscriptions
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- subscription_items
CREATE POLICY subscription_items_tenant ON public.subscription_items
  FOR ALL TO authenticated
  USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions
      WHERE account_id = public.current_account_id()
    )
  )
  WITH CHECK (
    subscription_id IN (
      SELECT id FROM public.subscriptions
      WHERE account_id = public.current_account_id()
    )
  );
