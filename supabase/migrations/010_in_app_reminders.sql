-- ============================================================================
-- Momentum — In-App Daily Reminders (replaces the email approach)
-- Drops the email cron helper and adds a self-service reminder the app calls
-- on load: if you're in a group and haven't logged today, drop a nudge in your
-- notification bell (once per day). Run in the SQL Editor. Idempotent.
-- ============================================================================

-- 1. Rename the preference column to reflect in-app (not email) reminders.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_reminders'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'reminders_enabled'
  )
  THEN
    ALTER TABLE public.profiles RENAME COLUMN email_reminders TO reminders_enabled;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Remove the email-only helper (no longer used).
DROP FUNCTION IF EXISTS public.users_needing_reminder();

-- 3. Create today's reminder for the calling user, if warranted.
--    SECURITY DEFINER but strictly scoped to auth.uid() — a user can only ever
--    trigger their own reminder. Idempotent per day.
CREATE OR REPLACE FUNCTION public.maybe_create_daily_reminder()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid   UUID := auth.uid();
  wants BOOLEAN;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT reminders_enabled INTO wants FROM public.profiles WHERE id = uid;
  IF NOT COALESCE(wants, true) THEN
    RETURN false;
  END IF;

  -- Reports require a group; skip users who aren't in one.
  IF NOT EXISTS (SELECT 1 FROM public.group_members WHERE user_id = uid) THEN
    RETURN false;
  END IF;

  -- Already logged today — nothing to nudge.
  IF EXISTS (
    SELECT 1 FROM public.daily_reports
    WHERE user_id = uid AND report_date = CURRENT_DATE
  ) THEN
    RETURN false;
  END IF;

  -- Already reminded today — don't duplicate.
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = uid AND type = 'streak_risk' AND created_at::date = CURRENT_DATE
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    uid,
    'streak_risk',
    'Keep your momentum going',
    'You haven''t logged today''s progress yet. A quick check-in keeps your streak alive.',
    '/progress/submit'
  );
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.maybe_create_daily_reminder() TO authenticated;
