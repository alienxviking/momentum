-- ============================================================================
-- Momentum — Achievement Stats
-- One-shot aggregate of the calling user's lifetime stats, used to compute
-- which achievements they've unlocked. Run in the SQL Editor. Idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_achievement_stats()
RETURNS TABLE (
  groups_count  INT,
  habits_count  INT,
  reports_count INT,
  peer_actions  INT,
  best_streak   INT,
  score         INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH cd AS (
    SELECT DISTINCT completion_date
    FROM public.habit_logs
    WHERE user_id = auth.uid() AND is_completed
  ),
  islands AS (
    SELECT completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date))::int AS grp
    FROM cd
  ),
  runs AS (
    SELECT COUNT(*) AS len FROM islands GROUP BY grp
  )
  SELECT
    (SELECT COUNT(*) FROM public.group_members WHERE user_id = auth.uid())::int,
    (SELECT COUNT(*) FROM public.habits WHERE user_id = auth.uid())::int,
    (SELECT COUNT(*) FROM public.daily_reports WHERE user_id = auth.uid())::int,
    ((SELECT COUNT(*) FROM public.comments WHERE user_id = auth.uid())
      + (SELECT COUNT(*) FROM public.reactions WHERE user_id = auth.uid()))::int,
    COALESCE((SELECT MAX(len) FROM runs), 0)::int,
    COALESCE((SELECT accountability_score FROM public.profiles WHERE id = auth.uid()), 50)::int;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_achievement_stats() TO authenticated;
