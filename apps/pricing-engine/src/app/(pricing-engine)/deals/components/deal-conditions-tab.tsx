"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  FileText,
  Filter,
  ChevronDown,
  Bot,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { ScrollArea } from "@repo/ui/shadcn/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command";

interface Citation {
  docId?: string;
  chunkId?: string;
  page: number;
  bbox: { x: number; y: number; w: number; h: number } | null;
  snippet: string;
  whyRelevant?: string;
}

interface ConditionResult {
  id: number;
  condition_label: string;
  document_type_ai_condition_id: number;
  deal_document_id: number;
  document_name: string;
  document_type_name: string | null;
  document_file_id: number | null;
  status: "pass" | "fail" | "not_determined" | "pending";
  ai_value: boolean | null;
  approved_value: boolean | null;
  rejected: boolean | null;
  confidence: number | null;
  citations: Citation[];
  answer: boolean | null;
  created_at: string;
}

interface DealConditionsTabProps {
  dealId: string;
}

interface ExtractionResult {
  id: number;
  input_id: string | null;
  input_label: string;
  input_type: string;
  deal_document_id: number;
  document_name: string;
  document_type_name: string | null;
  ai_value: string | null;
  approved_value: string | null;
  rejected: boolean | null;
  confidence: number | null;
  citations: Citation[];
  answer: unknown;
  created_at: string;
}

const STATUS_CONFIG = {
  pass: {
    label: "Pass",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  fail: {
    label: "Fail",
    icon: XCircle,
    className: "text-red-600 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  not_determined: {
    label: "Not Determined",
    icon: HelpCircle,
    className: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
  pending: {
    label: "Pending",
    icon: Loader2,
    className: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

export function DealConditionsTab({ dealId }: DealConditionsTabProps) {
  const [conditions, setConditions] = useState<ConditionResult[]>([]);
  const [extractions, setExtractions] = useState<ExtractionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [docFilter, setDocFilter] = useState<string | null>(null);

  const loadConditions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/conditions`);
      if (res.ok) {
        const data = await res.json();
        setConditions(data.conditions ?? []);
        setExtractions(data.extractions ?? []);
      }
    } catch (err) {
      console.error("Failed to load conditions:", err);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadConditions();
  }, [loadConditions]);

  const uniqueDocuments = [
    ...new Map(
      conditions.map((c) => [c.deal_document_id, c.document_name])
    ).entries(),
  ];

  const filtered = conditions.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (docFilter && String(c.deal_document_id) !== docFilter) return false;
    return true;
  });

  const counts = {
    pass: conditions.filter((c) => c.status === "pass").length,
    fail: conditions.filter((c) => c.status === "fail").length,
    not_determined: conditions.filter((c) => c.status === "not_determined").length,
    total: conditions.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conditions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          No conditions found
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload documents and run AI extraction to see condition results here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">{counts.pass} Pass</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">{counts.fail} Fail</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {counts.not_determined} Not Determined
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {statusFilter
                  ? STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label
                  : "Status"}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => setStatusFilter(null)}
                      className="text-xs"
                    >
                      All Statuses
                    </CommandItem>
                    {(["pass", "fail", "not_determined"] as const).map((s) => (
                      <CommandItem
                        key={s}
                        onSelect={() =>
                          setStatusFilter(statusFilter === s ? null : s)
                        }
                        className="text-xs"
                      >
                        {STATUS_CONFIG[s].label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Document filter */}
          {uniqueDocuments.length > 1 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {docFilter
                    ? (uniqueDocuments.find(
                        ([id]) => String(id) === docFilter
                      )?.[1] ?? "Document"
                    ).substring(0, 20)
                    : "Document"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search documents..." />
                  <CommandList>
                    <CommandEmpty>No documents found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setDocFilter(null)}
                        className="text-xs"
                      >
                        All Documents
                      </CommandItem>
                      {uniqueDocuments.map(([id, name]) => (
                        <CommandItem
                          key={id}
                          onSelect={() =>
                            setDocFilter(
                              docFilter === String(id) ? null : String(id)
                            )
                          }
                          className="text-xs"
                        >
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={loadConditions}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Conditions list */}
      <div className="space-y-2">
        {filtered.map((cond) => {
          const config = STATUS_CONFIG[cond.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={cond.id}
              className="rounded-lg border p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <StatusIcon
                    className={cn(
                      "h-5 w-5 mt-0.5 shrink-0",
                      config.className,
                      cond.status === "pending" && "animate-spin"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {cond.condition_label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cond.document_type_name ?? cond.document_name}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={cn("shrink-0 text-xs", config.badgeClass)}
                >
                  {config.label}
                </Badge>
              </div>

              {/* Confidence */}
              {cond.confidence != null && cond.status !== "not_determined" && (
                <div className="pl-8">
                  <span className="text-xs text-muted-foreground">
                    Confidence: {Math.round(cond.confidence * 100)}%
                  </span>
                </div>
              )}

              {/* Citations */}
              {cond.citations && cond.citations.length > 0 && (
                <div className="pl-8 flex flex-col gap-1">
                  {cond.citations.map((citation, idx) => (
                    <a
                      key={idx}
                      href={`/deals/${dealId}/documents/${cond.deal_document_id}`}
                      className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-xs transition-colors hover:underline"
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      <span>
                        Page {citation.page}
                        {citation.snippet && (
                          <span className="text-muted-foreground ml-1">
                            — &quot;{citation.snippet.substring(0, 40)}
                            {citation.snippet.length > 40 ? "..." : ""}&quot;
                          </span>
                        )}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* Approval status */}
              {cond.approved_value != null && (
                <div className="pl-8">
                  <Badge variant="outline" className="text-xs">
                    {cond.rejected
                      ? "Rejected"
                      : `Approved: ${cond.approved_value ? "Yes" : "No"}`}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Extractions section */}
      {extractions.length > 0 && (
        <>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Extractions
            </h3>
          </div>

          <div className="space-y-2">
            {(() => {
              // Group by input_label
              const grouped = new Map<string, ExtractionResult[]>();
              for (const ext of extractions) {
                const key = ext.input_label;
                const arr = grouped.get(key) ?? [];
                arr.push(ext);
                grouped.set(key, arr);
              }

              return Array.from(grouped.entries()).map(([label, items]) => (
                <div key={label} className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium">{label}</p>
                  <div className="space-y-1.5">
                    {items.map((ext) => (
                      <div
                        key={ext.id}
                        className="flex items-start justify-between gap-3 pl-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {ext.ai_value ?? "—"}
                            </span>
                            {ext.confidence != null && (
                              <span className="text-xs text-muted-foreground">
                                ({Math.round(ext.confidence * 100)}%)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ext.document_type_name ?? ext.document_name}
                          </p>
                          {ext.citations?.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              {ext.citations.map((cit, idx) => (
                                <a
                                  key={idx}
                                  href={`/deals/${dealId}/documents/${ext.deal_document_id}`}
                                  className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs hover:underline"
                                >
                                  <FileText className="h-3 w-3 shrink-0" />
                                  Page {cit.page}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        {ext.approved_value != null && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Approved
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </>
      )}
    </div>
  );
}
