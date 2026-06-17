-- ============================================================================
-- Momentum — Auth Trigger + Extended RLS Policies
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor
-- ============================================================================

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Extended RLS Policies
-- ============================================================================

-- Profiles: authenticated users can view any profile (needed for group members, leaderboards)
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Groups: members can view their groups (private groups)
CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR created_by = auth.uid()
    OR id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Groups: authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Groups: only creator can update/delete
CREATE POLICY "Creator can update group"
  ON groups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Creator can delete group"
  ON groups FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Group Members: members can view other members in their groups
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Group Members: users can join groups (insert themselves)
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Group Members: users can leave groups (delete themselves)
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Daily Reports: group members can view reports in their groups
CREATE POLICY "Group members can view reports"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Daily Reports: users can create their own reports
CREATE POLICY "Users can create reports"
  ON daily_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Daily Reports: users can update their own reports
CREATE POLICY "Users can update own reports"
  ON daily_reports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Comments: group members can view comments on reports they can see
CREATE POLICY "Users can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT id FROM daily_reports
      WHERE user_id = auth.uid()
         OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    )
  );

-- Comments: authenticated users can add comments
CREATE POLICY "Users can add comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Reactions: same visibility as comments
CREATE POLICY "Users can view reactions"
  ON reactions FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT id FROM daily_reports
      WHERE user_id = auth.uid()
         OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own reactions"
  ON reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications: users can manage their own
CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Weekly Reviews: same pattern as daily reports
CREATE POLICY "Users can view weekly reviews"
  ON weekly_reviews FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create weekly reviews"
  ON weekly_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Accountability Scores: viewable by group mates
CREATE POLICY "Users can view accountability scores"
  ON accountability_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own scores"
  ON accountability_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Evidence Uploads
CREATE POLICY "Users can view evidence"
  ON evidence_uploads FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT id FROM daily_reports
      WHERE user_id = auth.uid()
         OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload evidence"
  ON evidence_uploads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
