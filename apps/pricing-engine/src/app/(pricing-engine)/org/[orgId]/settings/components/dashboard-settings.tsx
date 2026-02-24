"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Sparkles,
  Play,
  Loader2,
  Check,
  Plus,
  Trash2,
  X,
  Pencil,
  Maximize2,
  BarChart3,
  LineChart,
  AreaChart,
  User,
  Bot,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Building2,
  Calculator,
  CreditCard,
  Landmark,
  PiggyBank,
  Wallet,
  Receipt,
  FileText,
  Globe,
  Home,
  ShieldCheck,
  HandCoins,
  Banknote,
  CircleDollarSign,
  BadgeDollarSign,
  ChartLine,
  Activity,
  UserPlus,
  Scale,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  BadgePercent,
  CirclePercent,
  Target,
  Clock,
  CalendarDays,
  Hash,
  Layers,
  FolderOpen,
  FileCheck,
  FileClock,
  ClipboardList,
  ListChecks,
  CheckCircle,
  AlertCircle,
  Star,
  Heart,
  Zap,
  Award,
  Gift,
  Phone,
  Mail,
  MapPin,
  Truck,
  Package,
  ShoppingCart,
  Store,
  Gauge,
  Signal,
  Wifi,
  Lock,
  Unlock,
  Key,
  Eye,
  Settings,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import { ScrollArea } from "@repo/ui/shadcn/scroll-area";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai/prompt-input";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-[200px] items-center justify-center rounded-md border bg-muted/50">
      <Loader2 className="size-4 animate-spin text-muted-foreground" />
    </div>
  ),
});

export const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  CircleDollarSign,
  BadgeDollarSign,
  Banknote,
  HandCoins,
  Coins,
  CreditCard,
  Wallet,
  PiggyBank,
  Landmark,
  Receipt,
  Percent,
  BadgePercent,
  CirclePercent,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChartLine,
  BarChart3,
  LineChart,
  AreaChart,
  Activity,
  Gauge,
  Signal,
  Target,
  Users,
  User,
  UserPlus,
  Briefcase,
  Building2,
  Home,
  Store,
  Globe,
  MapPin,
  Calculator,
  Scale,
  Hash,
  Layers,
  FileText,
  FileCheck,
  FileClock,
  FolderOpen,
  ClipboardList,
  ListChecks,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Eye,
  Star,
  Heart,
  Award,
  Zap,
  Gift,
  Clock,
  CalendarDays,
  Phone,
  Mail,
  Truck,
  Package,
  ShoppingCart,
  Settings,
};

interface DashboardWidget {
  id: number;
  slot: string;
  widget_type: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  trend_label: string | null;
  trend_description: string | null;
  value_format: string | null;
  value_prefix: string | null;
  value_suffix: string | null;
  chart_type: string | null;
  x_axis_key: string | null;
  y_axis_key: string | null;
  sql_query: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type FieldSuggestions = Record<string, string | null>;

export function DashboardSettings() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    Record<string, FieldSuggestions>
  >({});
  const [openSlots, setOpenSlots] = useState<string[]>(["kpi_1"]);
  const [chatWidget, setChatWidget] = useState<DashboardWidget | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { data: unknown; error?: string } | null>
  >({});

