-- Add deal_stage_id to deal_tasks so each task knows which stepper step it belongs to
ALTER TABLE public.deal_tasks ADD COLUMN deal_stage_id bigint
  REFERENCES public.deal_stages(id);

-- Backfill existing tasks from their templates
UPDATE public.deal_tasks dt
SET deal_stage_id = tt.deal_stage_id
FROM public.task_templates tt
WHERE dt.task_template_id = tt.id AND tt.deal_stage_id IS NOT NULL;
