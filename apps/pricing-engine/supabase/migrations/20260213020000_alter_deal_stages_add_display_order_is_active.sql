-- ============================================================================
-- Migration: Add display_order and is_active to deal_stages
-- Aligns deal_stages with the pattern used by document_categories and
-- deal_role_types.
-- ============================================================================

ALTER TABLE public.deal_stages
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
