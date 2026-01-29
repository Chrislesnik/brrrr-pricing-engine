-- Migration: Sync DEV schema to match PROD
-- This migration adds missing tables, functions, triggers, indexes, RLS policies, FKs, and comments from PROD to DEV

-- ============================================================================
-- SECTION 1: FUNCTIONS (7 new + 1 replacement)
-- ============================================================================

-- Function 1: auto_populate_guarantor_emails
CREATE OR REPLACE FUNCTION public.auto_populate_guarantor_emails() RETURNS trigger
    LANGUAGE plpgsql AS $$
DECLARE ids uuid[]; emails text[];
BEGIN
  IF TG_TABLE_NAME = 'loan_scenarios' THEN ids := NEW.guarantor_borrower_ids;
  ELSE ids := NEW.guarantor_ids; END IF;
  IF ids IS NULL OR array_length(ids, 1) IS NULL THEN
    NEW.guarantor_emails := NULL; RETURN NEW;
  END IF;
  SELECT array_agg(b.email ORDER BY idx) INTO emails
  FROM unnest(ids) WITH ORDINALITY AS u(id, idx)
  LEFT JOIN borrowers b ON b.id = u.id;
  NEW.guarantor_emails := emails;
  RETURN NEW;
END; $$;

-- Function 2: create_xactus_subtable_row
CREATE OR REPLACE FUNCTION public.create_xactus_subtable_row() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'xactus' THEN
    INSERT INTO integrations_xactus (integration_id, account_user, account_password)
    VALUES (NEW.id, '', '')
    ON CONFLICT (integration_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

-- Function 3: delete_orphaned_credit_report_chat
CREATE OR REPLACE FUNCTION public.delete_orphaned_credit_report_chat() RETURNS trigger
    LANGUAGE plpgsql AS $$
begin
  -- Check if there are any remaining mappings for this chat_id
  if not exists (
    select 1 from credit_report_user_chats where chat_id = OLD.chat_id
  ) then
    -- No more mappings exist, delete the chat (which will cascade to messages)
    delete from credit_report_chats where id = OLD.chat_id;
  end if;
  return OLD;
end; $$;

-- Function 4: ensure_clear_integration
CREATE OR REPLACE FUNCTION public.ensure_clear_integration() RETURNS trigger
    LANGUAGE plpgsql AS $$
declare
  v_type text;
begin
  select type into v_type from integrations where id = new.integration_id;
  if v_type is null then
    raise exception 'integration % not found', new.integration_id;
  end if;
  if v_type <> 'clear' then
    raise exception 'integration % is type %, expected clear', new.integration_id, v_type;
  end if;
  return new;
end; $$;

-- Function 5: ensure_xactus_integration
CREATE OR REPLACE FUNCTION public.ensure_xactus_integration() RETURNS trigger
    LANGUAGE plpgsql AS $$
declare
  v_type text;
begin
  select type into v_type from integrations where id = new.integration_id;
  if v_type is null then
    raise exception 'integration % not found', new.integration_id;
  end if;
  if v_type <> 'xactus' then
    raise exception 'integration % is type %, expected xactus', new.integration_id, v_type;
  end if;
  return new;
end; $$;

-- Function 6: sync_clear_child
CREATE OR REPLACE FUNCTION public.sync_clear_child() RETURNS trigger
    LANGUAGE plpgsql AS $$
begin
  if (tg_op = 'INSERT') then
    if new.type = 'clear' then
      insert into integrations_clear (integration_id, username, password)
      values (new.id, null, null)
      on conflict (integration_id) do nothing;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.type = 'clear' then
      delete from integrations_clear where integration_id = old.id;
    end if;
    return old;
  end if;
  return null;
end; $$;

-- Function 7: sync_nadlan_child
CREATE OR REPLACE FUNCTION public.sync_nadlan_child() RETURNS trigger
    LANGUAGE plpgsql AS $$
begin
  if (tg_op = 'INSERT') then
    if new.type = 'nadlan' then
      insert into integrations_nadlan (integration_id, username, password)
      values (new.id, null, null)
      on conflict (integration_id) do nothing;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.type = 'nadlan' then
      delete from integrations_nadlan where integration_id = old.id;
    end if;
    return old;
  end if;
  return null;
end; $$;

-- Function 8: match_documents (REPLACEMENT to reference program_documents_chunks_vs)
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding public.vector,
  match_count integer DEFAULT NULL,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
    LANGUAGE plpgsql AS $$
#variable_conflict use_column
begin
  return query
  select id, content, metadata,
    1 - (program_documents_chunks_vs.embedding <=> query_embedding) as similarity
  from program_documents_chunks_vs
  where metadata @> filter
  order by program_documents_chunks_vs.embedding <=> query_embedding
  limit match_count;
end; $$;

-- ============================================================================
-- SECTION 2: TABLES (4 new)
-- ============================================================================

-- Table 1: integrations_xactus
CREATE TABLE IF NOT EXISTS public.integrations_xactus (
  integration_id uuid NOT NULL,
  account_user text NOT NULL,
  account_password text NOT NULL
);

-- Table 2: integrations_clear
CREATE TABLE IF NOT EXISTS public.integrations_clear (
  integration_id uuid NOT NULL,
  username text,
  password text
);

-- Table 3: integrations_nadlan
CREATE TABLE IF NOT EXISTS public.integrations_nadlan (
  integration_id uuid NOT NULL,
  username text,
  password text
);

-- Table 4: pricing_activity_log
CREATE TABLE IF NOT EXISTS public.pricing_activity_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  loan_id uuid NOT NULL,
  scenario_id uuid,
  activity_type text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id text NOT NULL,
  inputs jsonb,
  outputs jsonb,
  selected jsonb,
  term_sheet_original_path text,
  term_sheet_edit_path text,
  assigned_to_changes text[],
  CONSTRAINT pricing_activity_log_action_check CHECK (action = ANY (ARRAY['changed'::text, 'added'::text, 'deleted'::text, 'downloaded'::text, 'shared'::text])),
  CONSTRAINT pricing_activity_log_activity_type_check CHECK (activity_type = ANY (ARRAY['input_changes'::text, 'selection_changed'::text, 'user_assignment'::text, 'term_sheet'::text]))
);

