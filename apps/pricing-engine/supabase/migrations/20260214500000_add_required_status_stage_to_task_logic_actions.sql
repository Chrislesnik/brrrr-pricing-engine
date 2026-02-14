-- ============================================================================
-- Migration: Add required_status_id and required_for_stage_id to task_logic_actions
-- When action_type = 'required', these fields define which status is required
-- and for which deal stage transition.
-- ============================================================================

ALTER TABLE public.task_logic_actions
  ADD COLUMN IF NOT EXISTS required_status_id bigint,
  ADD COLUMN IF NOT EXISTS required_for_stage_id bigint;

-- Foreign keys
ALTER TABLE public.task_logic_actions
  ADD CONSTRAINT task_logic_actions_required_status_id_fkey
    FOREIGN KEY (required_status_id) REFERENCES public.task_statuses(id) ON DELETE SET NULL;

ALTER TABLE public.task_logic_actions
  ADD CONSTRAINT task_logic_actions_required_for_stage_id_fkey
    FOREIGN KEY (required_for_stage_id) REFERENCES public.deal_stages(id) ON DELETE SET NULL;
