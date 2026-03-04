"use client";

import { useState, useEffect, useRef } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
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
import { Switch } from "@/components/ui/switch";
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
  getTagVariant,
} from "@/components/ui/tags-input";
import {
  type TableConfig,
  type TableColumnDef,
  TABLE_COLUMN_TYPES,
  generateColumnKey,
} from "@/types/table-config";

interface AvailableInput {
  input_code: string;
  input_label: string;
  input_type: string;
}

interface TableConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputLabel: string;
  initialConfig: TableConfig | null;
  availableInputs: AvailableInput[];
  onSave: (config: TableConfig) => void;
}

const TYPES_WITH_OPTIONS = new Set(["toggle", "dropdown"]);

function emptyConfig(): TableConfig {
  return {
    row_source: { type: "fixed", count: 3 },
    row_label_template: "#{{n}}",
    columns: [],
  };
}

function emptyColumn(): TableColumnDef {
  return { key: "", label: "", type: "text" };
}

const COL_TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  currency: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  number: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  percentage: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  toggle: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  dropdown: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  readonly: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

export function TableConfigSheet({
  open,
  onOpenChange,
  inputLabel,
  initialConfig,
  availableInputs,
  onSave,
}: TableConfigSheetProps) {
  const [config, setConfig] = useState<TableConfig>(() => initialConfig ?? emptyConfig());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);
  const prevOpenRef = useRef(false);

  // Sync config from initialConfig whenever the sheet opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setConfig(initialConfig ?? emptyConfig());
      setExpandedIdx(null);
    }
    prevOpenRef.current = open;
  }, [open, initialConfig]);

  const updateColumn = (idx: number, patch: Partial<TableColumnDef>) => {
    setConfig((prev) => {
      const cols = [...prev.columns];
      cols[idx] = { ...cols[idx], ...patch };
      return { ...prev, columns: cols };
    });
  };

  const removeColumn = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== idx),
    }));
    if (expandedIdx === idx) setExpandedIdx(null);
    else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
  };

  const addColumn = () => {
    setConfig((prev) => ({
      ...prev,
      columns: [...prev.columns, emptyColumn()],
    }));
    setExpandedIdx(config.columns.length);
  };

  const moveColumn = (from: number, to: number) => {
    if (from === to) return;
    setConfig((prev) => {
      const cols = [...prev.columns];
      const [moved] = cols.splice(from, 1);
      cols.splice(to, 0, moved);
      return { ...prev, columns: cols };
    });
    if (expandedIdx === from) setExpandedIdx(to);
    else if (expandedIdx !== null) {
      if (from < expandedIdx && to >= expandedIdx) setExpandedIdx(expandedIdx - 1);
      else if (from > expandedIdx && to <= expandedIdx) setExpandedIdx(expandedIdx + 1);
    }
  };

  const handleSave = () => {
    const cleaned: TableConfig = {
      ...config,
      columns: config.columns
        .filter((c) => c.label.trim())
        .map((c) => ({
          ...c,
          key: c.key || generateColumnKey(c.label),
          label: c.label.trim(),
        })),
    };
    onSave(cleaned);
    onOpenChange(false);
  };

  const rowSourceType = config.row_source.type;
  const linkableInputs = availableInputs.filter(
    (inp) => inp.input_type === "number" || inp.input_type === "dropdown",
  );

  const hasValidColumns = config.columns.some((c) => c.label.trim());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Configure Table &mdash; {inputLabel}</SheetTitle>
          <SheetDescription>
            Define columns, row source, and cell types for this table input.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
          {/* Row Source */}
          <section className="space-y-3">
            <Label className="text-sm font-semibold">Row Source</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                  rowSourceType === "fixed"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    row_source: { type: "fixed", count: 3 },
                  }))
                }
              >
                Fixed Count
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                  rowSourceType === "input"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    row_source: {
                      type: "input",
                      input_code: linkableInputs[0]?.input_code ?? "",
                    },
                  }))
                }
              >
                Linked to Input
              </button>
            </div>

            {rowSourceType === "fixed" && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Number of rows</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={
                    config.row_source.type === "fixed"
                      ? config.row_source.count
                      : 3
                  }
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(50, Number(e.target.value) || 1));
                    setConfig((prev) => ({
                      ...prev,
                      row_source: { type: "fixed", count: n },
                    }));
                  }}
                  className="h-8 w-24 text-sm"
                />
              </div>
            )}

            {rowSourceType === "input" && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Input that controls row count
                </Label>
                {linkableInputs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No number or dropdown inputs available to link.
                  </p>
                ) : (
                  <Select
                    value={
                      config.row_source.type === "input"
                        ? config.row_source.input_code
                        : undefined
                    }
                    onValueChange={(code) =>
                      setConfig((prev) => ({
                        ...prev,
                        row_source: { type: "input", input_code: code },
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select input..." />
                    </SelectTrigger>
                    <SelectContent>
                      {linkableInputs.map((inp) => (
                        <SelectItem key={inp.input_code} value={inp.input_code}>
                          {inp.input_label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Row label template (optional)
              </Label>
              <Input
                value={config.row_label_template ?? ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    row_label_template: e.target.value || undefined,
                  }))
                }
                placeholder='e.g. Unit #{{n}}, Property {{n}}'
                className="h-8 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                {"Use {{n}} for 1-based row number. Leave empty for no row label column."}
              </p>
            </div>
          </section>

          {/* Columns */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Columns{" "}
                {config.columns.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({config.columns.length})
                  </span>
                )}
              </Label>
            </div>

            {config.columns.length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                No columns yet. Add a column to get started.
              </div>
            )}

            <div className="space-y-2">
              {config.columns.map((col, idx) => {
                const isExpanded = expandedIdx === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-md border bg-card"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIdx.current !== null && dragIdx.current !== idx) {
                        moveColumn(dragIdx.current, idx);
                      }
                      dragIdx.current = null;
                    }}
                  >
                    {/* Column header row */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span
                        draggable
                        onDragStart={(e) => {
                          dragIdx.current = idx;
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          dragIdx.current = null;
                        }}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground"
                      >
                        <GripVertical className="size-3.5" />
                      </span>

                      <button
                        type="button"
                        className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium truncate">
                          {col.label || "(unnamed)"}
                        </span>
                        <Badge
                          className={`pointer-events-none rounded-sm text-[10px] px-1.5 h-5 capitalize ${
                            COL_TYPE_COLORS[col.type] ?? ""
                          }`}
                          variant="secondary"
                        >
                          {col.type}
                        </Badge>
                        {col.required && (
                          <span className="text-red-500 text-[10px]">*</span>
                        )}
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeColumn(idx)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>

                    {/* Expanded config */}
                    {isExpanded && (
                      <div className="border-t px-3 py-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={col.label}
                              onChange={(e) => {
                                const label = e.target.value;
                                const patch: Partial<TableColumnDef> = { label };
                                if (!col.key || col.key === generateColumnKey(col.label)) {
                                  patch.key = generateColumnKey(label);
                                }
                                updateColumn(idx, patch);
                              }}
                              placeholder="Column name"
                              className="h-8 text-sm"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Key</Label>
                            <Input
                              value={col.key}
                              onChange={(e) =>
                                updateColumn(idx, {
                                  key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                                })
                              }
                              placeholder="data_key"
                              className="h-8 font-mono text-xs md:text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={col.type}
                              onValueChange={(v) =>
                                updateColumn(idx, {
                                  type: v as TableColumnDef["type"],
                                  options:
                                    v === "toggle"
                                      ? ["Yes", "No"]
                                      : v === "dropdown"
                                        ? col.options ?? []
                                        : undefined,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TABLE_COLUMN_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Width (px, optional)</Label>
                            <Input
                              type="number"
                              min={40}
                              max={500}
                              value={col.width ?? ""}
                              onChange={(e) =>
                                updateColumn(idx, {
                                  width: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                              placeholder="auto"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!!col.required}
                              onCheckedChange={(v) => updateColumn(idx, { required: v })}
                            />
                            <Label className="text-xs">Required</Label>
                          </div>
                        </div>

                        {col.type !== "toggle" && col.type !== "readonly" && (
                          <div className="space-y-1">
                            <Label className="text-xs">Placeholder (optional)</Label>
                            <Input
                              value={col.placeholder ?? ""}
                              onChange={(e) =>
                                updateColumn(idx, { placeholder: e.target.value || undefined })
                              }
                              placeholder="e.g. $ 0.00"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}

                        {TYPES_WITH_OPTIONS.has(col.type) && (
                          <div className="space-y-1">
                            <Label className="text-xs">
                              Options
                              {(col.options?.length ?? 0) > 0 && (
                                <span className="ml-1 text-muted-foreground">
                                  ({col.options!.length})
                                </span>
                              )}
                            </Label>
                            <OptionsEditor
                              options={col.options ?? []}
                              onChange={(opts) => updateColumn(idx, { options: opts })}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addColumn}
            >
              <Plus className="size-3.5 mr-1.5" />
              Add Column
            </Button>
          </section>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasValidColumns}>
            Save Configuration
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  return (
    <TagsInput
      value={options}
      onValueChange={onChange}
      className="w-full"
    >
      <TagsInputList className="min-h-9 px-2 py-1 flex-wrap">
        {options.map((opt, idx) => (
          <TagsInputItem
            key={`${opt}-${idx}`}
            value={opt}
            variant={getTagVariant(opt)}
            className="text-xs px-1.5 py-0.5"
          >
            {opt}
          </TagsInputItem>
        ))}
        <TagsInputInput
          placeholder="Type and press Enter..."
          className="text-sm min-w-[120px]"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputVal.trim()) {
              e.preventDefault();
              onChange([...options, inputVal.trim()]);
              setInputVal("");
            }
          }}
        />
      </TagsInputList>
    </TagsInput>
  );
}
