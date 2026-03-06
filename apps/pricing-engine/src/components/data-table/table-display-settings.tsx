"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, Kanban, ArrowUpDown } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import { cn } from "@repo/lib/cn";
import type { Table } from "@tanstack/react-table";

interface GroupOption {
  value: string;
  label: string;
}

interface TableDisplaySettingsProps<TData> {
  table: Table<TData>;
  formatColumnName: (columnId: string) => string;
  groupBy?: string;
  onSetGroupBy?: (v: string) => void;
  groupOptions?: GroupOption[];
  subGroupBy?: string;
  onSetSubGroupBy?: (v: string) => void;
  subGroupOptions?: GroupOption[];
}

const displaySelectCls =
  "h-7 w-auto min-w-0 rounded-md border bg-muted/60 px-2 text-xs [&>svg]:h-3 [&>svg]:w-3 gap-1";

export function TableDisplaySettings<TData>({
  table,
  formatColumnName,
  groupBy,
  onSetGroupBy,
  groupOptions,
  subGroupBy,
  onSetSubGroupBy,
  subGroupOptions,
}: TableDisplaySettingsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const [internalGroupBy, setInternalGroupBy] = React.useState("none");
  const [internalSubGroupBy, setInternalSubGroupBy] = React.useState("none");

  const hasExternalGrouping = !!(onSetGroupBy && groupOptions);
  const hasExternalSubGrouping = !!(onSetSubGroupBy && subGroupOptions);

  const columnGroupOptions = React.useMemo<GroupOption[]>(
    () => [
      { value: "none", label: "None" },
      ...table
        .getAllColumns()
        .filter((col) => col.getCanHide())
        .map((col) => ({ value: col.id, label: formatColumnName(col.id) })),
    ],
    [table, formatColumnName]
  );

  const effectiveGroupBy = hasExternalGrouping ? groupBy : internalGroupBy;
  const effectiveSetGroupBy = hasExternalGrouping ? onSetGroupBy! : setInternalGroupBy;
  const effectiveGroupOptions = hasExternalGrouping ? groupOptions! : columnGroupOptions;

  const effectiveSubGroupBy = hasExternalSubGrouping ? subGroupBy : internalSubGroupBy;
  const effectiveSetSubGroupBy = hasExternalSubGrouping ? onSetSubGroupBy! : setInternalSubGroupBy;
  const effectiveSubGroupOptions = hasExternalSubGrouping ? subGroupOptions! : columnGroupOptions;

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popRef.current?.contains(target) ||
        btnRef.current?.contains(target) ||
        (target instanceof Element &&
          (target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("[role='listbox']") ||
            target.closest("[role='option']")))
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  React.useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popoverWidth = 300;
      const rightOverflow = rect.left + popoverWidth - window.innerWidth;
      const left = rightOverflow > 0 ? rect.left - rightOverflow - 8 : rect.left;
      setPos({ top: rect.bottom + 4, left });
    }
  }, [open]);

  const toggleableColumns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter((col) => col.getCanHide()),
    [table]
  );

  const sorting = table.getState().sorting;
  const currentSortId = sorting[0]?.id ?? "";
  const currentSortAsc = sorting[0]?.desc === false;

  const sortableColumns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter((col) => col.getCanSort())
        .map((col) => ({
          id: col.id,
          label: formatColumnName(col.id),
        })),
    [table, formatColumnName]
  );

  return (
    <div className="relative">
      <Button
        ref={btnRef}
        variant="outline"
        size="default"
        onClick={() => setOpen(!open)}
        className="font-normal"
      >
        <SlidersHorizontal className="text-muted-foreground" />
        Display
      </Button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[9999] w-[300px] rounded-lg border bg-card shadow-lg"
            style={{ top: pos.top, left: pos.left }}
          >
            {/* Grouping / Sub-grouping / Ordering */}
            <div className="px-3 py-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Grouping</span>
                </div>
                <Select value={effectiveGroupBy ?? "none"} onValueChange={effectiveSetGroupBy}>
                  <SelectTrigger className={displaySelectCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {effectiveGroupOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Sub-grouping</span>
                </div>
                <Select value={effectiveSubGroupBy ?? "none"} onValueChange={effectiveSetSubGroupBy}>
                  <SelectTrigger className={displaySelectCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {effectiveSubGroupOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ordering */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>Ordering</span>
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    value={currentSortId || "__none__"}
                    onValueChange={(v) => {
                      if (v === "__none__") {
                        table.setSorting([]);
                      } else {
                        table.setSorting([{ id: v, desc: !currentSortAsc }]);
                      }
                    }}
                  >
                    <SelectTrigger className={displaySelectCls}>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="__none__" className="text-xs">None</SelectItem>
                      {sortableColumns.map((col) => (
                        <SelectItem key={col.id} value={col.id} className="text-xs">
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentSortId && (
                    <button
                      onClick={() => {
                        table.setSorting([{ id: currentSortId, desc: currentSortAsc }]);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                      title={currentSortAsc ? "Ascending" : "Descending"}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Display properties */}
            <div className="px-3 py-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                Display properties
              </p>
              <div className="flex flex-wrap gap-1.5">
                {toggleableColumns.map((col) => {
                  const visible = col.getIsVisible();
                  return (
                    <button
                      key={col.id}
                      onClick={() => col.toggleVisibility(!visible)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        visible
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-transparent bg-muted/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {formatColumnName(col.id)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t px-3 py-2.5 flex justify-center">
              <button
                onClick={() => {
                  table.setSorting([]);
                  effectiveSetGroupBy("none");
                  effectiveSetSubGroupBy("none");
                  toggleableColumns.forEach((col) => col.toggleVisibility(true));
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Show all
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
