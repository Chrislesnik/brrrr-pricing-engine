"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@repo/lib/cn";

// ─── Types matching getDealInputsTool output ─────────────────────────
interface MappedField {
  input_code: string;
  display_name: string;
  value: unknown;
  source: "deal_input" | "missing";
  is_required: boolean;
}

interface MissingField {
  input_code: string;
  display_name: string;
  data_type: string;
}

interface DealInputsOutput {
  dealId?: string;
  mappedFields?: MappedField[];
  missingRequired?: MissingField[];
  allRequiredFilled?: boolean;
  totalFields?: number;
  filledFields?: number;
  error?: string;
}

interface DealInputsSummaryProps {
  output: DealInputsOutput;
}

// ─── Component ───────────────────────────────────────────────────────
export function DealInputsSummary({ output }: DealInputsSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  if (output.error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
        <p className="text-[12px] font-medium text-destructive">
          Failed to fetch deal inputs
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {output.error}
        </p>
      </div>
    );
  }

  const total = output.totalFields ?? 0;
  const filled = output.filledFields ?? 0;
  const missing = output.missingRequired ?? [];
  const allFilled = output.allRequiredFilled ?? false;
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="rounded-md border border-border bg-card p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-foreground">
          Deal Inputs
        </span>
        <span className="text-[11px] text-muted-foreground">
          {filled}/{total} fields
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            allFilled ? "bg-emerald-500" : "bg-amber-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Missing required fields */}
      {missing.length > 0 && (
        <div className="mt-2">
          <span className="text-[11px] font-medium text-destructive">
            Missing required ({missing.length})
          </span>
          <div className="mt-1 space-y-0.5">
            {missing.slice(0, expanded ? undefined : 5).map((f) => (
              <div key={f.input_code} className="flex items-center gap-1">
                <span className="inline-block rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {f.display_name}
                </span>
              </div>
            ))}
            {missing.length > 5 && !expanded && (
              <span className="text-[11px] text-muted-foreground">
                +{missing.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expand/collapse toggle */}
      {(output.mappedFields ?? []).length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {expanded ? "Hide details" : "Show all fields"}
        </button>
      )}

      {/* Expanded field list */}
      {expanded && (
        <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
          {(output.mappedFields ?? []).map((f) => (
            <div
              key={f.input_code}
              className="flex items-center justify-between text-[11px]"
            >
              <span
                className={cn(
                  "text-muted-foreground",
                  f.source === "missing" && "text-destructive"
                )}
              >
                {f.display_name}
                {f.is_required && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
              </span>
              <span className="text-foreground tabular-nums">
                {f.value != null ? String(f.value) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
