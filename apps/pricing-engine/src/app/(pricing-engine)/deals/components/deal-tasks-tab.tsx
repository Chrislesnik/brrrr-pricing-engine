"use client";

import { useState, useEffect, useCallback } from "react";
import { DealTaskTracker } from "./deal-task-tracker";
import type { Task, TaskStatus, TaskPriority } from "./deal-task-tracker";

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
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  task_statuses: TaskStatusRow | null;
  task_priorities: TaskPriorityRow | null;
}

/* -------------------------------------------------------------------------- */
/*  Mapping helpers                                                            */
/* -------------------------------------------------------------------------- */

// Map DB status code → tracker TaskStatus
const STATUS_CODE_MAP: Record<string, TaskStatus> = {
  todo: "todo",
  in_progress: "in_progress",
  in_review: "in_review",
  blocked: "blocked",
  done: "done",
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
  in_progress: 2,
  in_review: 3,
  blocked: 4,
  done: 5,
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
    dueDate: task.due_date_at ?? undefined,
    labels: [],
    dealId,
    checked: status === "done",
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DealTasksTab({ dealId }: DealTasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    />
  );
}
