"use client";

import { FileText, Download, MessageSquare } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";

// ─── Types matching generateTermSheetTool output ─────────────────────
interface TermSheetTemplate {
  id: string;
  templateName: string;
  templateId: string | null;
}

interface TermSheetOutput {
  dealId?: string;
  programId?: string;
  selectedRate?: {
    interestRate: string | null;
    loanPrice: string | null;
    rowIndex: number;
  };
  availableTermSheets?: TermSheetTemplate[];
  totalTemplates?: number;
  message?: string;
  error?: string;
}

interface TermSheetResultProps {
  output: TermSheetOutput;
  onShareToChat?: (templateId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────
export function TermSheetResult({
  output,
  onShareToChat,
}: TermSheetResultProps) {
  if (output.error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-destructive" />
          <span className="text-[12px] font-medium text-destructive">
            Term sheet generation failed
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {output.error}
        </p>
      </div>
    );
  }

  const templates = output.availableTermSheets ?? [];
  const rate = output.selectedRate;

  return (
    <div className="rounded-md border border-border bg-card p-3">
      {/* Title */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        <span className="text-[13px] font-medium text-foreground">
          {templates.length > 0
            ? "Term Sheet Templates Available"
            : "No Term Sheets Found"}
        </span>
      </div>

      {/* Rate details */}
      {rate && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Rate: {rate.interestRate ?? "—"} | Price:{" "}
          {rate.loanPrice ?? "—"}
        </p>
      )}

      {/* Template list */}
      {templates.length > 0 && (
        <div className="mt-3 space-y-2">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="flex items-center justify-between rounded-md border border-border/50 bg-muted/10 px-3 py-2"
            >
              <span className="text-[12px] text-foreground">
                {tmpl.templateName}
              </span>
              <div className="flex gap-2">
                {tmpl.templateId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() =>
                      window.open(
                        `/deals/${output.dealId}?tab=documents&templateId=${tmpl.templateId}`,
                        "_blank"
                      )
                    }
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Open
                  </Button>
                )}
                {onShareToChat && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => onShareToChat(tmpl.id)}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message */}
      {output.message && (
        <p className="text-[11px] text-muted-foreground mt-2">
          {output.message}
        </p>
      )}
    </div>
  );
}
