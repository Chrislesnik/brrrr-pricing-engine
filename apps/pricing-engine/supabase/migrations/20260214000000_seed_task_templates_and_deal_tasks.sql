-- ============================================================================
-- Seed: task_templates + deal_tasks
-- Inserts generic task templates and creates sample deal tasks for existing deals.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Seed task_templates (using the first organization found)
-- --------------------------------------------------------------------------
DO $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Grab the first organization
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organizations found — skipping task_templates seed.';
    RETURN;
  END IF;

  -- Insert templates only if none exist yet
  IF NOT EXISTS (SELECT 1 FROM public.task_templates LIMIT 1) THEN
    INSERT INTO public.task_templates
      (organization_id, code, name, description, default_status_id, default_priority_id, due_offset_days, display_order, is_active)
    VALUES
      (v_org_id, 'upload_appraisal',      'Upload Property Appraisal',     'Complete appraisal from certified appraiser',              1, 3, 14,  1, true),
      (v_org_id, 'verify_income',          'Verify Borrower Income',        'Review tax returns and bank statements',                   1, 3,  7,  2, true),
      (v_org_id, 'title_search',           'Title Search',                  'Order and review title search report',                     1, 2, 10,  3, true),
      (v_org_id, 'environmental_phase1',   'Phase I Environmental',         'Phase I environmental site assessment',                    1, 2, 21,  4, true),
      (v_org_id, 'insurance_verification', 'Insurance Verification',        'Confirm hazard and flood insurance policies',              1, 1, 14,  5, true),
      (v_org_id, 'survey_review',          'Survey Review',                 'Review property survey for encroachments or easements',    1, 2, 14,  6, true),
      (v_org_id, 'zoning_compliance',      'Zoning Compliance Check',       'Verify property meets local zoning requirements',          1, 1, 10,  7, true),
      (v_org_id, 'borrower_credit',        'Pull Borrower Credit Report',   'Request and review borrower credit report',                1, 3,  3,  8, true),
      (v_org_id, 'closing_docs',           'Prepare Closing Documents',     'Draft and review all closing documents',                   1, 4,  5,  9, true),
      (v_org_id, 'final_walkthrough',      'Schedule Final Walkthrough',    'Coordinate final property inspection before closing',      1, 2,  2, 10, true);
  END IF;
END
$$;

-- --------------------------------------------------------------------------
-- 2. Seed deal_tasks for existing deals (up to 5 deals)
-- --------------------------------------------------------------------------
DO $$
DECLARE
  v_deal   RECORD;
  v_count  int := 0;
BEGIN
  -- Only seed if deal_tasks is empty
  IF EXISTS (SELECT 1 FROM public.deal_tasks LIMIT 1) THEN
    RAISE NOTICE 'deal_tasks already has data — skipping seed.';
    RETURN;
  END IF;

  FOR v_deal IN
    SELECT id, organization_id FROM public.deals ORDER BY created_at DESC LIMIT 5
  LOOP
    v_count := v_count + 1;

    INSERT INTO public.deal_tasks
      (deal_id, organization_id, title, description, task_status_id, task_priority_id, assigned_to_user_ids, display_order, created_by)
    VALUES
      -- Task 1: Upload Property Appraisal — To Do, High
      (v_deal.id, v_deal.organization_id,
       'Upload Property Appraisal',
       'Complete appraisal from certified appraiser',
       1, 3, '[]'::jsonb, 0, NULL),

      -- Task 2: Verify Borrower Income — In Progress, High
      (v_deal.id, v_deal.organization_id,
       'Verify Borrower Income',
       'Review tax returns and bank statements',
       2, 3, '[]'::jsonb, 1, NULL),

      -- Task 3: Title Search — Done, Medium
      (v_deal.id, v_deal.organization_id,
       'Title Search Complete',
       'Title search report has been reviewed and cleared',
       5, 2, '[]'::jsonb, 2, NULL),

      -- Task 4: Environmental Assessment — In Review, Medium
      (v_deal.id, v_deal.organization_id,
       'Phase I Environmental Assessment',
       'Phase I environmental report required for property',
       3, 2, '[]'::jsonb, 3, NULL),

      -- Task 5: Insurance Verification — To Do, Low
      (v_deal.id, v_deal.organization_id,
       'Insurance Verification',
       'Confirm hazard and flood insurance policies are in place',
       1, 1, '[]'::jsonb, 4, NULL),

      -- Task 6: Survey Review — Blocked, Urgent
      (v_deal.id, v_deal.organization_id,
       'Survey Review',
       'Review property survey for encroachments — waiting on surveyor',
       4, 4, '[]'::jsonb, 5, NULL),

      -- Task 7: Pull Borrower Credit — Done, High
      (v_deal.id, v_deal.organization_id,
       'Pull Borrower Credit Report',
       'Credit report received and meets minimum requirements',
       5, 3, '[]'::jsonb, 6, NULL),

      -- Task 8: Prepare Closing Documents — To Do, Urgent
      (v_deal.id, v_deal.organization_id,
       'Prepare Closing Documents',
       'Draft and review all closing documents for execution',
       1, 4, '[]'::jsonb, 7, NULL);
  END LOOP;

  RAISE NOTICE 'Seeded deal_tasks for % deal(s).', v_count;
END
$$;
