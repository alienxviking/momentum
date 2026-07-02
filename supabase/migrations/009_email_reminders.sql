-- ============================================================================
-- Momentum — Daily Email Reminders
-- Adds an opt-out preference and a helper the reminder cron calls to find
-- group members who haven't checked in today. Run in the SQL Editor.
-- Idempotent: safe to re-run.
-- ============================================================================

-- Per-user opt-out (defaults on).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN NOT NULL DEFAULT true;

-- Returns group members who have reminders enabled and have NOT submitted a
-- progress report today. Includes the auth email, so this is locked to the
-- service role only (never exposed to clients).
CREATE OR REPLACE FUNCTION public.users_needing_reminder()
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, u.email, p.full_name
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.email_reminders = true
    AND u.email IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.user_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.user_id = p.id AND dr.report_date = CURRENT_DATE
    );
$$;

-- Only the service role (used by the cron route) may list emails.
REVOKE ALL ON FUNCTION public.users_needing_reminder() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.users_needing_reminder() TO service_role;
