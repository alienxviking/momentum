-- ============================================================================
-- Momentum — Accountability Score Computation
-- Turns the hardcoded "50" into a real, data-driven metric.
-- Run in the SQL Editor. Idempotent: safe to re-run.
--
-- Score (0–100) over a trailing 30-day window, weighted across five factors:
--   30% daily submissions   — % of days with a progress report
--   25% habit consistency   — completed habit logs vs. expected
--   20% goal completion     — completed tasks vs. total tasks in reports
--   15% peer participation  — comments + reactions the user gave
--   10% (100 − missed)      — penalty for days without a submission
-- Users with no habits/tasks yet aren't penalized on those factors (neutral).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_accountability_score(target_user UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  win_days    INT := 30;
  since_date  DATE := CURRENT_DATE - 29;
  since_ts    TIMESTAMPTZ := now() - INTERVAL '30 days';

  submissions      INT;
  active_daily     INT;
  active_weekly    INT;
  expected_habits  NUMERIC;
  completed_habits INT;
  tasks_total      INT;
  tasks_done       INT;
  peer_actions     INT;

  rate_ds      NUMERIC;
  rate_hc      NUMERIC;
  rate_gc      NUMERIC;
  rate_pr      NUMERIC;
  missed_days  INT;
  rate_penalty NUMERIC;

  final_score  INT;
BEGIN
  IF target_user IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Daily submissions (distinct days with a report)
  SELECT COUNT(DISTINCT report_date) INTO submissions
  FROM public.daily_reports
  WHERE user_id = target_user AND report_date >= since_date;
  rate_ds := LEAST(100, submissions * 100.0 / win_days);

  -- 2. Habit consistency (completed logs vs. expected occurrences)
  SELECT
    COUNT(*) FILTER (WHERE frequency = 'daily'),
    COUNT(*) FILTER (WHERE frequency = 'weekly')
  INTO active_daily, active_weekly
  FROM public.habits
  WHERE user_id = target_user AND is_active;

  expected_habits := active_daily * win_days + active_weekly * (win_days / 7.0);

  SELECT COUNT(*) INTO completed_habits
  FROM public.habit_logs
  WHERE user_id = target_user AND is_completed
    AND completion_date >= since_date;

  rate_hc := CASE WHEN expected_habits <= 0 THEN 100
                  ELSE LEAST(100, completed_habits * 100.0 / expected_habits) END;

  -- 3. Goal completion (completed tasks vs. total across reports)
  SELECT
    COALESCE(SUM(jsonb_array_length(tasks_completed)), 0),
    COALESCE(SUM((
      SELECT COUNT(*) FROM jsonb_array_elements(tasks_completed) e
      WHERE (e->>'completed')::boolean
    )), 0)
  INTO tasks_total, tasks_done
  FROM public.daily_reports
  WHERE user_id = target_user AND report_date >= since_date;

  rate_gc := CASE WHEN tasks_total = 0 THEN 100
                  ELSE tasks_done * 100.0 / tasks_total END;

  -- 4. Peer participation (comments + reactions given), target ~1/day
  SELECT
    (SELECT COUNT(*) FROM public.comments  WHERE user_id = target_user AND created_at >= since_ts)
  + (SELECT COUNT(*) FROM public.reactions WHERE user_id = target_user AND created_at >= since_ts)
  INTO peer_actions;
  rate_pr := LEAST(100, peer_actions * 100.0 / win_days);

  -- 5. Missed commitments (days in the window without a submission)
  missed_days := GREATEST(0, win_days - submissions);
  rate_penalty := missed_days * 100.0 / win_days;

  final_score := ROUND(
      0.30 * rate_ds
    + 0.25 * rate_hc
    + 0.20 * rate_gc
    + 0.15 * rate_pr
    + 0.10 * GREATEST(0, 100 - rate_penalty)
  )::int;
  final_score := GREATEST(0, LEAST(100, final_score));

  -- Persist the current score on the profile (drives dashboard + leaderboard).
  UPDATE public.profiles
  SET accountability_score = final_score, updated_at = now()
  WHERE id = target_user;

  -- Keep one historical snapshot per day for trend charts.
  DELETE FROM public.accountability_scores
  WHERE user_id = target_user AND recorded_at::date = CURRENT_DATE;

  INSERT INTO public.accountability_scores (user_id, score, factors)
  VALUES (
    target_user,
    final_score,
    jsonb_build_object(
      'daily_submissions', ROUND(rate_ds),
      'habit_consistency', ROUND(rate_hc),
      'goal_completion', ROUND(rate_gc),
      'peer_review_participation', ROUND(rate_pr),
      'missed_commitments', missed_days
    )
  );

  RETURN final_score;
END;
$$;

-- ----------------------------------------------------------------------------
-- Recompute a user's score whenever their activity changes, so leaderboards
-- stay fresh even if that user never opens their own dashboard.
-- (All these tables have a `user_id` column.)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_score_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_accountability_score(OLD.user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalculate_accountability_score(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_report_recalc_score ON public.daily_reports;
CREATE TRIGGER on_report_recalc_score
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.recalc_score_on_activity();

DROP TRIGGER IF EXISTS on_habit_log_recalc_score ON public.habit_logs;
CREATE TRIGGER on_habit_log_recalc_score
  AFTER INSERT OR UPDATE OR DELETE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION public.recalc_score_on_activity();

DROP TRIGGER IF EXISTS on_comment_recalc_score ON public.comments;
CREATE TRIGGER on_comment_recalc_score
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_score_on_activity();

DROP TRIGGER IF EXISTS on_reaction_recalc_score ON public.reactions;
CREATE TRIGGER on_reaction_recalc_score
  AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.recalc_score_on_activity();
