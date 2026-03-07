"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GripVertical, Loader2, Save } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
import { cn } from "@repo/lib/cn";

interface InputCategory {
  id: number;
  category: string;
  display_order: number;
  default_open?: boolean;
}

interface InputField {
  id: string;
  category_id: number;
  input_label: string;
  input_type: string;
  display_order: number;
  layout_row: number;
  layout_width: string;
}

type WidthOption = "20" | "40" | "60" | "80" | "100";

const WIDTH_OPTIONS: { value: WidthOption; label: string; cols: number }[] = [
  { value: "20", label: "1 col", cols: 1 },
  { value: "40", label: "2 col", cols: 2 },
  { value: "60", label: "3 col", cols: 3 },
  { value: "80", label: "4 col", cols: 4 },
  { value: "100", label: "5 col", cols: 5 },
];

const TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  dropdown: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  number: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  currency: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  date: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  boolean: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  percentage: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function getColSpan(width: string): string {
  switch (width) {
    case "100": return "col-span-5";
    case "80": return "col-span-4";
    case "60": return "col-span-3";
    case "40": return "col-span-2";
    case "20": default: return "col-span-1";
  }
}

function colsForWidth(width: string): number {
  switch (width) {
    case "100": return 5;
    case "80": return 4;
    case "60": return 3;
    case "40": return 2;
    case "20": default: return 1;
  }
}

interface LayoutRow {
  rowIndex: number;
  items: InputField[];
}

function buildRows(inputs: InputField[]): LayoutRow[] {
  const sorted = [...inputs].sort(
    (a, b) => a.layout_row - b.layout_row || a.display_order - b.display_order
  );

  const rowMap = new Map<number, InputField[]>();
  for (const inp of sorted) {
    const existing = rowMap.get(inp.layout_row) ?? [];
    existing.push(inp);
    rowMap.set(inp.layout_row, existing);
  }

  const rows: LayoutRow[] = [];
  const sortedKeys = [...rowMap.keys()].sort((a, b) => a - b);
  for (const key of sortedKeys) {
    rows.push({ rowIndex: key, items: rowMap.get(key)! });
  }
  return rows;
}

