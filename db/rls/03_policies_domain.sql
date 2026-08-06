-- Domain table RLS policies (account_id tenant scope).
-- Requires: 00_helpers.sql, 01_enable_rls.sql

-- Macro: all tables with account_id column use the same tenant scope.

CREATE POLICY captures_tenant ON public.captures
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY capture_sources_tenant ON public.capture_sources
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY voice_logs_tenant ON public.voice_logs
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY transcript_segments_tenant ON public.transcript_segments
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY extraction_runs_tenant ON public.extraction_runs
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY extracted_values_tenant ON public.extracted_values
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY source_anchors_tenant ON public.source_anchors
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY timeline_events_tenant ON public.timeline_events
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY veritie_job_leases_tenant ON public.veritie_job_leases
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY tasks_tenant ON public.tasks
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY reminders_tenant ON public.reminders
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY goals_tenant ON public.goals
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY goal_progress_entries_tenant ON public.goal_progress_entries
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY money_entries_tenant ON public.money_entries
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY records_tenant ON public.records
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY resources_tenant ON public.resources
  FOR ALL TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());
