"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@repo/ui/shadcn/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@repo/lib/cn";
import {
  Kanban,
  Table2,
  CheckSquare,
  SlidersHorizontal,
  Plus,
  Eye,
  EyeOff,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  X,
  Circle,
  Calendar,
  User,
  GripVertical,
  Save,
  Archive,
  Tag,
  Clock,
  Paperclip,
  Upload,
  Link2,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog";
import { Input } from "@repo/ui/shadcn/input";
import { Textarea } from "@repo/ui/shadcn/textarea";
import { Label } from "@repo/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import { DatePickerField } from "@/components/date-picker-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/shadcn/command";
import {
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useThreads } from "@liveblocks/react/suspense";
import { Thread, Comment, Composer } from "@liveblocks/react-ui";
import type { ThreadData } from "@liveblocks/client";

/* ========================================================================== */
/*  Types                                                                      */
/* ========================================================================== */

export type TaskStatus = "todo" | "in_progress" | "in_review" | "blocked" | "done";
export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";
type ViewType = "board" | "table" | "checklist";
type RuleOperator = "is" | "is_not" | "contains" | "not_contains";
type LogicOperator = "and" | "or";
type SortColumn = "priority" | "status" | "title" | "assignee" | "created" | "dueDate";

export interface Task {
  id: string;
  identifier?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  labels: string[];
  dueDate?: string;
  dealId: string;
  checked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AdvancedRule {
  id: string;
  property: "status" | "priority" | "assignee" | "label";
  operator: RuleOperator;
  value: string;
}

interface FilterGroup {
  id: string;
  logic: LogicOperator;
  rules: AdvancedRule[];
}

interface AdvancedFilterState {
  logic: LogicOperator;
  items: (AdvancedRule | FilterGroup)[];
}

interface SortRule {
  id: string;
  column: SortColumn;
  ascending: boolean;
}

interface ViewSettings {
  currentView: ViewType;
  groupBy: "status" | "priority" | "assignee" | "label";
  sortRules: SortRule[];
  showCompletedTasks: boolean;
  advancedFilter: AdvancedFilterState;
}

export interface DealTaskTrackerProps {
  dealId: string;
  tasks?: Task[];
  onAddTask?: (dealId: string, task: Partial<Task>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

/* ========================================================================== */
/*  Constants                                                                  */
/* ========================================================================== */

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "To Do", color: "#6B7280" },
  in_progress: { label: "In Progress", color: "#3B82F6" },
  in_review: { label: "In Review", color: "#F59E0B" },
  blocked: { label: "Blocked", color: "#EF4444" },
  done: { label: "Done", color: "#10B981" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; level: number }> = {
  urgent: { label: "Urgent", color: "#EF4444", level: 4 },
  high: { label: "High", color: "#F97316", level: 3 },
  medium: { label: "Medium", color: "#F59E0B", level: 2 },
  low: { label: "Low", color: "#6B7280", level: 1 },
  none: { label: "No priority", color: "#D1D5DB", level: 0 },
};

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "in_review", "blocked", "done"];
const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "medium", "low", "none"];

const OPERATOR_OPTIONS: { value: RuleOperator; label: string }[] = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
];

const SORT_COLUMN_OPTIONS: { value: SortColumn; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
  { value: "title", label: "Title" },
  { value: "assignee", label: "Assignee" },
  { value: "created", label: "Created" },
  { value: "dueDate", label: "Due date" },
];

const FILTER_PROPERTIES: {
  key: "status" | "priority" | "assignee" | "label";
  label: string;
  options: { value: string; label: string; color?: string }[];
}[] = [
  {
    key: "status",
    label: "Status",
    options: STATUS_ORDER.map((s) => ({ value: s, label: STATUS_CONFIG[s].label, color: STATUS_CONFIG[s].color })),
  },
  {
    key: "priority",
    label: "Priority",
    options: PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_CONFIG[p].label, color: PRIORITY_CONFIG[p].color })),
  },
  {
    key: "assignee",
    label: "Assignee",
    options: [], // populated dynamically from tasks
  },
  {
    key: "label",
    label: "Label",
    options: [], // populated dynamically from tasks
  },
];

// No sample data — tasks are always fetched from the API via DealTasksTab

/* ========================================================================== */
/*  Utility: Filtering                                                         */
/* ========================================================================== */

function isFilterGroup(item: AdvancedRule | FilterGroup): item is FilterGroup {
  return "rules" in item;
}

function matchesRule(task: Task, rule: AdvancedRule): boolean {
  if (!rule.value) return true;
  const taskValues =
    rule.property === "label"
      ? task.labels
      : rule.property === "status"
        ? [task.status]
        : rule.property === "priority"
          ? [task.priority]
          : [task.assignee ?? ""];
  switch (rule.operator) {
    case "is":
      return taskValues.includes(rule.value as never);
    case "is_not":
      return !taskValues.includes(rule.value as never);
    case "contains":
      return taskValues.some((v) => v.toLowerCase().includes(rule.value.toLowerCase()));
    case "not_contains":
      return !taskValues.some((v) => v.toLowerCase().includes(rule.value.toLowerCase()));
  }
}

function matchesFilterItems(task: Task, items: (AdvancedRule | FilterGroup)[], logic: LogicOperator): boolean {
  if (items.length === 0) return true;
  if (logic === "and") {
    return items.every((item) => {
      if (isFilterGroup(item)) return matchesFilterItems(task, item.rules, item.logic);
      return matchesRule(task, item);
    });
  }
  return items.some((item) => {
    if (isFilterGroup(item)) return matchesFilterItems(task, item.rules, item.logic);
    return matchesRule(task, item);
  });
}

function applyFilters(tasks: Task[], filter: AdvancedFilterState): Task[] {
  if (filter.items.length === 0) return tasks;
  return tasks.filter((task) => matchesFilterItems(task, filter.items, filter.logic));
}

/* ========================================================================== */
/*  Utility: Sorting                                                           */
/* ========================================================================== */

function applySorting(tasks: Task[], sortRules: SortRule[]): Task[] {
  if (sortRules.length === 0) return tasks;
  return [...tasks].sort((a, b) => {
    for (const rule of sortRules) {
      let cmp = 0;
      switch (rule.column) {
        case "priority":
          cmp = PRIORITY_CONFIG[a.priority].level - PRIORITY_CONFIG[b.priority].level;
          break;
        case "status":
          cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "assignee":
          cmp = (a.assignee ?? "").localeCompare(b.assignee ?? "");
          break;
        case "created":
          cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
          break;
        case "dueDate": {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          cmp = aDate - bDate;
          break;
        }
      }
      if (cmp !== 0) return rule.ascending ? cmp : -cmp;
    }
    return 0;
  });
}

/* ========================================================================== */
/*  Utility: Grouping                                                          */
/* ========================================================================== */

interface TaskGroup {
  key: string;
  label: string;
  color: string;
  tasks: Task[];
}

