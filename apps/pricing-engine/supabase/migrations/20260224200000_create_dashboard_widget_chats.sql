-- New table to group conversation sessions per widget
CREATE TABLE public.dashboard_widget_chats (
  id bigserial PRIMARY KEY,
  dashboard_widget_id bigint NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dwch_widget_id ON public.dashboard_widget_chats(dashboard_widget_id);

ALTER TABLE public.dashboard_widget_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dwch_select" ON public.dashboard_widget_chats
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dwch_insert" ON public.dashboard_widget_chats
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT is_internal_yn FROM public.organizations WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')) = true
    AND (current_setting('request.jwt.claims', true)::jsonb ->> 'org_role') IN ('admin', 'owner')
  );

CREATE POLICY "dwch_update" ON public.dashboard_widget_chats
  FOR UPDATE TO authenticated
  USING (
    (SELECT is_internal_yn FROM public.organizations WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')) = true
    AND (current_setting('request.jwt.claims', true)::jsonb ->> 'org_role') IN ('admin', 'owner')
  )
  WITH CHECK (
    (SELECT is_internal_yn FROM public.organizations WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')) = true
    AND (current_setting('request.jwt.claims', true)::jsonb ->> 'org_role') IN ('admin', 'owner')
  );

CREATE POLICY "dwch_delete" ON public.dashboard_widget_chats
  FOR DELETE TO authenticated
  USING (
    (SELECT is_internal_yn FROM public.organizations WHERE clerk_organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')) = true
    AND (current_setting('request.jwt.claims', true)::jsonb ->> 'org_role') IN ('admin', 'owner')
  );

-- Add FK column to dashboard_widget_conversations (nullable initially for backfill)
ALTER TABLE public.dashboard_widget_conversations
  ADD COLUMN dashboard_widget_chat_id bigint REFERENCES public.dashboard_widget_chats(id) ON DELETE CASCADE;

-- Backfill: create one chat per widget that has existing messages, then assign
INSERT INTO public.dashboard_widget_chats (dashboard_widget_id, name, created_at, last_used_at)
SELECT DISTINCT
  dwc.dashboard_widget_id,
  'Chat 1',
  MIN(dwc.created_at) OVER (PARTITION BY dwc.dashboard_widget_id),
  MAX(dwc.created_at) OVER (PARTITION BY dwc.dashboard_widget_id)
FROM public.dashboard_widget_conversations dwc
WHERE dwc.dashboard_widget_chat_id IS NULL
GROUP BY dwc.dashboard_widget_id, dwc.created_at;

-- Deduplicate in case the window function produced multiple rows
DELETE FROM public.dashboard_widget_chats a
USING public.dashboard_widget_chats b
WHERE a.dashboard_widget_id = b.dashboard_widget_id
  AND a.id > b.id;

-- Assign existing messages to their widget's backfilled chat
UPDATE public.dashboard_widget_conversations dwc
SET dashboard_widget_chat_id = ch.id
FROM public.dashboard_widget_chats ch
WHERE dwc.dashboard_widget_id = ch.dashboard_widget_id
  AND dwc.dashboard_widget_chat_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.dashboard_widget_conversations
  ALTER COLUMN dashboard_widget_chat_id SET NOT NULL;

CREATE INDEX idx_dwc_chat_id ON public.dashboard_widget_conversations(dashboard_widget_chat_id);
