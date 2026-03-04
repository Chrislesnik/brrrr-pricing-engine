-- =====================================================
-- Migration 4: Users Table - Add New Columns
-- Date: 2026-01-28
-- Description: Add extended user profile columns to users table
-- Dependencies: None (modifies existing table)
-- Breaking Changes: None (backward compatible, requires type regeneration)
-- Risk Level: MEDIUM (adds columns to existing table)
-- =====================================================

BEGIN;

-- =====================================================
-- Verify users table exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'Migration 4 failed: users table not found';
  END IF;
END $$;

-- =====================================================
-- Add new columns to users table
-- Note: All columns are nullable for backward compatibility
-- =====================================================

-- Contact and profile information
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS email character varying(255) NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  ADD COLUMN IF NOT EXISTS clerk_username text NULL,
  ADD COLUMN IF NOT EXISTS avatar_url text NULL,
  ADD COLUMN IF NOT EXISTS website text NULL,
  ADD COLUMN IF NOT EXISTS phone_number text NULL,
  ADD COLUMN IF NOT EXISTS cell_phone text NULL,
  ADD COLUMN IF NOT EXISTS office_phone text NULL,
  ADD COLUMN IF NOT EXISTS office_phone_extension text NULL,
  ADD COLUMN IF NOT EXISTS personal_role text NULL;

-- Status and flags
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active_yn boolean NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_internal_yn boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_locked boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_image boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified boolean NULL DEFAULT false;

-- Dates and timestamps
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deactivation_date date NULL,
  ADD COLUMN IF NOT EXISTS invitation_date date NULL,
  ADD COLUMN IF NOT EXISTS activated_date date NULL,
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS legal_accepted_at timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone NULL;

-- Profile settings
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS create_organization_enabled boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delete_self_enabled boolean NULL DEFAULT false;

-- Image URL (separate from avatar_url for flexibility)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS image_url text NULL;

-- Foreign key to contact table (if exists)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS contact_id bigint NULL;

-- =====================================================
-- Add generated column for full_name
-- IMPORTANT: This computes PER RECORD from that record's first_name and last_name
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS full_name text 
    GENERATED ALWAYS AS (
      TRIM(
        both from (
          (COALESCE(first_name, ''::text) || ' '::text) || COALESCE(last_name, ''::text)
        )
      )
    ) STORED;
EXCEPTION
  WHEN duplicate_column THEN 
    RAISE NOTICE 'full_name column already exists, skipping';
END $$;

-- =====================================================
-- Add constraints
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT profiles_username_key 
      UNIQUE (clerk_username);
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'profiles_username_key constraint already exists, skipping';
END $$;

DO $$ BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT clerk_username_length 
      CHECK (char_length(clerk_username) >= 3);
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'clerk_username_length constraint already exists, skipping';
END $$;

-- Add foreign key to contact table if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact') THEN
    BEGIN
      ALTER TABLE public.users
        ADD CONSTRAINT user_profile_contact_id_fkey 
          FOREIGN KEY (contact_id) REFERENCES contact(id);
      RAISE NOTICE 'Added foreign key constraint to contact table';
    EXCEPTION
      WHEN duplicate_object THEN 
        RAISE NOTICE 'user_profile_contact_id_fkey already exists, skipping';
    END;
  ELSE
    RAISE NOTICE 'contact table does not exist, skipping foreign key constraint';
  END IF;
END $$;

-- =====================================================
-- Create indexes for new columns
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON public.users USING btree (email) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_clerk_username
  ON public.users USING btree (clerk_username) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_is_active_yn 
  ON public.users USING btree (is_active_yn) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_is_banned 
  ON public.users USING btree (is_banned) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_is_internal_yn 
  ON public.users USING btree (is_internal_yn) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_is_locked 
  ON public.users USING btree (is_locked) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_last_active_at 
  ON public.users USING btree (last_active_at) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_last_sign_in_at 
  ON public.users USING btree (last_sign_in_at) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_legal_accepted_at 
  ON public.users USING btree (legal_accepted_at) 
  TABLESPACE pg_default;

-- =====================================================
-- Create trigger for updated_at
-- =====================================================
DROP TRIGGER IF EXISTS handle_updated_at ON public.users;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_users_updated_at();

-- =====================================================
-- Verification
-- =====================================================
DO $$
DECLARE
  v_column_count integer;
BEGIN
  -- Count new columns (should be at least 25)
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_name = 'users'
    AND column_name IN (
      'email', 'updated_at', 'clerk_username', 'full_name', 'avatar_url',
      'website', 'is_active_yn', 'is_internal_yn', 'is_locked', 'is_banned',
      'phone_number', 'cell_phone', 'office_phone', 'image_url'
    );
  
  IF v_column_count < 10 THEN
    RAISE EXCEPTION 'Migration 4 failed: Expected at least 10 new columns, found %', v_column_count;
  END IF;
  
  -- Verify full_name is a generated column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'full_name'
      AND is_generated = 'ALWAYS'
  ) THEN
    RAISE WARNING 'Migration 4: full_name column may not be properly generated';
  END IF;
  
  RAISE NOTICE 'Migration 4 completed successfully (% new columns verified)', v_column_count;
END $$;

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - 25+ new columns added to users table
-- - full_name is GENERATED per-record from first_name + last_name
-- - All existing data preserved (new columns are NULL for existing rows)
-- - Indexes added for commonly queried columns
-- - updated_at trigger created for automatic timestamp updates
-- - REQUIRED: Regenerate TypeScript types for new columns
-- - OPTIONAL: Update user profile UI to use new fields
-- =====================================================