function getGroups(tasks: Task[], groupBy: string): TaskGroup[] {
  if (groupBy === "status") {
    return STATUS_ORDER.map((status) => ({
      key: status,
      label: STATUS_CONFIG[status].label,
      color: STATUS_CONFIG[status].color,
      tasks: tasks.filter((t) => t.status === status),
    }));
  }
  if (groupBy === "priority") {
    return PRIORITY_ORDER.map((p) => ({
      key: p,
      label: PRIORITY_CONFIG[p].label,
      color: PRIORITY_CONFIG[p].color,
      tasks: tasks.filter((t) => t.priority === p),
    }));
  }
  if (groupBy === "assignee") {
    const assignees = [...new Set(tasks.map((t) => t.assignee ?? "Unassigned"))].sort();
    return assignees.map((a) => ({
      key: a,
      label: a,
      color: "#6B7280",
      tasks: tasks.filter((t) => (t.assignee ?? "Unassigned") === a),
    }));
  }
  // label
  const labels = [...new Set(tasks.flatMap((t) => t.labels))].sort();
  if (labels.length === 0) return [{ key: "none", label: "No labels", color: "#6B7280", tasks }];
  return labels.map((l) => ({
    key: l,
    label: l,
    color: "#6B7280",
    tasks: tasks.filter((t) => t.labels.includes(l)),
  }));
}

function getActiveFilterCount(filter: AdvancedFilterState): number {
  let count = 0;
  for (const item of filter.items) {
    if (isFilterGroup(item)) {
      count += item.rules.filter((r) => r.value).length;
    } else if (item.value) {
      count++;
    }
  }
  return count;
}

/* ========================================================================== */
/*  Utility: Click outside                                                     */
/* ========================================================================== */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

/* ========================================================================== */
/*  PriorityIcon                                                               */
/* ========================================================================== */

function PriorityIcon({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority];
  const barCount = config.level;
  return (
    <div className="flex items-end gap-px" title={config.label}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm transition-colors"
          style={{
            height: `${6 + i * 2}px`,
            backgroundColor: i <= barCount ? config.color : "hsl(var(--border))",
          }}
        />
      ))}
    </div>
  );
}

/* ========================================================================== */
/*  MAIN COMPONENT                                                             */
/* ========================================================================== */

export function DealTaskTracker({
  dealId,
  tasks: propTasks,
  onAddTask,
  onUpdateTask,
}: DealTaskTrackerProps) {
  const [tasks, setTasks] = useState<Task[]>(propTasks ?? []);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("todo");

  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    currentView: "board",
    groupBy: "status",
    sortRules: [{ id: "sort-default", column: "priority", ascending: false }],
    showCompletedTasks: true,
    advancedFilter: { logic: "and", items: [] },
  });

  // Keep in sync with prop changes
  useEffect(() => {
    if (propTasks) {
      setTasks(propTasks);
    }
  }, [propTasks]);

  // Derive dynamic filter options from tasks
  const dynamicFilterProps = React.useMemo(() => {
    const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))] as string[];
    const labels = [...new Set(tasks.flatMap((t) => t.labels))];
    return FILTER_PROPERTIES.map((p) => {
      if (p.key === "assignee") return { ...p, options: assignees.map((a) => ({ value: a, label: a })) };
      if (p.key === "label") return { ...p, options: labels.map((l) => ({ value: l, label: l })) };
      return p;
    });
  }, [tasks]);

  // Process tasks: filter, show/hide completed, sort
  const visibleTasks = React.useMemo(() => {
    let result = viewSettings.showCompletedTasks
      ? tasks
      : tasks.filter((t) => t.status !== "done");
    result = applyFilters(result, viewSettings.advancedFilter);
    return result;
  }, [tasks, viewSettings.showCompletedTasks, viewSettings.advancedFilter]);

  const groups = React.useMemo(
    () => getGroups(visibleTasks, viewSettings.groupBy),
    [visibleTasks, viewSettings.groupBy]
  );

  const sortedGroups = React.useMemo(
    () => groups.map((g) => ({ ...g, tasks: applySorting(g.tasks, viewSettings.sortRules) })),
    [groups, viewSettings.sortRules]
  );

  // --- Actions ---

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus, checked: newStatus === "done" } : task
        )
      );
      onUpdateTask?.(taskId, { status: newStatus } as Partial<Task>);
    },
    [onUpdateTask]
  );

  const handleTaskUpdate = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );
      onUpdateTask?.(taskId, updates);
    },
    [onUpdateTask]
  );

  const handleAddTaskToStatus = useCallback((status: TaskStatus) => {
    setNewTaskStatus(status);
    setIsNewTaskDialogOpen(true);
  }, []);

  const handleCreateTask = useCallback(
    (taskData: Partial<Task>) => {
      const newTask: Task = {
        id: Date.now().toString(),
        identifier: `TSK-${tasks.length + 1}`,
        title: taskData.title || "Untitled Task",
        description: taskData.description,
        status: newTaskStatus,
        priority: taskData.priority || "none",
        assignee: taskData.assignee,
        dueDate: taskData.dueDate,
        labels: taskData.labels || [],
        dealId,
        checked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
      setIsNewTaskDialogOpen(false);
      onAddTask?.(dealId, newTask);
    },
    [dealId, newTaskStatus, onAddTask, tasks.length]
  );

  const handleCheckTask = useCallback(
    (taskId: string, checked: boolean) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, checked, status: checked ? "done" : "todo" } : t
        )
      );
      onUpdateTask?.(taskId, { checked, status: checked ? "done" : "todo" } as Partial<Task>);
    },
    [onUpdateTask]
  );

  // --- Filter actions ---
  const setTopLevelLogic = useCallback((logic: LogicOperator) => {
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: { ...prev.advancedFilter, logic },
    }));
  }, []);

  const addAdvancedRule = useCallback(() => {
    const rule: AdvancedRule = { id: `rule-${Date.now()}`, property: "status", operator: "is", value: "" };
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: { ...prev.advancedFilter, items: [...prev.advancedFilter.items, rule] },
    }));
  }, []);

  const addFilterGroup = useCallback(() => {
    const group: FilterGroup = {
      id: `group-${Date.now()}`,
      logic: "or",
      rules: [{ id: `rule-${Date.now()}-a`, property: "status", operator: "is", value: "" }],
    };
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: { ...prev.advancedFilter, items: [...prev.advancedFilter.items, group] },
    }));
  }, []);

  const addRuleToGroup = useCallback((groupId: string) => {
    const rule: AdvancedRule = { id: `rule-${Date.now()}`, property: "status", operator: "is", value: "" };
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: {
        ...prev.advancedFilter,
        items: prev.advancedFilter.items.map((item) =>
          isFilterGroup(item) && item.id === groupId ? { ...item, rules: [...item.rules, rule] } : item
        ),
      },
    }));
  }, []);

  const setGroupLogic = useCallback((groupId: string, logic: LogicOperator) => {
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: {
        ...prev.advancedFilter,
        items: prev.advancedFilter.items.map((item) =>
          isFilterGroup(item) && item.id === groupId ? { ...item, logic } : item
        ),
      },
    }));
  }, []);

  const updateAdvancedRule = useCallback((ruleId: string, updates: Partial<AdvancedRule>) => {
    function updateInItems(items: (AdvancedRule | FilterGroup)[]): (AdvancedRule | FilterGroup)[] {
      return items.map((item) => {
        if (isFilterGroup(item)) {
          return { ...item, rules: item.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)) };
        }
        return item.id === ruleId ? { ...item, ...updates } : item;
      });
    }
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: { ...prev.advancedFilter, items: updateInItems(prev.advancedFilter.items) },
    }));
  }, []);

  const removeAdvancedRule = useCallback((ruleId: string) => {
    function removeFromItems(items: (AdvancedRule | FilterGroup)[]): (AdvancedRule | FilterGroup)[] {
      return items
        .map((item) => {
          if (isFilterGroup(item)) return { ...item, rules: item.rules.filter((r) => r.id !== ruleId) };
          return item;
        })
        .filter((item) => {
          if (isFilterGroup(item) && item.rules.length === 0) return false;
          return item.id !== ruleId;
        });
    }
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: { ...prev.advancedFilter, items: removeFromItems(prev.advancedFilter.items) },
    }));
  }, []);

  const removeFilterGroup = useCallback((groupId: string) => {
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: { ...prev.advancedFilter, items: prev.advancedFilter.items.filter((i) => i.id !== groupId) },
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setViewSettings((prev) => ({
      ...prev,
      advancedFilter: { logic: "and", items: [] },
    }));
  }, []);

  // --- Sort actions ---
  const addSortRule = useCallback((column: SortColumn) => {
    const rule: SortRule = { id: `sort-${Date.now()}`, column, ascending: true };
    setViewSettings((prev) => ({
      ...prev,
      sortRules: [...prev.sortRules, rule],
    }));
  }, []);

  const updateSortRule = useCallback((ruleId: string, updates: Partial<SortRule>) => {
    setViewSettings((prev) => ({
      ...prev,
      sortRules: prev.sortRules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    }));
  }, []);

  const removeSortRule = useCallback((ruleId: string) => {
    setViewSettings((prev) => ({
      ...prev,
      sortRules: prev.sortRules.filter((r) => r.id !== ruleId),
    }));
  }, []);

  const activeFilterCount = getActiveFilterCount(viewSettings.advancedFilter);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <ViewToolbar
        viewSettings={viewSettings}
        onSetView={(v) => setViewSettings((p) => ({ ...p, currentView: v }))}
        onUpdateViewSettings={(s) => setViewSettings((p) => ({ ...p, ...s }))}
        onAddTask={() => handleAddTaskToStatus("todo")}
        activeFilterCount={activeFilterCount}
        totalTasks={visibleTasks.length}
        advancedFilter={viewSettings.advancedFilter}
        onSetTopLevelLogic={setTopLevelLogic}
        onAddAdvancedRule={addAdvancedRule}
        onAddFilterGroup={addFilterGroup}
        onAddRuleToGroup={addRuleToGroup}
        onSetGroupLogic={setGroupLogic}
        onUpdateAdvancedRule={updateAdvancedRule}
        onRemoveAdvancedRule={removeAdvancedRule}
        onRemoveFilterGroup={removeFilterGroup}
        onClearAllFilters={clearAllFilters}
        filterProperties={dynamicFilterProps}
        sortRules={viewSettings.sortRules}
        onAddSortRule={addSortRule}
        onUpdateSortRule={updateSortRule}
        onRemoveSortRule={removeSortRule}
      />

      {/* View content */}
      <div className="min-h-[400px]">
        {viewSettings.currentView === "board" && (
          <BoardView
            groups={sortedGroups}
            groupBy={viewSettings.groupBy}
            onStatusChange={handleStatusChange}
            onTaskClick={setSelectedTask}
            onAddTask={handleAddTaskToStatus}
            selectedTaskId={selectedTask?.id ?? null}
          />
        )}
        {viewSettings.currentView === "table" && (
          <TableView
            groups={sortedGroups}
            onTaskClick={setSelectedTask}
            selectedTaskId={selectedTask?.id ?? null}
          />
        )}
        {viewSettings.currentView === "checklist" && (
          <ChecklistView
            groups={sortedGroups}
            visibleTasks={visibleTasks}
            onTaskClick={setSelectedTask}
            onCheckTask={handleCheckTask}
            selectedTaskId={selectedTask?.id ?? null}
          />
        )}
      </div>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdate={(updates) => {
            handleTaskUpdate(selectedTask.id, updates);
            setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
          }}
          onDelete={(taskId) => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setSelectedTask(null);
          }}
        />
      )}

      {/* New Task Dialog */}
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onCreateTask={handleCreateTask}
        initialStatus={newTaskStatus}
      />
    </div>
  );
}

