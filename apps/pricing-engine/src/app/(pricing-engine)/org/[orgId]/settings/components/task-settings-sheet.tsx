"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Settings, X } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@repo/ui/shadcn/badge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";

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
  button_enabled?: boolean;
  button_action_id?: number | null;
  button_label?: string | null;
}

interface RoleType {
  id: number;
  code: string;
  name: string;
}

interface ActionItem {
  id: number;
  name: string;
  description: string | null;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lookup data
  const [allRoles, setAllRoles] = useState<RoleType[]>([]);
  const [allActions, setAllActions] = useState<ActionItem[]>([]);

  // Form state
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [buttonActionId, setButtonActionId] = useState<string>("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Role selector popover
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setButtonEnabled(task.button_enabled ?? false);
      setButtonActionId(task.button_action_id ? String(task.button_action_id) : "");
      setButtonLabel(task.button_label ?? "");
      setIsActive(task.is_active);
    }
  }, [task]);

  // Fetch lookup data + assigned roles when sheet opens
  useEffect(() => {
    if (!open || !task) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, actionsRes, assignedRes] = await Promise.all([
          fetch("/api/deal-role-types"),
          fetch("/api/actions"),
          fetch(`/api/task-templates/${task.id}/roles`),
        ]);

        if (rolesRes.ok) {
          const data = await rolesRes.json();
          if (!cancelled) setAllRoles(data.roles ?? []);
        }
        if (actionsRes.ok) {
          const data = await actionsRes.json();
          if (!cancelled) setAllActions((data.actions ?? []).filter((a: ActionItem & { is_active?: boolean }) => a.is_active !== false));
        }
        if (assignedRes.ok) {
          const data = await assignedRes.json();
          if (!cancelled) setSelectedRoleIds(data.role_ids ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch settings data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [open, task]);

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const removeRole = (roleId: number) => {
    setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
  };

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
          is_active: isActive,
          button_enabled: buttonEnabled,
          button_action_id: buttonEnabled && buttonActionId ? Number(buttonActionId) : null,
          button_label: buttonEnabled ? buttonLabel.trim() || null : null,
          assigned_role_ids: selectedRoleIds,
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
  }, [task, isActive, buttonEnabled, buttonActionId, buttonLabel, selectedRoleIds, onSaved, onOpenChange]);

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

              {/* Roles Assignment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned Roles</Label>
                <p className="text-xs text-muted-foreground">
                  Roles responsible for this task on a deal.
                </p>
                <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen} modal>
                  <PopoverTrigger asChild>
                    <div
                      role="combobox"
                      tabIndex={0}
                      className="flex min-h-[36px] w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {selectedRoleIds.length === 0 ? (
                        <span className="text-muted-foreground text-sm">Select roles...</span>
                      ) : (
                        selectedRoleIds.map((roleId) => {
                          const role = allRoles.find((r) => r.id === roleId);
                          if (!role) return null;
                          return (
                            <Badge
                              key={roleId}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {role.name}
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRole(roleId);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                    removeRole(roleId);
                                  }
                                }}
                                className="ml-0.5 cursor-pointer rounded-full hover:bg-muted-foreground/20 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </span>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 z-[100]" align="start" side="bottom" sideOffset={4}>
                    <div className="max-h-[300px] overflow-y-auto overscroll-contain p-1">
                      {allRoles.map((role) => {
                        const isSelected = selectedRoleIds.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => toggleRole(role.id)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          >
                            <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                              {isSelected && (
                                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                  <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <span>{role.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Button Configuration */}
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Button Configuration</Label>
                    <p className="text-xs text-muted-foreground">
                      Show an action button on this task in the deal checklist.
                    </p>
                  </div>
                  <div className="relative inline-grid h-8 grid-cols-[1fr_1fr] items-center text-sm font-medium">
                    <Switch
                      checked={buttonEnabled}
                      onCheckedChange={setButtonEnabled}
                      className="peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto rounded-md [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-sm [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full [&_span]:data-[state=checked]:rtl:-translate-x-full"
                    />
                    <span className="pointer-events-none relative ml-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full peer-data-[state=unchecked]:rtl:-translate-x-full">
                      <span className="text-[10px] font-medium uppercase">Off</span>
                    </span>
                    <span className="peer-data-[state=checked]:text-background pointer-events-none relative mr-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full">
                      <span className="text-[10px] font-medium uppercase">On</span>
                    </span>
                  </div>
                </div>

                {buttonEnabled && (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Select Action</Label>
                      <Select value={buttonActionId} onValueChange={setButtonActionId}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Choose an action..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allActions.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Button Label</Label>
                      <Input
                        placeholder='e.g. "Run Appraisal Check"'
                        value={buttonLabel}
                        onChange={(e) => setButtonLabel(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}
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
            disabled={!task || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
