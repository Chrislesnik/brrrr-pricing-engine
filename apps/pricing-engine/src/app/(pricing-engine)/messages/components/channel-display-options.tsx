"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "@repo/lib/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";

// ─── Types ───────────────────────────────────────────────────────────
export type GroupByOption =
  | "none"
  | "stage"
  | "loan_officer"
  | "broker"
  | "primary_user"
  | "archived";

export type SortByOption = "name" | "created_at" | "unread";

export interface ChannelDisplaySettings {
  groupBy: GroupByOption;
  sortBy: SortByOption;
  sortAscending: boolean;
  showArchived: boolean;
  showEmptyGroups: boolean;
}

export const DEFAULT_DISPLAY_SETTINGS: ChannelDisplaySettings = {
  groupBy: "none",
  sortBy: "name",
  sortAscending: true,
  showArchived: true,
  showEmptyGroups: false,
};

// ─── Options ─────────────────────────────────────────────────────────
const GROUP_OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: "none", label: "None" },
  { value: "stage", label: "Deal Stage" },
  { value: "loan_officer", label: "Loan Officer" },
  { value: "broker", label: "Broker" },
  { value: "primary_user", label: "Primary User" },
  { value: "archived", label: "Archived Status" },
];

const SORT_OPTIONS: { value: SortByOption; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Date Created" },
  { value: "unread", label: "Unread Count" },
];

// ─── Persistence Hook ────────────────────────────────────────────────
const STORAGE_KEY = "messages_display_settings";

export function usePersistedDisplaySettings(): [
  ChannelDisplaySettings,
  (updates: Partial<ChannelDisplaySettings>) => void,
] {
  const [settings, setSettings] = useState<ChannelDisplaySettings>(
    DEFAULT_DISPLAY_SETTINGS
  );

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ChannelDisplaySettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<ChannelDisplaySettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });
    },
    []
  );

  return [settings, updateSettings];
}

// ─── Component ───────────────────────────────────────────────────────
interface ChannelDisplayOptionsProps {
  settings: ChannelDisplaySettings;
  onUpdate: (updates: Partial<ChannelDisplaySettings>) => void;
}

export function ChannelDisplayOptions({
  settings,
  onUpdate,
}: ChannelDisplayOptionsProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Click outside to close (excluding Radix popper content)
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        btnRef.current?.contains(target) ||
        (target instanceof Element &&
          (target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("[role='listbox']") ||
            target.closest("[role='option']")))
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Position popover below button
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  const isModified =
    settings.groupBy !== DEFAULT_DISPLAY_SETTINGS.groupBy ||
    settings.sortBy !== DEFAULT_DISPLAY_SETTINGS.sortBy ||
    settings.sortAscending !== DEFAULT_DISPLAY_SETTINGS.sortAscending ||
    settings.showArchived !== DEFAULT_DISPLAY_SETTINGS.showArchived ||
    settings.showEmptyGroups !== DEFAULT_DISPLAY_SETTINGS.showEmptyGroups;

  // Count active modifications for badge
  const modifiedCount = [
    settings.groupBy !== DEFAULT_DISPLAY_SETTINGS.groupBy,
    settings.sortBy !== DEFAULT_DISPLAY_SETTINGS.sortBy,
    settings.sortAscending !== DEFAULT_DISPLAY_SETTINGS.sortAscending,
    settings.showArchived !== DEFAULT_DISPLAY_SETTINGS.showArchived,
    settings.showEmptyGroups !== DEFAULT_DISPLAY_SETTINGS.showEmptyGroups,
  ].filter(Boolean).length;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center justify-center rounded-md transition-colors shrink-0",
          "h-8 w-8",
          open
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isModified && !open && "text-primary"
        )}
        title={
          isModified
            ? `Display options (${modifiedCount} active)`
            : "Display options"
        }
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {isModified && !open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground px-[3px]">
            {modifiedCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[9999] w-[280px] rounded-lg border bg-card shadow-lg"
            style={{ top: popoverPos.top, left: popoverPos.left }}
          >
            {/* Grouping */}
            <div className="px-3 py-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Group by</span>
                </div>
                <Select
                  value={settings.groupBy}
                  onValueChange={(v) =>
                    onUpdate({ groupBy: v as GroupByOption })
                  }
                >
                  <SelectTrigger className="h-7 w-auto min-w-0 rounded-md border bg-muted/60 px-2 text-xs [&>svg]:h-3 [&>svg]:w-3 gap-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {GROUP_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>Sort by</span>
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    value={settings.sortBy}
                    onValueChange={(v) =>
                      onUpdate({ sortBy: v as SortByOption })
                    }
                  >
                    <SelectTrigger className="h-7 w-auto min-w-0 rounded-md border bg-muted/60 px-2 text-xs [&>svg]:h-3 [&>svg]:w-3 gap-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-xs"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() =>
                      onUpdate({ sortAscending: !settings.sortAscending })
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                    title={settings.sortAscending ? "Ascending" : "Descending"}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Toggles */}
            <div className="px-3 py-3 space-y-2.5">
              {/* Show archived */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Show archived
                </span>
                <button
                  title="Toggle show archived channels"
                  onClick={() =>
                    onUpdate({ showArchived: !settings.showArchived })
                  }
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
                    settings.showArchived ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform mt-0.5",
                      settings.showArchived
                        ? "translate-x-4 ml-0.5"
                        : "translate-x-0 ml-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Show empty groups (only relevant when groupBy is not "none") */}
              {settings.groupBy !== "none" && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Show empty groups
                  </span>
                  <button
                    title="Toggle show empty groups"
                    onClick={() =>
                      onUpdate({ showEmptyGroups: !settings.showEmptyGroups })
                    }
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
                      settings.showEmptyGroups ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform mt-0.5",
                        settings.showEmptyGroups
                          ? "translate-x-4 ml-0.5"
                          : "translate-x-0 ml-0.5"
                      )}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Reset */}
            {isModified && (
              <>
                <div className="border-t" />
                <div className="px-3 py-2 flex justify-center">
                  <button
                    onClick={() => onUpdate(DEFAULT_DISPLAY_SETTINGS)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
