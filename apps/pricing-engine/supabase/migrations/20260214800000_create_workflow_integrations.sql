-- ============================================================================
-- Migration: Create workflow_integrations table
-- Stores API keys and credentials for workflow builder integrations
-- (Perplexity, Slack, Resend, Linear, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  type text NOT NULL,
  name text,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT workflow_integrations_unique_per_user UNIQUE (organization_id, user_id, type, name)
);

-- RLS
ALTER TABLE public.workflow_integrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_integrations TO authenticated;
GRANT ALL ON public.workflow_integrations TO service_role;

CREATE POLICY "workflow_integrations_select"
  ON public.workflow_integrations FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "workflow_integrations_insert"
  ON public.workflow_integrations FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "workflow_integrations_update"
  ON public.workflow_integrations FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "workflow_integrations_delete"
  ON public.workflow_integrations FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.jwt() ->> 'sub'
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER workflow_integrations_updated_at
  BEFORE UPDATE ON public.workflow_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Index for common queries
CREATE INDEX idx_workflow_integrations_org_user
  ON public.workflow_integrations (organization_id, user_id);

CREATE INDEX idx_workflow_integrations_type
  ON public.workflow_integrations (type);
