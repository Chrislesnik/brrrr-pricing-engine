-- =====================================================
-- Migration: Add organization_id to inputs & input_categories
-- Date: 2026-02-12
--
-- Both tables were missing the organization_id column
-- that the API routes require for multi-tenant filtering.
-- =====================================================

BEGIN;

-- Add organization_id to input_categories
ALTER TABLE public.input_categories
  ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Add organization_id to inputs
ALTER TABLE public.inputs
  ADD COLUMN IF NOT EXISTS organization_id uuid;

COMMIT;
