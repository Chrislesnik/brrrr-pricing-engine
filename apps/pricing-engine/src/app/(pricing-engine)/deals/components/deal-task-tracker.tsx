"use client";

import * as React from "react";
import { useState } from "react";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";
import { cn } from "@repo/lib/cn";
import {
  LayoutGrid,
  List,
  Plus,
  MoreHorizontal,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Calendar,
  User,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@repo/ui/shadcn/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Separator } from "@repo/ui/shadcn/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible";

// Task status types matching Linear
type TaskStatus = "To Do" | "In Progress" | "In Review" | "Done";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
  dealId: string;
}

interface DealTaskTrackerProps {
  dealId: string;
  tasks?: Task[];
  onAddTask?: (dealId: string, task: Partial<Task>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

const statusColors: Record<TaskStatus, string> = {
  "To Do": "border-gray-300 text-gray-700 bg-gray-50",
  "In Progress": "border-blue-300 text-blue-700 bg-blue-50",
  "In Review": "border-orange-300 text-orange-700 bg-orange-50",
  "Done": "border-green-300 text-green-700 bg-green-50",
};

const priorityColors: Record<string, string> = {
  low: "border-gray-300 text-gray-600",
  medium: "border-orange-300 text-orange-600",
  high: "border-red-300 text-red-600",
};

// Sample tasks - In production, these would come from Supabase
const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Upload Property Appraisal",
    description: "Complete appraisal from certified appraiser",
    status: "To Do",
    priority: "high",
    dealId: "",
  },
  {
    id: "2",
    title: "Verify Borrower Income",
    description: "Review tax returns and bank statements",
    status: "In Progress",
    priority: "high",
    dealId: "",
  },
  {
    id: "3",
    title: "Title Search Complete",
    status: "Done",
    priority: "medium",
    dealId: "",
  },
  {
    id: "4",
    title: "Environmental Assessment",
    description: "Phase 1 environmental report required",
    status: "In Review",
    priority: "medium",
    dealId: "",
  },
];

export function DealTaskTracker({
  dealId,
  tasks: propTasks,
  onAddTask,
  onUpdateTask,
}: DealTaskTrackerProps) {
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [tasks, setTasks] = useState<Task[]>(
    propTasks || sampleTasks.map((t) => ({ ...t, dealId }))
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("To Do");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const statuses: TaskStatus[] = ["To Do", "In Progress", "In Review", "Done"];

  const getTasksByStatus = (status: TaskStatus) => {
    let filtered = tasks.filter((task) => task.status === status);
    if (filterPriority !== "all") {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }
    return filtered;
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    onUpdateTask?.(taskId, { status: newStatus });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleAddTaskToStatus = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setIsNewTaskDialogOpen(true);
  };

  const handleCreateTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || "Untitled Task",
      description: taskData.description,
      status: newTaskStatus,
      priority: taskData.priority || "medium",
      assignee: taskData.assignee,
      dueDate: taskData.dueDate,
      dealId,
    };
    setTasks((prev) => [...prev, newTask]);
    setIsNewTaskDialogOpen(false);
    onAddTask?.(dealId, newTask);
  };

  const filteredTasks = filterPriority === "all" 
    ? tasks 
    : tasks.filter((task) => task.priority === filterPriority);

  return (
    <div className="border-t bg-muted/30">
      {/* Header with View Controls and Filters */}
      <div className="flex items-center justify-between border-b bg-background/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Underwriting Conditions</h3>
          <Badge variant="secondary" className="rounded-full">
            {tasks.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                <Filter className="h-3 w-3" />
                <span className="text-xs">Filter</span>
                {filterPriority !== "all" && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Priority</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterPriority("all")}>
                <span className={cn(filterPriority === "all" && "font-medium")}>
                  All priorities
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("high")}>
                <span className={cn(filterPriority === "high" && "font-medium")}>
                  High priority
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("medium")}>
                <span className={cn(filterPriority === "medium" && "font-medium")}>
                  Medium priority
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("low")}>
                <span className={cn(filterPriority === "low" && "font-medium")}>
                  Low priority
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex rounded-md border bg-background">
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-r-none border-0"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-l-none border-0 border-l"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            className="h-7"
            onClick={() => handleAddTaskToStatus("To Do")}
          >
            <Plus className="h-3 w-3 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === "board" ? (
          <BoardView
            statuses={statuses}
            tasks={filteredTasks}
            getTasksByStatus={getTasksByStatus}
            onStatusChange={handleStatusChange}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTaskToStatus}
          />
        ) : (
          <ListView
            tasks={filteredTasks}
            statuses={statuses}
            onStatusChange={handleStatusChange}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTaskToStatus}
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
            setTasks((prev) =>
              prev.map((t) =>
                t.id === selectedTask.id ? { ...t, ...updates } : t
              )
            );
            onUpdateTask?.(selectedTask.id, updates);
          }}
          statuses={statuses}
        />
      )}

      {/* New Task Dialog */}
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onCreateTask={handleCreateTask}
        initialStatus={newTaskStatus}
        statuses={statuses}
      />
    </div>
  );
}

