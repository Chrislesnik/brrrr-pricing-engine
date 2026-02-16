-- Join table for role assignments
CREATE TABLE public.task_template_roles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_template_id bigint NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  deal_role_type_id bigint NOT NULL REFERENCES public.deal_role_types(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_template_id, deal_role_type_id)
);

-- Button config columns on task_templates
ALTER TABLE public.task_templates
  ADD COLUMN button_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN button_action_id bigint REFERENCES public.actions(id),
  ADD COLUMN button_label text;
