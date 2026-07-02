-- ============================================================================
-- Momentum — Weekly Reviews
-- Activates the weekly_reviews table: generate a per-group recap of the most
-- recent completed week for the calling user, and let them edit the reflection.
-- Lazy (called on page load) — no scheduler needed. Run in SQL Editor. Idempotent.
-- ============================================================================

-- Allow users to edit their own reflection text (migration 002 only added
-- SELECT + INSERT for weekly_reviews).
DROP POLICY IF EXISTS "Users can update own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can update own weekly reviews"
  ON public.weekly_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Generate the caller's weekly reviews for the most recent completed week,
-- one row per group they're in. Never overwrites an existing row (so edited
-- reflections are preserved).
CREATE OR REPLACE FUNCTION public.ensure_weekly_reviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid        UUID := auth.uid();
  wk_start   DATE := (date_trunc('week', CURRENT_DATE)::date - 7); -- last week's Monday
  wk_end     DATE := (date_trunc('week', CURRENT_DATE)::date - 1); -- last week's Sunday
  prev_start DATE := (date_trunc('week', CURRENT_DATE)::date - 14);
  prev_end   DATE := (date_trunc('week', CURRENT_DATE)::date - 8);
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
    -- Activity momentum: active days this week minus previous week.
    (SELECT COUNT(DISTINCT hl.completion_date) FROM public.habit_logs hl
       WHERE hl.user_id = uid AND hl.is_completed AND hl.completion_date BETWEEN wk_start AND wk_end)
    - (SELECT COUNT(DISTINCT hl.completion_date) FROM public.habit_logs hl
         WHERE hl.user_id = uid AND hl.is_completed AND hl.completion_date BETWEEN prev_start AND prev_end),
    -- Rank within the group by current accountability score.
    (SELECT r.rnk FROM (
       SELECT gm2.user_id, RANK() OVER (ORDER BY COALESCE(p.accountability_score, 50) DESC) AS rnk
       FROM public.group_members gm2
       JOIN public.profiles p ON p.id = gm2.user_id
       WHERE gm2.group_id = gm.group_id
     ) r WHERE r.user_id = uid)
  FROM public.group_members gm
  WHERE gm.user_id = uid
  ON CONFLICT (user_id, group_id, week_start) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_weekly_reviews() TO authenticated;
