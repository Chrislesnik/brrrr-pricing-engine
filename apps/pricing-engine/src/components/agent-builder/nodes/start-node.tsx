import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import { cn } from "@repo/lib/cn";
import type { AgentNodeData } from "../lib/agent-store";

function StartNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-background px-4 py-3 shadow-sm min-w-[160px]",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            Start
          </p>
          <p className="text-[10px] text-muted-foreground">Agent input</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);
