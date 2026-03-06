"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  getDealInputs: "Fetching deal inputs",
  generateLoanPricing: "Generating loan pricing",
  generateTermSheet: "Preparing term sheet",
};

const TOOL_DESCRIPTIONS: Record<string, string> = {
  getDealInputs: "Mapping deal fields to pricing engine inputs",
  generateLoanPricing: "Running pricing across eligible programs",
  generateTermSheet: "Building term sheet from selected rate",
};

interface ToolLoadingIndicatorProps {
  toolName: string;
}

export function ToolLoadingIndicator({ toolName }: ToolLoadingIndicatorProps) {
  const label = TOOL_LABELS[toolName] ?? "Processing";
  const description = TOOL_DESCRIPTIONS[toolName] ?? null;
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [toolName]);

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border bg-muted/20 px-3 py-2.5">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-info shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-foreground">
            {label}...
          </span>
          {elapsed > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {elapsed}s
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
