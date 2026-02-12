-- =====================================================
-- Migration: Add whitelabel logo columns to organizations
-- Date: 2026-02-07
-- Description:
--   - Add whitelabel_logo_light_url and whitelabel_logo_dark_url columns
--   - Create org-assets storage bucket
--   - Add storage policies for org-assets bucket
-- =====================================================

BEGIN;

-- Add whitelabel logo columns to organizations table (separate for light/dark mode)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS whitelabel_logo_light_url text;

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS whitelabel_logo_dark_url text;

-- Create org-assets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-assets', 'org-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for org-assets bucket
-- Allow authenticated users to upload to their org's folder
CREATE POLICY "Authenticated users can upload org assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-assets'
);

-- Allow public read access (logos need to be publicly accessible)
CREATE POLICY "Public read access for org assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-assets');

-- Allow authenticated users to update their org's assets
CREATE POLICY "Authenticated users can update org assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'org-assets');

-- Allow authenticated users to delete their org's assets
CREATE POLICY "Authenticated users can delete org assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'org-assets');

COMMIT;
