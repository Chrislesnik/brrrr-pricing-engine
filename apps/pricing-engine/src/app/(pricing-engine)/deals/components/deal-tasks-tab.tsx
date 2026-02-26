"use client";

import { useState, useEffect, useCallback } from "react";

import { DealTaskTracker } from "./deal-task-tracker";
import type { Task, TaskAssignee, TaskStatus, TaskPriority } from "./deal-task-tracker";

interface DealTasksTabProps {
  dealId: string;
}

/* -------------------------------------------------------------------------- */
/*  API response types                                                         */
/* -------------------------------------------------------------------------- */

interface TaskStatusRow {
  id: number;
  code: string;
  name: string;
  color: string | null;
}

interface TaskPriorityRow {
  id: number;
  code: string;
  name: string;
  color: string | null;
}

interface DealStageRow {
  id: number;
  code: string;
  name: string;
  color: string | null;
  display_order: number | null;
}

interface TaskTemplateRow {
  button_enabled: boolean;
  button_automation_id: number | null;
  button_label: string | null;
}

interface TaskFromApi {
  id: number;
  uuid: string;
  deal_id: string;
  organization_id: string | null;
  task_template_id: number | null;
  title: string;
  description: string | null;
  task_status_id: number | null;
  task_priority_id: number | null;
  assigned_to_user_ids: string[];
  due_date_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  deal_stage_id: number | null;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  task_statuses: TaskStatusRow | null;
  task_priorities: TaskPriorityRow | null;
  deal_stages: DealStageRow | null;
  task_templates: TaskTemplateRow | null;
  assignees?: TaskAssignee[];
}

/* -------------------------------------------------------------------------- */
/*  Mapping helpers                                                            */
/* -------------------------------------------------------------------------- */

// Map DB status code → tracker TaskStatus
const STATUS_CODE_MAP: Record<string, TaskStatus> = {
  todo: "todo",
  done: "done",
  skipped: "skipped",
};

// Map DB priority code → tracker TaskPriority
const PRIORITY_CODE_MAP: Record<string, TaskPriority> = {
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "urgent",
};

// Reverse: tracker TaskStatus → DB status id
const STATUS_TO_ID: Record<TaskStatus, number> = {
  todo: 1,
  done: 5,
  skipped: 6,
};

