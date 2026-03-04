-- Simplify task statuses from 5 (todo, in_progress, in_review, blocked, done) to 3 (todo, done, skipped)

-- Step 1: Move all deal_tasks in removed statuses to todo
UPDATE public.deal_tasks
SET task_status_id = 1
WHERE task_status_id IN (2, 3, 4);

-- Step 2: Move all task_templates with removed default statuses to todo
UPDATE public.task_templates
SET default_status_id = 1
WHERE default_status_id IN (2, 3, 4);

-- Step 3: Null out task_logic_actions referencing removed statuses
UPDATE public.task_logic_actions
SET required_status_id = NULL
WHERE required_status_id IN (2, 3, 4);

-- Step 4: Delete the removed statuses
DELETE FROM public.task_statuses
WHERE code IN ('in_progress', 'in_review', 'blocked');

-- Step 5: Insert the new 'skipped' status
INSERT INTO public.task_statuses (code, name, color, display_order)
VALUES ('skipped', 'Skipped', '#9CA3AF', 3);

-- Step 6: Normalize codes/names and reorder
UPDATE public.task_statuses SET code = 'todo', name = 'To Do', display_order = 1 WHERE id = 1;
UPDATE public.task_statuses SET code = 'done', name = 'Done', display_order = 2 WHERE id = 5;
UPDATE public.task_statuses SET display_order = 3 WHERE code = 'skipped';
