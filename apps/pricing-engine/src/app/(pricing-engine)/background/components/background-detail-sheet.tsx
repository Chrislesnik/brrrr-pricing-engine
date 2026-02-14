"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/shadcn/sheet";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { Separator } from "@repo/ui/shadcn/separator";
import { FileText, Download, ExternalLink, Calendar, User, Building, Loader2 } from "lucide-react";
import { cn } from "@repo/lib/cn";
import type { BackgroundReport } from "./background-table";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LinkedApplication {
  application_id: string;
  created_at: string;
}

interface BackgroundDetailSheetProps {
  report: BackgroundReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getDisplayName(report: BackgroundReport): string {
  if (report.is_entity && report.entities) {
    return report.entities.entity_name || "Unknown Entity";
  }
  if (report.borrowers) {
    const first = report.borrowers.first_name || "";
    const last = report.borrowers.last_name || "";
    return `${first} ${last}`.trim() || "Unknown Individual";
  }
  return "Unknown";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* -------------------------------------------------------------------------- */
/*  Detail Row                                                                 */
/* -------------------------------------------------------------------------- */

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

export function BackgroundDetailSheet({ report, open, onOpenChange }: BackgroundDetailSheetProps) {
  const [linkedApps, setLinkedApps] = useState<LinkedApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    if (!report || !open) {
      setLinkedApps([]);
      return;
    }

    async function fetchLinkedApplications() {
      setLoadingApps(true);
      try {
        const res = await fetch(`/api/background-reports/${report!.id}/applications`);
        if (res.ok) {
          const json = await res.json();
          setLinkedApps(json.applications ?? []);
        }
      } catch {
        // Non-critical
      } finally {
        setLoadingApps(false);
      }
    }
    fetchLinkedApplications();
  }, [report, open]);

  if (!report) return null;

  const name = getDisplayName(report);
  const statusColor =
    report.status === "completed"
      ? "border-green-500/50 text-green-600 dark:text-green-400"
      : report.status === "failed"
        ? "border-red-500/50 text-red-600 dark:text-red-400"
        : "border-yellow-500/50 text-yellow-600 dark:text-yellow-400";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full shrink-0",
                report.is_entity
                  ? "bg-primary/10 text-primary"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              )}
            >
              {report.is_entity ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg truncate">{name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-0.5">
                <Badge variant={report.is_entity ? "default" : "secondary"} className="text-xs">
                  {report.is_entity ? "Entity" : "Individual"}
                </Badge>
                <Badge variant="outline" className={cn("text-xs capitalize", statusColor)}>
                  {report.status || "pending"}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Report Details */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Report Details</h3>
            <div className="rounded-lg border divide-y px-4">
              <DetailRow label="Report Type" value={
                <span className="capitalize">{report.report_type || "—"}</span>
              } />
              <DetailRow label="Report Date" value={formatDate(report.report_date)} />
              <DetailRow label="Created" value={formatDateTime(report.created_at)} />
              <DetailRow label="Last Updated" value={formatDateTime(report.updated_at)} />
            </div>
          </div>

          {/* Notes */}
          {report.notes && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.notes}</p>
              </div>
            </div>
          )}

          {/* Document */}
          {report.storage_path && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Document</h3>
              <div className="rounded-lg border p-3 flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {report.file_name || "Document"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {report.file_type || "Unknown type"} · {formatFileSize(report.file_size)}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Linked Applications */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Linked Applications</h3>
            {loadingApps ? (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : linkedApps.length === 0 ? (
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No applications linked to this report.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border divide-y">
                {linkedApps.map((app) => (
                  <div
                    key={app.application_id}
                    className="flex items-center justify-between px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-mono truncate">
                        {app.application_id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(app.created_at)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`/applications/${app.application_id}`, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
