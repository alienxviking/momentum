-- ============================================================================
-- Momentum — Notification Triggers
-- Generates notifications on the events that matter. Run in the SQL Editor.
-- Idempotent: safe to re-run.
--
-- These run as SECURITY DEFINER because a notification's recipient is a
-- DIFFERENT user than the actor, which the row-level INSERT policy
-- (user_id = auth.uid()) would otherwise forbid.
-- ============================================================================

-- Helper: friendly display name for a user, with a sensible fallback.
CREATE OR REPLACE FUNCTION public.display_name(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT COALESCE(NULLIF(full_name, ''), NULLIF(username, ''), 'Someone')
  FROM public.profiles WHERE id = uid;
$$;

-- ----------------------------------------------------------------------------
-- Comment on a report -> notify the report's author (unless commenting on self)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  report_owner UUID;
BEGIN
  SELECT user_id INTO report_owner FROM public.daily_reports WHERE id = NEW.report_id;
  IF report_owner IS NULL OR report_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    report_owner,
    'comment',
    public.display_name(NEW.user_id) || ' commented on your report',
    left(NEW.content, 120),
    '/reviews'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_notify ON public.comments;
CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- ----------------------------------------------------------------------------
-- Reaction on a report -> notify the report's author (unless reacting to self)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  report_owner UUID;
BEGIN
  SELECT user_id INTO report_owner FROM public.daily_reports WHERE id = NEW.report_id;
  IF report_owner IS NULL OR report_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    report_owner,
    'reaction',
    public.display_name(NEW.user_id) || ' reacted to your report',
    replace(NEW.reaction_type, '_', ' '),
    '/reviews'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reaction_notify ON public.reactions;
CREATE TRIGGER on_reaction_notify
  AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_reaction();

-- ----------------------------------------------------------------------------
-- New group member -> notify the group's creator (unless the creator joined)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_group_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  group_owner UUID;
  group_name TEXT;
BEGIN
  SELECT created_by, name INTO group_owner, group_name
  FROM public.groups WHERE id = NEW.group_id;

  IF group_owner IS NULL OR group_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    group_owner,
    'group_invite',
    public.display_name(NEW.user_id) || ' joined ' || COALESCE(group_name, 'your group'),
    'Say hello and keep each other accountable.',
    '/groups/' || NEW.group_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_join_notify ON public.group_members;
CREATE TRIGGER on_group_join_notify
  AFTER INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_group_join();

-- ----------------------------------------------------------------------------
-- New daily report -> notify every other member of that group
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT
    gm.user_id,
    'friend_progress',
    public.display_name(NEW.user_id) || ' shared a progress update',
    COALESCE(NULLIF(left(NEW.notes, 120), ''), 'Check out their latest report.'),
    '/reviews'
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id
    AND gm.user_id <> NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_report_notify ON public.daily_reports;
CREATE TRIGGER on_report_notify
  AFTER INSERT ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_report();
