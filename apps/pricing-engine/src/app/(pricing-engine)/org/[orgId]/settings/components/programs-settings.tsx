"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@repo/lib/cn";
import { AddProgramDialog } from "../../../../settings/components/add-program-dialog";
import { ProgramRowActions } from "../../../../settings/components/program-row-actions";
import {
  addProgramAction,
  updateProgramAction,
  deleteProgramAction,
} from "../../../../settings/programs-actions";
import { Loader2, Copy, Check } from "lucide-react";
import { useCallback } from "react";

interface ProgramRow {
  id: string;
  loan_type: "dscr" | "bridge" | string;
  internal_name: string;
  external_name: string;
  webhook_url: string | null;
  status: "active" | "inactive";
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs font-mono hover:bg-muted transition-colors max-w-full"
      title={`Click to copy: ${value}`}
    >
      <span className="truncate">{label || value}</span>
      {copied ? (
        <Check className="size-3 shrink-0 text-green-600" />
      ) : (
        <Copy className="size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
      )}
    </button>
  );
}

export function ProgramsSettings() {
  const { orgId } = useAuth();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    async function checkAccessAndFetch() {
      // Check permissions via Supabase (admin/owner in internal org)
      try {
        const accessResponse = await fetch("/api/org/programs-access");
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

      // Fetch all programs for management
      try {
        const response = await fetch("/api/org/programs/list");
        if (response.ok) {
          const data = await response.json();
          setPrograms(data.programs || []);
        }
      } catch (error) {
        console.error("Failed to fetch programs:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndFetch();
  }, [orgId]);

  const refreshPrograms = async () => {
    try {
      const response = await fetch("/api/org/programs/list");
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error("Failed to refresh programs:", error);
    }
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
          You don&apos;t have permission to manage programs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Programs</h2>
        <p className="text-sm text-muted-foreground">
          Manage your loan programs.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full justify-end">
          <AddProgramDialog
            action={async (formData) => {
              const result = await addProgramAction(formData);
              if (!("error" in result)) {
                refreshPrograms();
              }
              return result;
            }}
            canCreate={!!orgId}
            orgId={orgId ?? null}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[12%]">ID</TableHead>
              <TableHead className="w-[18%]">Loan Type</TableHead>
              <TableHead className="w-[20%]">Internal Name</TableHead>
              <TableHead className="w-[20%]">External Name</TableHead>
              <TableHead className="w-[20%]">Webhook URL</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[4%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-[120px]">
                  <CopyButton value={p.id} label={p.id.slice(0, 8) + "..."} />
                </TableCell>
                <TableCell className="uppercase">{p.loan_type}</TableCell>
                <TableCell className="font-medium">{p.internal_name}</TableCell>
                <TableCell>{p.external_name}</TableCell>
                <TableCell className="max-w-[250px]">
                  {p.webhook_url ? (
                    <CopyButton value={p.webhook_url} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      p.status === "active"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    )}
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ProgramRowActions
                    program={p}
                    updateAction={async (formData) => {
                      const result = await updateProgramAction(formData);
                      refreshPrograms();
                      return result;
                    }}
                    deleteAction={async (formData) => {
                      const result = await deleteProgramAction(formData);
                      refreshPrograms();
                      return result;
                    }}
                    orgId={orgId ?? null}
                  />
                </TableCell>
              </TableRow>
            ))}
            {programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No records yet. Add your first one above.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
