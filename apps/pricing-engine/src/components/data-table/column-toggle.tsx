"use client";

import { type Table } from "@tanstack/react-table";
import { Columns2, ChevronDown } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";

interface ColumnToggleProps<TData> {
  table: Table<TData>;
  formatColumnName?: (columnId: string) => string;
}

function defaultFormatName(columnId: string): string {
  return columnId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function ColumnToggle<TData>({ table, formatColumnName }: ColumnToggleProps<TData>) {
  const fmt = formatColumnName ?? defaultFormatName;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 bg-background">
          <Columns2 className="w-4 h-4 mr-2" />
          <span className="text-xs font-medium">Customize Columns</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {table
          .getAllColumns()
          .filter((col) => col.getCanHide())
          .map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={col.getIsVisible()}
              onCheckedChange={(value) => col.toggleVisibility(!!value)}
            >
              {fmt(col.id)}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