-- ============================================================================
-- SECTION 3: ALTER EXISTING TABLES
-- ============================================================================

ALTER TABLE public.credit_reports ADD COLUMN IF NOT EXISTS aggregator_id uuid;

-- ============================================================================
-- SECTION 4: PRIMARY KEYS
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.integrations_xactus ADD CONSTRAINT integrations_xactus_pkey PRIMARY KEY (integration_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.integrations_clear ADD CONSTRAINT integrations_clear_pkey PRIMARY KEY (integration_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.integrations_nadlan ADD CONSTRAINT integrations_nadlan_pkey PRIMARY KEY (integration_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.pricing_activity_log ADD CONSTRAINT pricing_activity_log_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 5: FOREIGN KEYS
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.integrations_xactus ADD CONSTRAINT integrations_xactus_integration_id_fkey
    FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.integrations_clear ADD CONSTRAINT integrations_clear_integration_id_fkey
    FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.integrations_nadlan ADD CONSTRAINT integrations_nadlan_integration_id_fkey
    FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.pricing_activity_log ADD CONSTRAINT pricing_activity_log_loan_id_fkey
    FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.pricing_activity_log ADD CONSTRAINT pricing_activity_log_scenario_id_fkey
    FOREIGN KEY (scenario_id) REFERENCES public.loan_scenarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 6: INDEXES (5)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_loan_id ON public.pricing_activity_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_scenario_id ON public.pricing_activity_log(scenario_id);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_user_id ON public.pricing_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_activity_type ON public.pricing_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_pricing_activity_log_created_at ON public.pricing_activity_log(created_at DESC);

-- ============================================================================
-- SECTION 7: TRIGGERS (10)
-- ============================================================================

CREATE OR REPLACE TRIGGER trg_applications_auto_emails
  BEFORE INSERT OR UPDATE OF guarantor_ids ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_guarantor_emails();

CREATE OR REPLACE TRIGGER trg_create_xactus_subtable
  AFTER INSERT ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.create_xactus_subtable_row();

CREATE OR REPLACE TRIGGER trg_delete_orphaned_chat
  AFTER DELETE ON public.credit_report_user_chats
  FOR EACH ROW EXECUTE FUNCTION public.delete_orphaned_credit_report_chat();

CREATE OR REPLACE TRIGGER trg_ensure_clear_integration
  BEFORE INSERT OR UPDATE ON public.integrations_clear
  FOR EACH ROW EXECUTE FUNCTION public.ensure_clear_integration();

CREATE OR REPLACE TRIGGER trg_ensure_xactus_integration
  BEFORE INSERT OR UPDATE ON public.integrations_xactus
  FOR EACH ROW EXECUTE FUNCTION public.ensure_xactus_integration();

CREATE OR REPLACE TRIGGER trg_loan_scenarios_auto_emails
  BEFORE INSERT OR UPDATE OF guarantor_borrower_ids ON public.loan_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_guarantor_emails();

CREATE OR REPLACE TRIGGER trg_sync_clear_child_ins
  AFTER INSERT ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_clear_child();

CREATE OR REPLACE TRIGGER trg_sync_clear_child_del
  AFTER DELETE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_clear_child();

CREATE OR REPLACE TRIGGER trg_sync_nadlan_child_ins
  AFTER INSERT ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_nadlan_child();

CREATE OR REPLACE TRIGGER trg_sync_nadlan_child_del
  AFTER DELETE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_nadlan_child();

-- ============================================================================
-- SECTION 8: RLS POLICIES
-- ============================================================================

ALTER TABLE public.pricing_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert activity logs for accessible loans"
  ON public.pricing_activity_log FOR INSERT
  WITH CHECK (loan_id IN (
    SELECT loans.id FROM public.loans
    WHERE loans.organization_id IN (
      SELECT organizations.id FROM public.organizations
      WHERE organizations.clerk_organization_id = (current_setting('request.jwt.claims', true)::json ->> 'org_id')
    )
  ));

CREATE POLICY "Users can view their own activity logs"
  ON public.pricing_activity_log FOR SELECT
  USING (
    user_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')
    OR loan_id IN (
      SELECT loans.id FROM public.loans
      WHERE loans.assigned_to_user_id ? (current_setting('request.jwt.claims', true)::json ->> 'sub')
    )
  );

-- ============================================================================
-- SECTION 9: TABLE/COLUMN COMMENTS
-- ============================================================================

COMMENT ON TABLE public.pricing_activity_log IS 'Tracks activity on pricing pages including input changes, user assignments, and term sheet actions';

COMMENT ON COLUMN public.pricing_activity_log.activity_type IS 'Type of activity: input_changes, user_assignment, or term_sheet';

COMMENT ON COLUMN public.pricing_activity_log.action IS 'Action performed: changed, added, deleted, downloaded, or shared';
