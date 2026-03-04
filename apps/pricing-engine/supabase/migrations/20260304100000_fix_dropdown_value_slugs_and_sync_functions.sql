-- Fix dropdown value mismatch: map old API slug values to new human-readable
-- dropdown labels in loan_scenario_inputs.
--
-- Also update sync functions to use loan_scenario_inputs instead of old
-- loan_scenarios JSONB columns.

-- Fix sync_application_from_primary_scenario (was referencing l.borrower_first_name and ls.inputs)
CREATE OR REPLACE FUNCTION public.sync_application_from_primary_scenario(p_loan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
begin
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
    SELECT lsi.linked_record_id, lsi.value_text, pei.input_code, ilr.linked_table
    FROM public.loan_scenario_inputs lsi
    JOIN public.pricing_engine_inputs pei ON pei.id = lsi.pricing_engine_input_id
    LEFT JOIN LATERAL (
      SELECT linked_table FROM public.input_linked_rules
      WHERE input_id = pei.id ORDER BY rule_order ASC LIMIT 1
    ) ilr ON true
    WHERE lsi.loan_scenario_id = (SELECT scenario_id FROM primary_scenario)
  ),
  entity_link AS (
    SELECT linked_record_id::uuid AS entity_id, value_text AS borrower_name
    FROM enriched_inputs WHERE linked_table = 'entities' AND linked_record_id IS NOT NULL LIMIT 1
  ),
  borrower_links AS (
    SELECT array_agg(linked_record_id::uuid) AS guarantor_ids,
           array_agg(value_text) FILTER (WHERE value_text IS NOT NULL) AS guarantor_names
    FROM enriched_inputs WHERE linked_table = 'borrowers' AND linked_record_id IS NOT NULL
  ),
  address_data AS (
    SELECT MAX(CASE WHEN input_code = 'address_street' THEN value_text END) AS property_street,
           MAX(CASE WHEN input_code = 'address_city'   THEN value_text END) AS property_city,
           MAX(CASE WHEN input_code = 'address_state'  THEN value_text END) AS property_state,
           MAX(CASE WHEN input_code = 'address_zip'    THEN value_text END) AS property_zip
    FROM enriched_inputs WHERE input_code IN ('address_street','address_city','address_state','address_zip')
  ),
  borrower_name_input AS (
    SELECT value_text AS borrower_name FROM enriched_inputs WHERE input_code = 'borrower_name' LIMIT 1
  ),
  existing_app AS (
    SELECT guarantor_ids, guarantor_names, guarantor_emails FROM public.applications WHERE loan_id = p_loan_id LIMIT 1
  ),
  src AS (
    SELECT el.entity_id,
      CASE WHEN ea.guarantor_ids IS NOT NULL OR ea.guarantor_names IS NOT NULL THEN ea.guarantor_ids ELSE bl.guarantor_ids END AS guarantor_ids,
      CASE WHEN ea.guarantor_ids IS NOT NULL OR ea.guarantor_names IS NOT NULL THEN ea.guarantor_names ELSE bl.guarantor_names END AS guarantor_names,
      ad.property_street, ad.property_city, ad.property_state, ad.property_zip,
      COALESCE(el.borrower_name, bn.borrower_name) AS borrower_name
    FROM (SELECT 1) AS _dummy
    LEFT JOIN entity_link el ON true LEFT JOIN borrower_links bl ON true
    LEFT JOIN address_data ad ON true LEFT JOIN borrower_name_input bn ON true LEFT JOIN existing_app ea ON true
    WHERE EXISTS (SELECT 1 FROM primary_scenario)
    UNION ALL
    SELECT null::uuid, null::uuid[], null::text[], null::text, null::text, null::text, null::text, null::text
    WHERE NOT EXISTS (SELECT 1 FROM primary_scenario) LIMIT 1
  )
  UPDATE public.applications a
  SET entity_id = src.entity_id, guarantor_ids = src.guarantor_ids, guarantor_names = src.guarantor_names,
      property_street = src.property_street, property_city = src.property_city,
      property_state = src.property_state, property_zip = src.property_zip, borrower_name = src.borrower_name
  FROM src WHERE a.loan_id = p_loan_id;
end;
$$;

