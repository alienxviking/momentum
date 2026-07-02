-- ============================================================================
-- Momentum — Real Group Leaderboard
-- Computes each member's score, current streak, weekly consistency, and recent
-- score improvement in a single query (was hardcoded to 0 in the app). Run in
-- the SQL Editor. Idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_group_leaderboard(gid UUID)
RETURNS TABLE (
  user_id     UUID,
  full_name   TEXT,
  username    TEXT,
  avatar_url  TEXT,
  score       INT,
  streak      INT,
  consistency INT,
  improvement INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Only members of the group may read its leaderboard.
  WITH allowed AS (
    SELECT 1 WHERE EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = gid AND user_id = auth.uid()
    )
  ),
  members AS (
    SELECT gm.user_id FROM public.group_members gm, allowed WHERE gm.group_id = gid
  ),
  -- Distinct days each member completed at least one habit (last 90 days).
  completed_days AS (
    SELECT DISTINCT hl.user_id, hl.completion_date
    FROM public.habit_logs hl
    JOIN members m ON m.user_id = hl.user_id
    WHERE hl.is_completed AND hl.completion_date >= CURRENT_DATE - 90
  ),
  -- Gaps-and-islands: consecutive dates share (date - row_number).
  islands AS (
    SELECT user_id, completion_date,
           completion_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY completion_date))::int AS grp
    FROM completed_days
  ),
  runs AS (
    SELECT user_id, COUNT(*) AS len, MAX(completion_date) AS last_date
    FROM islands GROUP BY user_id, grp
  ),
  -- The most recent run per user; counts as a streak only if it reaches today/yesterday.
  streaks AS (
    SELECT DISTINCT ON (user_id) user_id, len, last_date
    FROM runs ORDER BY user_id, last_date DESC
  ),
  consist AS (
    SELECT m.user_id,
      (SELECT COUNT(*) FROM public.habit_logs hl
         WHERE hl.user_id = m.user_id AND hl.is_completed AND hl.completion_date >= CURRENT_DATE - 6) AS done,
      (SELECT COUNT(*) FROM public.habits h
         WHERE h.user_id = m.user_id AND h.is_active) AS active
    FROM members m
  ),
  improve AS (
    SELECT m.user_id,
      COALESCE(p.accountability_score, 50) - COALESCE((
        SELECT a.score FROM public.accountability_scores a
        WHERE a.user_id = m.user_id AND a.recorded_at >= CURRENT_DATE - 7
        ORDER BY a.recorded_at ASC LIMIT 1
      ), COALESCE(p.accountability_score, 50)) AS delta
    FROM members m JOIN public.profiles p ON p.id = m.user_id
  )
  SELECT
    m.user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    COALESCE(p.accountability_score, 50)::int AS score,
    COALESCE(CASE WHEN s.last_date >= CURRENT_DATE - 1 THEN s.len ELSE 0 END, 0)::int AS streak,
    CASE WHEN c.active > 0 THEN LEAST(100, ROUND(c.done * 100.0 / (c.active * 7)))::int ELSE 0 END AS consistency,
    COALESCE(i.delta, 0)::int AS improvement
  FROM members m
  JOIN public.profiles p ON p.id = m.user_id
  LEFT JOIN streaks s ON s.user_id = m.user_id
  LEFT JOIN consist c ON c.user_id = m.user_id
  LEFT JOIN improve i ON i.user_id = m.user_id
  ORDER BY score DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(UUID) TO authenticated;