export function DealGridLayout() {
  const [categories, setCategories] = useState<InputCategory[]>([]);
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dragItem = useRef<{ id: string; fromCatId: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, inputsRes] = await Promise.all([
        fetch("/api/input-categories"),
        fetch("/api/inputs"),
      ]);
      if (catsRes.ok) {
        const cats = await catsRes.json();
        setCategories(Array.isArray(cats) ? cats : []);
      }
      if (inputsRes.ok) {
        const inps = await inputsRes.json();
        setInputs(Array.isArray(inps) ? inps : []);
      }
    } catch (err) {
      console.error("Failed to fetch deal layout data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWidthChange = (inputId: string, newWidth: WidthOption) => {
    setInputs((prev) =>
      prev.map((inp) =>
        inp.id === inputId ? { ...inp, layout_width: newWidth } : inp
      )
    );
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const layoutPayload = inputs.map((inp) => ({
        id: inp.id,
        layout_row: inp.layout_row,
        layout_width: inp.layout_width,
        category_id: inp.category_id,
      }));
      const res = await fetch("/api/inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: layoutPayload }),
      });
      if (res.ok) {
        setDirty(false);
      }
    } catch (err) {
      console.error("Failed to save deal layout:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, inputId: string, catId: number) => {
    dragItem.current = { id: inputId, fromCatId: catId };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOverTarget(null);
  };

  const handleDropOnRow = (e: React.DragEvent, targetRow: number, targetCatId: number) => {
    e.preventDefault();
    if (!dragItem.current) return;
    const { id } = dragItem.current;

    setInputs((prev) =>
      prev.map((inp) => {
        if (inp.id !== id) return inp;
        return { ...inp, layout_row: targetRow, category_id: targetCatId };
      })
    );
    setDirty(true);
    dragItem.current = null;
  };

  const handleDropOnNewRow = (e: React.DragEvent, catId: number, afterRow: number) => {
    e.preventDefault();
    if (!dragItem.current) return;
    const { id } = dragItem.current;

    const catInputs = inputs.filter((i) => i.category_id === catId);
    const maxRow = catInputs.length > 0 ? Math.max(...catInputs.map((i) => i.layout_row)) : -1;
    const newRow = Math.max(afterRow + 1, maxRow + 1);

    setInputs((prev) =>
      prev.map((inp) => {
        if (inp.id !== id) return inp;
        return { ...inp, layout_row: newRow, category_id: catId, layout_width: "20" };
      })
    );
    setDirty(true);
    dragItem.current = null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Arrange inputs into rows and set their column widths. Drag inputs to reorder.
        </p>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-1.5" />
          ) : (
            <Save className="size-4 mr-1.5" />
          )}
          {dirty ? "Save Layout" : "Saved"}
        </Button>
      </div>

      {/* Width selector for selected input */}
      {selectedId && (() => {
        const sel = inputs.find((i) => i.id === selectedId);
        if (!sel) return null;
        return (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2">
            <span className="text-sm font-medium truncate">{sel.input_label}</span>
            <div className="flex items-center gap-1 ml-auto">
              {WIDTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleWidthChange(sel.id, opt.value)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md transition-colors",
                    sel.layout_width === opt.value
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted border"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-muted-foreground hover:text-foreground ml-2"
            >
              Done
            </button>
          </div>
        );
      })()}

      {categories.map((cat) => {
        const catInputs = inputs.filter((i) => i.category_id === cat.id);
        const rows = buildRows(catInputs);

        return (
          <div key={cat.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {cat.category}
              </h3>
              <span className="text-xs text-muted-foreground/60">
                {catInputs.length} inputs
              </span>
            </div>

            <div className="space-y-1">
              {rows.map((row) => {
                const usedCols = row.items.reduce((sum, item) => sum + colsForWidth(item.layout_width), 0);

                return (
                  <div
                    key={row.rowIndex}
                    className={cn(
                      "grid grid-cols-5 gap-2 rounded-lg border border-dashed p-1.5 min-h-[3rem] transition-colors",
                      dragOverTarget === `row-${cat.id}-${row.rowIndex}`
                        ? "border-primary/60 bg-primary/5"
                        : "border-border/40 hover:border-border"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOverTarget(`row-${cat.id}-${row.rowIndex}`);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      setDragOverTarget(null);
                      handleDropOnRow(e, row.rowIndex, cat.id);
                    }}
                  >
                    {row.items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id, cat.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-2 shadow-xs cursor-grab active:cursor-grabbing transition-all min-w-0",
                          getColSpan(item.layout_width),
                          selectedId === item.id && "ring-2 ring-primary"
                        )}
                      >
                        <GripVertical className="size-3 text-muted-foreground/50 shrink-0" />
                        <span className="text-xs font-medium truncate flex-1 min-w-0">
                          {item.input_label}
                        </span>
                        <Badge
                          className={cn(
                            "pointer-events-none rounded-sm text-[9px] px-1 h-4 capitalize shrink-0",
                            TYPE_COLORS[item.input_type] ?? ""
                          )}
                          variant="secondary"
                        >
                          {item.input_type}
                        </Badge>
                      </div>
                    ))}

                    {usedCols < 5 && (
                      <div className={cn(
                        "rounded-md border border-dashed border-border/30 flex items-center justify-center",
                        `col-span-${5 - usedCols}`
                      )}>
                        <span className="text-[10px] text-muted-foreground/40">
                          {5 - usedCols} col{5 - usedCols > 1 ? "s" : ""} free
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Drop zone for new row */}
              <div
                className={cn(
                  "grid grid-cols-5 gap-2 rounded-lg border border-dashed p-1.5 min-h-[2.5rem] transition-colors",
                  dragOverTarget === `new-${cat.id}`
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/20 hover:border-border/50"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOverTarget(`new-${cat.id}`);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverTarget(null);
                  }
                }}
                onDrop={(e) => {
                  setDragOverTarget(null);
                  const maxRow = rows.length > 0 ? rows[rows.length - 1].rowIndex : -1;
                  handleDropOnNewRow(e, cat.id, maxRow);
                }}
              >
                <div className="col-span-5 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/40">
                    Drop here for new row
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