// Board View Component
function BoardView({
  statuses,
  tasks,
  getTasksByStatus,
  onStatusChange,
  onTaskClick,
  onAddTask,
}: {
  statuses: TaskStatus[];
  tasks: Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {statuses.map((status) => {
        const statusTasks = getTasksByStatus(status);
        return (
          <div key={status} className="flex flex-col gap-2">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  {status}
                </h4>
                <Badge
                  variant="secondary"
                  className="h-5 rounded-full px-1.5 text-xs"
                >
                  {statusTasks.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => onAddTask(status)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2 group">
              {statusTasks.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground">No tasks</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 mt-2"
                    onClick={() => onAddTask(status)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add task
                  </Button>
                </div>
              ) : (
                statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    statuses={statuses}
                    onStatusChange={onStatusChange}
                    onClick={() => onTaskClick(task)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// List View Component with Collapsible Row Grouping by Status
function ListView({
  tasks,
  statuses,
  onStatusChange,
  onTaskClick,
  onAddTask,
}: {
  tasks: Task[];
  statuses: TaskStatus[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<TaskStatus>>(
    new Set()
  );

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const toggleGroup = (status: TaskStatus) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-2">
      {statuses.map((status) => {
        const statusTasks = getTasksByStatus(status);
        const isCollapsed = collapsedGroups.has(status);

        return (
          <Collapsible
            key={status}
            open={!isCollapsed}
            onOpenChange={() => toggleGroup(status)}
            className="overflow-hidden rounded-lg border bg-background"
          >
            {/* Status Group Header - Collapsible Row */}
            <div className="relative flex items-center border-b bg-muted/50">
              <CollapsibleTrigger className="flex flex-1 items-center gap-2 px-4 py-2.5 hover:bg-muted/70 transition-colors">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <h4 className="text-sm font-semibold">{status}</h4>
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-xs">
                  {statusTasks.length}
                </Badge>
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 mr-2"
                onClick={() => onAddTask(status)}
              >
                <Plus className="h-3 w-3" />
                <span className="text-xs">New Task</span>
              </Button>
            </div>

            {/* Tasks Table */}
            <CollapsibleContent>
              {statusTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No tasks in {status}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddTask(status)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add first task
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="font-semibold">Task</TableHead>
                      <TableHead className="font-semibold">Priority</TableHead>
                      <TableHead className="font-semibold">Assignee</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusTasks.map((task, index) => (
                      <TableRow
                        key={task.id}
                        className="cursor-pointer"
                        onClick={() => onTaskClick(task)}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{task.title}</div>
                            {task.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.priority && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full text-xs capitalize",
                                priorityColors[task.priority]
                              )}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {task.assignee || "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onTaskClick(task)}>
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs">
                                Move to:
                              </DropdownMenuLabel>
                              {statuses
                                .filter((s) => s !== status)
                                .map((targetStatus) => (
                                  <DropdownMenuItem
                                    key={targetStatus}
                                    onClick={() => onStatusChange(task.id, targetStatus)}
                                    className="pl-6"
                                  >
                                    {targetStatus}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

// Task Card Component (for Board View)
function TaskCard({
  task,
  statuses,
  onStatusChange,
  onClick,
}: {
  task: Task;
  statuses: TaskStatus[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onClick?: () => void;
}) {
  return (
    <div
      className="group/card rounded-lg border bg-background p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h5 className="text-sm font-medium line-clamp-2 flex-1">
          {task.title}
        </h5>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover/card:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>Open</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Move to:</DropdownMenuLabel>
            {statuses
              .filter((s) => s !== task.status)
              .map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(task.id, status)}
                  className="pl-6"
                >
                  {status}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {task.priority && (
          <Badge
            variant="outline"
            className={cn(
              "h-5 rounded-full px-2 text-[10px] capitalize",
              priorityColors[task.priority]
            )}
          >
            {task.priority}
          </Badge>
        )}
        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[10px] font-medium">
                {task.assignee.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Detail Sheet Component
function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onUpdate,
  statuses,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<Task>) => void;
  statuses: TaskStatus[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">{task.title}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{task.description}</p>
            </div>
          )}

          <Separator />

          {/* Properties */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Properties</h4>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Status</Label>
              </div>
              <Select
                value={task.status}
                onValueChange={(value) => onUpdate({ status: value as TaskStatus })}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                          statusColors[status]
                        )}
                      >
                        {status}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Priority</Label>
              </div>
              <Select
                value={task.priority || "medium"}
                onValueChange={(value) =>
                  onUpdate({ priority: value as "low" | "medium" | "high" })
                }
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Assignee</Label>
              </div>
              <Input
                className="w-[180px] h-8"
                placeholder="Unassigned"
                value={task.assignee || ""}
                onChange={(e) => onUpdate({ assignee: e.target.value })}
              />
            </div>

            {/* Due Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Due date</Label>
              </div>
              <Input
                type="date"
                className="w-[180px] h-8"
                value={task.dueDate || ""}
                onChange={(e) => onUpdate({ dueDate: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Activity */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Activity</h4>
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex gap-2">
                <span className="text-foreground font-medium">Aaron Kraut</span>
                <span>created the task</span>
                <span>20 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// New Task Dialog Component
function NewTaskDialog({
  open,
  onOpenChange,
  onCreateTask,
  initialStatus,
  statuses,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: Partial<Task>) => void;
  initialStatus: TaskStatus;
  statuses: TaskStatus[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreateTask({
      title,
      description,
      status,
      priority,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
    });
    // Reset form
    setTitle("");
    setDescription("");
    setStatus(initialStatus);
    setPriority("medium");
    setAssignee("");
    setDueDate("");
  };

  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Create a new underwriting condition task
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter text or type '/' for commands"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Properties Row */}
          <div className="flex flex-wrap gap-2">
            {/* Status */}
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">No Priority</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignee */}
            <Button variant="outline" size="sm" className="h-8">
              <User className="h-3 w-3 mr-1" />
              Assign
            </Button>

            {/* Due Date */}
            <Input
              type="date"
              className="w-[140px] h-8"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Labels */}
          <Button variant="outline" size="sm" className="h-8 w-fit">
            <Tag className="h-3 w-3 mr-1" />
            Labels
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