  const fetchWidgets = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard-widgets");
      if (!res.ok) return;
      const { widgets: data } = await res.json();
      setWidgets(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const updateWidget = useCallback(
    (slot: string, field: string, value: unknown) => {
      setWidgets((prev) =>
        prev.map((w) => (w.slot === slot ? { ...w, [field]: value } : w))
      );
    },
    []
  );

  const saveWidget = useCallback(
    async (widget: DashboardWidget) => {
      setSaving(widget.slot);
      try {
        const res = await fetch("/api/dashboard-widgets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot: widget.slot,
            title: widget.title,
            subtitle: widget.subtitle,
            icon: widget.icon,
            trend_label: widget.trend_label,
            trend_description: widget.trend_description,
            value_format: widget.value_format,
            value_prefix: widget.value_prefix,
            value_suffix: widget.value_suffix,
            chart_type: widget.chart_type,
            x_axis_key: widget.x_axis_key,
            y_axis_key: widget.y_axis_key,
            sql_query: widget.sql_query,
          }),
        });
        if (!res.ok) {
          console.error("Save failed:", await res.text());
        }
      } finally {
        setSaving(null);
      }
    },
    []
  );

  const testQuery = useCallback(async (widget: DashboardWidget) => {
    if (!widget.sql_query) return;
    setTestResults((prev) => ({
      ...prev,
      [widget.slot]: null,
    }));

    try {
      const res = await fetch("/api/dashboard/data");
      if (!res.ok) {
        setTestResults((prev) => ({
          ...prev,
          [widget.slot]: { data: null, error: `HTTP ${res.status}` },
        }));
        return;
      }
      const all = await res.json();
      const result = all[widget.slot];
      setTestResults((prev) => ({
        ...prev,
        [widget.slot]: result
          ? { data: result.data, error: result.error }
          : { data: null, error: "Widget not found in response" },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [widget.slot]: {
          data: null,
          error: err instanceof Error ? err.message : "Test failed",
        },
      }));
    }
  }, []);

  // openSlots is managed by the Accordion component directly

  const suggestFields = useCallback(
    async (widget: DashboardWidget) => {
      if (!widget.sql_query) return;
      setSuggesting(widget.slot);

      try {
        let conversation: ChatMessage[] = [];
        try {
          const chatsRes = await fetch(
            `/api/dashboard-widgets/chats?widget_id=${widget.id}`
          );
          if (chatsRes.ok) {
            const { chats } = await chatsRes.json();
            if (Array.isArray(chats) && chats.length > 0) {
              const convRes = await fetch(
                `/api/dashboard-widgets/conversations?chat_id=${chats[0].id}`
              );
              if (convRes.ok) {
                const { messages } = await convRes.json();
                conversation = Array.isArray(messages) ? messages : [];
              }
            }
          }
        } catch {
          /* proceed without conversation context */
        }

        const res = await fetch("/api/sql-agent/dashboard/suggest-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widget_type: widget.widget_type,
            sql_query: widget.sql_query,
            conversation,
          }),
        });

        if (!res.ok) {
          console.error("Suggest fields failed:", await res.text());
          return;
        }

        const { suggestions: data } = await res.json();
        if (!data) return;

        setSuggestions((prev) => ({ ...prev, [widget.slot]: data }));
      } finally {
        setSuggesting(null);
      }
    },
    []
  );

  const acceptSuggestion = useCallback(
    (slot: string, field: string) => {
      const s = suggestions[slot];
      if (!s || s[field] === undefined) return;
      setWidgets((prev) =>
        prev.map((w) =>
          w.slot === slot ? { ...w, [field]: s[field] } : w
        )
      );
      setSuggestions((prev) => {
        const updated = { ...prev[slot] };
        delete updated[field];
        if (Object.keys(updated).length === 0) {
          const { [slot]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [slot]: updated };
      });
    },
    [suggestions]
  );

  const acceptAllSuggestions = useCallback(
    (slot: string) => {
      const s = suggestions[slot];
      if (!s) return;
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.slot !== slot) return w;
          const updated = { ...w };
          for (const [field, value] of Object.entries(s)) {
            if (value !== undefined) {
              (updated as Record<string, unknown>)[field] = value;
            }
          }
          return updated as DashboardWidget;
        })
      );
      setSuggestions((prev) => {
        const { [slot]: _, ...rest } = prev;
        return rest;
      });
    },
    [suggestions]
  );

  const dismissSuggestion = useCallback(
    (slot: string, field: string) => {
      setSuggestions((prev) => {
        const current = prev[slot];
        if (!current) return prev;
        const updated = { ...current };
        delete updated[field];
        if (Object.keys(updated).length === 0) {
          const { [slot]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [slot]: updated };
      });
    },
    []
  );

  const dismissAllSuggestions = useCallback((slot: string) => {
    setSuggestions((prev) => {
      const { [slot]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleAcceptSql = useCallback(
    async (slot: string, sql: string, _history: ChatMessage[]) => {
      const widget = widgets.find((w) => w.slot === slot);
      if (!widget) return;

      setWidgets((prev) =>
        prev.map((w) => (w.slot === slot ? { ...w, sql_query: sql } : w))
      );

      await saveWidget({ ...widget, sql_query: sql });
      setChatWidget(null);
    },
    [widgets, saveWidget]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading dashboard configuration...</span>
      </div>
    );
  }

  const kpiWidgets = widgets.filter((w) => w.widget_type === "kpi");
  const chartWidgets = widgets.filter((w) => w.widget_type === "chart");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the KPI widgets and chart displayed on the dashboard. Use
          the AI assistant to generate SQL queries for each widget.
        </p>
      </div>

      <Accordion
        type="multiple"
        value={openSlots}
        onValueChange={setOpenSlots}
        className="space-y-6"
      >
        {/* KPI Widgets */}
        <div className="space-y-3">
          <h3 className="text-base font-medium">KPI Widgets</h3>
          {kpiWidgets.map((w) => (
            <WidgetCard
              key={w.slot}
              widget={w}
              onChange={(field, value) => updateWidget(w.slot, field, value)}
              onSave={() => saveWidget(w)}
              onTest={() => testQuery(w)}
              onOpenChat={() => setChatWidget(w)}
              onSuggestFields={() => suggestFields(w)}
              onAcceptSuggestion={(field) => acceptSuggestion(w.slot, field)}
              onDismissSuggestion={(field) => dismissSuggestion(w.slot, field)}
              onAcceptAllSuggestions={() => acceptAllSuggestions(w.slot)}
              onDismissAllSuggestions={() => dismissAllSuggestions(w.slot)}
              saving={saving === w.slot}
              suggesting={suggesting === w.slot}
              fieldSuggestions={suggestions[w.slot] ?? null}
              testResult={testResults[w.slot]}
            />
          ))}
        </div>

        {/* Chart Widgets */}
        <div className="space-y-3">
          <h3 className="text-base font-medium">Chart Widget</h3>
          {chartWidgets.map((w) => (
            <WidgetCard
              key={w.slot}
              widget={w}
              onChange={(field, value) => updateWidget(w.slot, field, value)}
              onSave={() => saveWidget(w)}
              onTest={() => testQuery(w)}
              onOpenChat={() => setChatWidget(w)}
              onSuggestFields={() => suggestFields(w)}
              onAcceptSuggestion={(field) => acceptSuggestion(w.slot, field)}
              onDismissSuggestion={(field) => dismissSuggestion(w.slot, field)}
              onAcceptAllSuggestions={() => acceptAllSuggestions(w.slot)}
              onDismissAllSuggestions={() => dismissAllSuggestions(w.slot)}
              saving={saving === w.slot}
              suggesting={suggesting === w.slot}
              fieldSuggestions={suggestions[w.slot] ?? null}
              testResult={testResults[w.slot]}
            />
          ))}
        </div>
      </Accordion>

      {/* AI Chat Sheet */}
      <AiChatSheet
        widget={chatWidget}
        open={chatWidget !== null}
        onOpenChange={(open) => {
          if (!open) setChatWidget(null);
        }}
        onAcceptSql={handleAcceptSql}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Widget Card                                                        */
/* ------------------------------------------------------------------ */

interface WidgetCardProps {
  widget: DashboardWidget;
  onChange: (field: string, value: unknown) => void;
  onSave: () => void;
  onTest: () => void;
  onOpenChat: () => void;
  onSuggestFields: () => Promise<void>;
  onAcceptSuggestion: (field: string) => void;
  onDismissSuggestion: (field: string) => void;
  onAcceptAllSuggestions: () => void;
  onDismissAllSuggestions: () => void;
  saving: boolean;
  suggesting: boolean;
  fieldSuggestions: FieldSuggestions | null;
  testResult: { data: unknown; error?: string } | null | undefined;
}

function WidgetCard({
  widget,
  onChange,
  onSave,
  onTest,
  onOpenChat,
  onSuggestFields,
  onAcceptSuggestion,
  onDismissSuggestion,
  onAcceptAllSuggestions,
  onDismissAllSuggestions,
  saving,
  suggesting,
  fieldSuggestions,
  testResult,
}: WidgetCardProps) {
  const [editingSql, setEditingSql] = useState(false);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";
  const isKpi = widget.widget_type === "kpi";
  const slotLabel = isKpi
    ? `KPI ${widget.slot.replace("kpi_", "")}`
    : "Chart";

  return (
    <AccordionItem value={widget.slot} className="rounded-lg border bg-card">
      <AccordionTrigger
        asDiv
        className="px-4 py-3 hover:bg-accent/50 transition-colors hover:no-underline rounded-t-lg"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {(() => {
              if (isKpi && widget.icon && ICON_MAP[widget.icon]) {
                const Icon = ICON_MAP[widget.icon];
                return <Icon className="size-4" />;
              }
              return isKpi ? <BarChart3 className="size-4" /> : <AreaChart className="size-4" />;
            })()}
          </div>
          <div>
            <span className="font-medium text-sm">{widget.title}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({slotLabel})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mr-2">
          {widget.sql_query ? (
            <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-400 dark:border-green-800">
              Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800">
              Not configured
            </Badge>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 space-y-4">
            {/* Display fields header with suggest button */}
            <div className="flex items-center justify-between pt-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Display Fields
              </Label>
              <div className="flex items-center gap-1">
                {fieldSuggestions &&
                  Object.keys(fieldSuggestions).length > 0 && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs text-primary hover:text-primary"
                        onClick={onAcceptAllSuggestions}
                      >
                        <Check className="size-3" />
                        Accept All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs text-muted-foreground"
                        onClick={onDismissAllSuggestions}
                        aria-label="Dismiss suggestions"
                      >
                        <X className="size-3" />
                      </Button>
                    </>
                  )}
                {widget.sql_query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs text-primary hover:text-primary"
                    disabled={suggesting}
                    onClick={onSuggestFields}
                  >
                    {suggesting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3" />
                    )}
                    {suggesting ? "Suggesting..." : "Suggest with AI"}
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-end gap-2">
                  {isKpi && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Icon</Label>
                      <IconPicker
                        value={widget.icon}
                        onChange={(v) => onChange("icon", v)}
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={widget.title}
                      onChange={(e) => onChange("title", e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                {isKpi && (
                  <SuggestionHint
                    value={fieldSuggestions?.icon}
                    onAccept={() => onAcceptSuggestion("icon")}
                    onDismiss={() => onDismissSuggestion("icon")}
                  />
                )}
                <SuggestionHint
                  value={fieldSuggestions?.title}
                  onAccept={() => onAcceptSuggestion("title")}
                  onDismiss={() => onDismissSuggestion("title")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subtitle</Label>
                <Input
                  value={widget.subtitle ?? ""}
                  onChange={(e) =>
                    onChange("subtitle", e.target.value || null)
                  }
                  className="h-9"
                />
                <SuggestionHint
                  value={fieldSuggestions?.subtitle}
                  onAccept={() => onAcceptSuggestion("subtitle")}
                  onDismiss={() => onDismissSuggestion("subtitle")}
                />
              </div>
            </div>

            {isKpi && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Value Format</Label>
                    <Select
                      value={widget.value_format ?? "number"}
                      onValueChange={(v) => onChange("value_format", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="currency">Currency ($)</SelectItem>
                        <SelectItem value="integer">Integer</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <SuggestionHint
                      value={fieldSuggestions?.value_format}
                      onAccept={() => onAcceptSuggestion("value_format")}
                      onDismiss={() => onDismissSuggestion("value_format")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Trend Label</Label>
                    <Input
                      value={widget.trend_label ?? ""}
                      onChange={(e) =>
                        onChange("trend_label", e.target.value || null)
                      }
                      className="h-9"
                      placeholder="e.g. Up this month"
                    />
                    <SuggestionHint
                      value={fieldSuggestions?.trend_label}
                      onAccept={() => onAcceptSuggestion("trend_label")}
                      onDismiss={() => onDismissSuggestion("trend_label")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Trend Description</Label>
                    <Input
                      value={widget.trend_description ?? ""}
                      onChange={(e) =>
                        onChange("trend_description", e.target.value || null)
                      }
                      className="h-9"
                      placeholder="e.g. Total over 6 months"
                    />
                    <SuggestionHint
                      value={fieldSuggestions?.trend_description}
                      onAccept={() => onAcceptSuggestion("trend_description")}
                      onDismiss={() => onDismissSuggestion("trend_description")}
                    />
                  </div>
                </div>
              </>
            )}

            {!isKpi && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Chart Type</Label>
                  <Select
                    value={widget.chart_type ?? "area"}
                    onValueChange={(v) => onChange("chart_type", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="area">
                        <span className="flex items-center gap-2">
                          <AreaChart className="size-3.5" /> Area
                        </span>
                      </SelectItem>
                      <SelectItem value="bar">
                        <span className="flex items-center gap-2">
                          <BarChart3 className="size-3.5" /> Bar
                        </span>
                      </SelectItem>
                      <SelectItem value="line">
                        <span className="flex items-center gap-2">
                          <LineChart className="size-3.5" /> Line
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <SuggestionHint
                    value={fieldSuggestions?.chart_type}
                    onAccept={() => onAcceptSuggestion("chart_type")}
                    onDismiss={() => onDismissSuggestion("chart_type")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">X-Axis Key</Label>
                  <Input
                    value={widget.x_axis_key ?? "date"}
                    onChange={(e) => onChange("x_axis_key", e.target.value)}
                    className="h-9"
                  />
                  <SuggestionHint
                    value={fieldSuggestions?.x_axis_key}
                    onAccept={() => onAcceptSuggestion("x_axis_key")}
                    onDismiss={() => onDismissSuggestion("x_axis_key")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Y-Axis Key</Label>
                  <Input
                    value={widget.y_axis_key ?? "value"}
                    onChange={(e) => onChange("y_axis_key", e.target.value)}
                    className="h-9"
                  />
                  <SuggestionHint
                    value={fieldSuggestions?.y_axis_key}
                    onAccept={() => onAcceptSuggestion("y_axis_key")}
                    onDismiss={() => onDismissSuggestion("y_axis_key")}
                  />
                </div>
              </div>
            )}

            {/* SQL Query */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">SQL Query</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={() => setEditingSql((v) => !v)}
                >
                  {editingSql ? (
                    <>
                      <Check className="size-3" />
                      Done
                    </>
                  ) : (
                    <>
                      <Pencil className="size-3" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
              {editingSql ? (
                <div className="relative overflow-hidden rounded-md border">
                  <MonacoEditor
                    height="220px"
                    language="sql"
                    value={widget.sql_query ?? ""}
                    onChange={(v) => onChange("sql_query", v ?? "")}
                    theme={monacoTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      padding: { top: 12, bottom: 12 },
                      renderLineHighlight: "none",
                      overviewRulerLanes: 0,
                      hideCursorInOverviewRuler: true,
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "hidden",
                      },
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 size-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={() => setSqlModalOpen(true)}
                    aria-label="Expand editor"
                  >
                    <Maximize2 className="size-3.5" />
                  </Button>
                </div>
              ) : widget.sql_query ? (
                <pre className="rounded-md border bg-muted/50 p-3 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {widget.sql_query}
                </pre>
              ) : (
                <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  No SQL query configured. Use the AI assistant to generate
                  one.
                </div>
              )}
            </div>

            {/* SQL Editor Modal */}
            <Dialog open={sqlModalOpen} onOpenChange={setSqlModalOpen}>
              <DialogContent className="max-w-4xl p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                  <DialogTitle className="text-sm font-medium">
                    SQL Query &mdash; {widget.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-hidden">
                  <MonacoEditor
                    height="500px"
                    language="sql"
                    value={widget.sql_query ?? ""}
                    onChange={(v) => onChange("sql_query", v ?? "")}
                    theme={monacoTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      padding: { top: 16, bottom: 16 },
                      renderLineHighlight: "line",
                      overviewRulerLanes: 0,
                      hideCursorInOverviewRuler: true,
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                      },
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Test result */}
            {testResult !== undefined && testResult !== null && (
              <div className="space-y-1.5">
                <Label className="text-xs">Test Result</Label>
                {testResult.error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                    {testResult.error}
                  </div>
                ) : (
                  <pre className="rounded-md border bg-green-50 p-3 text-xs font-mono overflow-x-auto max-h-32 dark:bg-green-950/20">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenChat}
                className="gap-1.5"
              >
                <Sparkles className="size-3.5" />
                Configure with AI
              </Button>
              {widget.sql_query && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTest}
                  className="gap-1.5"
                >
                  <Play className="size-3.5" />
                  Test Query
                </Button>
              )}
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="gap-1.5 ml-auto"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Save
              </Button>
            </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Suggestion Hint                                             */
/* ------------------------------------------------------------------ */

function SuggestionHint({
  value,
  onAccept,
  onDismiss,
}: {
  value: string | null | undefined;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  if (value === undefined || value === null) return null;

  const SuggestedIcon = ICON_MAP[value];

  return (
    <div className="flex w-full items-center gap-0.5 rounded border border-primary/25 bg-primary/5 px-2 py-1">
      {SuggestedIcon ? (
        <SuggestedIcon className="size-3 shrink-0 text-primary/60" />
      ) : (
        <Sparkles className="size-2.5 shrink-0 text-primary/60" />
      )}
      <span className="flex-1 truncate text-[11px] text-primary/80 ml-1">
        {value || "(empty)"}
      </span>
      <button
        type="button"
        onClick={onAccept}
        className="flex size-5 shrink-0 items-center justify-center rounded text-primary/40 hover:text-primary hover:bg-primary/10 transition-colors"
        aria-label="Accept suggestion"
      >
        <Check className="size-3" />
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="Dismiss suggestion"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon Picker                                                        */
/* ------------------------------------------------------------------ */

const ICON_ENTRIES = Object.entries(ICON_MAP);

function IconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iconName: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? ICON_ENTRIES.filter(([name]) =>
        name.toLowerCase().includes(search.toLowerCase())
      )
    : ICON_ENTRIES;

  const SelectedIcon = value ? ICON_MAP[value] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          title={value ?? "Select icon"}
        >
          {SelectedIcon ? (
            <SelectedIcon className="size-4" />
          ) : (
            <Plus className="size-3.5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <ScrollArea className="h-[240px]">
          <div className="grid grid-cols-8 gap-0.5 p-2">
            {filtered.map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                title={name}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors",
                  value === name
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground/80 hover:text-foreground"
                )}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Icon className="size-4" />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-8 py-6 text-center text-xs text-muted-foreground">
                No icons match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Chat Sheet                                                      */
/* ------------------------------------------------------------------ */

interface WidgetChat {
  id: number;
  dashboard_widget_id: number;
  name: string;
  created_at: string;
  last_used_at: string;
}

interface AiChatSheetProps {
  widget: DashboardWidget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptSql: (
    slot: string,
    sql: string,
    history: ChatMessage[]
  ) => void;
}

function AiChatSheet({
  widget,
  open,
  onOpenChange,
  onAcceptSql,
}: AiChatSheetProps) {
  const [chats, setChats] = useState<WidgetChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSql, setLastSql] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chats list when the widget changes; auto-create one only if none exist
  useEffect(() => {
    if (!widget) return;
    let cancelled = false;
    setLoadingChats(true);
    setChats([]);
    setSelectedChatId(null);
    setMessages([]);
    setLastSql(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/dashboard-widgets/chats?widget_id=${widget.id}`
        );
        if (!res.ok || cancelled) return;
        const { chats: data } = await res.json();
        if (cancelled) return;

        if (!Array.isArray(data) || data.length === 0) {
          const createRes = await fetch("/api/dashboard-widgets/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ widget_id: widget.id }),
          });
          if (cancelled) return;
          if (createRes.ok) {
            const { chat } = await createRes.json();
            if (!cancelled && chat) {
              setChats([chat]);
              setSelectedChatId(chat.id);
            }
          }
        } else {
          setChats(data);
          setSelectedChatId(data[0].id);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingChats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [widget]);

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLastSql(null);
    setLoadingHistory(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/dashboard-widgets/conversations?chat_id=${selectedChatId}`
        );
        if (!res.ok || cancelled) {
          setMessages([]);
          return;
        }
        const { messages: history } = await res.json();
        if (!cancelled) {
          setMessages(
            Array.isArray(history)
              ? history.map((m: { role: string; content: string }) => ({
                  role: m.role as "user" | "assistant",
                  content: m.content,
                }))
              : []
          );
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedChatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createChat = useCallback(async () => {
    if (!widget) return;
    try {
      const res = await fetch("/api/dashboard-widgets/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widget_id: widget.id }),
      });
      if (!res.ok) return;
      const { chat } = await res.json();
      if (chat) {
        setChats((prev) => [chat, ...prev]);
        setSelectedChatId(chat.id);
      }
    } catch {
      /* ignore */
    }
  }, [widget]);

  const deleteChat = useCallback(
    async (chatId: number) => {
      try {
        await fetch(`/api/dashboard-widgets/chats?chat_id=${chatId}`, {
          method: "DELETE",
        });
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
          setMessages([]);
        }
      } catch {
        /* ignore */
      }
    },
    [selectedChatId]
  );

  const persistMessages = useCallback(
    async (msgs: ChatMessage[]) => {
      if (!widget || !selectedChatId || msgs.length === 0) return;
      await fetch("/api/dashboard-widgets/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widget_id: widget.id,
          chat_id: selectedChatId,
          messages: msgs,
        }),
      }).catch(() => {});
    },
    [widget, selectedChatId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating || !widget || !selectedChatId) return;

      const userMsg: ChatMessage = { role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsGenerating(true);
      setLastSql(null);

      await persistMessages([userMsg]);

      try {
        const res = await fetch("/api/sql-agent/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            widgetType: widget.widget_type,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: fullText },
          ]);
        }

        const trimmed = fullText.trim();
        const isSql =
          /^(SELECT|WITH)\b/i.test(trimmed) &&
          !trimmed.startsWith("Sure") &&
          !trimmed.startsWith("I ");
        if (isSql) {
          setLastSql(trimmed);
        }

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: fullText,
        };
        setMessages([...updatedMessages, assistantMsg]);
        await persistMessages([assistantMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to generate"}`,
        };
        setMessages([...updatedMessages, errorMsg]);
        await persistMessages([errorMsg]);
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, messages, widget, selectedChatId, persistMessages]
  );

  if (!widget) return null;

  const slotLabel =
    widget.widget_type === "kpi"
      ? `KPI ${widget.slot.replace("kpi_", "")}: ${widget.title}`
      : `Chart: ${widget.title}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI SQL Assistant
          </SheetTitle>
          <SheetDescription>{slotLabel}</SheetDescription>
        </SheetHeader>

        {/* Chat tabs bar */}
        <div className="flex items-center border-b">
          <div className="flex flex-1 items-center overflow-x-auto">
            {loadingChats && (
              <div className="px-4 py-2">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              </div>
            )}
            {chats.map((c) => {
              const isActive = selectedChatId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    "group relative flex items-center gap-1.5 border-r px-3 py-2 text-xs transition-colors",
                    isActive
                      ? "bg-background text-foreground"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                  onClick={() => setSelectedChatId(c.id)}
                >
                  <span className="max-w-[120px] truncate">{c.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm transition-colors",
                      isActive
                        ? "text-muted-foreground/60 hover:text-foreground hover:bg-muted"
                        : "opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-foreground hover:bg-muted"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(c.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        deleteChat(c.id);
                      }
                    }}
                    aria-label="Close chat"
                  >
                    <X className="size-3" />
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center justify-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l"
            onClick={createChat}
            aria-label="New chat"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* Context hint */}
        <div className="border-b bg-muted/30 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Describe what data this{" "}
            {widget.widget_type === "kpi" ? "KPI" : "chart"} should show. The AI
            will generate a SQL query or ask clarifying questions.
            {widget.widget_type === "kpi"
              ? " The query must return value and trend_pct columns."
              : " The query must return date and value columns."}
          </p>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {!selectedChatId && !loadingChats && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Select a chat or click <Plus className="inline size-3.5" /> to start a new one.
            </div>
          )}
          {loadingHistory && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading conversation...
            </div>
          )}
          {!loadingHistory && selectedChatId && messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Start a conversation to configure this widget&apos;s data query.
            </div>
          )}
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const isSqlMsg =
              !isUser &&
              /^(SELECT|WITH)\b/i.test(m.content.trim()) &&
              !m.content.trim().startsWith("Sure") &&
              !m.content.trim().startsWith("I ");

            return (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {!isUser && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : isSqlMsg
                        ? "bg-muted/50 border font-mono text-xs whitespace-pre-wrap"
                        : "bg-muted/50"
                  )}
                >
                  {isUser || isSqlMsg ? (
                    m.content
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent">
                    <User className="size-3.5" />
                  </div>
                )}
              </div>
            );
          })}
          {isGenerating && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="size-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Accept button */}
        {lastSql && !isGenerating && (
          <div className="border-t bg-green-50 px-6 py-3 dark:bg-green-950/20">
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={() => onAcceptSql(widget.slot, lastSql, messages)}
            >
              <Check className="size-3.5" />
              Accept SQL &amp; Save
            </Button>
          </div>
        )}

        {/* Prompt Input */}
        <div className="border-t px-4 py-3">
          <PromptInput
            onSubmit={async ({ text }) => {
              await sendMessage(text);
            }}
          >
            <PromptInputTextarea
              placeholder={
                !selectedChatId
                  ? "Create a new chat first..."
                  : messages.length === 0
                    ? `Describe what this ${widget.widget_type === "kpi" ? "KPI" : "chart"} should show...`
                    : "Reply or ask for changes..."
              }
              disabled={isGenerating || !selectedChatId}
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit
                disabled={!selectedChatId}
                status={isGenerating ? "streaming" : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </SheetContent>
    </Sheet>
  );
}
