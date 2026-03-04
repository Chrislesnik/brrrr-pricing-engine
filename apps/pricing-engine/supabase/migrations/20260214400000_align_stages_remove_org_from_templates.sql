-- ============================================================================
-- Migration: Align deal_stages with input_stepper step_order
--            Remove organization_id from task_templates (make global)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Align deal_stages with current stepper step_order
--    Stepper: Loan Setup, Processing, QC 1, Underwriting,
--             Conditional Approval, QC 2, Clear to Close, Closed & Funded
-- --------------------------------------------------------------------------

-- Rename mismatched stages
UPDATE public.deal_stages SET name = 'Processing',           code = 'processing'           WHERE id = 2;
UPDATE public.deal_stages SET name = 'QC 1',                 code = 'qc_1'                 WHERE id = 5;
UPDATE public.deal_stages SET name = 'Conditional Approval', code = 'conditional_approval'  WHERE id = 4;
UPDATE public.deal_stages SET name = 'Closed & Funded',      code = 'closed_and_funded'     WHERE id = 7;

-- Fix display_order to match stepper order
UPDATE public.deal_stages SET display_order = 0 WHERE id = 1; -- Loan Setup
UPDATE public.deal_stages SET display_order = 1 WHERE id = 2; -- Processing
UPDATE public.deal_stages SET display_order = 2 WHERE id = 5; -- QC 1
UPDATE public.deal_stages SET display_order = 3 WHERE id = 3; -- Underwriting
UPDATE public.deal_stages SET display_order = 4 WHERE id = 4; -- Conditional Approval
UPDATE public.deal_stages SET display_order = 6 WHERE id = 6; -- Clear to Close
UPDATE public.deal_stages SET display_order = 7 WHERE id = 7; -- Closed & Funded

-- Insert missing QC 2 stage
INSERT INTO public.deal_stages (code, name, display_order, is_active)
VALUES ('qc_2', 'QC 2', 5, true)
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------------------------
-- 2. Remove organization_id from task_templates (make global)
-- --------------------------------------------------------------------------

-- Drop the unique constraint on (organization_id, code)
ALTER TABLE public.task_templates
  DROP CONSTRAINT IF EXISTS task_templates_org_code_key;

-- Drop the foreign key constraint
ALTER TABLE public.task_templates
  DROP CONSTRAINT IF EXISTS task_templates_organization_id_fkey;

-- Drop the organization_id column
ALTER TABLE public.task_templates
  DROP COLUMN IF EXISTS organization_id;

-- Add a new unique constraint on just code
ALTER TABLE public.task_templates
  ADD CONSTRAINT task_templates_code_key UNIQUE (code);
