"use client";

import { useState, useCallback } from "react";
import { Star, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { cn } from "@repo/lib/cn";

// ─── Types matching generateLoanPricingTool output ───────────────────
interface RateOption {
  rowIndex: number;
  interestRate: string | null;
  loanPrice: string | null;
  pitia: string | null;
  dscr: string | null;
}

interface ProgramResult {
  id: string;
  name: string;
  pass: boolean;
  error?: string;
  validations?: unknown[];
  loanAmount?: string | null;
  ltv?: string | null;
  rateOptions: RateOption[];
  rawResponse?: string;
}

interface PricingOutput {
  dealId?: string;
  programs?: ProgramResult[];
  totalPrograms?: number;
  passingPrograms?: number;
  error?: string;
}

interface PricingArtifactV2Props {
  output: PricingOutput;
  dealId: string;
  onSelectRate?: (programId: string, rate: RateOption) => void;
}

// ─── Component ───────────────────────────────────────────────────────
export function PricingArtifactV2({
  output,
  dealId,
  onSelectRate,
}: PricingArtifactV2Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [starredRows, setStarredRows] = useState<
    Map<string, number>
  >(new Map());

  const programs = output.programs ?? [];

  const handleStar = useCallback(
    (programId: string, rowIndex: number) => {
      setStarredRows((prev) => {
        const next = new Map(prev);
        if (next.get(programId) === rowIndex) {
          next.delete(programId);
        } else {
          next.set(programId, rowIndex);
        }
        return next;
      });
    },
    []
  );

  if (output.error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-[12px] font-medium text-destructive">
            Pricing generation failed
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {output.error}
        </p>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3">
        <p className="text-[12px] text-muted-foreground">
          No pricing results available.
        </p>
      </div>
    );
  }

  const activeProgram = programs[activeTab];
  const starredRow = activeProgram
    ? starredRows.get(activeProgram.id)
    : undefined;

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pricing Results
          </span>
          <span className="text-[11px] text-muted-foreground">
            {output.passingPrograms ?? 0}/{output.totalPrograms ?? 0} passing
          </span>
        </div>
      </div>

      {/* Tabs */}
      {programs.length > 1 && (
        <div className="flex border-b border-border overflow-x-auto">
          {programs.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(i)}
              className={cn(
                "h-8 px-3 text-[12px] whitespace-nowrap transition-colors",
                i === activeTab
                  ? "border-b-2 border-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                !p.pass && "text-destructive/70"
              )}
            >
              {p.name}
              {!p.pass && " (fail)"}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {activeProgram && (
        <>
          {!activeProgram.pass ? (
            <div className="p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-[12px] font-medium">
                  Program failed validation
                </span>
              </div>
              {activeProgram.error && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {activeProgram.error}
                </p>
              )}
              {Array.isArray(activeProgram.validations) &&
                activeProgram.validations.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {activeProgram.validations.map((v, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-muted-foreground"
                      >
                        {String(v)}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          ) : (
            <>
              {/* Rate table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium uppercase text-muted-foreground">
                        Rate
                      </th>
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium uppercase text-muted-foreground">
                        Price
                      </th>
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium uppercase text-muted-foreground">
                        PITIA
                      </th>
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium uppercase text-muted-foreground">
                        DSCR
                      </th>
                      <th className="px-3 py-1.5 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeProgram.rateOptions.map((row) => {
                      const isStarred =
                        starredRow === row.rowIndex;

                      return (
                        <tr
                          key={row.rowIndex}
                          className={cn(
                            "h-8 hover:bg-accent/30 transition-colors",
                            isStarred &&
                              "bg-blue-500/5 border-l-2 border-blue-500"
                          )}
                        >
                          <td className="px-3 tabular-nums">
                            {row.interestRate ?? "—"}
                          </td>
                          <td className="px-3 tabular-nums">
                            {row.loanPrice ?? "—"}
                          </td>
                          <td className="px-3 tabular-nums">
                            {row.pitia ?? "—"}
                          </td>
                          <td className="px-3 tabular-nums">
                            {row.dscr ?? "—"}
                          </td>
                          <td className="px-3">
                            <button
                              onClick={() =>
                                handleStar(activeProgram.id, row.rowIndex)
                              }
                              className={cn(
                                "h-5 w-5 flex items-center justify-center rounded-sm transition-colors",
                                isStarred
                                  ? "text-amber-500"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              aria-label={
                                isStarred
                                  ? "Unstar this rate"
                                  : "Star this rate"
                              }
                            >
                              <Star
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isStarred && "fill-amber-500"
                                )}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer with action */}
              {starredRow !== undefined && (
                <div className="px-3 py-2 border-t border-border">
                  <Button
                    size="sm"
                    className="h-8 px-3 text-[12px]"
                    onClick={() => {
                      const rate =
                        activeProgram.rateOptions[starredRow];
                      if (rate) {
                        onSelectRate?.(activeProgram.id, rate);
                      }
                    }}
                  >
                    Generate Term Sheet
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
