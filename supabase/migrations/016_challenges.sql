-- ============================================================================
-- Momentum — Group Challenges
-- Time-boxed group goals (e.g. "log 20 reports in 30 days"). Every group member
-- participates; progress is computed from their real activity in the window.
-- Run in the SQL Editor. Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  goal_type   TEXT NOT NULL CHECK (goal_type IN ('reports', 'habits', 'hours')),
  target      NUMERIC NOT NULL CHECK (target > 0),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_group ON public.challenges(group_id);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view challenges" ON public.challenges;
CREATE POLICY "Members can view challenges"
  ON public.challenges FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can create challenges" ON public.challenges;
CREATE POLICY "Members can create challenges"
  ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Creator or admin can delete challenge" ON public.challenges;
CREATE POLICY "Creator or admin can delete challenge"
  ON public.challenges FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Per-member progress toward a challenge, computed from activity in its window.
CREATE OR REPLACE FUNCTION public.get_challenge_progress(cid UUID)
RETURNS TABLE (user_id UUID, full_name TEXT, avatar_url TEXT, progress NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH ch AS (SELECT * FROM public.challenges WHERE id = cid),
  allowed AS (
    SELECT 1 FROM ch
    WHERE EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = ch.group_id AND gm.user_id = auth.uid()
    )
  ),
  members AS (
    SELECT gm.user_id FROM public.group_members gm, ch, allowed WHERE gm.group_id = ch.group_id
  )
  SELECT
    m.user_id,
    p.full_name,
    p.avatar_url,
    CASE (SELECT goal_type FROM ch)
      WHEN 'reports' THEN (
        SELECT COUNT(DISTINCT dr.report_date)::numeric FROM public.daily_reports dr, ch
        WHERE dr.user_id = m.user_id AND dr.group_id = ch.group_id
          AND dr.report_date BETWEEN ch.start_date AND ch.end_date
      )
      WHEN 'habits' THEN (
        SELECT COUNT(*)::numeric FROM public.habit_logs hl, ch
        WHERE hl.user_id = m.user_id AND hl.is_completed
          AND hl.completion_date BETWEEN ch.start_date AND ch.end_date
      )
      WHEN 'hours' THEN COALESCE((
        SELECT SUM(dr.hours_worked) FROM public.daily_reports dr, ch
        WHERE dr.user_id = m.user_id AND dr.group_id = ch.group_id
          AND dr.report_date BETWEEN ch.start_date AND ch.end_date
      ), 0)
      ELSE 0
    END AS progress
  FROM members m
  JOIN public.profiles p ON p.id = m.user_id
  ORDER BY progress DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_challenge_progress(UUID) TO authenticated;
