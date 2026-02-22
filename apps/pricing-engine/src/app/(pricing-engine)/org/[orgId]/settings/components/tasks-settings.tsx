"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button as AriaButton,
  Group,
  Input as AriaInput,
  NumberField,
} from "react-aria-components";
import {
  Check,
  GripVertical,
  ListOrdered,
  MinusIcon,
  Pencil,
  Plus,
  PlusIcon,
  Loader2,
  Settings,
  Workflow,
  X,
  Archive,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from "@/components/ui/kanban";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskLogicBuilderSheet } from "./task-logic-builder-sheet";
import { TaskSettingsSheet } from "./task-settings-sheet";
import { StepperBuilderSheet } from "./stepper-builder-sheet";
// ActionsSettings now rendered directly by DealsSettings wrapper

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DealStage {
  id: number;
  code: string;
  name: string;
  color: string | null;
  display_order: number;
  is_active: boolean;
}

interface TaskTemplate {
  id: number;
  uuid: string;
  deal_stage_id: number | null;
  code: string;
  name: string;
  description: string | null;
  default_status_id: number | null;
  default_priority_id: number | null;
  due_offset_days: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface LookupItem {
  id: number;
  code: string;
  name: string;
  color: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                   */
/* -------------------------------------------------------------------------- */

const UNASSIGNED_KEY = "col-unassigned";

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function TasksSettings() {
  const [stages, setStages] = useState<DealStage[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  // Add task state (per column)
  const [addingTaskForStage, setAddingTaskForStage] = useState<
    number | "unassigned" | null
  >(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatusId, setNewTaskStatusId] = useState("");
  const [newTaskPriorityId, setNewTaskPriorityId] = useState("");
  const [newTaskDueOffsetDays, setNewTaskDueOffsetDays] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Logic Builder sheet state
  const [logicBuilderOpen, setLogicBuilderOpen] = useState(false);
  const [logicBuilderTaskId, setLogicBuilderTaskId] = useState<number | null>(
    null
  );

  // Stepper sheet state
  const [stepperOpen, setStepperOpen] = useState(false);

  // Task settings sheet state
  const [settingsTask, setSettingsTask] = useState<TaskTemplate | null>(null);

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number;
    name: string;
  }>({ open: false, id: 0, name: "" });

  /* ---- Fetch data ---- */

  const fetchData = useCallback(async () => {
    try {
      const [stagesRes, templatesRes, statusesRes, prioritiesRes] =
        await Promise.all([
          fetch("/api/deal-stages"),
          fetch("/api/task-templates"),
          fetch("/api/task-statuses"),
          fetch("/api/task-priorities"),
        ]);
      if (stagesRes.ok) {
        const data = await stagesRes.json();
        setStages(data.stages ?? []);
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates ?? []);
      }
      if (statusesRes.ok) {
        const data = await statusesRes.json();
        setStatuses(data.statuses ?? []);
      }
      if (prioritiesRes.ok) {
        const data = await prioritiesRes.json();
        setPriorities(data.priorities ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAccessAndFetch() {
      try {
        const accessResponse = await fetch("/api/org/settings-access?tab=tasks");
        if (accessResponse.ok) {
          const accessData = await accessResponse.json();
          setCanAccess(accessData.canAccess);

          if (!accessData.canAccess) {
            setLoading(false);
            return;
          }
        } else {
          setCanAccess(false);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to check access:", error);
        setCanAccess(false);
        setLoading(false);
        return;
      }

      await fetchData();
    }

    checkAccessAndFetch();
  }, [fetchData]);

  /* ---- Build Kanban columns ---- */

  const kanbanColumns = buildKanbanColumns(stages, templates);
  const stageMap = new Map(stages.map((s) => [colKey(s.id), s]));

  /* ---- Task CRUD ---- */

  const handleAddTask = async (stageId: number | null) => {
    if (!newTaskName.trim()) return;
    setSavingTask(true);
    try {
      const res = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_stage_id: stageId,
          name: newTaskName.trim(),
          description: newTaskDescription.trim() || null,
          default_status_id: newTaskStatusId ? Number(newTaskStatusId) : null,
          default_priority_id: newTaskPriorityId ? Number(newTaskPriorityId) : null,
          due_offset_days: newTaskDueOffsetDays !== "" ? Number(newTaskDueOffsetDays) : null,
        }),
      });
      if (res.ok) {
        resetTaskForm();
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to add task:", err.error);
      }
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await fetch("/api/task-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const confirmDelete = async () => {
    await handleDeleteTask(deleteDialog.id);
    setDeleteDialog((prev) => ({ ...prev, open: false }));
  };

  const handleSaveTaskEdit = async (task: TaskTemplate) => {
    if (!newTaskName.trim()) return;
    setSavingTask(true);
    try {
      const res = await fetch("/api/task-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          name: newTaskName.trim(),
          description: newTaskDescription.trim() || null,
        }),
      });
      if (res.ok) {
        resetTaskForm();
        setEditingTaskId(null);
        await fetchData();
      }
    } finally {
      setSavingTask(false);
    }
  };

