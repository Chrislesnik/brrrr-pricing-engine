"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GripVertical, Loader2, Save, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
import { cn } from "@repo/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface InputCategory {
  id: number;
  category: string;
  display_order: number;
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

type WidthOption = "25" | "50" | "75" | "100";

const WIDTH_OPTIONS: { value: WidthOption; label: string }[] = [
  { value: "25", label: "25%" },
  { value: "50", label: "50%" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
];

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

/* -------------------------------------------------------------------------- */
/*  Row building logic                                                         */
/* -------------------------------------------------------------------------- */

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

function getWidthClass(width: string): string {
  switch (width) {
    case "100": return "w-full";
    case "75": return "w-3/4";
    case "50": return "w-1/2";
    case "25": return "w-1/4";
    default: return "w-1/2";
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function PricingEngineGridLayout() {
  const [categories, setCategories] = useState<InputCategory[]>([]);
  const [inputs, setInputs] = useState<InputField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [canAccess, setCanAccess] = useState(false);

  const dragItem = useRef<{ id: string; fromCatId: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, inputsRes] = await Promise.all([
        fetch("/api/pricing-engine-input-categories"),
        fetch("/api/pricing-engine-inputs"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (inputsRes.ok) setInputs(await inputsRes.json());
    } catch (err) {
      console.error("Failed to fetch layout data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAccessAndFetch() {
      try {
        const res = await fetch("/api/org/settings-access?tab=pricing-engine");
        if (res.ok) {
          const data = await res.json();
          setCanAccess(data.canAccess);
          if (!data.canAccess) { setLoading(false); return; }
        } else {
          setCanAccess(false); setLoading(false); return;
        }
      } catch {
        setCanAccess(false); setLoading(false); return;
      }
      await fetchData();
    }
    checkAccessAndFetch();
  }, [fetchData]);

  const handleWidthChange = (inputId: string, newWidth: WidthOption) => {
    setInputs((prev) => {
      const target = prev.find((inp) => inp.id === inputId);
      if (!target) return prev;

      const siblings = prev.filter(
        (inp) => inp.category_id === target.category_id && inp.layout_row === target.layout_row && inp.id !== inputId
      );

      if (siblings.length === 0) {
        return prev.map((inp) =>
          inp.id === inputId ? { ...inp, layout_width: newWidth } : inp
        );
      }

      const remaining = 100 - Number(newWidth);

      if (siblings.length === 1) {
        const sibWidth = remaining <= 0 ? "50" : String(remaining) as WidthOption;
        const sibId = siblings[0].id;
        return prev.map((inp) => {
          if (inp.id === inputId) return { ...inp, layout_width: newWidth };
          if (inp.id === sibId) return { ...inp, layout_width: sibWidth };
          return inp;
        });
      }

      const perSibling = Math.max(25, Math.floor(remaining / siblings.length));
      const sibIds = new Set(siblings.map((s) => s.id));
      return prev.map((inp) => {
        if (inp.id === inputId) return { ...inp, layout_width: newWidth };
        if (sibIds.has(inp.id)) return { ...inp, layout_width: String(perSibling) };
        return inp;
      });
    });
    setDirty(true);
  };

  const handleMoveToRow = (inputId: string, newRow: number) => {
    setInputs((prev) =>
      prev.map((inp) =>
        inp.id === inputId ? { ...inp, layout_row: newRow } : inp
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
      const res = await fetch("/api/pricing-engine-inputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: layoutPayload }),
      });
      if (res.ok) {
        setDirty(false);
      }
    } catch (err) {
      console.error("Failed to save layout:", err);
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

  const handleSwapRows = (catId: number, rowA: number, rowB: number) => {
    setInputs((prev) =>
      prev.map((inp) => {
        if (inp.category_id !== catId) return inp;
        if (inp.layout_row === rowA) return { ...inp, layout_row: rowB };
        if (inp.layout_row === rowB) return { ...inp, layout_row: rowA };
        return inp;
      })
    );
    setDirty(true);
  };

  const handleDropOnRow = (e: React.DragEvent, targetRow: number, targetCatId: number) => {
    e.preventDefault();
    if (!dragItem.current) return;
    const { id } = dragItem.current;

    setInputs((prev) => {
      const othersInRow = prev.filter(
        (inp) => inp.category_id === targetCatId && inp.layout_row === targetRow && inp.id !== id
      );
      const usedWidth = othersInRow.reduce((sum, inp) => sum + Number(inp.layout_width || 50), 0);
      const remaining = 100 - usedWidth;
      const fitWidth = remaining >= 50 ? "50" : remaining >= 25 ? "25" : "100";
      const autoWidth = remaining <= 0 ? "50" : fitWidth;

      return prev.map((inp) => {
        if (inp.id !== id) return inp;
        return { ...inp, layout_row: targetRow, category_id: targetCatId, layout_width: autoWidth };
      });
    });
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
        return { ...inp, layout_row: newRow, category_id: catId, layout_width: "100" };
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

      {categories.map((cat) => {
        const catInputs = inputs.filter((i) => i.category_id === cat.id);
        const rows = buildRows(catInputs);

        return (
          <div key={cat.id} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {cat.category}
              <span className="ml-2 text-xs font-normal">({catInputs.length} inputs)</span>
            </h3>

            <div className="space-y-1.5">
              {rows.map((row, rowIdx) => {
                const totalWidth = row.items.reduce(
                  (sum, item) => sum + Number(item.layout_width || 50),
                  0
                );
                const isFirst = rowIdx === 0;
                const isLast = rowIdx === rows.length - 1;

                return (
                  <div key={row.rowIndex} className="flex gap-1">
                    <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleSwapRows(cat.id, row.rowIndex, rows[rowIdx - 1].rowIndex)}
                        className={cn(
                          "rounded p-0.5 transition-colors",
                          isFirst
                            ? "text-muted-foreground/20 cursor-not-allowed"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleSwapRows(cat.id, row.rowIndex, rows[rowIdx + 1].rowIndex)}
                        className={cn(
                          "rounded p-0.5 transition-colors",
                          isLast
                            ? "text-muted-foreground/20 cursor-not-allowed"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                    <div
                      className={cn(
                        "flex-1 flex gap-1.5 items-stretch min-h-[3rem] rounded-md border border-dashed p-1 transition-colors",
                        dragOverTarget === `row-${cat.id}-${row.rowIndex}`
                          ? "border-primary/60 bg-primary/5"
                          : "border-border/50 hover:border-border"
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
                        className={cn(
                          "group flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-xs cursor-grab active:cursor-grabbing transition-all shrink-0 overflow-x-auto",
                          getWidthClass(item.layout_width)
                        )}
                      >
                        <GripVertical className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate flex-1 min-w-0">
                          {item.input_label}
                        </span>
                        <Badge
                          className={cn(
                            "pointer-events-none rounded-sm text-[10px] px-1.5 h-5 capitalize shrink-0",
                            TYPE_COLORS[item.input_type] ?? ""
                          )}
                          variant="secondary"
                        >
                          {item.input_type === "calc_currency" ? "Calc $" : item.input_type}
                        </Badge>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {WIDTH_OPTIONS.map((opt) => {
                            const hasSiblings = row.items.length > 1;
                            const disabled = opt.value === "100" && hasSiblings;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => !disabled && handleWidthChange(item.id, opt.value)}
                                disabled={disabled}
                                className={cn(
                                  "px-1.5 py-0.5 text-[10px] rounded transition-colors",
                                  item.layout_width === opt.value
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : disabled
                                      ? "text-muted-foreground/30 cursor-not-allowed"
                                      : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {totalWidth < 100 && (
                      <div className="flex-1 min-w-[60px] rounded-md border border-dashed border-border/30 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/50">
                          {100 - totalWidth}% free
                        </span>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}

              {/* Drop zone for new row */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-md border border-dashed p-2 min-h-[2rem] transition-colors",
                  dragOverTarget === `new-${cat.id}`
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/30 hover:border-border/60 hover:bg-muted/20"
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
                <span className="text-[10px] text-muted-foreground/50">
                  Drop here for new row
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
