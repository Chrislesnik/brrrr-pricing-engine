ALTER TABLE actions RENAME TO automations;
ALTER TABLE task_templates RENAME COLUMN button_action_id TO button_automation_id;
