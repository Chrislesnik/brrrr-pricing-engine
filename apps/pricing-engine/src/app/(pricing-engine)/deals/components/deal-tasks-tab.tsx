"use client";

import { useState, useEffect, useCallback } from "react";
import { DealTaskTracker } from "./deal-task-tracker";

interface DealTasksTabProps {
  dealId: string;
}

interface TaskFromApi {
  id: string;
  uuid: string;
  title: string;
  description?: string;
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
  task_template_id: number | null;
}

// Map DB status IDs to the display labels used by DealTaskTracker
// These match the seed data in task_statuses (id 1-5)
const STATUS_ID_TO_LABEL: Record<number, string> = {
  1: "To Do",
  2: "In Progress",
  3: "In Review",
  4: "Blocked",
  5: "Done",
};

const STATUS_LABEL_TO_ID: Record<string, number> = {
  "To Do": 1,
  "In Progress": 2,
  "In Review": 3,
  "Blocked": 4,
  "Done": 5,
};

const PRIORITY_ID_TO_LABEL: Record<number, string> = {
  1: "low",
  2: "medium",
  3: "high",
  4: "urgent",
};

const PRIORITY_LABEL_TO_ID: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

type TaskStatus = "To Do" | "In Progress" | "In Review" | "Done";
type TaskPriority = "low" | "medium" | "high";

interface TrackerTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
  dealId: string;
}

function apiTaskToTrackerTask(task: TaskFromApi, dealId: string): TrackerTask {
  return {
    id: task.uuid || task.id.toString(),
    title: task.title,
    description: task.description || undefined,
    status: (task.task_status_id
      ? (STATUS_ID_TO_LABEL[task.task_status_id] as TaskStatus)
      : "To Do") as TaskStatus,
    priority: task.task_priority_id
      ? (PRIORITY_ID_TO_LABEL[task.task_priority_id] as TaskPriority)
      : undefined,
    assignee:
      task.assigned_to_user_ids && task.assigned_to_user_ids.length > 0
        ? task.assigned_to_user_ids[0]
        : undefined,
    dueDate: task.due_date_at || undefined,
    dealId,
  };
}

export function DealTasksTab({ dealId }: DealTasksTabProps) {
  const [tasks, setTasks] = useState<TrackerTask[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}/tasks`);
      if (!response.ok) {
        // API not yet implemented — fall back to sample data
        setTasks(undefined);
        return;
      }
      const data = await response.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: TaskFromApi) => apiTaskToTrackerTask(t, dealId)));
      } else {
        setTasks(undefined);
      }
    } catch {
      // API not available yet — component will use sample data
      setTasks(undefined);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = useCallback(
    async (_dealId: string, task: Partial<TrackerTask>) => {
      try {
        await fetch(`/api/deals/${dealId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            task_status_id: task.status
              ? STATUS_LABEL_TO_ID[task.status]
              : STATUS_LABEL_TO_ID["To Do"],
            task_priority_id: task.priority
              ? PRIORITY_LABEL_TO_ID[task.priority]
              : PRIORITY_LABEL_TO_ID["medium"],
            assigned_to_user_ids: task.assignee ? [task.assignee] : [],
            due_date_at: task.dueDate || null,
          }),
        });
        // Refresh from server
        fetchTasks();
      } catch {
        // API not yet available — local state in tracker handles it
      }
    },
    [dealId, fetchTasks]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<TrackerTask>) => {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined)
          payload.description = updates.description;
        if (updates.status !== undefined)
          payload.task_status_id = STATUS_LABEL_TO_ID[updates.status];
        if (updates.priority !== undefined)
          payload.task_priority_id = PRIORITY_LABEL_TO_ID[updates.priority];
        if (updates.assignee !== undefined)
          payload.assigned_to_user_ids = updates.assignee
            ? [updates.assignee]
            : [];
        if (updates.dueDate !== undefined)
          payload.due_date_at = updates.dueDate || null;

        await fetch(`/api/deals/${dealId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // API not yet available — local state in tracker handles it
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

  return (
    <DealTaskTracker
      dealId={dealId}
      tasks={tasks}
      onAddTask={handleAddTask}
      onUpdateTask={handleUpdateTask}
    />
  );
}
