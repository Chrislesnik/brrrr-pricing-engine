-- =====================================================
-- Migration: Rename deal_document_participants to document_files_deals
-- Date: 2026-02-10
-- =====================================================

BEGIN;

-- Step 1: Drop existing document_files_deals table if it exists
DROP TABLE IF EXISTS public.document_files_deals CASCADE;

-- Step 2: Rename deal_document_participants to document_files_deals
ALTER TABLE IF EXISTS public.deal_document_participants
  RENAME TO document_files_deals;

-- Step 3: Rename constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_document_participants_pkey') THEN
    ALTER TABLE public.document_files_deals
      RENAME CONSTRAINT deal_document_participants_pkey
      TO document_files_deals_pkey;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_document_participants_deal_id_fkey') THEN
    ALTER TABLE public.document_files_deals
      RENAME CONSTRAINT deal_document_participants_deal_id_fkey
      TO document_files_deals_deal_id_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_document_participants_document_file_id_fkey') THEN
    ALTER TABLE public.document_files_deals
      RENAME CONSTRAINT deal_document_participants_document_file_id_fkey
      TO document_files_deals_document_file_id_fkey;
  END IF;
END $$;

-- Step 4: Rename indexes
ALTER INDEX IF EXISTS idx_ddp_deal RENAME TO idx_dfd_deal;
ALTER INDEX IF EXISTS idx_ddp_doc RENAME TO idx_dfd_doc;

-- Verification
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'document_files_deals';

COMMIT;