  const resetTaskForm = () => {
    setAddingTaskForStage(null);
    setEditingTaskId(null);
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskStatusId("");
    setNewTaskPriorityId("");
    setNewTaskDueOffsetDays("");
  };

  /* ---- Drag and drop handlers ---- */

  const handleKanbanChange = (newColumns: Record<string, TaskTemplate[]>) => {
    // Build reorder payload for all items
    const reorderPayload: {
      id: number;
      deal_stage_id: number | null;
      display_order: number;
    }[] = [];
    const newTemplates: TaskTemplate[] = [];

    for (const [key, items] of Object.entries(newColumns)) {
      const stageId = key === UNASSIGNED_KEY ? null : colId(key);
      items.forEach((item, index) => {
        reorderPayload.push({
          id: item.id,
          deal_stage_id: stageId,
          display_order: index,
        });
        newTemplates.push({
          ...item,
          deal_stage_id: stageId,
          display_order: index,
        });
      });
    }

    setTemplates(newTemplates);

    // Persist reorder
    if (reorderPayload.length > 0) {
      fetch("/api/task-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: reorderPayload }),
      }).catch(console.error);
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You don&apos;t have permission to manage tasks.
        </p>
      </div>
    );
  }

  // All column keys in order: stages first, then unassigned
  const columnKeys = [
    ...stages.map((s) => colKey(s.id)),
    UNASSIGNED_KEY,
  ];

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLogicBuilderTaskId(null);
            setLogicBuilderOpen(true);
          }}
        >
          <Workflow className="size-4 mr-1.5" />
          Logic Builder
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStepperOpen(true)}
        >
          <ListOrdered className="size-4 mr-1.5" />
          Stepper
        </Button>
      </div>

      {/* Kanban Board */}
      {stages.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">
            No deal stages configured yet. Set up the stepper in the Inputs tab
            first.
          </p>
        </div>
      ) : (
        <Kanban<TaskTemplate>
          value={kanbanColumns}
          onValueChange={handleKanbanChange}
          getItemValue={(item) => String(item.id)}
        >
          <KanbanBoard>
            {columnKeys.map((ck) => {
              const isUnassigned = ck === UNASSIGNED_KEY;
              const stage = stageMap.get(ck);
              const colName = isUnassigned
                ? "Unassigned"
                : stage?.name ?? "Unknown";
              const colTemplates = kanbanColumns[ck] ?? [];

              return (
                <KanbanColumn key={ck} value={ck}>
                  {/* Column header (read-only — stages managed via Stepper) */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm uppercase tracking-wide">
                        {colName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="pointer-events-none rounded-sm text-xs"
                      >
                        {colTemplates.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Task items */}
                  <div className="flex flex-col gap-1.5">
                    {colTemplates.map((task) =>
                      editingTaskId === task.id ? (
                        <div
                          key={task.id}
                          className="space-y-3 rounded-md border bg-card p-3"
                        >
                          <div className="space-y-1.5">
                            <Label className="text-xs">Name *</Label>
                            <Input
                              placeholder="e.g. Upload Appraisal"
                              value={newTaskName}
                              onChange={(e) => setNewTaskName(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="Optional description..."
                              value={newTaskDescription}
                              onChange={(e) =>
                                setNewTaskDescription(e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSaveTaskEdit(task)}
                              disabled={savingTask || !newTaskName.trim()}
                            >
                              {savingTask ? (
                                <Loader2 className="size-3 animate-spin mr-1" />
                              ) : (
                                <Check className="size-3 mr-1" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={resetTaskForm}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <KanbanItem
                          key={task.id}
                          value={String(task.id)}
                          asHandle
                          asChild
                        >
                          <div className="group flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-xs transition-shadow">
                            <GripVertical className="size-3.5 text-muted-foreground shrink-0" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium truncate">
                                {task.name}
                              </span>
                              {task.description && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {task.description}
                                </span>
                              )}
                            </div>
                            <div className="ml-auto flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLogicBuilderTaskId(task.id);
                                  setLogicBuilderOpen(true);
                                }}
                              >
                                <Workflow className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSettingsTask(task);
                                }}
                              >
                                <Settings className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetTaskForm();
                                  setEditingTaskId(task.id);
                                  setNewTaskName(task.name);
                                  setNewTaskDescription(
                                    task.description ?? ""
                                  );
                                }}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDialog({
                                    open: true,
                                    id: task.id,
                                    name: task.name,
                                  });
                                }}
                              >
                                <Archive className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </KanbanItem>
                      )
                    )}
                  </div>

                  {/* Add Task Form */}
                  {addingTaskForStage ===
                  (isUnassigned ? "unassigned" : stage?.id) ? (
                    <div className="mt-3 space-y-3 rounded-md border bg-card p-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Name *</Label>
                        <Input
                          placeholder="e.g. Upload Appraisal"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="Optional description..."
                          value={newTaskDescription}
                          onChange={(e) =>
                            setNewTaskDescription(e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Default Status</Label>
                          <Select
                            value={newTaskStatusId}
                            onValueChange={setNewTaskStatusId}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((s) => (
                                <SelectItem
                                  key={s.id}
                                  value={String(s.id)}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {s.color && (
                                      <span
                                        className="inline-block size-2 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: s.color,
                                        }}
                                      />
                                    )}
                                    {s.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Default Priority</Label>
                          <Select
                            value={newTaskPriorityId}
                            onValueChange={setNewTaskPriorityId}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              {priorities.map((p) => (
                                <SelectItem
                                  key={p.id}
                                  value={String(p.id)}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {p.color && (
                                      <span
                                        className="inline-block size-2 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: p.color,
                                        }}
                                      />
                                    )}
                                    {p.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Due Offset Days
                        </Label>
                        <NumberField
                          value={
                            newTaskDueOffsetDays !== ""
                              ? Number(newTaskDueOffsetDays)
                              : undefined
                          }
                          onChange={(val) =>
                            setNewTaskDueOffsetDays(
                              isNaN(val) ? "" : String(val)
                            )
                          }
                          minValue={0}
                          className="w-44"
                        >
                          <Group className="border-input data-focus-within:ring-ring relative inline-flex h-8 w-full items-center overflow-hidden rounded-md border bg-transparent shadow-xs transition-colors outline-none data-disabled:opacity-50 data-focus-within:ring-1">
                            <AriaInput
                              placeholder="0"
                              className="placeholder:text-muted-foreground w-full grow bg-transparent px-3 py-1 text-xs outline-none"
                            />
                            <AriaButton
                              slot="decrement"
                              className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                            >
                              <MinusIcon className="size-3" />
                            </AriaButton>
                            <AriaButton
                              slot="increment"
                              className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex aspect-square h-[inherit] items-center justify-center border-l text-sm transition-colors disabled:opacity-50"
                            >
                              <PlusIcon className="size-3" />
                            </AriaButton>
                          </Group>
                        </NumberField>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            handleAddTask(isUnassigned ? null : stage?.id ?? null)
                          }
                          disabled={savingTask || !newTaskName.trim()}
                        >
                          {savingTask ? (
                            <Loader2 className="size-3 animate-spin mr-1" />
                          ) : (
                            <Plus className="size-3 mr-1" />
                          )}
                          Save Task
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={resetTaskForm}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start text-xs text-muted-foreground h-7"
                      onClick={() => {
                        resetTaskForm();
                        setAddingTaskForStage(
                          isUnassigned ? "unassigned" : stage?.id ?? null
                        );
                      }}
                    >
                      <Plus className="size-3 mr-1" />
                      Add Task
                    </Button>
                  )}
                </KanbanColumn>
              );
            })}
          </KanbanBoard>
          <KanbanOverlay>
            <div className="size-full rounded-md bg-primary/10" />
          </KanbanOverlay>
        </Kanban>
      )}

      {/* Logic Builder Sheet */}
      <TaskLogicBuilderSheet
        open={logicBuilderOpen}
        onOpenChange={setLogicBuilderOpen}
        filterTaskTemplateId={logicBuilderTaskId}
      />

      {/* Stepper Builder Sheet */}
      <StepperBuilderSheet
        open={stepperOpen}
        onOpenChange={(open) => {
          setStepperOpen(open);
          // Refresh stages after stepper closes (sync may have updated deal_stages)
          if (!open) fetchData();
        }}
      />

      {/* Task Settings Sheet */}
      <TaskSettingsSheet
        open={settingsTask !== null}
        onOpenChange={(open) => {
          if (!open) setSettingsTask(null);
        }}
        task={settingsTask}
        onSaved={fetchData}
      />

      {/* Archive confirmation dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Task Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteDialog.name}&rdquo;
              </span>
              ? This will be archived and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Prefix numeric IDs so Object.keys() preserves insertion order */
const COL_PREFIX = "col-";
function colKey(id: number): string {
  return `${COL_PREFIX}${id}`;
}
function colId(key: string): number {
  return Number(key.slice(COL_PREFIX.length));
}

function buildKanbanColumns(
  stages: DealStage[],
  templates: TaskTemplate[]
): Record<string, TaskTemplate[]> {
  const columns: Record<string, TaskTemplate[]> = {};

  // Create a column for each active stage
  for (const stage of stages) {
    columns[colKey(stage.id)] = [];
  }

  // Create the Unassigned column
  columns[UNASSIGNED_KEY] = [];

  // Distribute templates into columns
  for (const tmpl of templates) {
    if (tmpl.deal_stage_id) {
      const key = colKey(tmpl.deal_stage_id);
      if (columns[key]) {
        columns[key].push(tmpl);
      } else {
        // Stage not found (might be inactive) — put in unassigned
        columns[UNASSIGNED_KEY].push(tmpl);
      }
    } else {
      columns[UNASSIGNED_KEY].push(tmpl);
    }
  }

  // Sort templates within each column by display_order
  for (const key of Object.keys(columns)) {
    columns[key].sort((a, b) => a.display_order - b.display_order);
  }

  return columns;
}
