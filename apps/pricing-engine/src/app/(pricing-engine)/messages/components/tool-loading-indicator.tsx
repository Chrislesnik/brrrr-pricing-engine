"use client";

import { Loader2 } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  getDealInputs: "Fetching deal inputs...",
  generateLoanPricing: "Generating loan pricing...",
  generateTermSheet: "Preparing term sheet...",
};

interface ToolLoadingIndicatorProps {
  toolName: string;
}

export function ToolLoadingIndicator({ toolName }: ToolLoadingIndicatorProps) {
  const label = TOOL_LABELS[toolName] ?? "Processing...";

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
  );
}
