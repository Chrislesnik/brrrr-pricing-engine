"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  GripVertical,
  Pencil,
  Plus,
  Star,
  Archive,
  Loader2,
  X,
  Link2,
  Unlink,
  Workflow,
  PanelTopOpen,
  PanelTopClose,
  Settings,
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
import { ColumnExpressionInput } from "@/components/column-expression-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PELogicBuilderSheet } from "./pe-logic-builder-sheet";
import { TableConfigSheet } from "./table-config-sheet";
import type { TableConfig } from "@/types/table-config";
import { NumberConstraintsSheet } from "./number-constraints-sheet";
import type { NumberConstraintsConfig } from "@/types/number-constraints";
import { NUMERIC_INPUT_TYPES } from "@/types/number-constraints";
import { SectionButtonsSheet } from "./section-buttons-sheet";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputCategory {
  id: number;
  category: string;
  display_order: number;
  created_at: string;
  default_open: boolean;
  config?: Record<string, unknown> | null;
}

interface InputField {
  id: string;
  category_id: number;
  category: string;
  input_label: string;
  input_code: string;
  input_type: string;
  dropdown_options: string[] | null;
  config: Record<string, unknown>;
  starred: boolean;
  display_order: number;
  created_at: string;
  linked_table?: string | null;
  linked_column?: string | null;
  tooltip?: string | null;
  placeholder?: string | null;
  default_value?: string | null;
}

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
  { value: "table", label: "Table" },
  { value: "tags", label: "Tags / Multi-Select" },
  { value: "calc_currency", label: "Calc Currency" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  dropdown: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  number: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  currency: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  date: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  boolean: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  percentage: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  table: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  tags: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  calc_currency: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

const TYPES_WITH_OPTIONS = new Set(["dropdown", "tags"]);

const BOOLEAN_DISPLAY_TYPES = [
  { value: "dropdown", label: "Dropdown" },
  { value: "switch", label: "Switch" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
] as const;

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function PricingEngineLayoutSettings() {
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

  // Tooltip / placeholder / default value state
  const [newTooltip, setNewTooltip] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [newDefaultValue, setNewDefaultValue] = useState("");

  // Boolean display type state
  const [newBooleanDisplay, setNewBooleanDisplay] = useState("dropdown");

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

  // Logic Builder sheet state
  const [logicBuilderOpen, setLogicBuilderOpen] = useState(false);
  const [logicBuilderInputId, setLogicBuilderInputId] = useState<string | null>(null);

  // Table config sheet state
  const [tableConfigOpen, setTableConfigOpen] = useState(false);
  const [tableConfigInputId, setTableConfigInputId] = useState<string | null>(null);
  const [pendingTableConfig, setPendingTableConfig] = useState<TableConfig | null>(null);

  // Number constraints sheet state
  const [numberConstraintsOpen, setNumberConstraintsOpen] = useState(false);
  const [numberConstraintsInputId, setNumberConstraintsInputId] = useState<string | null>(null);
  const [pendingNumberConfig, setPendingNumberConfig] = useState<NumberConstraintsConfig | null>(null);

  // Section buttons sheet state
  const [sectionButtonsOpen, setSectionButtonsOpen] = useState(false);
  const [sectionButtonsCategoryId, setSectionButtonsCategoryId] = useState<number | null>(null);

  // Fetch linkable tables
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

  // When a linked table is selected, set input type to "dropdown"
  useEffect(() => {
    if (newLinkedTable) {
      setNewInputType("dropdown");
    }
  }, [newLinkedTable]);

  const dragTagIdx = useRef<number | null>(null);

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
        fetch("/api/pricing-engine-input-categories"),
        fetch("/api/pricing-engine-inputs"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (inputsRes.ok) setInputs(await inputsRes.json());
    } catch (err) {
      console.error("Failed to fetch pricing engine layout data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAccessAndFetch() {
      try {
        const accessResponse = await fetch("/api/org/settings-access?tab=pricing-engine");
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

  const kanbanColumns = buildKanbanColumns(categories, inputs);
  const categoryMap = new Map(categories.map((c) => [colKey(c.id), c]));

  /* ---- Category CRUD ---- */

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const res = await fetch("/api/pricing-engine-input-categories", {
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
      await fetch("/api/pricing-engine-input-categories", {
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
      const res = await fetch("/api/pricing-engine-input-categories", {
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
      const res = await fetch("/api/pricing-engine-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          input_label: newInputLabel.trim(),
          input_type: newInputType,
          dropdown_options: TYPES_WITH_OPTIONS.has(newInputType) ? newDropdownOptions : null,
          config: newInputType === "table" && pendingTableConfig
            ? pendingTableConfig
            : NUMERIC_INPUT_TYPES.has(newInputType) && pendingNumberConfig
              ? pendingNumberConfig
              : newInputType === "boolean"
                ? { boolean_display: newBooleanDisplay }
                : undefined,
          linked_table: newLinkedTable || null,
          linked_column: newLinkedColumn || null,
          tooltip: newTooltip.trim() || null,
          placeholder: newPlaceholder.trim() || null,
          default_value: newDefaultValue.trim() || null,
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

  const handleDeleteInput = async (inputId: string) => {
    try {
      await fetch("/api/pricing-engine-inputs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inputId }),
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
      const configPayload = newInputType === "table"
        ? (pendingTableConfig ?? (input.config as unknown as TableConfig | undefined) ?? undefined)
        : NUMERIC_INPUT_TYPES.has(newInputType)
          ? (pendingNumberConfig ?? (input.config as unknown as NumberConstraintsConfig | undefined) ?? undefined)
          : newInputType === "boolean"
            ? { ...(input.config ?? {}), boolean_display: newBooleanDisplay }
            : undefined;
      const res = await fetch("/api/pricing-engine-inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: input.id,
          input_label: newInputLabel.trim(),
          input_type: newInputType,
          dropdown_options: TYPES_WITH_OPTIONS.has(newInputType) ? newDropdownOptions : null,
          config: configPayload,
          linked_table: newLinkedTable || null,
          linked_column: newLinkedColumn || null,
          tooltip: newTooltip.trim() || null,
          placeholder: newPlaceholder.trim() || null,
          default_value: newDefaultValue.trim() || null,
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
      const res = await fetch("/api/pricing-engine-inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: input.id, starred: !input.starred }),
      });
      if (res.ok) {
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
    setNewPlaceholder("");
    setNewDefaultValue("");
    setNewBooleanDisplay("dropdown");
    setPendingTableConfig(null);
    setPendingNumberConfig(null);
  };

  /* ---- Drag and drop handlers ---- */

  const handleKanbanChange = (newColumns: Record<string, InputField[]>) => {
    const newColumnKeys = Object.keys(newColumns);
    const oldColumnKeys = categories.map((c) => colKey(c.id));

    const columnOrderChanged =
      newColumnKeys.length === oldColumnKeys.length &&
      newColumnKeys.some((key, i) => key !== oldColumnKeys[i]);

    if (columnOrderChanged) {
      const catById = new Map(categories.map((c) => [colKey(c.id), c]));
      const reorderedCategories = newColumnKeys
        .map((key) => catById.get(key)!)
        .filter(Boolean);
      setCategories(reorderedCategories);

      const catReorder = reorderedCategories.map((c, i) => ({
        id: c.id,
        display_order: i,
      }));
      fetch("/api/pricing-engine-input-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: catReorder }),
      }).catch(console.error);
    }

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

    if (reorderPayload.length > 0 && !columnOrderChanged) {
      fetch("/api/pricing-engine-inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: reorderPayload }),
      }).catch(console.error);
    }
  };

  /* ---- Shared form fragment for dropdown/tags options ---- */

  const optionsNeedSetting = TYPES_WITH_OPTIONS.has(newInputType) && !newLinkedTable;

  const renderOptionsEditor = () => {
    if (!optionsNeedSetting) return null;
    return (
      <div className="space-y-1.5 p-2">
        <Label className="text-xs">
          {newInputType === "tags" ? "Tag Options" : "Dropdown Options"}
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
    );
  };

  const renderDatabaseLink = () => (
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
  );

  const renderDefaultValueInput = () => {
    if (newInputType === "dropdown" || newInputType === "tags") {
      const opts = newDropdownOptions;
      if (opts.length === 0) return null;
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Default Value (optional)</Label>
          <Select
            value={newDefaultValue || undefined}
            onValueChange={setNewDefaultValue}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {opts.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {newDefaultValue && (
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-destructive"
              onClick={() => setNewDefaultValue("")}
            >
              Clear default
            </button>
          )}
        </div>
      );
    }

    if (newInputType === "boolean") {
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Default Value (optional)</Label>
          <Select
            value={newDefaultValue || undefined}
            onValueChange={setNewDefaultValue}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
          {newDefaultValue && (
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-destructive"
              onClick={() => setNewDefaultValue("")}
            >
              Clear default
            </button>
          )}
        </div>
      );
    }

    if (newInputType === "date") {
      const match = newDefaultValue.match(/^([+-])(\d+)([dmy])$/);
      const sign = match ? match[1] : "+";
      const amount = match ? match[2] : "";
      const unit = match ? match[3] : "d";

      const updateDateDefault = (s: string, a: string, u: string) => {
        if (!a || a === "0") {
          setNewDefaultValue(`${s}0${u}`);
          return;
        }
        setNewDefaultValue(`${s}${a}${u}`);
      };

      const unitLabels: Record<string, string> = { d: "Days", m: "Months", y: "Years" };

      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Default Value (optional)</Label>
          <p className="text-[10px] text-muted-foreground">Relative to today</p>
          <div className="flex items-center gap-1.5">
            <Select
              value={sign}
              onValueChange={(s) => updateDateDefault(s, amount || "0", unit)}
            >
              <SelectTrigger className="h-8 text-sm w-16 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="-">-</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={amount}
              onChange={(e) => updateDateDefault(sign, e.target.value, unit)}
              className="h-8 text-sm w-20 shrink-0"
            />
            <Select
              value={unit}
              onValueChange={(u) => updateDateDefault(sign, amount || "0", u)}
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="d">Days</SelectItem>
                <SelectItem value="m">Months</SelectItem>
                <SelectItem value="y">Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newDefaultValue && (
            <p className="text-[10px] text-muted-foreground">
              Today {sign === "+" ? "+" : "-"} {amount || "0"} {unitLabels[unit] ?? unit}
            </p>
          )}
          {newDefaultValue && (
            <button
              type="button"
              className="text-[10px] text-muted-foreground hover:text-destructive"
              onClick={() => setNewDefaultValue("")}
            >
              Clear default
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <Label className="text-xs">Default Value (optional)</Label>
        <Input
          placeholder="Pre-populated value for new scenarios"
          value={newDefaultValue}
          onChange={(e) => setNewDefaultValue(e.target.value)}
          className="h-8 text-sm"
          type={newInputType === "number" || newInputType === "currency" || newInputType === "percentage" ? "number" : "text"}
          inputMode={newInputType === "number" || newInputType === "currency" || newInputType === "percentage" ? "decimal" : undefined}
        />
      </div>
    );
  };

  const isFormValid =
    newInputLabel.trim() &&
    newInputType &&
    !(TYPES_WITH_OPTIONS.has(newInputType) && !newLinkedTable && newDropdownOptions.length === 0);

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
          You don&apos;t have permission to manage the pricing engine layout.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Category */}
      <div>
        {showCategoryInput ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Section name..."
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
              Add Section
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
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">No sections yet. Add a section to get started.</p>
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
                                    await fetch("/api/pricing-engine-input-categories", {
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
                              {cat.default_open ? "Default: Open on new loans" : "Default: Closed on new loans"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setSectionButtonsCategoryId(cat.id);
                                  setSectionButtonsOpen(true);
                                }}
                              >
                                <Settings className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Section Buttons</TooltipContent>
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

                          {newInputType === "table" && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Table Configuration</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs"
                                onClick={() => {
                                  setTableConfigInputId(input.id);
                                  setTableConfigOpen(true);
                                }}
                              >
                                Configure Columns
                                {pendingTableConfig?.columns?.length
                                  ? ` (${pendingTableConfig.columns.length} cols)`
                                  : (input.config as Record<string, unknown>)?.columns
                                    ? ` (${(((input.config as Record<string, unknown>).columns) as unknown[]).length} cols)`
                                    : ""}
                              </Button>
                            </div>
                          )}

                          {NUMERIC_INPUT_TYPES.has(newInputType) && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Min / Max Constraints</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs"
                                onClick={() => {
                                  setNumberConstraintsInputId(input.id);
                                  setNumberConstraintsOpen(true);
                                }}
                              >
                                Configure Min / Max
                                {(() => {
                                  const nc = pendingNumberConfig ?? (input.config as Record<string, unknown> | undefined);
                                  if (!nc) return "";
                                  const parts: string[] = [];
                                  if (nc.min != null) parts.push(`min:${nc.min}`);
                                  if (nc.max != null) parts.push(`max:${nc.max}`);
                                  const cc = nc.conditional_constraints;
                                  if (Array.isArray(cc) && cc.length > 0) parts.push(`${cc.length} rules`);
                                  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
                                })()}
                              </Button>
                            </div>
                          )}

                          {newInputType !== "table" && renderDatabaseLink()}
                          {renderOptionsEditor()}

                          <div className="space-y-1.5">
                            <Label className="text-xs">Placeholder (optional)</Label>
                            <Input
                              placeholder="e.g. 0.00, Select..., 123 Main St"
                              value={newPlaceholder}
                              onChange={(e) => setNewPlaceholder(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>

                          {renderDefaultValueInput()}

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
                              disabled={savingInput || !isFormValid}
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
                              {input.input_type === "calc_currency" ? "Calc $" : input.input_type}
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
                            {input.config && !!(input.config as Record<string, unknown>).group && (
                              <Badge
                                className="pointer-events-none rounded-sm text-[10px] px-1.5 h-5 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                                variant="secondary"
                              >
                                {String((input.config as Record<string, unknown>).group)}
                              </Badge>
                            )}
                            {input.input_type === "table" && Array.isArray((input.config as Record<string, unknown>)?.columns) && (
                              <Badge
                                className="pointer-events-none rounded-sm text-[10px] px-1.5 h-5 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                                variant="secondary"
                              >
                                {((input.config as Record<string, unknown>).columns as unknown[]).length} cols
                              </Badge>
                            )}
                            {NUMERIC_INPUT_TYPES.has(input.input_type) && input.config && ((input.config as Record<string, unknown>).min != null || (input.config as Record<string, unknown>).max != null || Array.isArray((input.config as Record<string, unknown>).conditional_constraints)) && (
                              <Badge
                                className="pointer-events-none rounded-sm text-[10px] px-1.5 h-5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                variant="secondary"
                              >
                                {[
                                  (input.config as Record<string, unknown>).min != null ? `min:${(input.config as Record<string, unknown>).min}` : "",
                                  (input.config as Record<string, unknown>).max != null ? `max:${(input.config as Record<string, unknown>).max}` : "",
                                ].filter(Boolean).join(" ") || "constrained"}
                              </Badge>
                            )}
                            <div className="ml-auto flex items-center gap-1 shrink-0">
                              {TYPES_WITH_OPTIONS.has(input.input_type) &&
                                input.dropdown_options &&
                                input.dropdown_options.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                                    ({input.dropdown_options.length} opts)
                                  </span>
                                )}
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
                                  setNewPlaceholder(input.placeholder ?? "");
                                  setNewDefaultValue(input.default_value ?? "");
                                  if (input.input_type === "table" && input.config) {
                                    const tc = input.config as Record<string, unknown>;
                                    if (tc.columns) setPendingTableConfig(tc as unknown as TableConfig);
                                  }
                                  if (NUMERIC_INPUT_TYPES.has(input.input_type) && input.config) {
                                    const nc = input.config as Record<string, unknown>;
                                    if (nc.min !== undefined || nc.max !== undefined || nc.conditional_constraints) {
                                      setPendingNumberConfig(nc as unknown as NumberConstraintsConfig);
                                    }
                                  }
                                  if (input.input_type === "boolean" && input.config) {
                                    const bc = input.config as Record<string, unknown>;
                                    setNewBooleanDisplay((bc.boolean_display as string) ?? "dropdown");
                                  }
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

                      {newInputType === "table" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Table Configuration</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                              setTableConfigInputId(null);
                              setTableConfigOpen(true);
                            }}
                          >
                            Configure Columns
                            {pendingTableConfig?.columns?.length
                              ? ` (${pendingTableConfig.columns.length} cols)`
                              : ""}
                          </Button>
                        </div>
                      )}

                      {NUMERIC_INPUT_TYPES.has(newInputType) && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Min / Max Constraints</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                              setNumberConstraintsInputId(null);
                              setNumberConstraintsOpen(true);
                            }}
                          >
                            Configure Min / Max
                            {(() => {
                              const nc = pendingNumberConfig;
                              if (!nc) return "";
                              const parts: string[] = [];
                              if (nc.min != null) parts.push(`min:${nc.min}`);
                              if (nc.max != null) parts.push(`max:${nc.max}`);
                              if (nc.conditional_constraints?.length) parts.push(`${nc.conditional_constraints.length} rules`);
                              return parts.length > 0 ? ` (${parts.join(", ")})` : "";
                            })()}
                          </Button>
                        </div>
                      )}

                      {newInputType !== "table" && renderDatabaseLink()}
                      {renderOptionsEditor()}

                      <div className="space-y-1.5">
                        <Label className="text-xs">Placeholder (optional)</Label>
                        <Input
                          placeholder="e.g. 0.00, Select..., 123 Main St"
                          value={newPlaceholder}
                          onChange={(e) => setNewPlaceholder(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      {renderDefaultValueInput()}

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
                          disabled={savingInput || !isFormValid}
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

      {/* Logic Builder Sheet */}
      <PELogicBuilderSheet
        open={logicBuilderOpen}
        onOpenChange={setLogicBuilderOpen}
        filterInputId={logicBuilderInputId}
      />

      {/* Table Config Sheet */}
      <TableConfigSheet
        open={tableConfigOpen}
        onOpenChange={setTableConfigOpen}
        inputLabel={
          tableConfigInputId
            ? inputs.find((i) => i.id === tableConfigInputId)?.input_label ?? "Table"
            : newInputLabel || "Table"
        }
        initialConfig={
          pendingTableConfig ??
          (tableConfigInputId
            ? (() => {
                const inp = inputs.find((i) => i.id === tableConfigInputId);
                const c = inp?.config as Record<string, unknown> | undefined;
                return c?.columns ? (c as unknown as TableConfig) : null;
              })()
            : null)
        }
        availableInputs={inputs.map((i) => ({
          input_code: i.input_code,
          input_label: i.input_label,
          input_type: i.input_type,
        }))}
        onSave={(cfg) => {
          setPendingTableConfig(cfg);
          if (tableConfigInputId) {
            setInputs((prev) =>
              prev.map((inp) =>
                inp.id === tableConfigInputId ? { ...inp, config: cfg as unknown as Record<string, unknown> } : inp,
              ),
            );
            fetch("/api/pricing-engine-inputs", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: tableConfigInputId, config: cfg }),
            }).then(() => fetchData()).catch(console.error);
          }
        }}
      />

      {/* Number Constraints Sheet */}
      <NumberConstraintsSheet
        open={numberConstraintsOpen}
        onOpenChange={setNumberConstraintsOpen}
        inputLabel={
          numberConstraintsInputId
            ? inputs.find((i) => i.id === numberConstraintsInputId)?.input_label ?? "Input"
            : newInputLabel || "Input"
        }
        initialConfig={
          pendingNumberConfig ??
          (numberConstraintsInputId
            ? (() => {
                const inp = inputs.find((i) => i.id === numberConstraintsInputId);
                const c = inp?.config as Record<string, unknown> | undefined;
                return c && (c.min !== undefined || c.max !== undefined || c.conditional_constraints)
                  ? (c as unknown as NumberConstraintsConfig)
                  : null;
              })()
            : null)
        }
        availableInputs={inputs.map((i) => ({
          id: i.id,
          input_code: i.input_code,
          input_label: i.input_label,
          input_type: i.input_type,
          dropdown_options: i.dropdown_options,
        }))}
        onSave={(cfg) => {
          setPendingNumberConfig(cfg);
          if (numberConstraintsInputId) {
            setInputs((prev) =>
              prev.map((inp) =>
                inp.id === numberConstraintsInputId
                  ? { ...inp, config: cfg as unknown as Record<string, unknown> }
                  : inp,
              ),
            );
            fetch("/api/pricing-engine-inputs", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: numberConstraintsInputId, config: cfg }),
            }).then(() => fetchData()).catch(console.error);
          }
        }}
      />

      {/* Section Buttons Sheet */}
      <SectionButtonsSheet
        open={sectionButtonsOpen}
        onOpenChange={setSectionButtonsOpen}
        categoryId={sectionButtonsCategoryId}
        sectionName={
          sectionButtonsCategoryId
            ? categories.find((c) => c.id === sectionButtonsCategoryId)?.category ?? "Section"
            : "Section"
        }
      />

      {/* Archive confirmation dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archive {deleteDialog.type === "category" ? "Section" : "Input"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteDialog.name}&rdquo;
              </span>
              ? This will be archived and can be restored later
              {deleteDialog.type === "category"
                ? " along with all inputs within this section."
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
  for (const key of Object.keys(columns)) {
    columns[key].sort((a, b) => a.display_order - b.display_order);
  }
  return columns;
}
