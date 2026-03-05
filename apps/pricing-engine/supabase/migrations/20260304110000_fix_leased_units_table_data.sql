-- Fix leased_units value_array data from old migration:
-- 1. Rename old column keys: "gross" -> "gross_rent", "market" -> "market_rent"
-- 2. Capitalize toggle values: "yes" -> "Yes", "no" -> "No"
-- 3. Remove duplicate old keys when both old and new exist

UPDATE loan_scenario_inputs lsi
SET value_array = (
  SELECT json_agg(
    json_build_object(
      'leased',
      CASE 
        WHEN (elem->>'leased') = 'yes' THEN 'Yes'
        WHEN (elem->>'leased') = 'no' THEN 'No'
        ELSE COALESCE(elem->>'leased', '')
      END,
      'gross_rent',
      COALESCE(elem->>'gross_rent', elem->>'gross', ''),
      'market_rent',
      COALESCE(elem->>'market_rent', elem->>'market', '')
    )
  )
  FROM json_array_elements(lsi.value_array) AS elem
)
WHERE lsi.pricing_engine_input_id = (
  SELECT id FROM pricing_engine_inputs WHERE input_code = 'leased_units' LIMIT 1
)
AND lsi.value_array IS NOT NULL
AND (
  lsi.value_array::text LIKE '%"gross"%'
  OR lsi.value_array::text LIKE '%"market"%'
  OR lsi.value_array::text LIKE '%"yes"%'
  OR lsi.value_array::text LIKE '%"no"%'
);
