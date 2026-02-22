"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import { Button } from "@repo/ui/shadcn/button";
import { cn } from "@repo/lib/cn";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PipelineTaskAssignee {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

interface PipelineTask {
  id: string;
  uuid: string;
  identifier: string;
  title: string;
  checked: boolean;
  status: string;
  stageName: string;
  buttonEnabled: boolean;
  buttonLabel: string | null;
  buttonActionId: number | null;
  assignees: PipelineTaskAssignee[];
}

const STATUS_COLORS: Record<string, string> = {
  done: "#10B981",
  todo: "#6B7280",
  skipped: "#9CA3AF",
};

interface DealPipelineTasksProps {
  dealId: string;
}

export function DealPipelineTasks({ dealId }: DealPipelineTasksProps) {
  const [tasks, setTasks] = useState<PipelineTask[]>([]);
  const [stepOrder, setStepOrder] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, stepperRes] = await Promise.all([
        fetch(`/api/deals/${dealId}/tasks`),
        fetch(`/api/deals/${dealId}/stepper`),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        const apiTasks = (data.tasks ?? []).map((t: any) => {
          const tmpl = t.task_templates ?? {};
          return {
            id: String(t.id),
            uuid: t.uuid ?? t.id,
            identifier: t.identifier ?? `TSK-${t.id}`,
            title: t.title ?? "Untitled",
            checked: t.task_statuses?.code === "done",
            status: t.task_statuses?.code ?? "todo",
            stageName: t.deal_stages?.name ?? "",
            buttonEnabled: tmpl.button_enabled === true,
            buttonLabel: tmpl.button_label ?? null,
            buttonActionId: tmpl.button_automation_id ?? null,
            assignees: (t.assignees ?? []) as PipelineTaskAssignee[],
          };
        });
        setTasks(apiTasks);
      }

      if (stepperRes.ok) {
        const data = await stepperRes.json();
        const stepper = data.stepper;
        if (stepper) {
          setStepOrder(stepper.step_order ?? []);
          setCurrentStep(stepper.current_step ?? "");
        }
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCheck = useCallback(
    async (taskUuid: string, checked: boolean) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.uuid === taskUuid
            ? { ...t, checked, status: checked ? "done" : "todo" }
            : t
        )
      );
      try {
        await fetch(`/api/deals/${dealId}/tasks/${taskUuid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_status_id: checked ? 5 : 1 }),
        });
      } catch {
        setTasks((prev) =>
          prev.map((t) =>
            t.uuid === taskUuid
              ? { ...t, checked: !checked, status: !checked ? "done" : "todo" }
              : t
          )
        );
      }
    },
    [dealId]
  );

  const handleTriggerAction = useCallback(
    async (task: PipelineTask): Promise<boolean> => {
      if (!task.buttonActionId) return false;
      try {
        const actionRes = await fetch(`/api/automations/by-id/${task.buttonActionId}`);
        if (!actionRes.ok) {
          toast.error("Failed to load action");
          return false;
        }
        const action = await actionRes.json();
        const workflowUuid = action.uuid as string;
        const workflowData = action.workflow_data as {
          nodes?: { data?: { type?: string; config?: Record<string, unknown> } }[];
        } | null;

        const triggerNode = workflowData?.nodes?.find((n) => n.data?.type === "trigger");
        const webhookSchemaRaw = triggerNode?.data?.config?.webhookSchema as string | undefined;
        type SchemaField = { name: string; type: string; inputId?: string };
        const schemaFields: SchemaField[] = webhookSchemaRaw ? JSON.parse(webhookSchemaRaw) : [];

        const inputPayload: Record<string, unknown> = {};
        const fieldsWithInputs = schemaFields.filter((f) => f.inputId);

        for (const field of fieldsWithInputs) {
          if (field.inputId === "__deal_id__") {
            inputPayload[field.name] = dealId;
          }
        }

        const realInputFields = fieldsWithInputs.filter((f) => f.inputId !== "__deal_id__");
        if (realInputFields.length > 0) {
          const dealRes = await fetch(`/api/deals/${dealId}`);
          if (dealRes.ok) {
            const dealData = await dealRes.json();
            const dealInputs = (dealData.deal?.inputs ?? {}) as Record<string, unknown>;
            for (const field of realInputFields) {
              const value = dealInputs[field.inputId!];
              if (value !== undefined) inputPayload[field.name] = value;
            }
          }
        }

        if (!("deal_id" in inputPayload)) inputPayload.deal_id = dealId;

        const execRes = await fetch(`/api/workflow/${workflowUuid}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: inputPayload }),
        });

        if (!execRes.ok) {
          const errData = await execRes.json().catch(() => ({}));
          toast.error(errData.error || "Failed to execute action");
          return false;
        }

        const result = await execRes.json();
        toast.success(`Action started (ID: ${result.executionId})`);
        return true;
      } catch (err) {
        console.error("Error triggering action:", err);
        toast.error("Failed to trigger action");
        return false;
      }
    },
    [dealId]
  );

  const currentStepTasks = useMemo(() => {
    if (!currentStep) return tasks;
    return tasks.filter((t) => t.stageName === currentStep);
  }, [tasks, currentStep]);

  const doneCount = currentStepTasks.filter((t) => t.checked).length;
  const totalCount = currentStepTasks.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const currentStepIdx = stepOrder.indexOf(currentStep);
  const nextStep =
    currentStepIdx >= 0 && currentStepIdx + 1 < stepOrder.length
      ? stepOrder[currentStepIdx + 1]
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-5 py-4 max-w-3xl">
      {/* Header with step name and progress */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {currentStep || "Tasks"}
          </span>
          {currentStep && (
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
              Current Step
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {nextStep
            ? `${totalCount - doneCount} task${totalCount - doneCount !== 1 ? "s" : ""} to reach ${nextStep}`
            : `${doneCount}/${totalCount} completed`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: STATUS_COLORS.done }}
        />
      </div>

      {/* Task list */}
      {currentStepTasks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No tasks in this step
        </p>
      ) : (
        <div className="space-y-0.5">
          {currentStepTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={task.checked}
                onCheckedChange={(checked) =>
                  void handleCheck(task.uuid, checked as boolean)
                }
                className="h-4 w-4 rounded border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span
                className={cn(
                  "text-sm truncate",
                  task.checked
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {task.title}
              </span>
              {task.status !== "todo" && (
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium shrink-0"
                  style={{
                    backgroundColor: `${STATUS_COLORS[task.status] ?? STATUS_COLORS.todo}20`,
                    color: STATUS_COLORS[task.status] ?? STATUS_COLORS.todo,
                  }}
                >
                  {task.status === "done" ? "Done" : task.status === "skipped" ? "Skipped" : task.status}
                </span>
              )}
              {task.assignees.length > 0 && (
                <PipelineAssigneeAvatars assignees={task.assignees} max={3} />
              )}
              <div className="flex items-center gap-2 ml-auto shrink-0">
                {task.buttonEnabled && task.buttonLabel && task.buttonActionId && (
                  <PipelineActionButton
                    label={task.buttonLabel}
                    onRun={() => handleTriggerAction(task)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineAssigneeAvatars({
  assignees,
  max = 3,
}: {
  assignees: PipelineTaskAssignee[];
  max?: number;
}) {
  const visible = assignees.slice(0, max);
  const overflow = assignees.length - max;

  const getInitials = (a: PipelineTaskAssignee) => {
    const parts = [a.first_name, a.last_name].filter(Boolean);
    if (parts.length === 0) return "?";
    return parts.map((p) => p![0]).join("").toUpperCase();
  };

  const getFullName = (a: PipelineTaskAssignee) =>
    [a.first_name, a.last_name].filter(Boolean).join(" ") || a.user_id;

  return (
    <div className="flex items-center" title={assignees.map(getFullName).join(", ")}>
      {visible.map((a, idx) => (
        <div
          key={a.user_id}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[8px] font-semibold text-primary border-2 border-background",
            idx > 0 && "-ml-1.5"
          )}
          title={getFullName(a)}
        >
          {getInitials(a)}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground border-2 border-background -ml-1.5">
          +{overflow}
        </div>
      )}
    </div>
  );
}

function PipelineActionButton({
  label,
  onRun,
}: {
  label: string;
  onRun: () => Promise<boolean>;
}) {
  const [state, setState] = useState<"idle" | "running" | "success" | "error">("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state === "running") return;
    setState("running");
    try {
      const ok = await onRun();
      setState(ok ? "success" : "error");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <Button
      size="sm"
      disabled={state === "running"}
      className={cn(
        "h-6 px-2.5 text-[10px] font-medium transition-all duration-200",
        state === "idle" && "bg-primary text-primary-foreground hover:bg-primary/90",
        state === "running" && "bg-primary text-primary-foreground",
        state === "success" && "bg-emerald-600 text-white",
        state === "error" && "bg-destructive text-destructive-foreground animate-shake"
      )}
      onClick={handleClick}
    >
      {state === "running" && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}
      {state === "success" && <CheckCircle2 className="mr-1 h-2.5 w-2.5" />}
      {state === "idle" && label}
      {state === "running" && "Running..."}
      {state === "success" && "Done"}
      {state === "error" && "Failed"}
    </Button>
  );
}
