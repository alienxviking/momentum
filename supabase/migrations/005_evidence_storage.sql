-- ============================================================================
-- Momentum — Evidence Storage Bucket Setup
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Create a new public bucket for evidence uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all evidence
CREATE POLICY "Public Access to Evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidence');

-- Allow authenticated users to upload evidence
-- They can only upload files into a folder that matches their user ID
CREATE POLICY "Users can upload their own evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own evidence
CREATE POLICY "Users can update their own evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidence' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own evidence
CREATE POLICY "Users can delete their own evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
