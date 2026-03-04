-- Fix sync_application_from_primary_scenario:
-- 1. Use input_linked_rules instead of the dropped linked_table column
-- 2. Add recursion guard to prevent the reverse sync from overwriting
--    application data when triggered by the forward sync
-- 3. Preserve manually-entered guarantor data on the application
--    (application is the source of truth for guarantors, not PE inputs)

CREATE OR REPLACE FUNCTION public.sync_application_from_primary_scenario(p_loan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
begin
  -- Recursion guard: if the forward sync (app -> scenario) is already running,
  -- do NOT run the reverse sync back, as it would overwrite the data that was
  -- just written to the application.
  IF current_setting('app.sync_in_progress', true) = 'true' THEN
    RETURN;
  END IF;
  PERFORM set_config('app.sync_in_progress', 'true', true);

  INSERT INTO public.applications (loan_id, organization_id, borrower_name, status)
  SELECT l.id, l.organization_id, null, 'draft'
  FROM public.loans l
  WHERE l.id = p_loan_id
    AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.loan_id = p_loan_id);

  WITH primary_scenario AS (
    SELECT ls.id AS scenario_id
    FROM public.loan_scenarios ls
    WHERE ls.loan_id = p_loan_id
      AND COALESCE(ls.primary, false) = true
    ORDER BY ls.created_at DESC NULLS LAST, ls.id DESC
    LIMIT 1
  ),
  enriched_inputs AS (
    SELECT
      lsi.linked_record_id,
      lsi.value_text,
      pei.input_code,
      ilr.linked_table
    FROM public.loan_scenario_inputs lsi
    JOIN public.pricing_engine_inputs pei ON pei.id = lsi.pricing_engine_input_id
    LEFT JOIN LATERAL (
      SELECT linked_table FROM public.input_linked_rules
      WHERE input_id = pei.id
      ORDER BY rule_order ASC LIMIT 1
    ) ilr ON true
    WHERE lsi.loan_scenario_id = (SELECT scenario_id FROM primary_scenario)
  ),
  entity_link AS (
    SELECT
      linked_record_id::uuid AS entity_id,
      value_text AS borrower_name
    FROM enriched_inputs
    WHERE linked_table = 'entities' AND linked_record_id IS NOT NULL
    LIMIT 1
  ),
  borrower_links AS (
    SELECT
      array_agg(linked_record_id::uuid) AS guarantor_ids,
      array_agg(value_text) FILTER (WHERE value_text IS NOT NULL) AS guarantor_names
    FROM enriched_inputs
    WHERE linked_table = 'borrowers' AND linked_record_id IS NOT NULL
  ),
  address_data AS (
    SELECT
      MAX(CASE WHEN input_code = 'address_street' THEN value_text END) AS property_street,
      MAX(CASE WHEN input_code = 'address_city'   THEN value_text END) AS property_city,
      MAX(CASE WHEN input_code = 'address_state'  THEN value_text END) AS property_state,
      MAX(CASE WHEN input_code = 'address_zip'    THEN value_text END) AS property_zip
    FROM enriched_inputs
    WHERE input_code IN ('address_street','address_city','address_state','address_zip')
  ),
  borrower_name_input AS (
    SELECT value_text AS borrower_name
    FROM enriched_inputs
    WHERE input_code = 'borrower_name'
    LIMIT 1
  ),
  existing_app AS (
    SELECT guarantor_ids, guarantor_names, guarantor_emails
    FROM public.applications
    WHERE loan_id = p_loan_id
    LIMIT 1
  ),
  src AS (
    SELECT
      el.entity_id,
      CASE WHEN ea.guarantor_ids IS NOT NULL OR ea.guarantor_names IS NOT NULL
           THEN ea.guarantor_ids
           ELSE bl.guarantor_ids
      END AS guarantor_ids,
      CASE WHEN ea.guarantor_ids IS NOT NULL OR ea.guarantor_names IS NOT NULL
           THEN ea.guarantor_names
           ELSE bl.guarantor_names
      END AS guarantor_names,
      ad.property_street,
      ad.property_city,
      ad.property_state,
      ad.property_zip,
      COALESCE(el.borrower_name, bn.borrower_name) AS borrower_name
    FROM (SELECT 1) AS _dummy
    LEFT JOIN entity_link el ON true
    LEFT JOIN borrower_links bl ON true
    LEFT JOIN address_data ad ON true
    LEFT JOIN borrower_name_input bn ON true
    LEFT JOIN existing_app ea ON true
    WHERE EXISTS (SELECT 1 FROM primary_scenario)
    UNION ALL
    SELECT
      null::uuid,
      null::uuid[],
      null::text[],
      null::text,
      null::text,
      null::text,
      null::text,
      null::text
    WHERE NOT EXISTS (SELECT 1 FROM primary_scenario)
    LIMIT 1
  )
  UPDATE public.applications a
  SET entity_id       = src.entity_id,
      guarantor_ids   = src.guarantor_ids,
      guarantor_names = src.guarantor_names,
      property_street = src.property_street,
      property_city   = src.property_city,
      property_state  = src.property_state,
      property_zip    = src.property_zip,
      borrower_name   = src.borrower_name
  FROM src
  WHERE a.loan_id = p_loan_id;
end;
$$;
