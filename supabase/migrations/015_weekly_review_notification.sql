-- ============================================================================
-- Momentum — Weekly Review "ready" notification
-- Updates ensure_weekly_reviews() (from migration 014) to drop a single
-- notification when it generates new reviews. Run in the SQL Editor. Idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_weekly_reviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid            UUID := auth.uid();
  wk_start       DATE := (date_trunc('week', CURRENT_DATE)::date - 7); -- last week's Monday
  wk_end         DATE := (date_trunc('week', CURRENT_DATE)::date - 1); -- last week's Sunday
  prev_start     DATE := (date_trunc('week', CURRENT_DATE)::date - 14);
  prev_end       DATE := (date_trunc('week', CURRENT_DATE)::date - 8);
  inserted_count INT;
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.weekly_reviews (
    user_id, group_id, week_start,
    total_hours, habits_completed, habits_missed, streak_change, group_ranking
  )
  SELECT
    uid,
    gm.group_id,
    wk_start,
    COALESCE((
      SELECT SUM(dr.hours_worked) FROM public.daily_reports dr
      WHERE dr.user_id = uid AND dr.group_id = gm.group_id
        AND dr.report_date BETWEEN wk_start AND wk_end
    ), 0),
    (
      SELECT COUNT(*) FROM public.habit_logs hl
      WHERE hl.user_id = uid AND hl.is_completed
        AND hl.completion_date BETWEEN wk_start AND wk_end
    ),
    GREATEST(0,
      (SELECT COUNT(*) FROM public.habits h
         WHERE h.user_id = uid AND h.is_active AND h.frequency = 'daily') * 7
      - (SELECT COUNT(*) FROM public.habit_logs hl
           WHERE hl.user_id = uid AND hl.is_completed
             AND hl.completion_date BETWEEN wk_start AND wk_end)
    ),
    (SELECT COUNT(DISTINCT hl.completion_date) FROM public.habit_logs hl
       WHERE hl.user_id = uid AND hl.is_completed AND hl.completion_date BETWEEN wk_start AND wk_end)
    - (SELECT COUNT(DISTINCT hl.completion_date) FROM public.habit_logs hl
         WHERE hl.user_id = uid AND hl.is_completed AND hl.completion_date BETWEEN prev_start AND prev_end),
    (SELECT r.rnk FROM (
       SELECT gm2.user_id, RANK() OVER (ORDER BY COALESCE(p.accountability_score, 50) DESC) AS rnk
       FROM public.group_members gm2
       JOIN public.profiles p ON p.id = gm2.user_id
       WHERE gm2.group_id = gm.group_id
     ) r WHERE r.user_id = uid)
  FROM public.group_members gm
  WHERE gm.user_id = uid
  ON CONFLICT (user_id, group_id, week_start) DO NOTHING;

  -- If this run actually produced new review(s), drop a single "ready"
  -- notification (once per week, guarded against duplicates).
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count > 0 AND NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = uid AND type = 'weekly_review' AND created_at >= wk_start
  ) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      uid,
      'weekly_review',
      'Your weekly review is ready',
      'See how last week went and set your intention for the next.',
      '/reviews/weekly'
    );
  END IF;
END;
$$;
