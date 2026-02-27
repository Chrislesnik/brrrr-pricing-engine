-- Separate table for AI conversation history per dashboard widget
CREATE TABLE public.dashboard_widget_conversations (
  id bigserial PRIMARY KEY,
  dashboard_widget_id bigint NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_dwc_widget_id ON public.dashboard_widget_conversations(dashboard_widget_id);

-- RLS: same access pattern as dashboard_widgets
ALTER TABLE public.dashboard_widget_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dwc_select" ON public.dashboard_widget_conversations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dwc_insert" ON public.dashboard_widget_conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT is_internal_yn FROM public.organizations WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')) = true
    AND (current_setting('request.jwt.claims', true)::jsonb ->> 'org_role') IN ('admin', 'owner')
  );

CREATE POLICY "dwc_delete" ON public.dashboard_widget_conversations
  FOR DELETE TO authenticated
  USING (
    (SELECT is_internal_yn FROM public.organizations WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')) = true
    AND (current_setting('request.jwt.claims', true)::jsonb ->> 'org_role') IN ('admin', 'owner')
  );

-- Drop the old jsonb column from dashboard_widgets
ALTER TABLE public.dashboard_widgets DROP COLUMN IF EXISTS conversation_history;
