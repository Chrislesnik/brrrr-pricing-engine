"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { cn } from "@repo/lib/cn";
import type { Table } from "@tanstack/react-table";

interface TableDisplaySettingsProps<TData> {
  table: Table<TData>;
  formatColumnName: (columnId: string) => string;
}

/**
 * Simple Display settings popover that lists each table column as a Display Property.
 * Shows all columns by default (columnVisibility empty = all visible).
 */
export function TableDisplaySettings<TData>({
  table,
  formatColumnName,
}: TableDisplaySettingsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

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