// Reverse: tracker TaskPriority → DB priority id (0 = none / null)
const PRIORITY_TO_ID: Record<TaskPriority, number | null> = {
  none: null,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

function apiTaskToTrackerTask(task: TaskFromApi, dealId: string): Task {
  // Prefer the joined row's code, fall back to id-based mapping
  let status: TaskStatus = "todo";
  if (task.task_statuses?.code) {
    status = STATUS_CODE_MAP[task.task_statuses.code] ?? "todo";
  }

  let priority: TaskPriority = "none";
  if (task.task_priorities?.code) {
    priority = PRIORITY_CODE_MAP[task.task_priorities.code] ?? "none";
  }

  return {
    id: task.uuid,
    identifier: `TSK-${task.id}`,
    title: task.title,
    description: task.description ?? undefined,
    status,
    priority,
    assignee:
      task.assigned_to_user_ids && task.assigned_to_user_ids.length > 0
        ? task.assigned_to_user_ids[0]
        : undefined,
    assignees: task.assignees ?? [],
    dueDate: task.due_date_at ?? undefined,
    labels: [],
    dealId,
    checked: status === "done",
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    stage: task.deal_stages?.name ?? undefined,
    stageCode: task.deal_stages?.code ?? undefined,
    stageColor: task.deal_stages?.color ?? undefined,
    stageOrder: task.deal_stages?.display_order ?? undefined,
    dealStageName: task.deal_stages?.name ?? undefined,
    buttonEnabled: task.task_templates?.button_enabled ?? false,
    buttonLabel: task.task_templates?.button_label ?? undefined,
    buttonActionId: task.task_templates?.button_automation_id ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DealTasksTab({ dealId }: DealTasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepOrder, setStepOrder] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [stageNameToId, setStageNameToId] = useState<Map<string, number>>(new Map());

  // Fetch stepper data and deal stages
  useEffect(() => {
    (async () => {
      try {
        const [stepperRes, stagesRes] = await Promise.all([
          fetch(`/api/deals/${dealId}/stepper`),
          fetch("/api/deal-stages"),
        ]);
        if (stepperRes.ok) {
          const data = await stepperRes.json();
          const stepper = data.stepper;
          if (stepper) {
            setStepOrder(stepper.step_order ?? []);
            setCurrentStep(stepper.current_step ?? "");
          }
        }
        if (stagesRes.ok) {
          const stages = await stagesRes.json();
          const map = new Map<string, number>();
          for (const s of stages) {
            if (s.name && s.id) map.set(s.name, s.id);
          }
          setStageNameToId(map);
        }
      } catch {
        // non-critical
      }
    })();
  }, [dealId]);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/deals/${dealId}/tasks`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch tasks (${response.status})`);
      }

      const data = await response.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: TaskFromApi) => apiTaskToTrackerTask(t, dealId)));
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = useCallback(
    async (_dealId: string, task: Partial<Task>) => {
      try {
        const response = await fetch(`/api/deals/${dealId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            task_status_id: task.status ? STATUS_TO_ID[task.status] : STATUS_TO_ID.todo,
            task_priority_id: task.priority ? PRIORITY_TO_ID[task.priority] : null,
            assigned_to_user_ids: task.assignee ? [task.assignee] : [],
            due_date_at: task.dueDate || null,
            deal_stage_id: task.dealStageName ? (stageNameToId.get(task.dealStageName) ?? null) : null,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.error("Failed to create task:", data.error);
        }

        // Refetch to get fresh data
        fetchTasks();
      } catch (err) {
        console.error("Error creating task:", err);
      }
    },
    [dealId, fetchTasks]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.status !== undefined) payload.task_status_id = STATUS_TO_ID[updates.status];
        if (updates.priority !== undefined) payload.task_priority_id = PRIORITY_TO_ID[updates.priority];
        if (updates.assignee !== undefined)
          payload.assigned_to_user_ids = updates.assignee ? [updates.assignee] : [];
        if (updates.dueDate !== undefined) payload.due_date_at = updates.dueDate || null;
        // Map checked toggle to status when no explicit status update
        if (updates.checked !== undefined && updates.status === undefined) {
          payload.task_status_id = updates.checked ? STATUS_TO_ID.done : STATUS_TO_ID.todo;
        }

        const response = await fetch(`/api/deals/${dealId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.error("Failed to update task:", data.error);
        }

        // Refetch to get fresh data
        fetchTasks();
      } catch (err) {
        console.error("Error updating task:", err);
      }
    },
    [dealId, fetchTasks]
  );

  const handleTriggerAction = useCallback(
    async (task: Task): Promise<boolean> => {
      if (!task.buttonActionId) return false;

      try {
        // 1. Look up the action by numeric ID to get uuid + workflow_data
        const actionRes = await fetch(`/api/automations/by-id/${task.buttonActionId}`);
        if (!actionRes.ok) {
          return false;
        }
        const action = await actionRes.json();
        const workflowUuid = action.uuid as string;
        const workflowData = action.workflow_data as {
          nodes?: { data?: { type?: string; config?: Record<string, unknown> } }[];
        } | null;

        // 2. Parse the trigger node's webhookSchema to find input mappings
        const triggerNode = workflowData?.nodes?.find(
          (n) => n.data?.type === "trigger"
        );
        const webhookSchemaRaw = triggerNode?.data?.config?.webhookSchema as string | undefined;
        type SchemaField = {
          name: string;
          type: string;
          inputId?: string;
        };
        const schemaFields: SchemaField[] = webhookSchemaRaw
          ? JSON.parse(webhookSchemaRaw)
          : [];

        // 3. For each field with an inputId, resolve the deal's input value
        const inputPayload: Record<string, unknown> = {};
        const fieldsWithInputs = schemaFields.filter((f) => f.inputId);

        // Resolve system inputs (e.g. __deal_id__) first
        for (const field of fieldsWithInputs) {
          if (field.inputId === "__deal_id__") {
            inputPayload[field.name] = dealId;
          }
        }

        // Resolve real deal inputs by fetching the deal (which includes inputs keyed by input_id)
        const realInputFields = fieldsWithInputs.filter(
          (f) => f.inputId !== "__deal_id__"
        );
        if (realInputFields.length > 0) {
          const dealRes = await fetch(`/api/deals/${dealId}`);
          if (dealRes.ok) {
            const dealData = await dealRes.json();
            const dealInputs = (dealData.deal?.inputs ?? {}) as Record<string, unknown>;

            for (const field of realInputFields) {
              // inputId is a string, deal inputs are keyed by numeric input_id
              const value = dealInputs[field.inputId!];
              if (value !== undefined) {
                inputPayload[field.name] = value;
              }
            }
          }
        }

        // Always include deal_id as a fallback if not explicitly mapped
        if (!("deal_id" in inputPayload)) {
          inputPayload.deal_id = dealId;
        }

        // 4. Execute the workflow
        const execRes = await fetch(`/api/workflow/${workflowUuid}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: inputPayload }),
        });

        if (!execRes.ok) {
          return false;
        }

        await execRes.json();
        return true;
      } catch {
        return false;
      }
    },
    [dealId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <button
            onClick={fetchTasks}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DealTaskTracker
      dealId={dealId}
      tasks={tasks}
      onAddTask={handleAddTask}
      onUpdateTask={handleUpdateTask}
      onTriggerAction={handleTriggerAction}
      stepOrder={stepOrder}
      currentStep={currentStep}
    />
  );
}
