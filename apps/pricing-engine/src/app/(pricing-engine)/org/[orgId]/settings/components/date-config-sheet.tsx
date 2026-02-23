"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarIcon, CalendarDays } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import { cn } from "@repo/lib/cn";
import { DatePickerField } from "@/components/date-picker-field";
import type { DateConfig, DateBound } from "@/types/date-config";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DateConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputLabel: string;
  initialConfig: DateConfig | null;
  onSave: (config: DateConfig) => void;
}

type BoundMode = "none" | "fixed" | "dynamic";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function emptyConfig(): DateConfig {
  return { calendar_style: "label", min_date: null, max_date: null };
}

function boundToMode(bound: DateBound | null | undefined): BoundMode {
  if (!bound) return "none";
  return bound.mode;
}

function emptyBound(mode: "fixed" | "dynamic"): DateBound {
  if (mode === "fixed") {
    return { mode: "fixed", fixed_date: null };
  }
  return { mode: "dynamic", offset_sign: "+", offset_amount: 0, offset_unit: "d" };
}

const UNIT_LABELS: Record<string, string> = { d: "Days", m: "Months", y: "Years" };

function describeBound(bound: DateBound | null | undefined): string {
  if (!bound) return "None";
  if (bound.mode === "fixed") {
    return bound.fixed_date ? bound.fixed_date : "Not set";
  }
  const sign = bound.offset_sign === "-" ? "-" : "+";
  const amount = bound.offset_amount ?? 0;
  const unit = UNIT_LABELS[bound.offset_unit ?? "d"] ?? "Days";
  return `Today ${sign} ${amount} ${unit}`;
}

/* -------------------------------------------------------------------------- */
/*  Date Bound Editor                                                          */
/* -------------------------------------------------------------------------- */

function DateBoundEditor({
  label,
  bound,
  mode,
  onModeChange,
  onBoundChange,
}: {
  label: string;
  bound: DateBound | null | undefined;
  mode: BoundMode;
  onModeChange: (mode: BoundMode) => void;
  onBoundChange: (bound: DateBound | null) => void;
}) {
  const handleModeChange = (newMode: string) => {
    const m = newMode as BoundMode;
    onModeChange(m);
    if (m === "none") {
      onBoundChange(null);
    } else {
      onBoundChange(emptyBound(m));
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{label}</Label>
      <Select value={mode} onValueChange={handleModeChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None (no constraint)</SelectItem>
          <SelectItem value="fixed">Fixed Date</SelectItem>
          <SelectItem value="dynamic">Relative to Today</SelectItem>
        </SelectContent>
      </Select>

      {mode === "fixed" && bound && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Select date</Label>
          <DatePickerField
            value={bound.fixed_date ?? undefined}
            onChange={(val) =>
              onBoundChange({ ...bound, fixed_date: val || null })
            }
            emptyOnMount
          />
        </div>
      )}

      {mode === "dynamic" && bound && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Offset from today
          </Label>
          <div className="flex items-center gap-1.5">
            <Select
              value={bound.offset_sign ?? "+"}
              onValueChange={(s) =>
                onBoundChange({ ...bound, offset_sign: s as "+" | "-" })
              }
            >
              <SelectTrigger className="h-8 text-sm w-16 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="-">-</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={bound.offset_amount ?? ""}
              onChange={(e) =>
                onBoundChange({
                  ...bound,
                  offset_amount:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="h-8 text-sm w-20 shrink-0"
            />
            <Select
              value={bound.offset_unit ?? "d"}
              onValueChange={(u) =>
                onBoundChange({
                  ...bound,
                  offset_unit: u as "d" | "m" | "y",
                })
              }
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="d">Days</SelectItem>
                <SelectItem value="m">Months</SelectItem>
                <SelectItem value="y">Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {describeBound(bound)}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DateConfigSheet({
  open,
  onOpenChange,
  inputLabel,
  initialConfig,
  onSave,
}: DateConfigSheetProps) {
  const [config, setConfig] = useState<DateConfig>(
    () => initialConfig ?? emptyConfig(),
  );
  const [minMode, setMinMode] = useState<BoundMode>(() =>
    boundToMode(initialConfig?.min_date),
  );
  const [maxMode, setMaxMode] = useState<BoundMode>(() =>
    boundToMode(initialConfig?.max_date),
  );
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const c = initialConfig ?? emptyConfig();
      setConfig(c);
      setMinMode(boundToMode(c.min_date));
      setMaxMode(boundToMode(c.max_date));
    }
    prevOpenRef.current = open;
  }, [open, initialConfig]);

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Configure Date Settings &mdash; {inputLabel}</SheetTitle>
          <SheetDescription>
            Choose a calendar style and optionally constrain the selectable date
            range for this input.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
          {/* Calendar style */}
          <section className="space-y-3">
            <Label className="text-sm font-semibold">Calendar Style</Label>
            <p className="text-[10px] text-muted-foreground">
              Choose how the month/year navigation appears in the calendar
              popover.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfig((p) => ({ ...p, calendar_style: "label" }))
                }
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                  config.calendar_style !== "dropdown"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted",
                )}
              >
                <CalendarIcon className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">Simple</span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  Arrow navigation only
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfig((p) => ({ ...p, calendar_style: "dropdown" }))
                }
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                  config.calendar_style === "dropdown"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted",
                )}
              >
                <CalendarDays className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">With Dropdowns</span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  Month &amp; year selectors
                </span>
              </button>
            </div>
          </section>

          {/* Earliest date */}
          <section>
            <DateBoundEditor
              label="Earliest Date (Min)"
              bound={config.min_date}
              mode={minMode}
              onModeChange={setMinMode}
              onBoundChange={(b) => setConfig((p) => ({ ...p, min_date: b }))}
            />
          </section>

          {/* Latest date */}
          <section>
            <DateBoundEditor
              label="Latest Date (Max)"
              bound={config.max_date}
              mode={maxMode}
              onModeChange={setMaxMode}
              onBoundChange={(b) => setConfig((p) => ({ ...p, max_date: b }))}
            />
          </section>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function summarizeDateConfig(config: DateConfig | null | undefined): string {
  if (!config) return "";
  const parts: string[] = [];
  if (config.calendar_style === "dropdown") parts.push("dropdown");
  if (config.min_date) parts.push(`min: ${describeBound(config.min_date)}`);
  if (config.max_date) parts.push(`max: ${describeBound(config.max_date)}`);
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}
