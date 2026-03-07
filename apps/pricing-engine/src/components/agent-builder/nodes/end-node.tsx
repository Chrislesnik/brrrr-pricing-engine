import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Flag } from "lucide-react";
import { cn } from "@repo/lib/cn";

function EndNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-background px-4 py-3 shadow-sm min-w-[160px]",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-red-500 !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Flag className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
            End
          </p>
          <p className="text-[10px] text-muted-foreground">Agent output</p>
        </div>
      </div>
    </div>
  );
}

export const EndNode = memo(EndNodeComponent);
