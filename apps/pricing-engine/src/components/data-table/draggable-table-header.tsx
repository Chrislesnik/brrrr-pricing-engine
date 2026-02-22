"use client";

import * as React from "react";
import { flexRender, type Header } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TableHead } from "@repo/ui/shadcn/table";
import { cn } from "@repo/lib/cn";

export const PINNED_RIGHT_SET = new Set<string>(["row_actions"]);
export const FIXED_COLUMNS = new Set<string>(["select", "expand", "row_actions"]);

interface DraggableTableHeaderProps<TData> {
  header: Header<TData, unknown>;
}

export function DraggableTableHeader<TData>({ header }: DraggableTableHeaderProps<TData>) {
  const columnId = header.column.id;
  const isFixedColumn = FIXED_COLUMNS.has(columnId);
  const isPinnedRight = PINNED_RIGHT_SET.has(columnId);
  const isDraggable = !isFixedColumn && !isPinnedRight;

  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: columnId,
      disabled: !isDraggable,
    });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    position: isPinnedRight ? "sticky" : "relative",
    transform: isDraggable ? CSS.Translate.toString(transform) : "none",
    transition: isDragging ? "none" : "transform 0.2s ease",
    whiteSpace: "nowrap",
    zIndex: isDragging ? 999 : isPinnedRight ? 20 : "auto",
    ...(isPinnedRight ? { right: 0, boxShadow: "-4px 0 8px -4px rgba(0,0,0,0.08)" } : {}),
  };

  const metaClassName = (header.column.columnDef.meta as Record<string, unknown> | undefined)?.className as string | undefined;

  return (
    <TableHead
      ref={setNodeRef}
      colSpan={header.colSpan}
      style={style}
      className={cn(
        "relative text-left px-3",
        isDragging && "shadow-lg border-2 border-primary",
        isPinnedRight && "bg-muted !px-1",
        metaClassName
      )}
    >
      <div className="flex items-center">
        {isDraggable && (
          <button
            className="flex items-center cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-background/50 transition-colors mr-1 shrink-0"
            {...attributes}
            {...listeners}
            title="Drag to reorder column"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 text-left">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      </div>
    </TableHead>
  );
}
