-- ============================================================================
-- Momentum — Security Hardening
-- Run this in your Supabase SQL Editor (after migrations 001–005).
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Make the evidence bucket PRIVATE
--    Files were world-readable via public URLs, bypassing evidence_uploads RLS.
--    The app now stores the storage path and serves short-lived signed URLs.
-- ----------------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'evidence';

-- Remove the open read policy and replace with owner + group-member access.
DROP POLICY IF EXISTS "Public Access to Evidence" ON storage.objects;
DROP POLICY IF EXISTS "Evidence readable by owner and group members" ON storage.objects;

CREATE POLICY "Evidence readable by owner and group members"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND (
    -- Owner: files are stored under a folder named for the uploader's user id.
    (storage.foldername(name))[1] = auth.uid()::text
    -- Or a member of the group the evidence's report belongs to.
    OR name IN (
      SELECT eu.file_url
      FROM public.evidence_uploads eu
      JOIN public.daily_reports dr ON dr.id = eu.report_id
      WHERE dr.group_id IN (
        SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
      )
    )
  )
);

-- ----------------------------------------------------------------------------
-- 2. Pin search_path on SECURITY DEFINER functions
--    Prevents search-path hijacking (flagged by Supabase's security advisor).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_by_invite_code(invite_code_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_group_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_group_id FROM public.groups WHERE invite_code = invite_code_param;
  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  BEGIN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (target_group_id, current_user_id, 'member');
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Already a member';
  END;

  RETURN target_group_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Tighten accountability_scores visibility
--    Was USING (true) — every user could read every user's scores.
--    Now: your own scores plus those of people you share a group with.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view accountability scores" ON public.accountability_scores;

CREATE POLICY "Users can view accountability scores"
ON public.accountability_scores FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT gm2.user_id
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- 4. Add missing write policies (features that would silently fail under RLS)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reports" ON public.daily_reports;
CREATE POLICY "Users can delete own reports"
ON public.daily_reports FOR DELETE
TO authenticated
USING (user_id = auth.uid());
