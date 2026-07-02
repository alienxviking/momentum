-- ============================================================================
-- Momentum — Web Push Subscriptions
-- Stores browser push subscriptions and exposes a service-role query the push
-- cron uses to reach group members who haven't logged today. Run in SQL Editor.
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage only their own subscriptions.
DROP POLICY IF EXISTS "Manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Subscriptions for group members with reminders on who haven't logged today.
-- Service-role only (the push cron calls it).
CREATE OR REPLACE FUNCTION public.push_subscriptions_needing_reminder()
RETURNS TABLE (user_id UUID, endpoint TEXT, p256dh TEXT, auth TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ps.user_id, ps.endpoint, ps.p256dh, ps.auth
  FROM public.push_subscriptions ps
  JOIN public.profiles p ON p.id = ps.user_id
  WHERE COALESCE(p.reminders_enabled, true) = true
    AND EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.user_id = ps.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.user_id = ps.user_id AND dr.report_date = CURRENT_DATE
    );
$$;

REVOKE ALL ON FUNCTION public.push_subscriptions_needing_reminder() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_subscriptions_needing_reminder() TO service_role;
