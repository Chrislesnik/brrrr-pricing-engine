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
import { AddProgramDialog } from "../../../settings/components/add-program-dialog";
import { ProgramRowActions } from "../../../settings/components/program-row-actions";
import {
  addProgramAction,
  updateProgramAction,
  deleteProgramAction,
} from "../../../settings/programs-actions";
import { Loader2 } from "lucide-react";

interface ProgramRow {
  id: string;
  loan_type: "dscr" | "bridge" | string;
  internal_name: string;
  external_name: string;
  webhook_url: string | null;
  status: "active" | "inactive";
}

export function ProgramsSettings() {
  const { orgId, orgRole, has } = useAuth();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    async function checkAccessAndFetch() {
      // Check permissions
      const isOwner = orgRole === "org:owner" || orgRole === "owner";
      const hasPermission = has ? await has({ permission: "org:manage_programs" }) : false;
      const access = isOwner || hasPermission;
      setCanAccess(access);

      if (!access) {
        setLoading(false);
        return;
      }

      // Fetch programs
      try {
        const response = await fetch("/api/pricing/programs");
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
  }, [orgId, orgRole, has]);

  const refreshPrograms = async () => {
    try {
      const response = await fetch("/api/pricing/programs");
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
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="uppercase">{p.loan_type}</TableCell>
                <TableCell className="font-medium">{p.internal_name}</TableCell>
                <TableCell>{p.external_name}</TableCell>
                <TableCell className="truncate">{p.webhook_url ?? ""}</TableCell>
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
