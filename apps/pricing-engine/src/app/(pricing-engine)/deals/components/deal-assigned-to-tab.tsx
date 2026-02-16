"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@repo/ui/shadcn/badge";
import { Users } from "lucide-react";
import { RoleAssignmentDialog } from "@/components/role-assignment-dialog";

type RoleAssignment = {
  id: number;
  role_type_id: number;
  role_name: string;
  role_code: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
};

interface DealAssignedToRosterProps {
  dealId: string;
}

/**
 * Compact inline roster shown in the deal header.
 * Displays assigned members as small badges and opens the full
 * RoleAssignmentDialog on click.
 */
export function DealAssignedToRoster({ dealId }: DealAssignedToRosterProps) {
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/role-assignments?resource_type=deal&resource_id=${encodeURIComponent(dealId)}`
      );
      if (!res.ok) return;
      const json = (await res.json()) as { assignments: RoleAssignment[] };
      setAssignments(json.assignments ?? []);
    } catch {
      // Non-critical
    }
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const fullName = (a: { first_name?: string | null; last_name?: string | null; user_id?: string }) =>
    [a.first_name, a.last_name].filter(Boolean).join(" ").trim() || a.user_id || "?";

  const initials = (a: { first_name?: string | null; last_name?: string | null }) => {
    const f = a.first_name?.[0]?.toUpperCase() ?? "";
    const l = a.last_name?.[0]?.toUpperCase() ?? "";
    return f + l || "?";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 hover:bg-muted transition-colors shrink-0 cursor-pointer"
        title="Manage role assignments"
      >
        <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {assignments.length === 0 ? (
          <span className="text-xs text-muted-foreground">Assign</span>
        ) : (
          <div className="flex items-center -space-x-1">
            {assignments.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-medium border-2 border-background"
                title={`${a.role_name}: ${fullName(a)}`}
              >
                {initials(a)}
              </div>
            ))}
            {assignments.length > 4 && (
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border-2 border-background">
                +{assignments.length - 4}
              </div>
            )}
          </div>
        )}
      </button>

      <RoleAssignmentDialog
        resourceType="deal"
        resourceId={dealId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => void load()}
      />
    </>
  );
}