/* ========================================================================== */
/*  ViewToolbar                                                                */
/* ========================================================================== */

const VIEW_OPTIONS: { value: ViewType; label: string; icon: typeof Kanban }[] = [
  { value: "board", label: "Board", icon: Kanban },
  { value: "table", label: "Table", icon: Table2 },
  { value: "checklist", label: "Checklist", icon: CheckSquare },
];

const GROUP_OPTIONS: { value: ViewSettings["groupBy"]; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
  { value: "label", label: "Label" },
];

function ViewToolbar({
  viewSettings,
  onSetView,
  onUpdateViewSettings,
  onAddTask,
  activeFilterCount,
  totalTasks,
  advancedFilter,
  onSetTopLevelLogic,
  onAddAdvancedRule,
  onAddFilterGroup,
  onAddRuleToGroup,
  onSetGroupLogic,
  onUpdateAdvancedRule,
  onRemoveAdvancedRule,
  onRemoveFilterGroup,
  onClearAllFilters,
  filterProperties,
  sortRules,
  onAddSortRule,
  onUpdateSortRule,
  onRemoveSortRule,
}: {
  viewSettings: ViewSettings;
  onSetView: (v: ViewType) => void;
  onUpdateViewSettings: (s: Partial<ViewSettings>) => void;
  onAddTask: () => void;
  activeFilterCount: number;
  totalTasks: number;
  advancedFilter: AdvancedFilterState;
  onSetTopLevelLogic: (l: LogicOperator) => void;
  onAddAdvancedRule: () => void;
  onAddFilterGroup: () => void;
  onAddRuleToGroup: (groupId: string) => void;
  onSetGroupLogic: (groupId: string, l: LogicOperator) => void;
  onUpdateAdvancedRule: (ruleId: string, updates: Partial<AdvancedRule>) => void;
  onRemoveAdvancedRule: (ruleId: string) => void;
  onRemoveFilterGroup: (groupId: string) => void;
  onClearAllFilters: () => void;
  filterProperties: typeof FILTER_PROPERTIES;
  sortRules: SortRule[];
  onAddSortRule: (column: SortColumn) => void;
  onUpdateSortRule: (ruleId: string, updates: Partial<SortRule>) => void;
  onRemoveSortRule: (ruleId: string) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useClickOutside(settingsRef, () => setSettingsOpen(false));

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-1">
        {/* View tabs */}
        <div className="flex items-center rounded-md bg-muted/60 p-0.5">
          {VIEW_OPTIONS.map((opt) => {
            const active = viewSettings.currentView === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onSetView(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <opt.icon className="h-3.5 w-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-2 h-4 w-px bg-border" />

        {/* Filter popover */}
        <FilterPopover
          advancedFilter={advancedFilter}
          activeFilterCount={activeFilterCount}
          totalTasks={totalTasks}
          filterProperties={filterProperties}
          onSetTopLevelLogic={onSetTopLevelLogic}
          onAddAdvancedRule={onAddAdvancedRule}
          onAddFilterGroup={onAddFilterGroup}
          onAddRuleToGroup={onAddRuleToGroup}
          onSetGroupLogic={onSetGroupLogic}
          onUpdateAdvancedRule={onUpdateAdvancedRule}
          onRemoveAdvancedRule={onRemoveAdvancedRule}
          onRemoveFilterGroup={onRemoveFilterGroup}
          onClearAllFilters={onClearAllFilters}
        />

        {/* Sort popover */}
        <SortPopover
          sortRules={sortRules}
          onAddSortRule={onAddSortRule}
          onUpdateSortRule={onUpdateSortRule}
          onRemoveSortRule={onRemoveSortRule}
        />
      </div>

      <div className="flex items-center gap-1.5">
        {/* View settings */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              settingsOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", settingsOpen && "rotate-180")} />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-[280px] rounded-lg border bg-card shadow-lg">
              <div className="px-3 py-2.5 border-b"><span className="text-xs font-semibold">View settings</span></div>
              {/* Layout */}
              <div className="px-3 py-2.5 border-b">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Layout</span>
                <div className="mt-2 flex gap-1.5">
                  {VIEW_OPTIONS.map((opt) => {
                    const active = viewSettings.currentView === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onSetView(opt.value)}
                        className={cn(
                          "flex flex-1 flex-col items-center gap-1 rounded-md p-2 transition-colors",
                          active ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "bg-muted/60 text-muted-foreground hover:bg-accent"
                        )}
                      >
                        <opt.icon className="h-4 w-4" />
                        <span className="text-[10px] font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Group by */}
              <div className="px-3 py-2.5 border-b">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Group by</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {GROUP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onUpdateViewSettings({ groupBy: opt.value })}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs transition-colors",
                        viewSettings.groupBy === opt.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "bg-muted/60 text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Show/hide completed */}
              <div className="px-3 py-2.5">
                <button
                  onClick={() => onUpdateViewSettings({ showCompletedTasks: !viewSettings.showCompletedTasks })}
                  className="flex w-full items-center gap-2 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {viewSettings.showCompletedTasks ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{viewSettings.showCompletedTasks ? "Showing" : "Hiding"} completed tasks</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Add task */}
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New task</span>
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  BoardView                                                                  */
/* ========================================================================== */

function BoardView({
  groups,
  groupBy,
  onStatusChange,
  onTaskClick,
  onAddTask,
  selectedTaskId,
}: {
  groups: TaskGroup[];
  groupBy: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  selectedTaskId: string | null;
}) {
  return (
    <div className="flex h-full gap-3 overflow-x-auto px-4 py-4">
      {groups.map((group) => (
        <BoardColumn
          key={group.key}
          groupKey={group.key}
          label={group.label}
          color={group.color}
          tasks={group.tasks}
          groupBy={groupBy}
          onStatusChange={onStatusChange}
          onTaskClick={onTaskClick}
          onAddTask={onAddTask}
          selectedTaskId={selectedTaskId}
        />
      ))}
    </div>
  );
}

function BoardColumn({
  groupKey,
  label,
  color,
  tasks,
  groupBy,
  onStatusChange,
  onTaskClick,
  onAddTask,
  selectedTaskId,
}: {
  groupKey: string;
  label: string;
  color: string;
  tasks: Task[];
  groupBy: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  selectedTaskId: string | null;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function handleDragLeave() {
    setIsDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId && groupBy === "status") {
      onStatusChange(taskId, groupKey as TaskStatus);
    }
  }

  return (
    <div
      className={cn(
        "flex w-[240px] min-w-[200px] shrink flex-col rounded-lg transition-colors",
        isDragOver && "bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <Circle
            className="h-3 w-3"
            style={{ color }}
            fill={groupKey === "done" ? color : "none"}
          />
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(groupBy === "status" ? (groupKey as TaskStatus) : "todo")}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label={`Add task to ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-0.5 pb-2 overflow-y-auto flex-1">
        {tasks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableCard key={task.id} task={task} onClick={() => onTaskClick(task)} isSelected={selectedTaskId === task.id} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({ task, onClick, isSelected }: { task: Task; onClick: () => void; isSelected: boolean }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={cn("transition-opacity", isDragging && "opacity-40")}
    >
      <TaskCard task={task} onClick={onClick} isSelected={isSelected} />
    </div>
  );
}

function TaskCard({ task, onClick, isSelected = false }: { task: Task; onClick: () => void; isSelected?: boolean }) {
  const statusConfig = STATUS_CONFIG[task.status];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border bg-card p-3 text-left transition-all hover:shadow-sm cursor-pointer group",
        isSelected
          ? "border-primary/40 ring-1 ring-primary/20 shadow-sm"
          : "border-border hover:border-border/80"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <Circle
          className="h-3 w-3 flex-shrink-0"
          style={{ color: statusConfig.color }}
          fill={task.status === "done" ? statusConfig.color : "none"}
          strokeWidth={2}
        />
        {task.identifier && (
          <span className="text-[11px] font-mono text-muted-foreground">{task.identifier}</span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 mb-2">{task.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={task.priority} />
          {task.labels.slice(0, 2).map((lbl) => (
            <span key={lbl} className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {lbl}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          {task.dueDate && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          {task.assignee && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary" title={task.assignee}>
              {task.assignee.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ========================================================================== */
/*  TableView                                                                  */
/* ========================================================================== */

function TableView({
  groups,
  onTaskClick,
  selectedTaskId,
}: {
  groups: TaskGroup[];
  onTaskClick: (task: Task) => void;
  selectedTaskId: string | null;
}) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[40px]" />
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[80px]">ID</th>
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[100px]">Status</th>
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[90px]">Priority</th>
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[130px]">Assignee</th>
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[120px]">Labels</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <TableGroupRows
              key={group.key}
              groupKey={group.key}
              label={group.label}
              color={group.color}
              tasks={group.tasks}
              onTaskClick={onTaskClick}
              selectedTaskId={selectedTaskId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableGroupRows({
  groupKey,
  label,
  color,
  tasks,
  onTaskClick,
  selectedTaskId,
}: {
  groupKey: string;
  label: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskId: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <tr
        className="border-b border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <td colSpan={7} className="px-4 py-2">
          <div className="flex items-center gap-2">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            <Circle className="h-3 w-3" style={{ color }} fill={groupKey === "done" ? color : "none"} />
            <span className="text-xs font-semibold text-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
          </div>
        </td>
      </tr>
      {!collapsed &&
        tasks.map((task) => {
          const statusConfig = STATUS_CONFIG[task.status];
          const isSelected = selectedTaskId === task.id;
          return (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={cn(
                "border-b border-border cursor-pointer transition-colors group",
                isSelected ? "bg-primary/5" : "hover:bg-accent/50"
              )}
            >
              <td className="px-4 py-2.5">
                <Circle className="h-3 w-3" style={{ color: statusConfig.color }} fill={task.status === "done" ? statusConfig.color : "none"} strokeWidth={2} />
              </td>
              <td className="px-4 py-2.5">
                <span className="text-xs font-mono text-muted-foreground">{task.identifier ?? task.id.slice(0, 6)}</span>
              </td>
              <td className="px-4 py-2.5">
                <span className="text-sm text-foreground">{task.title}</span>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${statusConfig.color}1A`, color: statusConfig.color }}
                >
                  {statusConfig.label}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <PriorityIcon priority={task.priority} />
                  <span className="text-xs text-muted-foreground">{PRIORITY_CONFIG[task.priority].label}</span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                {task.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                      {task.assignee.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-xs text-muted-foreground">{task.assignee}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1">
                  {task.labels.slice(0, 2).map((lbl) => (
                    <span key={lbl} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {lbl}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          );
        })}
    </>
  );
}

/* ========================================================================== */
/*  ChecklistView                                                              */
/* ========================================================================== */

function ChecklistView({
  groups,
  visibleTasks,
  onTaskClick,
  onCheckTask,
  selectedTaskId,
}: {
  groups: TaskGroup[];
  visibleTasks: Task[];
  onTaskClick: (task: Task) => void;
  onCheckTask: (taskId: string, checked: boolean) => void;
  selectedTaskId: string | null;
}) {
  const totalTasks = visibleTasks.length;
  const checkedTasks = visibleTasks.filter((t) => t.checked).length;
  const progress = totalTasks > 0 ? (checkedTasks / totalTasks) * 100 : 0;

  return (
    <div className="h-full overflow-auto px-4 py-4">
      {/* Progress bar */}
      <div className="mb-4 max-w-3xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-foreground">Progress</span>
          <span className="text-xs text-muted-foreground">{checkedTasks} of {totalTasks} tasks completed</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: STATUS_CONFIG.done.color }}
          />
        </div>
      </div>

      {/* Grouped checklists */}
      <div className="flex flex-col gap-1 max-w-3xl">
        {groups.map((group) => (
          <ChecklistGroup
            key={group.key}
            groupKey={group.key}
            label={group.label}
            color={group.color}
            tasks={group.tasks}
            onTaskClick={onTaskClick}
            onCheckTask={onCheckTask}
            selectedTaskId={selectedTaskId}
          />
        ))}
      </div>
    </div>
  );
}

function ChecklistGroup({
  groupKey,
  label,
  color,
  tasks,
  onTaskClick,
  onCheckTask,
  selectedTaskId,
}: {
  groupKey: string;
  label: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCheckTask: (taskId: string, checked: boolean) => void;
  selectedTaskId: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const checkedCount = tasks.filter((t) => t.checked).length;

  return (
    <div className="rounded-lg border overflow-hidden mb-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        <Circle className="h-3 w-3" style={{ color }} fill={groupKey === "done" ? color : "none"} />
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{checkedCount}/{tasks.length}</span>
      </button>

      {!collapsed && (
        <div className="divide-y divide-border">
          {tasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer group",
                  isSelected ? "bg-primary/5" : "hover:bg-accent/50"
                )}
              >
                <Checkbox
                  checked={task.checked}
                  onCheckedChange={(checked) => onCheckTask(task.id, checked as boolean)}
                  className="h-4 w-4 rounded border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <button onClick={() => onTaskClick(task)} className="flex flex-1 items-center gap-3 min-w-0 text-left">
                  {task.identifier && <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">{task.identifier}</span>}
                  <span className={cn("text-sm flex-1 truncate transition-colors", task.checked ? "text-muted-foreground line-through" : "text-foreground")}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityIcon priority={task.priority} />
                    {task.assignee && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary" title={task.assignee}>
                        {task.assignee.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  FilterPopover                                                              */
/* ========================================================================== */

function FilterPopover({
  advancedFilter,
  activeFilterCount,
  totalTasks,
  filterProperties,
  onSetTopLevelLogic,
  onAddAdvancedRule,
  onAddFilterGroup,
  onAddRuleToGroup,
  onSetGroupLogic,
  onUpdateAdvancedRule,
  onRemoveAdvancedRule,
  onRemoveFilterGroup,
  onClearAllFilters,
}: {
  advancedFilter: AdvancedFilterState;
  activeFilterCount: number;
  totalTasks: number;
  filterProperties: typeof FILTER_PROPERTIES;
  onSetTopLevelLogic: (l: LogicOperator) => void;
  onAddAdvancedRule: () => void;
  onAddFilterGroup: () => void;
  onAddRuleToGroup: (groupId: string) => void;
  onSetGroupLogic: (groupId: string, l: LogicOperator) => void;
  onUpdateAdvancedRule: (ruleId: string, updates: Partial<AdvancedRule>) => void;
  onRemoveAdvancedRule: (ruleId: string) => void;
  onRemoveFilterGroup: (groupId: string) => void;
  onClearAllFilters: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
          open || activeFilterCount > 0
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>Filter</span>
        {activeFilterCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[560px] rounded-xl border bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-semibold text-foreground">Filters</h3>
              <span className="text-[11px] text-muted-foreground">{totalTasks} tasks</span>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={onClearAllFilters} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Clear all</button>
            )}
          </div>

          <div className="p-4">
            {advancedFilter.items.length > 0 ? (
              <div className="space-y-2">
                {advancedFilter.items.map((item, idx) => {
                  const isGroup = isFilterGroup(item);
                  return (
                    <div key={item.id}>
                      <div className="flex items-start gap-2">
                        <div className="w-[52px] shrink-0 pt-1.5">
                          {idx === 0 ? (
                            <span className="text-xs font-medium text-muted-foreground">Where</span>
                          ) : (
                            <LogicToggle value={advancedFilter.logic} onChange={onSetTopLevelLogic} compact />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isGroup ? (
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <FilterGroupBlock
                                  group={item as FilterGroup}
                                  filterProperties={filterProperties}
                                  onAddRuleToGroup={onAddRuleToGroup}
                                  onSetGroupLogic={onSetGroupLogic}
                                  onUpdateAdvancedRule={onUpdateAdvancedRule}
                                  onRemoveAdvancedRule={onRemoveAdvancedRule}
                                />
                              </div>
                              <button onClick={() => onRemoveFilterGroup(item.id)} className="shrink-0 rounded p-1 mt-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" aria-label="Remove filter group">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <RuleRow rule={item as AdvancedRule} filterProperties={filterProperties} onUpdate={onUpdateAdvancedRule} onRemove={() => onRemoveAdvancedRule(item.id)} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground">No filters applied</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">Add a filter to narrow down your tasks</p>
              </div>
            )}

            <div className="mt-3 flex items-center gap-4">
              <button onClick={onAddAdvancedRule} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                <Plus className="h-3 w-3" /><span>New filter</span>
              </button>
              <button onClick={onAddFilterGroup} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                <Plus className="h-3 w-3" /><span>New group</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroupBlock({
  group,
  filterProperties,
  onAddRuleToGroup,
  onSetGroupLogic,
  onUpdateAdvancedRule,
  onRemoveAdvancedRule,
}: {
  group: FilterGroup;
  filterProperties: typeof FILTER_PROPERTIES;
  onAddRuleToGroup: (groupId: string) => void;
  onSetGroupLogic: (groupId: string, l: LogicOperator) => void;
  onUpdateAdvancedRule: (ruleId: string, updates: Partial<AdvancedRule>) => void;
  onRemoveAdvancedRule: (ruleId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/40 p-3">
      <div className="space-y-2">
        {group.rules.map((rule, ruleIdx) => (
          <div key={rule.id} className="flex items-center gap-2">
            <div className="w-[52px] shrink-0">
              {ruleIdx === 0 ? (
                <span className="text-xs font-medium text-muted-foreground">Where</span>
              ) : (
                <LogicToggle value={group.logic} onChange={(v) => onSetGroupLogic(group.id, v)} compact />
              )}
            </div>
            <RuleRow rule={rule} filterProperties={filterProperties} onUpdate={onUpdateAdvancedRule} onRemove={() => onRemoveAdvancedRule(rule.id)} />
          </div>
        ))}
      </div>
      <button onClick={() => onAddRuleToGroup(group.id)} className="mt-2 ml-[52px] flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors">
        <Plus className="h-3 w-3" /><span>New filter</span>
      </button>
    </div>
  );
}

function RuleRow({
  rule,
  filterProperties,
  onUpdate,
  onRemove,
}: {
  rule: AdvancedRule;
  filterProperties: typeof FILTER_PROPERTIES;
  onUpdate: (ruleId: string, updates: Partial<AdvancedRule>) => void;
  onRemove: () => void;
}) {
  const property = filterProperties.find((p) => p.key === rule.property);
  const selectedValueOption = property?.options.find((o) => o.value === rule.value);

  return (
    <div className="flex items-center gap-2">
      <div className="w-[110px] shrink-0">
        <MiniDropdown
          value={rule.property}
          options={filterProperties.map((p) => ({ value: p.key, label: p.label }))}
          onChange={(val) => onUpdate(rule.id, { property: val as AdvancedRule["property"], value: "" })}
          placeholder="Column"
        />
      </div>
      <div className="w-[120px] shrink-0">
        <MiniDropdown
          value={rule.operator}
          options={OPERATOR_OPTIONS}
          onChange={(val) => onUpdate(rule.id, { operator: val as RuleOperator })}
          placeholder="Condition"
        />
      </div>
      <div className="flex-1 min-w-0">
        {selectedValueOption && rule.value ? (
          <div className="flex items-center gap-1 rounded-md border bg-transparent px-2 py-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={selectedValueOption.color ? { backgroundColor: `${selectedValueOption.color}1A`, color: selectedValueOption.color } : {}}
            >
              {selectedValueOption.label}
              <button onClick={() => onUpdate(rule.id, { value: "" })} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors" aria-label="Clear value">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          </div>
        ) : (
          <MiniDropdown
            value={rule.value || ""}
            options={property?.options ?? []}
            onChange={(val) => onUpdate(rule.id, { value: val })}
            placeholder="Value"
          />
        )}
      </div>
      <button onClick={onRemove} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" aria-label="Remove filter">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function LogicToggle({ value, onChange, compact }: { value: LogicOperator; onChange: (v: LogicOperator) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 rounded-md border bg-transparent text-xs font-medium transition-colors hover:bg-accent",
          compact ? "px-2 py-1" : "px-2.5 py-1.5"
        )}
      >
        <span className="text-foreground capitalize">{value}</span>
        <ChevronDown className="h-2.5 w-2.5 opacity-50" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 min-w-[80px] rounded-lg border bg-card shadow-lg p-1">
          {(["and", "or"] as LogicOperator[]).map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "flex w-full items-center rounded-md px-2.5 py-1.5 text-xs capitalize transition-colors",
                opt === value ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T | "";
  options: { value: T; label: string; color?: string }[];
  onChange: (val: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-1 rounded-md border bg-transparent px-2.5 py-1.5 text-xs transition-colors hover:bg-accent",
          selected ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected ? selected.label : (placeholder ?? "Select...")}</span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-full min-w-[160px] rounded-lg border bg-card shadow-lg p-1 max-h-[220px] overflow-auto">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                  active ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {opt.color && <Circle className="h-2.5 w-2.5 shrink-0" style={{ color: opt.color, fill: opt.color }} />}
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  SortPopover                                                                */
/* ========================================================================== */

function SortPopover({
  sortRules,
  onAddSortRule,
  onUpdateSortRule,
  onRemoveSortRule,
}: {
  sortRules: SortRule[];
  onAddSortRule: (column: SortColumn) => void;
  onUpdateSortRule: (ruleId: string, updates: Partial<SortRule>) => void;
  onRemoveSortRule: (ruleId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useClickOutside(popoverRef, () => { setOpen(false); setPickerOpen(false); });

  useEffect(() => {
    function handlePickerOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    if (pickerOpen) {
      document.addEventListener("mousedown", handlePickerOutside);
      return () => document.removeEventListener("mousedown", handlePickerOutside);
    }
  }, [pickerOpen]);

  const usedColumns = sortRules.map((r) => r.column);
  const availableColumns = SORT_COLUMN_OPTIONS.filter((o) => !usedColumns.includes(o.value));
  const hasRules = sortRules.length > 0;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
          hasRules ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        <span>{hasRules ? `Sorted by ${sortRules.length} rule${sortRules.length > 1 ? "s" : ""}` : "Sort"}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[420px] rounded-lg border bg-card shadow-lg">
          <div className="p-3">
            {!hasRules ? (
              <div className="pb-3">
                <p className="text-sm font-medium text-foreground">No sorts applied to this view</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Add a column below to sort the view</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 pb-3">
                {sortRules.map((rule) => {
                  const colLabel = SORT_COLUMN_OPTIONS.find((o) => o.value === rule.column)?.label ?? rule.column;
                  return (
                    <div key={rule.id} className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 cursor-grab" />
                      <span className="text-xs text-muted-foreground">sort by</span>
                      <span className="text-xs font-medium text-foreground">{colLabel}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">ascending:</span>
                        <label className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={rule.ascending}
                            onChange={() => onUpdateSortRule(rule.id, { ascending: !rule.ascending })}
                            aria-label={`Toggle ascending for ${colLabel}`}
                          />
                          <div className={cn(
                            "h-5 w-9 rounded-full border-2 border-transparent transition-colors",
                            rule.ascending ? "bg-primary" : "bg-muted-foreground/30"
                          )}>
                            <span className={cn("block h-4 w-4 rounded-full bg-card shadow-sm transition-transform", rule.ascending ? "translate-x-4" : "translate-x-0")} />
                          </div>
                        </label>
                        <button onClick={() => onRemoveSortRule(rule.id)} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" aria-label={`Remove sort by ${colLabel}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-dashed pt-3">
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => { if (availableColumns.length > 0) setPickerOpen(!pickerOpen); }}
                  disabled={availableColumns.length === 0}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
                    availableColumns.length === 0 ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span>Pick a column to sort by</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {pickerOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-[200px] rounded-md border bg-card shadow-lg p-1">
                    {availableColumns.map((col) => (
                      <button
                        key={col.value}
                        onClick={() => { onAddSortRule(col.value); setPickerOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={!hasRules}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  hasRules ? "text-foreground hover:bg-accent" : "text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                Apply sorting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  TaskDetailSheet                                                            */
/* ========================================================================== */

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[460px] p-0 flex flex-col gap-0 [&>button]:hidden">
        <SheetHeader className="sr-only">
          <SheetTitle>{task.title}</SheetTitle>
        </SheetHeader>
        <TaskDetailSheetHeader task={task} onClose={() => onOpenChange(false)} onDelete={onDelete} />
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Scrollable region: properties, files, comment list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <TaskDetailBody task={task} onUpdate={onUpdate} />
            <TaskProperties task={task} onUpdate={onUpdate} />
            <TaskFilesSection taskId={task.id} />
            <TaskCommentsListSection taskId={task.id} />
          </div>
          {/* Composer pinned to bottom — outside scroll so mentions popover is not clipped */}
          <TaskCommentsComposerSection taskId={task.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TaskDetailSheetHeader({ task, onClose, onDelete }: { task: Task; onClose: () => void; onDelete?: (taskId: string) => void }) {
  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Circle
          className="h-3.5 w-3.5"
          style={{ color: statusConfig.color }}
          fill={task.status === "done" ? statusConfig.color : "none"}
        />
        <span className="text-xs font-mono text-muted-foreground">{task.identifier}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onClose}
          className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          title="Save and close"
        >
          <Save className="h-3.5 w-3.5" />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
            title="Archive task"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TaskDetailBody({ task, onUpdate }: { task: Task; onUpdate: (updates: Partial<Task>) => void }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || "");

  // Sync local state when task changes
  React.useEffect(() => { setTitle(task.title); }, [task.title]);
  React.useEffect(() => { setDesc(task.description || ""); }, [task.description]);

  function saveTitle() {
    if (title.trim() && title !== task.title) {
      onUpdate({ title });
    }
    setEditingTitle(false);
  }

  function saveDesc() {
    if (desc !== (task.description || "")) {
      onUpdate({ description: desc });
    }
    setEditingDesc(false);
  }

  return (
    <div className="px-4 py-4 border-b border-border">
      {/* Title */}
      {editingTitle ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === "Enter" && saveTitle()}
          className="w-full text-base font-semibold text-foreground bg-transparent outline-none border-b border-primary pb-1"
          aria-label="Task title"
          autoFocus
        />
      ) : (
        <h2
          onClick={() => {
            setTitle(task.title);
            setEditingTitle(true);
          }}
          className="text-base font-semibold text-foreground cursor-text hover:text-primary/80 transition-colors"
        >
          {task.title}
        </h2>
      )}

      {/* Description */}
      <div className="mt-3">
        {editingDesc ? (
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={saveDesc}
            rows={3}
            className="w-full text-sm text-muted-foreground bg-transparent outline-none border border-border rounded-md p-2 resize-none"
            aria-label="Task description"
            autoFocus
          />
        ) : (
          <p
            onClick={() => {
              setDesc(task.description || "");
              setEditingDesc(true);
            }}
            className={cn(
              "text-sm cursor-text transition-colors rounded-md p-1 -m-1 hover:bg-accent/50",
              task.description ? "text-muted-foreground" : "text-muted-foreground/50 italic"
            )}
          >
            {task.description || "Add a description..."}
          </p>
        )}
      </div>
    </div>
  );
}

function TaskProperties({ task, onUpdate }: { task: Task; onUpdate: (updates: Partial<Task>) => void }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  return (
    <div className="px-4 py-3 border-b border-border">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Properties</span>

      <div className="mt-2.5 flex flex-col gap-2">
        {/* Status */}
        <PropertyRow icon={Circle} label="Status">
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              <Circle
                className="h-2.5 w-2.5"
                style={{ color: STATUS_CONFIG[task.status].color }}
                fill={task.status === "done" ? STATUS_CONFIG[task.status].color : "none"}
              />
              <span className="text-foreground">{STATUS_CONFIG[task.status].label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {statusOpen && (
              <InlineDropdownMenu
                items={STATUS_ORDER.map((s) => ({
                  key: s,
                  label: STATUS_CONFIG[s].label,
                  color: STATUS_CONFIG[s].color,
                  active: task.status === s,
                }))}
                onSelect={(key) => {
                  onUpdate({ status: key as TaskStatus });
                  setStatusOpen(false);
                }}
                onClose={() => setStatusOpen(false)}
              />
            )}
          </div>
        </PropertyRow>

        {/* Priority */}
        <PropertyRow icon={PriorityDots} label="Priority">
          <div className="relative">
            <button
              onClick={() => setPriorityOpen(!priorityOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              <PriorityIcon priority={task.priority} />
              <span className="text-foreground">{PRIORITY_CONFIG[task.priority].label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {priorityOpen && (
              <InlineDropdownMenu
                items={(["urgent", "high", "medium", "low", "none"] as TaskPriority[]).map((p) => ({
                  key: p,
                  label: PRIORITY_CONFIG[p].label,
                  color: PRIORITY_CONFIG[p].color,
                  active: task.priority === p,
                }))}
                onSelect={(key) => {
                  onUpdate({ priority: key as TaskPriority });
                  setPriorityOpen(false);
                }}
                onClose={() => setPriorityOpen(false)}
              />
            )}
          </div>
        </PropertyRow>

        {/* Assignee */}
        <PropertyRow icon={User} label="Assignee">
          <div className="relative">
            <button
              onClick={() => setAssigneeOpen(!assigneeOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              {task.assignee ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary flex-shrink-0">
                    {task.assignee.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <span className="text-foreground">{task.assignee}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {assigneeOpen && (
              <AssigneeDropdown
                currentAssignee={task.assignee}
                onSelect={(name) => {
                  onUpdate({ assignee: name || undefined });
                  setAssigneeOpen(false);
                }}
                onClose={() => setAssigneeOpen(false)}
              />
            )}
          </div>
        </PropertyRow>

        {/* Labels */}
        <PropertyRow icon={Tag} label="Labels">
          <div className="flex items-center gap-1 flex-wrap">
            {task.labels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground cursor-pointer hover:bg-secondary/80"
                onClick={() =>
                  onUpdate({ labels: task.labels.filter((l) => l !== label) })
                }
              >
                {label}
                <span className="ml-1 text-muted-foreground/60">&times;</span>
              </span>
            ))}
            <LabelSearchDropdown
              currentLabels={task.labels}
              onAdd={(label) => {
                onUpdate({ labels: [...task.labels, label] });
              }}
            />
          </div>
        </PropertyRow>

        {/* Due date */}
        <PropertyRow icon={Calendar} label="Due date">
          <DatePickerField
            className="w-[160px]"
            value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
            onChange={(val) => onUpdate({ dueDate: val || undefined })}
          />
        </PropertyRow>

        {/* Updated */}
        {task.updatedAt && (
          <PropertyRow icon={Clock} label="Updated">
            <span className="text-xs text-muted-foreground px-2">{formatRelativeDate(task.updatedAt)}</span>
          </PropertyRow>
        )}

        {/* Created */}
        {task.createdAt && (
          <PropertyRow icon={Clock} label="Created">
            <span className="text-xs text-muted-foreground px-2">{formatRelativeDate(task.createdAt)}</span>
          </PropertyRow>
        )}
      </div>
    </div>
  );
}

function PropertyRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-[90px] flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function PriorityDots({ className }: { className?: string }) {
  return (
    <div className={cn("h-3.5 w-3.5 flex items-center justify-center", className)}>
      <div className="flex items-end gap-px">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-[2px] rounded-sm bg-muted-foreground/40" style={{ height: `${4 + i * 2}px` }} />
        ))}
      </div>
    </div>
  );
}

function InlineDropdownMenu({
  items,
  onSelect,
  onClose,
}: {
  items: { key: string; label: string; color?: string; active?: boolean }[];
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full z-50 mt-1 w-[180px] rounded-md border border-border bg-card shadow-lg py-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors",
              item.active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent"
            )}
          >
            {item.color && (
              <Circle
                className="h-2.5 w-2.5"
                style={{ color: item.color }}
                fill={item.active ? item.color : "none"}
              />
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function AssigneeDropdown({
  currentAssignee,
  onSelect,
  onClose,
}: {
  currentAssignee?: string;
  onSelect: (name: string | null) => void;
  onClose: () => void;
}) {
  const [inputValue, setInputValue] = useState("");

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full z-50 mt-1 w-[200px] rounded-md border border-border bg-card shadow-lg py-1">
        <div className="px-2 py-1.5 border-b border-border">
          <input
            type="text"
            placeholder="Type a name..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                onSelect(inputValue.trim());
              }
            }}
            className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
            autoFocus
          />
        </div>
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors",
            !currentAssignee ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent"
          )}
        >
          <span className="text-muted-foreground">Unassigned</span>
        </button>
        {inputValue.trim() && (
          <button
            onClick={() => onSelect(inputValue.trim())}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            <span>Assign to &ldquo;{inputValue.trim()}&rdquo;</span>
          </button>
        )}
      </div>
    </>
  );
}

function LabelSearchDropdown({
  currentLabels,
  onAdd,
}: {
  currentLabels: string[];
  onAdd: (label: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const availableLabels = AVAILABLE_LABELS.filter(
    (l) => !currentLabels.some((cl) => cl.toLowerCase() === l.toLowerCase())
  );

  const trimmed = search.trim();
  const isCustom =
    trimmed.length > 0 &&
    !AVAILABLE_LABELS.some((l) => l.toLowerCase() === trimmed.toLowerCase()) &&
    !currentLabels.some((l) => l.toLowerCase() === trimmed.toLowerCase());

  const handleSelect = (label: string) => {
    onAdd(label);
    setSearch("");
    setOpen(false);
  };

  const handleCreateCustom = () => {
    if (!trimmed) return;
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    onAdd(capitalized);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="rounded-full bg-secondary/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent transition-colors"
          title="Add label"
        >
          +
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0"
        align="start"
        sideOffset={4}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput
            placeholder="Search or create..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>
              {trimmed ? (
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-xs text-left hover:bg-accent transition-colors"
                  onClick={handleCreateCustom}
                >
                  Create &ldquo;{trimmed}&rdquo;
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No labels found
                </span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {availableLabels.map((label) => (
                <CommandItem
                  key={label}
                  value={label}
                  onSelect={() => handleSelect(label)}
                  className="text-xs"
                >
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
            {isCustom && availableLabels.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value={`create-${trimmed}`}
                    onSelect={handleCreateCustom}
                    className="text-xs"
                  >
                    Create &ldquo;{trimmed}&rdquo;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const AVAILABLE_LABELS = ["Underwriting", "Compliance", "Documentation", "Review", "Urgent", "Closing", "Insurance", "Appraisal"];

/* ========================================================================== */
/*  TaskFilesSection                                                           */
/* ========================================================================== */

interface TaskFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileTypeIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf") return FileText;
  return FileIcon;
}

function TaskFilesSection({ taskId }: { taskId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<TaskFile[]>([]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    for (const file of Array.from(fileList)) {
      const newFile: TaskFile = {
        id: `${taskId}-file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      };
      setFiles((prev) => [...prev, newFile]);
    }
    e.target.value = "";
  }

  function removeFile(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Files
          </span>
          {files.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{files.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Link existing file"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Upload file"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload files"
      />

      {files.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-4 text-xs text-muted-foreground hover:bg-accent/30 hover:border-muted-foreground/30 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Drop files here or click to upload</span>
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          {files.map((file) => {
            const TypeIcon = getFileTypeIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-2.5 rounded-md bg-secondary/40 px-2.5 py-2 group"
              >
                <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(file.size)} &middot; {formatRelativeDate(file.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removeFile(file.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  TaskCommentsSection (Liveblocks)                                           */
/* ========================================================================== */

const TASK_COMPOSER_OVERRIDES = {
  COMPOSER_PLACEHOLDER: "Write a comment...",
} as const;

/* ── Comment list (rendered inside the scroll container) ────────────── */

function TaskCommentsListInner() {
  const { threads } = useThreads();
  const [activeThread, setActiveThread] = useState<ThreadData | null>(null);

  const currentThread = activeThread
    ? threads.find((t) => t.id === activeThread.id) ?? activeThread
    : null;

  const totalComments = threads.reduce((sum, t) => sum + t.comments.length, 0);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Comments
        </span>
        {totalComments > 0 && (
          <span className="text-[10px] text-muted-foreground">{totalComments}</span>
        )}
      </div>

      {currentThread ? (
        <div className="[&_.lb-thread]:border-none [&_.lb-thread]:p-0 [&_.lb-thread]:shadow-none [&_.lb-thread]:bg-transparent [&_.lb-comment]:px-0">
          <button
            onClick={() => setActiveThread(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            Back to all
          </button>
          <Thread
            thread={currentThread}
            showComposer={true}
            showActions="hover"
            showReactions={true}
            overrides={TASK_COMPOSER_OVERRIDES}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-xs text-muted-foreground gap-1.5">
              <MessageSquare className="h-5 w-5 text-muted-foreground/30" />
              <span>No comments yet</span>
            </div>
          ) : (
            threads.map((thread) => {
              const rootComment = thread.comments[0];
              const replyCount = thread.comments.length - 1;
              if (!rootComment) return null;

              return (
                <div key={thread.id} className="group [&_.lb-comment]:px-0 [&_.lb-comment]:py-0 [&_.lb-comment]:mb-0">
                  <Comment
                    comment={rootComment}
                    showActions="hover"
                    showReactions={true}
                  />
                  {replyCount > 0 && (
                    <button
                      onClick={() => setActiveThread(thread)}
                      className="flex items-center gap-1 ml-8 text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      {replyCount} {replyCount === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function TaskCommentsListSection({ taskId }: { taskId: string }) {
  const roomId = `task:${taskId}`;

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense
        fallback={
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Comments
              </span>
            </div>
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading comments...</span>
            </div>
          </div>
        }
      >
        <TaskCommentsListInner />
      </ClientSideSuspense>
    </RoomProvider>
  );
}

/* ── Composer (rendered outside the scroll container, pinned to bottom) */

function TaskCommentsComposerSection({ taskId }: { taskId: string }) {
  const roomId = `task:${taskId}`;

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense
        fallback={
          <div className="border-t border-border px-4 py-3">
            <div className="h-[60px] rounded-md border border-border bg-secondary/30 animate-pulse" />
          </div>
        }
      >
        <div className="border-t border-border px-4 py-3 relative overflow-visible [&_.lb-composer]:border [&_.lb-composer]:border-border [&_.lb-composer]:rounded-md [&_.lb-composer]:bg-secondary/30 [&_.lb-composer-editor]:text-sm [&_.lb-composer-editor]:min-h-[48px]">
          <Composer overrides={TASK_COMPOSER_OVERRIDES} />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
}

/* ========================================================================== */
/*  NewTaskDialog                                                              */
/* ========================================================================== */

function NewTaskDialog({
  open,
  onOpenChange,
  onCreateTask,
  initialStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: Partial<Task>) => void;
  initialStatus: TaskStatus;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreateTask({ title, description, status, priority, assignee: assignee || undefined, dueDate: dueDate || undefined });
    setTitle(""); setDescription(""); setStatus(initialStatus); setPriority("none"); setAssignee(""); setDueDate("");
  };

  React.useEffect(() => { setStatus(initialStatus); }, [initialStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Create a new task for this deal</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task title</Label>
            <Input id="title" placeholder="Enter task title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <Circle className="h-2.5 w-2.5" style={{ color: STATUS_CONFIG[s].color }} fill={s === "done" ? STATUS_CONFIG[s].color : "none"} />
                      {STATUS_CONFIG[s].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePickerField className="w-[140px]" value={dueDate} onChange={setDueDate} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
