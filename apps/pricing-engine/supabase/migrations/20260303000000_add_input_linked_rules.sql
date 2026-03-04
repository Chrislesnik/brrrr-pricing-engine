CREATE TABLE IF NOT EXISTS public.input_linked_rules (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  input_id    bigint NOT NULL REFERENCES public.inputs(id) ON DELETE CASCADE,
  rule_order  integer NOT NULL DEFAULT 0,
  conditions  jsonb NOT NULL DEFAULT '[]'::jsonb,
  logic_type  text NOT NULL DEFAULT 'AND',
  linked_table text NOT NULL,
  linked_column text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_input_linked_rules_input_id ON public.input_linked_rules(input_id);

ALTER TABLE public.input_linked_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read input_linked_rules"
  ON public.input_linked_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert input_linked_rules"
  ON public.input_linked_rules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update input_linked_rules"
  ON public.input_linked_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete input_linked_rules"
  ON public.input_linked_rules FOR DELETE TO authenticated USING (true);

CREATE POLICY "Service role full access on input_linked_rules"
  ON public.input_linked_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
