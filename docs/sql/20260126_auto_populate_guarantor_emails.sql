-- Migration: Auto-populate guarantor_emails from borrowers table
-- Date: 2026-01-26
-- Description: Creates a trigger function and triggers that automatically populate
--              guarantor_emails by looking up emails from the borrowers table
--              whenever guarantor_borrower_ids (loan_scenarios) or guarantor_ids (applications) is set.

-- ============================================================================
-- 1. Create the trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_populate_guarantor_emails()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  ids uuid[];
  emails text[];
BEGIN
  -- Get the appropriate ID column based on table
  IF TG_TABLE_NAME = 'loan_scenarios' THEN
    ids := NEW.guarantor_borrower_ids;
  ELSE
    ids := NEW.guarantor_ids;
  END IF;

  -- If no IDs, set emails to NULL
  IF ids IS NULL OR array_length(ids, 1) IS NULL THEN
    NEW.guarantor_emails := NULL;
    RETURN NEW;
  END IF;

  -- Look up emails from borrowers, preserving order of IDs
  SELECT array_agg(b.email ORDER BY idx)
  INTO emails
  FROM unnest(ids) WITH ORDINALITY AS u(id, idx)
  LEFT JOIN borrowers b ON b.id = u.id;

  NEW.guarantor_emails := emails;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Create triggers on both tables
-- ============================================================================

-- Trigger on loan_scenarios table
DROP TRIGGER IF EXISTS trg_loan_scenarios_auto_emails ON loan_scenarios;
CREATE TRIGGER trg_loan_scenarios_auto_emails
  BEFORE INSERT OR UPDATE OF guarantor_borrower_ids
  ON loan_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_guarantor_emails();

-- Trigger on applications table
DROP TRIGGER IF EXISTS trg_applications_auto_emails ON applications;
CREATE TRIGGER trg_applications_auto_emails
  BEFORE INSERT OR UPDATE OF guarantor_ids
  ON applications
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_guarantor_emails();

-- ============================================================================
-- 3. Backfill existing data
-- ============================================================================

-- Backfill loan_scenarios: Update guarantor_emails based on guarantor_borrower_ids
UPDATE loan_scenarios ls
SET guarantor_emails = (
  SELECT array_agg(b.email ORDER BY idx)
  FROM unnest(ls.guarantor_borrower_ids) WITH ORDINALITY AS u(id, idx)
  LEFT JOIN borrowers b ON b.id = u.id
)
WHERE ls.guarantor_borrower_ids IS NOT NULL
  AND array_length(ls.guarantor_borrower_ids, 1) > 0;

-- Backfill applications: Update guarantor_emails based on guarantor_ids
UPDATE applications a
SET guarantor_emails = (
  SELECT array_agg(b.email ORDER BY idx)
  FROM unnest(a.guarantor_ids) WITH ORDINALITY AS u(id, idx)
  LEFT JOIN borrowers b ON b.id = u.id
)
WHERE a.guarantor_ids IS NOT NULL
  AND array_length(a.guarantor_ids, 1) > 0;
