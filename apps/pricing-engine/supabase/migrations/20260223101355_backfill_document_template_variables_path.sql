DO $$
BEGIN
  IF to_regclass('public.document_template_variables') IS NOT NULL THEN
    UPDATE public.document_template_variables
    SET path = name
    WHERE path IS NULL;
  END IF;
END $$;
