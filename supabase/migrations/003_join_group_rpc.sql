-- ============================================================================
-- Momentum — Join Group By Invite Code RPC
-- Run this in your Supabase SQL Editor to allow joining private groups via invite code
-- ============================================================================

CREATE OR REPLACE FUNCTION public.join_group_by_invite_code(invite_code_param TEXT)
RETURNS UUID AS $$
DECLARE
  target_group_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the ID of the user calling the function
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find the group by invite code
  SELECT id INTO target_group_id FROM groups WHERE invite_code = invite_code_param;

  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Insert the user into the group_members table
  -- If they are already a member, it will throw a unique constraint violation which we handle
  BEGIN
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (target_group_id, current_user_id, 'member');
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Already a member';
  END;

  RETURN target_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
