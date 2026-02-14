-- ============================================================================
-- Migration: Create workflow execution tracking tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id text NOT NULL,
  user_id text NOT NULL,
  organization_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'running',
  input jsonb,
  output jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration text
);

CREATE TABLE IF NOT EXISTS public.workflow_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  node_name text,
  node_type text,
  status text NOT NULL DEFAULT 'pending',
  input jsonb,
  output jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  duration text
);

-- RLS
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.workflow_executions TO service_role;
GRANT ALL ON public.workflow_execution_logs TO service_role;
GRANT SELECT ON public.workflow_executions TO authenticated;
GRANT SELECT ON public.workflow_execution_logs TO authenticated;

CREATE POLICY "workflow_executions_select"
  ON public.workflow_executions FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "workflow_execution_logs_select"
  ON public.workflow_execution_logs FOR SELECT TO authenticated
  USING (
    execution_id IN (
      SELECT id FROM public.workflow_executions
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Indexes
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions (workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions (user_id);
CREATE INDEX idx_workflow_execution_logs_execution_id ON public.workflow_execution_logs (execution_id);
