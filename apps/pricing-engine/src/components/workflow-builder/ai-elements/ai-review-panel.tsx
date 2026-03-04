"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Check, Minus, Pencil, Plus, X } from "lucide-react";
import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import { Button } from "@repo/ui/shadcn/button";
import { Switch } from "@repo/ui/shadcn/switch";
import {
  aiProposalAtom,
  applyProposalAtom,
  currentWorkflowIdAtom,
  discardProposalAtom,
  type ProposedNodeChange,
} from "@/components/workflow-builder/lib/workflow-store";
import { api } from "@/components/workflow-builder/lib/api-client";
import { cn } from "@/components/workflow-builder/lib/utils";

export function AIReviewPanel() {
  const [proposal, setProposal] = useAtom(aiProposalAtom);
  const applyProposal = useSetAtom(applyProposalAtom);
  const discardProposal = useSetAtom(discardProposalAtom);
  const workflowId = useAtomValue(currentWorkflowIdAtom);
  const { fitView } = useReactFlow();

  const toggleChange = useCallback(
    (nodeId: string) => {
      if (!proposal) return;
      setProposal({
        ...proposal,
        nodeChanges: proposal.nodeChanges.map((c) =>
          c.nodeId === nodeId ? { ...c, accepted: !c.accepted } : c,
        ),
      });
    },
    [proposal, setProposal],
  );

  const handleApply = useCallback(async () => {
    if (!proposal) return;
    applyProposal();

    if (workflowId) {
      try {
        await api.workflow.update(workflowId, {
          name: proposal.name,
          description: proposal.description,
        });
      } catch {
        // Autosave will handle it
      }
    }

    toast.success("Changes applied");
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [proposal, applyProposal, workflowId, fitView]);

  const handleDiscard = useCallback(() => {
    discardProposal();
    toast.info("Changes discarded");
  }, [discardProposal]);

  if (!proposal) return null;

  const acceptedCount = proposal.nodeChanges.filter((c) => c.accepted).length;
  const totalCount = proposal.nodeChanges.length;

  const added = proposal.nodeChanges.filter((c) => c.type === "added");
  const modified = proposal.nodeChanges.filter((c) => c.type === "modified");
  const removed = proposal.nodeChanges.filter((c) => c.type === "removed");

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 w-[min(100%,36rem)] px-4">
      <div className="rounded-lg border bg-background shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium">
              AI Proposed Changes
            </span>
            {proposal.name && (
              <span className="text-xs text-muted-foreground">
                &mdash; {proposal.name}
              </span>
            )}
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleDiscard}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Change list */}
        <div className="max-h-[240px] overflow-y-auto divide-y">
          {added.length > 0 && (
            <ChangeGroup icon={Plus} label="Added" changes={added} onToggle={toggleChange} colorClass="text-green-500" />
          )}
          {modified.length > 0 && (
            <ChangeGroup icon={Pencil} label="Modified" changes={modified} onToggle={toggleChange} colorClass="text-amber-500" />
          )}
          {removed.length > 0 && (
            <ChangeGroup icon={Minus} label="Removed" changes={removed} onToggle={toggleChange} colorClass="text-red-500" />
          )}
          {totalCount === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No changes detected.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <Button variant="ghost" size="sm" onClick={handleDiscard}>
            Discard All
          </Button>
          <Button size="sm" onClick={handleApply} disabled={acceptedCount === 0}>
            <Check className="size-3.5 mr-1.5" />
            Apply {acceptedCount} of {totalCount} Change{totalCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChangeGroup({
  icon: Icon,
  label,
  changes,
  onToggle,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  changes: ProposedNodeChange[];
  onToggle: (nodeId: string) => void;
  colorClass: string;
}) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn("size-3.5", colorClass)} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label} ({changes.length})
        </span>
      </div>
      <div className="space-y-1">
        {changes.map((change) => (
          <div
            key={change.nodeId}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {change.label}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {change.detail}
              </div>
            </div>
            <Switch
              checked={change.accepted}
              onCheckedChange={() => onToggle(change.nodeId)}
              className="shrink-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
