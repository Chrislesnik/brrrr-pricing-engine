import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";

// CardAction stub - not in our card component
const CardAction = ({ children, ...props }: React.ComponentProps<"div">) => (
  <div {...props}>{children}</div>
);
import { cn } from "@/components/workflow-builder/lib/utils";
import { Handle, Position } from "@xyflow/react";
import type { ComponentProps } from "react";
import { AnimatedBorder } from "@/components/workflow-builder/ui/animated-border";

export type NodeProps = ComponentProps<typeof Card> & {
  handles: {
    target: boolean;
    source: boolean | string[];
  };
  status?: "idle" | "running" | "success" | "error";
};

export const Node = ({ handles, className, status, ...props }: NodeProps) => (
  <Card
    className={cn(
      "node-container relative size-full h-auto w-sm gap-0 rounded-md bg-card p-0 transition-all duration-200",
      status === "success" && "border-green-500 border-2",
      status === "error" && "border-red-500 border-2",
      className
    )}
    {...props}
  >
    {status === "running" && <AnimatedBorder />}
    {handles.target && <Handle position={Position.Left} type="target" />}
    {/* Single source handle */}
    {handles.source === true && <Handle position={Position.Right} type="source" />}
    {/* Multiple named source handles (e.g., for Condition true/false) */}
    {Array.isArray(handles.source) &&
      handles.source.map((handleId, idx) => {
        const total = (handles.source as string[]).length;
        const topPercent = ((idx + 1) / (total + 1)) * 100;
        const isTrue = handleId === "true";
        const isFalse = handleId === "false";
        return (
          <div key={handleId}>
            <Handle
              id={handleId}
              position={Position.Right}
              type="source"
              style={{ top: `${topPercent}%` }}
            />
            <span
              className={cn(
                "absolute right-5 text-[9px] font-medium whitespace-nowrap pointer-events-none",
                isTrue && "text-green-600 dark:text-green-400",
                isFalse && "text-red-500 dark:text-red-400",
                !isTrue && !isFalse && "text-muted-foreground"
              )}
              style={{ top: `${topPercent}%`, transform: "translateY(-50%)" }}
            >
              {handleId.charAt(0).toUpperCase() + handleId.slice(1)}
            </span>
          </div>
        );
      })}
    {props.children}
  </Card>
);

export type NodeHeaderProps = ComponentProps<typeof CardHeader>;

export const NodeHeader = ({ className, ...props }: NodeHeaderProps) => (
  <CardHeader
    className={cn("gap-0.5 rounded-t-md border-b bg-secondary p-3!", className)}
    {...props}
  />
);

export type NodeTitleProps = ComponentProps<typeof CardTitle>;

export const NodeTitle = (props: NodeTitleProps) => <CardTitle {...props} />;

export type NodeDescriptionProps = ComponentProps<typeof CardDescription>;

export const NodeDescription = (props: NodeDescriptionProps) => (
  <CardDescription {...props} />
);

export type NodeActionProps = ComponentProps<typeof CardAction>;

export const NodeAction = (props: NodeActionProps) => <CardAction {...props} />;

export type NodeContentProps = ComponentProps<typeof CardContent>;

export const NodeContent = ({ className, ...props }: NodeContentProps) => (
  <CardContent className={cn("rounded-b-md bg-card p-3", className)} {...props} />
);

export type NodeFooterProps = ComponentProps<typeof CardFooter>;

export const NodeFooter = ({ className, ...props }: NodeFooterProps) => (
  <CardFooter
    className={cn("rounded-b-md border-t bg-secondary p-3!", className)}
    {...props}
  />
);
