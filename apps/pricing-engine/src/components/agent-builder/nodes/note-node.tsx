import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { StickyNote } from "lucide-react";
import { cn } from "@repo/lib/cn";
import type { AgentNodeData } from "../lib/agent-store";

function NoteNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as AgentNodeData;

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 shadow-sm min-w-[180px] max-w-[280px]",
        selected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-300 dark:border-amber-700"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <StickyNote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Note</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {nodeData.label || "Add a note..."}
      </p>
    </div>
  );
}

export const NoteNode = memo(NoteNodeComponent);
