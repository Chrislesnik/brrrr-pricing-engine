"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/shadcn/sheet";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";

import { Download, User, FileText } from "lucide-react";
import type { CreditReport } from "./credit-table";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getBorrowerName(report: CreditReport): string {
  if (report.borrowers) {
    const first = report.borrowers.first_name || "";
    const last = report.borrowers.last_name || "";
    return `${first} ${last}`.trim() || "Unknown";
  }
  return "Unknown";
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getReportStatus(report: CreditReport): { label: string; colorVar: string; bgVar: string } {
  const dateStr = report.report_date ?? report.created_at;
  if (!dateStr) return { label: "Unknown", colorVar: "--muted-foreground", bgVar: "--muted" };
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > 90) return { label: "Expired", colorVar: "--danger", bgVar: "--danger-muted" };
  if (ageDays >= 75) return { label: "Expiring Soon", colorVar: "--warning", bgVar: "--warning-muted" };
  return { label: "Valid", colorVar: "--success", bgVar: "--success-muted" };
}

function getDaysSincePull(report: CreditReport): number | null {
  const dateStr = report.report_date ?? report.created_at;
  if (!dateStr) return null;
  const ageMs = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  const num = score !== null && score !== undefined ? Number(score) : null;
  let scoreColor = "--danger";
  if (num !== null) {
    if (num >= 740) scoreColor = "--success";
    else if (num >= 670) scoreColor = "--warning";
  }
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3 flex-1">
      <span className="text-xs text-muted-foreground uppercase font-medium">{label}</span>
      {num !== null ? (
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: `hsl(var(${scoreColor}))` }}
        >
          {num}
        </span>
      ) : (
        <span className="text-2xl font-bold text-muted-foreground">—</span>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value || "—"}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface CreditDetailSheetProps {
  report: CreditReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditDetailSheet({ report, open, onOpenChange }: CreditDetailSheetProps) {
  if (!report) return null;

  const name = getBorrowerName(report);
  const { label: statusLabel, colorVar, bgVar } = getReportStatus(report);
  const daysSince = getDaysSincePull(report);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg truncate">{name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-0.5">
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `hsl(var(${bgVar}))`,
                    color: `hsl(var(${colorVar}))`,
                  }}
                >
                  {statusLabel}
                </span>
                {report.aggregator_link?.aggregator && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {report.aggregator_link.aggregator}
                  </Badge>
                )}
                {report.pull_type && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {report.pull_type} pull
                  </Badge>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Scores */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Credit Scores</h3>
            <div className="flex gap-3">
              <ScoreCard label="TransUnion" score={report.transunion_score} />
              <ScoreCard label="Experian" score={report.experian_score} />
              <ScoreCard label="Equifax" score={report.equifax_score} />
            </div>
          </div>

          {/* Report Details */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Report Details</h3>
            <div className="rounded-lg border divide-y px-4">
              <DetailRow label="Report ID" value={
                <span className="font-mono text-xs">{report.report_id || report.id.slice(0, 12) + "..."}</span>
              } />
              <DetailRow label="Status" value={
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `hsl(var(${bgVar}))`,
                    color: `hsl(var(${colorVar}))`,
                  }}
                >
                  {statusLabel}
                </span>
              } />
              <DetailRow label="Aggregator" value={
                <span className="capitalize">{report.aggregator_link?.aggregator || report.aggregator || "—"}</span>
              } />
              <DetailRow label="Pull Type" value={
                <span className="capitalize">{report.pull_type || "—"}</span>
              } />
              <DetailRow label="Days Since Pull" value={
                daysSince !== null ? `${daysSince} day${daysSince !== 1 ? "s" : ""}` : "—"
              } />
              <DetailRow label="Report Date" value={formatDateTime(report.report_date ?? report.created_at)} />
            </div>
          </div>

          {/* Download */}
          {report.download_url && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Document</h3>
              <div className="rounded-lg border p-3 flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">Credit Report PDF</p>
                  <p className="text-xs text-muted-foreground">
                    {report.storage_path?.split("/").pop() || "report.pdf"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => window.open(report.download_url!, "_blank")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