-- Fix sync_primary_scenario_from_application (was referencing ls.inputs JSONB)
CREATE OR REPLACE FUNCTION public.sync_primary_scenario_from_application(p_loan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_scenario_id uuid;
  v_app record;
  v_entity_pe_id bigint;
  v_guarantors_pe_id bigint;
begin
  IF current_setting('app.sync_in_progress', true) = 'true' THEN RETURN; END IF;
  PERFORM set_config('app.sync_in_progress', 'true', true);

  SELECT ls.id INTO v_scenario_id FROM public.loan_scenarios ls
  WHERE ls.loan_id = p_loan_id AND COALESCE(ls.primary, false) = true
  ORDER BY ls.created_at DESC NULLS LAST, ls.id DESC LIMIT 1;
  IF v_scenario_id IS NULL THEN RETURN; END IF;

  SELECT * INTO v_app FROM public.applications WHERE loan_id = p_loan_id LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT id INTO v_entity_pe_id FROM public.pricing_engine_inputs WHERE input_code = 'borrower_name' AND archived_at IS NULL LIMIT 1;
  SELECT id INTO v_guarantors_pe_id FROM public.pricing_engine_inputs WHERE input_code = 'guarantors' AND archived_at IS NULL LIMIT 1;

  IF v_entity_pe_id IS NOT NULL AND v_app.borrower_name IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.loan_scenario_inputs WHERE loan_scenario_id = v_scenario_id AND pricing_engine_input_id = v_entity_pe_id) THEN
      UPDATE public.loan_scenario_inputs SET value_text = v_app.borrower_name,
        linked_record_id = CASE WHEN v_app.entity_id IS NOT NULL THEN v_app.entity_id::text ELSE linked_record_id END
      WHERE loan_scenario_id = v_scenario_id AND pricing_engine_input_id = v_entity_pe_id;
    ELSE
      INSERT INTO public.loan_scenario_inputs (loan_scenario_id, pricing_engine_input_id, input_type, value_text, linked_record_id)
      VALUES (v_scenario_id, v_entity_pe_id, 'text', v_app.borrower_name,
        CASE WHEN v_app.entity_id IS NOT NULL THEN v_app.entity_id::text ELSE NULL END);
    END IF;
  END IF;

  IF v_guarantors_pe_id IS NOT NULL AND v_app.guarantor_names IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.loan_scenario_inputs WHERE loan_scenario_id = v_scenario_id AND pricing_engine_input_id = v_guarantors_pe_id) THEN
      UPDATE public.loan_scenario_inputs SET value_array = to_jsonb(v_app.guarantor_names)
      WHERE loan_scenario_id = v_scenario_id AND pricing_engine_input_id = v_guarantors_pe_id;
    ELSE
      INSERT INTO public.loan_scenario_inputs (loan_scenario_id, pricing_engine_input_id, input_type, value_array)
      VALUES (v_scenario_id, v_guarantors_pe_id, 'tags', to_jsonb(v_app.guarantor_names));
    END IF;
  END IF;
end;
$$;

-- Data migration: map old slug values to new labels
UPDATE loan_scenario_inputs SET value_text = 'DSCR' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'loan_type' LIMIT 1) AND value_text = 'dscr';
UPDATE loan_scenario_inputs SET value_text = 'Bridge' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'loan_type' LIMIT 1) AND value_text = 'bridge';
UPDATE loan_scenario_inputs SET value_text = 'Purchase' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'transaction_type' LIMIT 1) AND value_text = 'purchase';
UPDATE loan_scenario_inputs SET value_text = 'Refinance Cash Out' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'transaction_type' LIMIT 1) AND value_text = 'co-refi';
UPDATE loan_scenario_inputs SET value_text = 'Refinance Rate/Term' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'transaction_type' LIMIT 1) AND value_text = 'rt-refi';
UPDATE loan_scenario_inputs SET value_text = 'Single Family' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'property_type' LIMIT 1) AND value_text = 'single';
UPDATE loan_scenario_inputs SET value_text = 'Townhome/PUD' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'property_type' LIMIT 1) AND value_text = 'pud';
UPDATE loan_scenario_inputs SET value_text = 'Condominium' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'property_type' LIMIT 1) AND value_text = 'condo';
UPDATE loan_scenario_inputs SET value_text = 'Multifamily 2-4 Units' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'property_type' LIMIT 1) AND value_text = 'mf2_4';
UPDATE loan_scenario_inputs SET value_text = 'Multifamily 5-10 Units' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'property_type' LIMIT 1) AND value_text = 'mf5_10';
UPDATE loan_scenario_inputs SET value_text = 'Entity' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'borrower_type' LIMIT 1) AND value_text = 'entity';
UPDATE loan_scenario_inputs SET value_text = 'Individual' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'borrower_type' LIMIT 1) AND value_text = 'individual';
UPDATE loan_scenario_inputs SET value_text = 'U.S. Citizen' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'citizenship' LIMIT 1) AND value_text = 'us';
UPDATE loan_scenario_inputs SET value_text = '30 Year Fixed' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'loan_structure_type' LIMIT 1) AND value_text = 'fixed-30';
UPDATE loan_scenario_inputs SET value_text = 'Interest Only' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'loan_structure_type' LIMIT 1) AND value_text = 'io';
UPDATE loan_scenario_inputs SET value_text = 'Bridge + Rehab' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'bridge_type' LIMIT 1) AND value_text = 'bridge-rehab';
UPDATE loan_scenario_inputs SET value_text = '12 Months' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'bridge_term' LIMIT 1) AND value_text = '12';
UPDATE loan_scenario_inputs SET value_text = 'None' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'pre_payment_penalty' LIMIT 1) AND value_text = 'none';
UPDATE loan_scenario_inputs SET value_text = 'Warrantable' WHERE pricing_engine_input_id = (SELECT id FROM pricing_engine_inputs WHERE input_code = 'warrantability' LIMIT 1) AND value_text = 'warrantable';

UPDATE loan_scenario_inputs lsi SET value_text = 'Yes' FROM pricing_engine_inputs pei
WHERE lsi.pricing_engine_input_id = pei.id AND pei.input_type = 'dropdown' AND pei.dropdown_options::text LIKE '%"Yes"%' AND lsi.value_text = 'yes';

UPDATE loan_scenario_inputs lsi SET value_text = 'No' FROM pricing_engine_inputs pei
WHERE lsi.pricing_engine_input_id = pei.id AND pei.input_type = 'dropdown' AND pei.dropdown_options::text LIKE '%"No"%' AND lsi.value_text = 'no';
