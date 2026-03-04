"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { cn } from "@repo/lib/cn";
import { Loader2, Settings2, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import { ConfirmDialog } from "@repo/ui/custom/confirm-dialog";
import { AddTermSheetDialog } from "./add-term-sheet-dialog";
import { TermSheetConditionSheet } from "./term-sheet-condition-sheet";

interface TermSheetRow {
  id: string;
  document_template_id: string;
  template_name: string;
  status: "active" | "inactive";
  display_order: number;
}

export function TermSheetsSettings() {
  const { orgId } = useAuth();
  const [rows, setRows] = useState<TermSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionSheetOpen, setConditionSheetOpen] = useState(false);
  const [conditionSheetId, setConditionSheetId] = useState<string>("");
  const [conditionSheetName, setConditionSheetName] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch("/api/pe-term-sheets");
      if (res.ok) {
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch term sheets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, orgId]);

  const handleToggleStatus = useCallback(
    async (row: TermSheetRow) => {
      const newStatus = row.status === "active" ? "inactive" : "active";
      try {
        const res = await fetch(`/api/pe-term-sheets/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: newStatus } : r))
          );
        }
      } catch (error) {
        console.error("Failed to toggle status:", error);
      }
    },
    []
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pe-term-sheets/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== deleteTargetId));
        setDeleteConfirmOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete term sheet:", error);
    } finally {
      setDeleting(false);
    }
  }, [deleteTargetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Term Sheets</h2>
          <p className="text-sm text-muted-foreground">
            Manage term sheet templates and their conditional logic.
          </p>
        </div>
        <AddTermSheetDialog
          existingTemplateIds={rows.map((r) => r.document_template_id)}
          onAdded={fetchRows}
        />
      </div>

      <div className="flex w-full flex-col gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Template Name</TableHead>
              <TableHead className="w-[20%]">Logic</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[15%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.template_name}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      setConditionSheetId(row.id);
                      setConditionSheetName(row.template_name);
                      setConditionSheetOpen(true);
                    }}
                  >
                    <Settings2 className="size-3.5" />
                    Edit
                  </Button>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(row)}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        row.status === "active"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {row.status}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open row actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteTargetId(row.id);
                          setDeleteConfirmOpen(true);
                        }}
                        className="gap-2 text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No term sheets yet. Add your first one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {conditionSheetId && (
        <TermSheetConditionSheet
          open={conditionSheetOpen}
          onOpenChange={setConditionSheetOpen}
          peTermSheetId={conditionSheetId}
          templateName={conditionSheetName}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        handleConfirm={handleDelete}
        isLoading={deleting}
        destructive
        title="Delete term sheet?"
        desc="This term sheet and all its conditions will be permanently deleted."
        confirmText="Delete"
      />
    </div>
  );
}
