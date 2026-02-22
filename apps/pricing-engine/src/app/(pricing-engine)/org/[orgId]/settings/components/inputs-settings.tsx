"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  GripVertical,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Archive,
  Loader2,
  Workflow,
  X,
  Link2,
  Unlink,
  Settings,
  PanelTopOpen,
  PanelTopClose,
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
  KanbanColumnHandle,
  KanbanItem,
  KanbanOverlay,
} from "@/components/ui/kanban";
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
} from "@/components/ui/tags-input";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LogicBuilderSheet } from "./logic-builder-sheet";
import { InputAIOrderSheet } from "./input-ai-order-sheet";
import { ColumnExpressionInput } from "@/components/column-expression-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputCategory {
  id: number;
  category: string;
  display_order: number;
  created_at: string;
  default_open: boolean;
}

interface InputField {
  id: string;
  category_id: number;
  category: string;
  input_label: string;
  input_code: string;
  input_type: string;
  dropdown_options: string[] | null;
  starred: boolean;
  display_order: number;
  created_at: string;
  linked_table?: string | null;
  linked_column?: string | null;
  tooltip?: string | null;
}

/** Convert a snake_case table name to Title Case for display. */
function formatTableLabel(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const INPUT_TYPES = [
  { value: "text", label: "Text" },
  { value: "dropdown", label: "Dropdown" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percentage", label: "Percentage" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  dropdown: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  number: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  currency: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  date: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  boolean: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  percentage: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function InputsSettings() {
  const [categories, setCategories] = useState<InputCategory[]>([]);
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  // Add category state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  // Add input state (per category)
  const [addingInputForCategory, setAddingInputForCategory] = useState<number | null>(null);
  const [newInputLabel, setNewInputLabel] = useState("");
  const [newInputType, setNewInputType] = useState("");
  const [newDropdownOptions, setNewDropdownOptions] = useState<string[]>([]);
  const [savingInput, setSavingInput] = useState(false);

  // Tooltip state
  const [newTooltip, setNewTooltip] = useState("");

  // Database link state
  const [newLinkedTable, setNewLinkedTable] = useState<string>("");
  const [newLinkedColumn, setNewLinkedColumn] = useState<string>("");
  const [linkableColumns, setLinkableColumns] = useState<{ name: string; type: string }[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [linkableTables, setLinkableTables] = useState<{ value: string; label: string }[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Edit category state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Edit input state
  const [editingInputId, setEditingInputId] = useState<string | null>(null);

  // Fetch all public tables for the Database Link dropdown
  useEffect(() => {
    let cancelled = false;
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const res = await fetch("/api/supabase-schema?type=tables");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.tables)) {
          setLinkableTables(
            data.tables
              .sort((a: string, b: string) => a.localeCompare(b))
              .map((t: string) => ({ value: t, label: formatTableLabel(t) }))
          );
        }
      } catch {
        if (!cancelled) setLinkableTables([]);
      } finally {
        if (!cancelled) setLoadingTables(false);
      }
    };
    fetchTables();
    return () => { cancelled = true; };
  }, []);

  // Fetch columns when linked table changes
  useEffect(() => {
    if (!newLinkedTable) {
      setLinkableColumns([]);
      return;
    }
    let cancelled = false;
    const fetchColumns = async () => {
      setLoadingColumns(true);
      try {
        const res = await fetch(`/api/supabase-schema?type=columns&table=${encodeURIComponent(newLinkedTable)}`);
        const data = await res.json();
        if (!cancelled) {
          setLinkableColumns(Array.isArray(data.columns) ? data.columns : []);
        }
      } catch {
        if (!cancelled) setLinkableColumns([]);
      } finally {
        if (!cancelled) setLoadingColumns(false);
      }
    };
    fetchColumns();
    return () => { cancelled = true; };
  }, [newLinkedTable]);

  // When a linked table is selected, always set input type to "dropdown"
  useEffect(() => {
    if (newLinkedTable) {
      setNewInputType("dropdown");
    }
  }, [newLinkedTable]);

  // Native drag-and-drop for reordering dropdown option tags
  const dragTagIdx = useRef<number | null>(null);

  // Logic Builder sheet state
  const [logicBuilderOpen, setLogicBuilderOpen] = useState(false);
  const [logicBuilderInputId, setLogicBuilderInputId] = useState<string | null>(null);

  // AI Order sheet state
  const [aiOrderOpen, setAiOrderOpen] = useState(false);
  const [aiOrderInputId, setAiOrderInputId] = useState<string | null>(null);
  const [aiOrderInputLabel, setAiOrderInputLabel] = useState("");

  // Deal Settings sheet state
  const [dealSettingsOpen, setDealSettingsOpen] = useState(false);
  const [headingExpr, setHeadingExpr] = useState("");
  const [subheadingExpr, setSubheadingExpr] = useState("");
  const [dealSettingsSaving, setDealSettingsSaving] = useState(false);

  // Deal Role Types state
  const [dealRoleTypes, setDealRoleTypes] = useState<{ id: number; name: string; is_active: boolean }[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [addingRole, setAddingRole] = useState(false);

  const fetchDealRoleTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/deal-role-types");
      if (res.ok) {
        const data = await res.json();
        setDealRoleTypes(data.roles ?? []);
      }
    } catch {
      // non-critical
    }
  }, []);

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setAddingRole(true);
    try {
      const res = await fetch("/api/deal-role-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      if (res.ok) {
        setNewRoleName("");
        fetchDealRoleTypes();
      }
    } catch (err) {
      console.error("Failed to add role:", err);
    } finally {
      setAddingRole(false);
    }
  };

  const handleArchiveRole = async (roleId: number) => {
    try {
      await fetch("/api/deal-role-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleId, is_active: false }),
      });
      fetchDealRoleTypes();
    } catch (err) {
      console.error("Failed to archive role:", err);
    }
  };

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "category" | "input";
    id: number | string;
    name: string;
  }>({ open: false, type: "input", id: "", name: "" });

  /* ---- Fetch data ---- */

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, inputsRes] = await Promise.all([
        fetch("/api/input-categories"),
        fetch("/api/inputs"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (inputsRes.ok) setInputs(await inputsRes.json());
    } catch (err) {
      console.error("Failed to fetch inputs data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load deal settings when the sheet opens
  useEffect(() => {
    if (!dealSettingsOpen) return;
    (async () => {
      try {
        const res = await fetch("/api/app-settings");
        if (res.ok) {
          const { settings } = await res.json();
          setHeadingExpr(settings?.deal_heading_expression ?? "");
          setSubheadingExpr(settings?.deal_subheading_expression ?? "");
        }
      } catch {
        // non-critical
      }
    })();
  }, [dealSettingsOpen]);

  // Build columns for the expression input from the already-loaded inputs
  const expressionColumns = inputs.map((inp: InputField) => ({
    name: inp.input_code,
    type: inp.input_type,
  }));

  const handleSaveDealSettings = async () => {
    setDealSettingsSaving(true);
    try {
      await Promise.all([
        fetch("/api/app-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "deal_heading_expression", value: headingExpr }),
        }),
        fetch("/api/app-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "deal_subheading_expression", value: subheadingExpr }),
        }),
      ]);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:settings:changed"));
      }
      setDealSettingsOpen(false);
    } catch (err) {
      console.error("Failed to save deal settings:", err);
    } finally {
      setDealSettingsSaving(false);
    }
  };

  useEffect(() => {
    async function checkAccessAndFetch() {
      // Check permissions via Supabase (admin/owner in internal org)
      try {
        const accessResponse = await fetch("/api/org/settings-access?tab=inputs");
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
      fetchDealRoleTypes();
    }

    checkAccessAndFetch();
  }, [fetchData, fetchDealRoleTypes]);

  /* ---- Build Kanban columns (Record<string, InputField[]>) ---- */

  const kanbanColumns = buildKanbanColumns(categories, inputs);
  const categoryMap = new Map(categories.map((c) => [colKey(c.id), c]));

  /* ---- Category CRUD ---- */

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const res = await fetch("/api/input-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategoryName.trim() }),
      });
      if (res.ok) {
        setNewCategoryName("");
        setShowCategoryInput(false);
        await fetchData();
      }
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await fetch("/api/input-categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const confirmDelete = async () => {
    if (deleteDialog.type === "category") {
      await handleDeleteCategory(deleteDialog.id as number);
    } else {
      await handleDeleteInput(deleteDialog.id as string);
    }
    setDeleteDialog((prev) => ({ ...prev, open: false }));
  };

  const handleStartEditCategory = (cat: InputCategory) => {
    setEditingCategoryId(cat.id);
    setEditedCategoryName(cat.category);
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryId || !editedCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const res = await fetch("/api/input-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCategoryId, category: editedCategoryName.trim() }),
      });
      if (res.ok) {
        setEditingCategoryId(null);
        setEditedCategoryName("");
        await fetchData();
      }
    } finally {
      setSavingCategory(false);
    }
  };

  /* ---- Input CRUD ---- */

  const handleAddInput = async (categoryId: number) => {
    if (!newInputLabel.trim() || !newInputType) return;
    setSavingInput(true);
    try {
      const res = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          input_label: newInputLabel.trim(),
          input_type: newInputType,
          dropdown_options: newInputType === "dropdown" ? newDropdownOptions : null,
          linked_table: newLinkedTable || null,
          linked_column: newLinkedColumn || null,
          tooltip: newTooltip.trim() || null,
        }),
      });
      if (res.ok) {
        resetInputForm();
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to add input:", err.error);
      }
    } finally {
      setSavingInput(false);
    }
  };

  const handleDeleteInput = async (inputCode: string) => {
    try {
      await fetch("/api/inputs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inputCode }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to delete input:", err);
    }
  };

  const handleSaveInputEdit = async (input: InputField) => {
    if (!newInputLabel.trim() || !newInputType) return;
    setSavingInput(true);
    try {
      const res = await fetch("/api/inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: input.id,
          input_label: newInputLabel.trim(),
          input_type: newInputType,
          dropdown_options: newInputType === "dropdown" ? newDropdownOptions : null,
          linked_table: newLinkedTable || null,
          linked_column: newLinkedColumn || null,
          tooltip: newTooltip.trim() || null,
        }),
      });
      if (res.ok) {
        resetInputForm();
        setEditingInputId(null);
        await fetchData();
      }
    } finally {
      setSavingInput(false);
    }
  };

  const handleToggleStar = async (input: InputField) => {
    try {
      const res = await fetch("/api/inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: input.id, starred: !input.starred }),
      });
      if (res.ok) {
        // Optimistically update local state
        setInputs((prev) =>
          prev.map((inp) =>
            inp.id === input.id ? { ...inp, starred: !inp.starred } : inp
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const resetInputForm = () => {
    setAddingInputForCategory(null);
    setEditingInputId(null);
    setNewInputLabel("");
    setNewInputType("");
    setNewDropdownOptions([]);
    setNewLinkedTable("");
    setNewLinkedColumn("");
    setLinkableColumns([]);
    setNewTooltip("");
  };

  /* ---- Drag and drop handlers ---- */

  const handleKanbanChange = (newColumns: Record<string, InputField[]>) => {
    const newColumnKeys = Object.keys(newColumns);
    const oldColumnKeys = categories.map((c) => colKey(c.id));

    // Check if column order changed (category drag)
    const columnOrderChanged =
      newColumnKeys.length === oldColumnKeys.length &&
      newColumnKeys.some((key, i) => key !== oldColumnKeys[i]);

    if (columnOrderChanged) {
      // Reorder the categories array to match the new column key order
      const catById = new Map(categories.map((c) => [colKey(c.id), c]));
      const reorderedCategories = newColumnKeys
        .map((key) => catById.get(key)!)
        .filter(Boolean);
      setCategories(reorderedCategories);

      // Persist category order
      const catReorder = reorderedCategories.map((c, i) => ({
        id: c.id,
        display_order: i,
      }));
      fetch("/api/input-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: catReorder }),
      }).catch(console.error);
    }

    // Always sync inputs for the new column layout
    const reorderPayload: { id: string; category_id: number; display_order: number }[] = [];
    const newInputs: InputField[] = [];

    for (const [key, items] of Object.entries(newColumns)) {
      const categoryId = colId(key);
      const cat = categoryMap.get(key);
      items.forEach((item, index) => {
        reorderPayload.push({
          id: item.id,
          category_id: categoryId,
          display_order: index,
        });
        newInputs.push({
          ...item,
          category_id: categoryId,
          category: cat?.category ?? item.category,
          display_order: index,
        });
      });
    }
    setInputs(newInputs);

    // Only persist input reorder if there are inputs and it's not purely a column move
    if (reorderPayload.length > 0 && !columnOrderChanged) {
      fetch("/api/inputs", {
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
          You don&apos;t have permission to manage inputs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Inputs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define the input fields that appear on deal pages. Organize them into categories and drag to reorder.
        </p>
      </div>

      {/* Add Category */}
      <div>
        {showCategoryInput ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
                if (e.key === "Escape") {
                  setShowCategoryInput(false);
                  setNewCategoryName("");
                }
              }}
              className="max-w-xs"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={addingCategory || !newCategoryName.trim()}
            >
              {addingCategory ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCategoryInput(false);
                setNewCategoryName("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryInput(true)}
            >
              <Plus className="size-4 mr-1.5" />
              Add Category
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLogicBuilderInputId(null);
                setLogicBuilderOpen(true);
              }}
            >
              <Workflow className="size-4 mr-1.5" />
              Logic Builder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDealSettingsOpen(true)}
            >
              <Settings className="size-4 mr-1.5" />
              Deal Settings
            </Button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">No categories yet. Add a category to get started.</p>
        </div>
      ) : (
        <Kanban<InputField>
          value={kanbanColumns}
          onValueChange={handleKanbanChange}
          getItemValue={(item) => item.id}
        >
          <KanbanBoard>
            {categories.map((cat) => {
              const ck = colKey(cat.id);
              const colInputs = kanbanColumns[ck] ?? [];

              return (
                <KanbanColumn key={ck} value={ck}>
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <KanbanColumnHandle>
                        <GripVertical className="size-4 text-muted-foreground" />
                      </KanbanColumnHandle>
                      {editingCategoryId === cat.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={editedCategoryName}
                            onChange={(e) => setEditedCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveCategory();
                              if (e.key === "Escape") {
                                setEditingCategoryId(null);
                                setEditedCategoryName("");
                              }
                            }}
                            className="h-7 text-sm w-40"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-6 p-0 text-green-600 hover:text-green-700"
                            onClick={handleSaveCategory}
                            disabled={savingCategory || !editedCategoryName.trim()}
                          >
                            {savingCategory ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-6 p-0"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditedCategoryName("");
                            }}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-sm uppercase tracking-wide">
                            {cat.category}
                          </span>
                          <Badge
                            variant="secondary"
                            className="pointer-events-none rounded-sm text-xs"
                          >
                            {colInputs.length}
                          </Badge>
                        </>
                      )}
                    </div>
                    {editingCategoryId !== cat.id && (
                      <div className="flex items-center gap-0.5">
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                style={{ color: cat.default_open ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }}
                                onClick={async () => {
                                  try {
                                    await fetch("/api/input-categories", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ id: cat.id, default_open: !cat.default_open }),
                                    });
                                    await fetchData();
                                  } catch { /* ignore */ }
                                }}
                              >
                                {cat.default_open ? <PanelTopOpen className="size-3.5" /> : <PanelTopClose className="size-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {cat.default_open ? "Default: Open on new deals" : "Default: Closed on new deals"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setLogicBuilderInputId(null);
                            setLogicBuilderOpen(true);
                          }}
                        >
                          <Workflow className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleStartEditCategory(cat)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              type: "category",
                              id: cat.id,
                              name: cat.category,
                            })
                          }
                        >
                          <Archive className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Input items */}
                  <div className="flex flex-col gap-1.5">
                    {colInputs.map((input) =>
                      editingInputId === input.id ? (
                        <div key={input.id} className="space-y-3 rounded-md border bg-card p-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Label</Label>
                            <Input
                              placeholder="e.g. Loan Amount"
                              value={newInputLabel}
                              onChange={(e) => setNewInputLabel(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={newInputType}
                              onValueChange={setNewInputType}
                              disabled={!!newLinkedTable}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {INPUT_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {newLinkedTable && (
                              <p className="text-[10px] text-muted-foreground">Type is auto-set to Dropdown for linked inputs</p>
                            )}
                          </div>

                          {/* Database Link */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs flex items-center gap-1">
                                <Link2 className="size-3" />
                                Database Link
                              </Label>
                              {newLinkedTable ? (
                                <button
                                  type="button"
                                  className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5"
                                  onClick={() => {
                                    setNewLinkedTable("");
                                    setNewLinkedColumn("");
                                  }}
                                >
                                  <Unlink className="size-2.5" />
                                  Remove
                                </button>
                              ) : null}
                            </div>
                            <Select
                              value={newLinkedTable || undefined}
                              onValueChange={(val) => {
                                setNewLinkedTable(val);
                                setNewLinkedColumn("");
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="None (standalone input)" />
                              </SelectTrigger>
                              <SelectContent>
                                {loadingTables ? (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading tables…</div>
                                ) : linkableTables.length === 0 ? (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No tables found</div>
                                ) : (
                                  linkableTables.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                      {t.label}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {newLinkedTable && (
                              <>
                                <Label className="text-[10px] text-muted-foreground mt-1">
                                  Display Expression (shown in dropdown)
                                </Label>
                                <ColumnExpressionInput
                                  value={newLinkedColumn}
                                  onChange={setNewLinkedColumn}
                                  columns={linkableColumns}
                                  loading={loadingColumns}
                                  placeholder="e.g. @first_name @last_name"
                                />
                              </>
                            )}
                          </div>

                          {newInputType === "dropdown" && !newLinkedTable && (
                            <div className="space-y-1.5 p-2">
                              <Label className="text-xs">
                                Dropdown Options
                                {newDropdownOptions.length > 0 && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({newDropdownOptions.length})
                                  </span>
                                )}
                              </Label>
                              <TagsInput
                                value={newDropdownOptions}
                                onValueChange={setNewDropdownOptions}
                                className="w-full"
                                editable
                              >
                                <TagsInputList className="min-h-9 px-2 py-1 flex-wrap">
                                  {newDropdownOptions.map((opt, idx) => (
                                    <div
                                      key={`${opt}-${idx}`}
                                      className="inline-flex items-center"
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = "move";
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        const from = dragTagIdx.current;
                                        if (from !== null && from !== idx) {
                                          const updated = [...newDropdownOptions];
                                          const [moved] = updated.splice(from, 1);
                                          updated.splice(idx, 0, moved);
                                          setNewDropdownOptions(updated);
                                        }
                                        dragTagIdx.current = null;
                                      }}
                                    >
                                      <span
                                        draggable
                                        onDragStart={(e) => {
                                          dragTagIdx.current = idx;
                                          e.dataTransfer.effectAllowed = "move";
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            e.dataTransfer.setDragImage(parent, 0, 0);
                                          }
                                        }}
                                        onDragEnd={() => {
                                          dragTagIdx.current = null;
                                        }}
                                        className="flex items-center cursor-grab active:cursor-grabbing pl-0.5 pr-0.5 text-muted-foreground/50 hover:text-muted-foreground"
                                      >
                                        <GripVertical className="size-3" />
                                      </span>
                                      <TagsInputItem
                                        value={opt}
                                        className="text-xs px-1.5 py-0.5"
                                      >
                                        {opt}
                                      </TagsInputItem>
                                    </div>
                                  ))}
                                  <TagsInputInput
                                    placeholder="Type and press Enter..."
                                    className="text-sm min-w-[140px]"
                                  />
                                </TagsInputList>
                              </TagsInput>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label className="text-xs">Tooltip (optional)</Label>
                            <Input
                              placeholder="Help text shown on hover"
                              value={newTooltip}
                              onChange={(e) => setNewTooltip(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSaveInputEdit(input)}
                          disabled={
                            savingInput ||
                            !newInputLabel.trim() ||
                            !newInputType ||
                            (newInputType === "dropdown" &&
                              !newLinkedTable &&
                              newDropdownOptions.length === 0)
                          }
                        >
                          {savingInput ? (
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
                              onClick={resetInputForm}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <KanbanItem
                          key={input.id}
                          value={input.id}
                          asHandle
                          asChild
                        >
                          <div
                            className={`group flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-xs transition-shadow ${
                              input.starred
                                ? "ring-1 ring-warning/60 shadow-[0_0_8px_hsl(var(--warning)/0.25)]"
                                : ""
                            }`}
                          >
                            <GripVertical className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {input.input_label}
                            </span>
                            <Badge
                              className={`pointer-events-none rounded-sm text-[10px] px-1.5 h-5 capitalize ${TYPE_COLORS[input.input_type] ?? ""}`}
                              variant="secondary"
                            >
                              {input.input_type}
                            </Badge>
                            {input.linked_table && (
                              <Badge
                                className="pointer-events-none rounded-sm text-[10px] px-1.5 h-5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                variant="secondary"
                              >
                                <Link2 className="size-2.5 mr-0.5" />
                                {input.linked_table}
                              </Badge>
                            )}
                            <div className="ml-auto flex items-center gap-1 shrink-0">
                              {input.input_type === "dropdown" &&
                                input.dropdown_options &&
                                input.dropdown_options.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                                    ({input.dropdown_options.length} opts)
                                  </span>
                                )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-warning shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(input);
                                }}
                              >
                                <Star
                                  className={`size-3 ${input.starred ? "fill-warning text-warning" : ""}`}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAiOrderInputId(input.id);
                                  setAiOrderInputLabel(input.input_label);
                                  setAiOrderOpen(true);
                                }}
                              >
                                <Sparkles className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLogicBuilderInputId(input.id);
                                  setLogicBuilderOpen(true);
                                }}
                              >
                                <Workflow className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => {
                                e.stopPropagation();
                                resetInputForm();
                                setEditingInputId(input.id);
                                setNewInputLabel(input.input_label);
                                setNewInputType(input.input_type);
                                setNewDropdownOptions(
                                  input.dropdown_options ?? [],
                                );
                                setNewLinkedTable(input.linked_table ?? "");
                                setNewLinkedColumn(input.linked_column ?? "");
                                setNewTooltip(input.tooltip ?? "");
                                }}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDialog({
                                    open: true,
                                    type: "input",
                                    id: input.id,
                                    name: input.input_label,
                                  });
                                }}
                              >
                                <Archive className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </KanbanItem>
                      ),
                    )}
                  </div>

                  {/* Add Input Form */}
                  {addingInputForCategory === cat.id ? (
                    <div className="mt-3 space-y-3 rounded-md border bg-card p-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Label</Label>
                        <Input
                          placeholder="e.g. Loan Amount"
                          value={newInputLabel}
                          onChange={(e) => setNewInputLabel(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={newInputType}
                          onValueChange={setNewInputType}
                          disabled={!!newLinkedTable}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {INPUT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newLinkedTable && (
                          <p className="text-[10px] text-muted-foreground">Type is auto-set to Dropdown for linked inputs</p>
                        )}
                      </div>

                      {/* Database Link */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1">
                            <Link2 className="size-3" />
                            Database Link
                          </Label>
                          {newLinkedTable ? (
                            <button
                              type="button"
                              className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5"
                              onClick={() => {
                                setNewLinkedTable("");
                                setNewLinkedColumn("");
                              }}
                            >
                              <Unlink className="size-2.5" />
                              Remove
                            </button>
                          ) : null}
                        </div>
                        <Select
                          value={newLinkedTable || undefined}
                          onValueChange={(val) => {
                            setNewLinkedTable(val);
                            setNewLinkedColumn("");
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="None (standalone input)" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingTables ? (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading tables…</div>
                            ) : linkableTables.length === 0 ? (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">No tables found</div>
                            ) : (
                              linkableTables.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {newLinkedTable && (
                          <>
                            <Label className="text-[10px] text-muted-foreground mt-1">
                              Display Expression (shown in dropdown)
                            </Label>
                            <ColumnExpressionInput
                              value={newLinkedColumn}
                              onChange={setNewLinkedColumn}
                              columns={linkableColumns}
                              loading={loadingColumns}
                              placeholder="e.g. @first_name @last_name"
                            />
                          </>
                        )}
                      </div>

                      {newInputType === "dropdown" && !newLinkedTable && (
                        <div className="space-y-1.5 p-2">
                          <Label className="text-xs">
                            Dropdown Options
                            {newDropdownOptions.length > 0 && (
                              <span className="ml-1 text-muted-foreground">
                                ({newDropdownOptions.length})
                              </span>
                            )}
                          </Label>
                          <TagsInput
                            value={newDropdownOptions}
                            onValueChange={setNewDropdownOptions}
                            className="w-full"
                            editable
                          >
                            <TagsInputList className="min-h-9 px-2 py-1 flex-wrap">
                              {newDropdownOptions.map((opt, idx) => (
                                <div
                                  key={`${opt}-${idx}`}
                                  className="inline-flex items-center"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const from = dragTagIdx.current;
                                    if (from !== null && from !== idx) {
                                      const updated = [...newDropdownOptions];
                                      const [moved] = updated.splice(from, 1);
                                      updated.splice(idx, 0, moved);
                                      setNewDropdownOptions(updated);
                                    }
                                    dragTagIdx.current = null;
                                  }}
                                >
                                  <span
                                    draggable
                                    onDragStart={(e) => {
                                      dragTagIdx.current = idx;
                                      e.dataTransfer.effectAllowed = "move";
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        e.dataTransfer.setDragImage(parent, 0, 0);
                                      }
                                    }}
                                    onDragEnd={() => {
                                      dragTagIdx.current = null;
                                    }}
                                    className="flex items-center cursor-grab active:cursor-grabbing pl-0.5 pr-0.5 text-muted-foreground/50 hover:text-muted-foreground"
                                  >
                                    <GripVertical className="size-3" />
                                  </span>
                                  <TagsInputItem
                                    value={opt}
                                    className="text-xs px-1.5 py-0.5"
                                  >
                                    {opt}
                                  </TagsInputItem>
                                </div>
                              ))}
                              <TagsInputInput
                                placeholder="Type and press Enter..."
                                className="text-sm min-w-[140px]"
                              />
                            </TagsInputList>
                          </TagsInput>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs">Tooltip (optional)</Label>
                        <Input
                          placeholder="Help text shown on hover"
                          value={newTooltip}
                          onChange={(e) => setNewTooltip(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAddInput(cat.id)}
                          disabled={
                            savingInput ||
                            !newInputLabel.trim() ||
                            !newInputType ||
                            (newInputType === "dropdown" &&
                              !newLinkedTable &&
                              newDropdownOptions.length === 0)
                          }
                        >
                          {savingInput ? (
                            <Loader2 className="size-3 animate-spin mr-1" />
                          ) : (
                            <Plus className="size-3 mr-1" />
                          )}
                          Save Input
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={resetInputForm}
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
                        resetInputForm();
                        setAddingInputForCategory(cat.id);
                      }}
                    >
                      <Plus className="size-3 mr-1" />
                      Add Input
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

      {/* Deal Settings Sheet */}
      <Sheet open={dealSettingsOpen} onOpenChange={setDealSettingsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Deal Settings</SheetTitle>
            <SheetDescription>
              Configure how deal headings and subheadings are displayed.
              Use <code className="text-xs bg-muted px-1 py-0.5 rounded">@input_code</code> to reference deal inputs.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Heading Expression</Label>
              <ColumnExpressionInput
                value={headingExpr}
                onChange={setHeadingExpr}
                columns={expressionColumns}
                placeholder="e.g. @loan_number — @property_address"
              />
              <p className="text-[11px] text-muted-foreground">
                Replaces the default &ldquo;Deal abc123&rdquo; title on deal pages.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Subheading Expression</Label>
              <ColumnExpressionInput
                value={subheadingExpr}
                onChange={setSubheadingExpr}
                columns={expressionColumns}
                placeholder="e.g. @borrower_name — @loan_amount_total"
              />
              <p className="text-[11px] text-muted-foreground">
                Replaces the default UUID subtitle on deal pages.
              </p>
            </div>

            {/* Deal Role Types */}
            <div className="space-y-3 border-t pt-6">
              <div>
                <Label className="text-sm font-medium">Deal Role Types</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Manage the roles that can be assigned to tasks and deals.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {dealRoleTypes.map((role) => (
                  <div
                    key={role.id}
                    className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-xs font-medium"
                  >
                    {role.name}
                    <button
                      onClick={() => handleArchiveRole(role.id)}
                      className="ml-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive p-0.5 transition-colors"
                      title="Archive role"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {dealRoleTypes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No roles yet.</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="New role name..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddRole();
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs shrink-0"
                  onClick={handleAddRole}
                  disabled={addingRole || !newRoleName.trim()}
                >
                  {addingRole ? (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="size-3 mr-1" />
                  )}
                  Add
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                size="sm"
                onClick={handleSaveDealSettings}
                disabled={dealSettingsSaving}
                className="gap-1.5"
              >
                {dealSettingsSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDealSettingsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logic Builder Sheet */}
      <LogicBuilderSheet
        open={logicBuilderOpen}
        onOpenChange={setLogicBuilderOpen}
        filterInputId={logicBuilderInputId}
      />

      {/* AI Extraction Order Sheet */}
      <InputAIOrderSheet
        open={aiOrderOpen}
        onOpenChange={setAiOrderOpen}
        inputId={aiOrderInputId}
        inputLabel={aiOrderInputLabel}
      />

      {/* Archive confirmation dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archive {deleteDialog.type === "category" ? "Category" : "Input"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteDialog.name}&rdquo;
              </span>
              ? This will be archived and can be restored later
              {deleteDialog.type === "category"
                ? " along with all inputs within this category."
                : "."}
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
  categories: InputCategory[],
  inputs: InputField[],
): Record<string, InputField[]> {
  const columns: Record<string, InputField[]> = {};
  for (const cat of categories) {
    columns[colKey(cat.id)] = [];
  }
  for (const input of inputs) {
    const key = colKey(input.category_id);
    if (columns[key]) {
      columns[key].push(input);
    }
  }
  // Sort inputs within each column by display_order
  for (const key of Object.keys(columns)) {
    columns[key].sort((a, b) => a.display_order - b.display_order);
  }
  return columns;
}
