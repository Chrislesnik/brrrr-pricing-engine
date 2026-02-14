"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Settings } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Switch } from "@repo/ui/shadcn/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface TaskTemplate {
  id: number;
  name: string;
  description: string | null;
  default_status_id: number | null;
  default_priority_id: number | null;
  due_offset_days: number | null;
  is_active: boolean;
}

interface LookupItem {
  id: number;
  code: string;
  name: string;
  color: string | null;
}

interface TaskSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskTemplate | null;
  onSaved: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TaskSettingsSheet({
  open,
  onOpenChange,
  task,
  onSaved,
}: TaskSettingsSheetProps) {
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [statusId, setStatusId] = useState<string>("");
  const [priorityId, setPriorityId] = useState<string>("");
  const [dueOffsetDays, setDueOffsetDays] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setStatusId(task.default_status_id ? String(task.default_status_id) : "");
      setPriorityId(
        task.default_priority_id ? String(task.default_priority_id) : ""
      );
      setDueOffsetDays(
        task.due_offset_days != null ? String(task.due_offset_days) : ""
      );
      setIsActive(task.is_active);
    }
  }, [task]);

  // Fetch lookup data when sheet opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchLookups = async () => {
      setLoading(true);
      try {
        const [statusesRes, prioritiesRes] = await Promise.all([
          fetch("/api/task-statuses"),
          fetch("/api/task-priorities"),
        ]);

        if (statusesRes.ok) {
          const data = await statusesRes.json();
          if (!cancelled) setStatuses(data.statuses ?? []);
        }
        if (prioritiesRes.ok) {
          const data = await prioritiesRes.json();
          if (!cancelled) setPriorities(data.priorities ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch lookups:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLookups();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Check if anything changed
  const hasChanges =
    task != null &&
    (statusId !== (task.default_status_id ? String(task.default_status_id) : "") ||
      priorityId !==
        (task.default_priority_id
          ? String(task.default_priority_id)
          : "") ||
      dueOffsetDays !==
        (task.due_offset_days != null
          ? String(task.due_offset_days)
          : "") ||
      isActive !== task.is_active);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch("/api/task-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          default_status_id: statusId ? Number(statusId) : null,
          default_priority_id: priorityId ? Number(priorityId) : null,
          due_offset_days: dueOffsetDays !== "" ? Number(dueOffsetDays) : null,
          is_active: isActive,
        }),
      });

      if (res.ok) {
        onSaved();
        onOpenChange(false);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to save task settings:", err.error);
      }
    } catch (err) {
      console.error("Failed to save task settings:", err);
    } finally {
      setSaving(false);
    }
  }, [task, statusId, priorityId, dueOffsetDays, isActive, onSaved, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Task Settings
          </SheetTitle>
          <SheetDescription>
            {task
              ? `Configure settings for "${task.name}".`
              : "Select a task to configure."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !task ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No task selected.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Task name (read-only context) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Task Template
                </Label>
                <div className="text-sm font-medium">{task.name}</div>
                {task.description && (
                  <div className="text-xs text-muted-foreground">
                    {task.description}
                  </div>
                )}
              </div>

              {/* Default Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Status</Label>
                <p className="text-xs text-muted-foreground">
                  Status assigned when this task is created on a deal.
                </p>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="No default status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        <span className="flex items-center gap-2">
                          {s.color && (
                            <span
                              className="inline-block size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                          )}
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Default Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Priority</Label>
                <p className="text-xs text-muted-foreground">
                  Priority assigned when this task is created on a deal.
                </p>
                <Select value={priorityId} onValueChange={setPriorityId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="No default priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <span className="flex items-center gap-2">
                          {p.color && (
                            <span
                              className="inline-block size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: p.color }}
                            />
                          )}
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Offset Days */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Offset Days</Label>
                <p className="text-xs text-muted-foreground">
                  Number of days after the deal enters the stage that this task
                  is due. Leave empty for no due date.
                </p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="e.g. 14"
                  value={dueOffsetDays}
                  onChange={(e) => setDueOffsetDays(e.target.value)}
                  className="h-9 text-sm w-32"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive tasks won&apos;t be created on new deals.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!task || saving || !hasChanges}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
