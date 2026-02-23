"use client";

import * as React from "react";
import { useState, useTransition, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  getMemberRolesForPolicies,
  type MemberRoleOption,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/member-roles-api";
import {
  saveOrgPolicy,
  setOrgPolicyActive,
  updateOrgPolicy,
  deleteOrgPolicy,
  getAvailableResources,
  getColumnFilters,
  getNamedScopeRegistry,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/actions";
import {
  FEATURE_RESOURCES,
  type OrgPolicyRow,
  type ConditionInput,
  type ScopeConditionInput,
  type PolicyDefinitionInput,
  type PolicyScope,
  type PolicyEffect,
  type PolicyAction,
  type ResourceType,
  type NamedScopeRow,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/constants";
import {
  PolicyConditionRow,
  type ConditionFieldOption,
  type ConditionState,
} from "@/components/policies/policy-condition-row";
import { Button } from "@repo/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";
import { Badge } from "@repo/ui/shadcn/badge";
import { Label } from "@repo/ui/shadcn/label";
import { Switch } from "@repo/ui/shadcn/switch";
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
  CommandSeparator,
} from "@repo/ui/shadcn/command";
import { Separator } from "@repo/ui/shadcn/separator";
import { RadioGroup, RadioGroupItem } from "@repo/ui/shadcn/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/shadcn/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
} from "@repo/ui/shadcn/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/shadcn/sheet";
import {
  ChevronsUpDown,
  Check,
  X,
  Plus,
  Workflow,
  Archive,
  Lock,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Kanban,
  Table2,
  LayoutGrid,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Info,
} from "lucide-react";
import { cn } from "@repo/lib/cn";

// ============================================================================
// Constants
// ============================================================================

const orgRoleValueOptions = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "broker", label: "Broker" },
];

const orgTypeValueOptions = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
];

const userTypeValueOptions = [
  { value: "yes", label: "Internal" },
  { value: "no", label: "External" },
];

const standardOperators = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
];

const dataActionOptions = [
  { value: "select", label: "Select" },
  { value: "insert", label: "Insert" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
];

const featureActionOptions = [
  { value: "submit", label: "Submit" },
  { value: "view", label: "View" },
];

const resourceScopeOptions = [
  { value: "table:*", label: "All Tables" },
  { value: "storage_bucket:*", label: "All Storage Buckets" },
  { value: "feature:settings_*", label: "All Settings" },
  { value: "route:*", label: "All Routes" },
];

const SCOPE_SUBJECTS: Array<{ value: string; label: string; description: string }> = [
  { value: "active_org", label: "Active Organization", description: "organizations.id of the logged-in org" },
  { value: "current_user_clerk", label: "Logged-in User (Clerk ID)", description: "users.clerk_user_id from JWT" },
  { value: "current_user_pk", label: "Logged-in User (User ID)", description: "users.id resolved from JWT" },
];

const SCOPE_OPERATORS: Array<{ value: string; label: string }> = [
  { value: "is", label: "IS" },
  { value: "is_not", label: "IS NOT" },
  { value: "is_one_of", label: "IS ONE OF" },
  { value: "is_not_one_of", label: "IS NOT ONE OF" },
  { value: "contains", label: "CONTAINS" },
  { value: "not_contains", label: "DOES NOT CONTAIN" },
];

type ScopeConditionState = {
  subject: string;
  operator: string;
  targetColumn: string;
};

const defaultScopeCondition: ScopeConditionState = {
  subject: "active_org",
  operator: "is",
  targetColumn: "",
};

function scopeConditionsToLegacyScope(conditions: ScopeConditionState[]): PolicyScope {
  if (conditions.length === 0) return "all";
  const hasOrg = conditions.some((c) => c.subject === "active_org" && c.operator === "is");
  const hasUser = conditions.some(
    (c) => (c.subject === "current_user_clerk" || c.subject === "current_user_pk") && c.operator === "is"
  );
  if (hasOrg && hasUser) return "org_and_user";
  if (hasOrg) return "org_records";
  if (hasUser) return "user_records";
  return "all";
}

function legacyScopeToConditions(scope: PolicyScope): ScopeConditionState[] {
  switch (scope) {
    case "org_records":
      return [{ subject: "active_org", operator: "is", targetColumn: "org_id" }];
    case "user_records":
      return [{ subject: "current_user_clerk", operator: "is", targetColumn: "created_by" }];
    case "org_and_user":
      return [
        { subject: "active_org", operator: "is", targetColumn: "org_id" },
        { subject: "current_user_clerk", operator: "is", targetColumn: "created_by" },
      ];
    default:
      return [];
  }
}

function buildScopeTargetOptions(
  selectedResources: string[],
  columnFilters: Array<{ table_name: string; org_column: string | null; user_column: string | null }>
): Array<{ value: string; label: string }> {
  const isWildcard = selectedResources.some((r) => r.endsWith(":*"));

  if (isWildcard) {
    const allCols = new Set<string>();
    for (const f of columnFilters) {
      if (f.org_column) allCols.add(f.org_column);
      if (f.user_column) allCols.add(f.user_column);
    }
    return Array.from(allCols)
      .sort()
      .map((col) => ({ value: col, label: `{resource}.${col}` }));
  }

  const opts: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();

  for (const r of selectedResources) {
    const tableName = r.split(":")[1];
    if (!tableName || tableName === "*") continue;

    const filter = columnFilters.find((f) => f.table_name === tableName);
    if (filter?.org_column && !seen.has(`${tableName}.${filter.org_column}`)) {
      const key = `${tableName}.${filter.org_column}`;
      seen.add(key);
      opts.push({ value: key, label: key });
    }
    if (filter?.user_column && !seen.has(`${tableName}.${filter.user_column}`)) {
      const key = `${tableName}.${filter.user_column}`;
      seen.add(key);
      opts.push({ value: key, label: key });
    }
  }

  return opts.sort((a, b) => a.label.localeCompare(b.label));
}

const defaultCondition: ConditionState = {
  field: "org_role",
  operator: "is",
  values: [],
};

// ============================================================================
// Multi-Select Chips Component (reused for SET and ON)
// ============================================================================

function ChipsSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between font-normal h-auto min-h-9 shadow-xs"
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((v) => {
                const opt = options.find((o) => o.value === v);
                return (
                  <Badge key={v} variant="secondary" className="text-xs gap-1 pr-1">
                    {opt?.label ?? v}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 cursor-pointer"
                      aria-label={`Remove ${opt?.label ?? v}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(v);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          toggle(v);
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                );
              })
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <Command>
          <CommandList>
            <CommandEmpty>No options.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggle(opt.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/25"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Grouped Resource Multi-Select
// ============================================================================

interface ResourceOption {
  value: string;
  label: string;
}

function ResourceChipsSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: ResourceOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  // Helper: format a chip label with a category prefix for clarity
  function chipLabel(value: string, label: string): string {
    if (value.endsWith(":*") || value.endsWith("_*")) return label; // wildcards
    if (value.startsWith("table:")) return `Table: ${label}`;
    if (value.startsWith("storage_bucket:")) return `Bucket: ${label}`;
    if (value.startsWith("feature:")) return `Feature: ${label}`;
    if (value.startsWith("route:")) return `Route: ${label}`;
    return label;
  }

  // Group options by prefix
  const isWildcard = (o: ResourceOption) =>
    o.value.endsWith(":*") || o.value.endsWith("_*");
  const wildcards = options.filter(isWildcard);
  const tables = options.filter(
    (o) => o.value.startsWith("table:") && !isWildcard(o)
  );
  const buckets = options.filter(
    (o) => o.value.startsWith("storage_bucket:") && !isWildcard(o)
  );
  const features = options.filter(
    (o) => o.value.startsWith("feature:") && !isWildcard(o)
  );
  const routes = options.filter(
    (o) => o.value.startsWith("route:") && !isWildcard(o)
  );

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    tables: true,
    buckets: true,
  });

  function toggleCollapse(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function renderItem(opt: ResourceOption) {
    const isSelected = selected.includes(opt.value);
    return (
      <CommandItem
        key={opt.value}
        value={opt.value}
        keywords={[opt.label]}
        onSelect={() => toggle(opt.value)}
        className="whitespace-nowrap"
      >
        <div
          className={cn(
            "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/25"
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
        <span className="truncate">{opt.label}</span>
      </CommandItem>
    );
  }

  function renderCollapsibleGroup(
    key: string,
    heading: string,
    items: ResourceOption[],
    showSeparator: boolean
  ) {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[key] ?? false;
    const selectedCount = items.filter((o) => selected.includes(o.value)).length;
    return (
      <React.Fragment key={key}>
        {showSeparator && <CommandSeparator />}
        <div>
          <button
            type="button"
            onClick={() => toggleCollapse(key)}
            className="flex w-full items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronDown className="h-3 w-3 shrink-0" />
            )}
            <span>{heading}</span>
            <span className="ml-auto text-[10px] tabular-nums">
              {selectedCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] font-normal">
                  {selectedCount}
                </Badge>
              )}
              <span className="ml-1 opacity-60">{items.length}</span>
            </span>
          </button>
          {!isCollapsed && (
            <CommandGroup>{items.map(renderItem)}</CommandGroup>
          )}
        </div>
      </React.Fragment>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between font-normal h-auto min-h-9 shadow-xs"
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((v) => {
                const opt = options.find((o) => o.value === v);
                const display = opt ? chipLabel(v, opt.label) : v;
                return (
                  <Badge key={v} variant="secondary" className="text-xs gap-1 pr-1">
                    {display}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 cursor-pointer"
                      aria-label={`Remove ${display}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(v);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          toggle(v);
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                );
              })
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[420px]"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search resources..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No resources found.</CommandEmpty>

            {wildcards.length > 0 && (
              <CommandGroup heading="Wildcards">
                {wildcards.map(renderItem)}
              </CommandGroup>
            )}

            {renderCollapsibleGroup("tables", "Tables", tables, wildcards.length > 0)}
            {renderCollapsibleGroup("buckets", "Storage Buckets", buckets, wildcards.length > 0 || tables.length > 0)}
            {renderCollapsibleGroup("features", "Features", features, wildcards.length > 0 || tables.length > 0 || buckets.length > 0)}
            {renderCollapsibleGroup("routes", "Routes", routes, wildcards.length > 0 || tables.length > 0 || buckets.length > 0 || features.length > 0)}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Scope Condition Builder
// ============================================================================

function ScopeConditionBuilder({
  scopeConditions,
  setScopeConditions,
  scopeConnector,
  setScopeConnector,
  scopeEnabled,
  hasOnlyFeatures,
  selectedResources,
  columnFilters,
  namedScopeRegistry,
  selectedNamedScopes,
  setSelectedNamedScopes,
}: {
  scopeConditions: ScopeConditionState[];
  setScopeConditions: (c: ScopeConditionState[]) => void;
  scopeConnector: "AND" | "OR";
  setScopeConnector: (c: "AND" | "OR") => void;
  scopeEnabled: boolean;
  hasOnlyFeatures: boolean;
  selectedResources: string[];
  columnFilters: Array<{ table_name: string; org_column: string | null; user_column: string | null; named_scopes: string[] }>;
  namedScopeRegistry: NamedScopeRow[];
  selectedNamedScopes: string[];
  setSelectedNamedScopes: (s: string[]) => void;
}) {
  const targetOptions = useMemo(
    () => buildScopeTargetOptions(selectedResources, columnFilters),
    [selectedResources, columnFilters]
  );

  // Determine which named scopes are available for the currently selected tables
  const availableNamedScopes = useMemo(() => {
    const tableNames = selectedResources
      .filter((r) => r.startsWith("table:") && !r.endsWith(":*"))
      .map((r) => r.slice("table:".length));

    if (selectedResources.some((r) => r === "table:*")) {
      // Wildcard: show all named scopes
      return namedScopeRegistry;
    }

    const applicableNames = new Set<string>();
    for (const tableName of tableNames) {
      const filter = columnFilters.find((f) => f.table_name === tableName);
      for (const ns of filter?.named_scopes ?? []) applicableNames.add(ns);
    }
    return namedScopeRegistry.filter((ns) => applicableNames.has(ns.name));
  }, [selectedResources, columnFilters, namedScopeRegistry]);

  const hasNamedScopes = availableNamedScopes.length > 0;
  const usingNamedScope = selectedNamedScopes.length > 0;

  function toggleNamedScope(name: string) {
    if (selectedNamedScopes.includes(name)) {
      setSelectedNamedScopes(selectedNamedScopes.filter((s) => s !== name));
    } else {
      // Named scopes and column conditions are mutually exclusive
      setScopeConditions([]);
      setSelectedNamedScopes([...selectedNamedScopes, name]);
    }
  }

  function updateCondition(idx: number, patch: Partial<ScopeConditionState>) {
    const updated = [...scopeConditions];
    updated[idx] = { ...updated[idx], ...patch };
    setScopeConditions(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">WHERE</h3>
        {!scopeEnabled && (
          <span className="text-xs text-muted-foreground">
            {hasOnlyFeatures
              ? "(not applicable — add a table or storage resource to enable row-level filtering)"
              : "(not applicable — selected resource has no ownership columns)"}
          </span>
        )}
        {scopeEnabled && !usingNamedScope && scopeConditions.length === 0 && (
          <span className="text-xs text-muted-foreground">
            all records (no row-level filter)
          </span>
        )}
      </div>

      {/* Named scope predicates (Option B/C) — shown when selected table has registered named scopes */}
      {scopeEnabled && hasNamedScopes && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Named Scopes
          </p>
          <p className="text-xs text-muted-foreground -mt-1">
            Multi-hop predicates evaluated via the named scope dispatcher.
            Selecting one disables column-level WHERE conditions.
          </p>
          {availableNamedScopes.map((ns) => (
            <label
              key={ns.name}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                checked={selectedNamedScopes.includes(ns.name)}
                onChange={() => toggleNamedScope(ns.name)}
              />
              <div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                  {ns.label}
                </span>
                {ns.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{ns.description}</p>
                )}
                <code className="text-[10px] text-muted-foreground font-mono">
                  named:{ns.name}{ns.uses_precomputed ? " · precomputed" : " · live subquery"}
                </code>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Column-level scope conditions — disabled when a named scope is active */}
      {scopeEnabled && !usingNamedScope && scopeConditions.length > 0 && (
        <div className="space-y-2 rounded-lg border p-4">
          {scopeConditions.map((sc, idx) => (
            <div key={`scope-${idx}`}>
              {idx > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setScopeConnector(scopeConnector === "AND" ? "OR" : "AND")
                    }
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {scopeConnector}
                  </button>
                  <Separator className="flex-1" />
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={sc.subject}
                  onValueChange={(v) => updateCondition(idx, { subject: v })}
                >
                  <SelectTrigger className="w-auto min-w-[180px] h-9 text-xs">
                    <span className="truncate">
                      {SCOPE_SUBJECTS.find((s) => s.value === sc.subject)?.label ?? sc.subject}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="z-[10000] min-w-[300px]">
                    {SCOPE_SUBJECTS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        <div>
                          <span className="font-medium">{s.label}</span>
                          <span className="ml-2 text-[10px] text-muted-foreground">{s.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sc.operator}
                  onValueChange={(v) => updateCondition(idx, { operator: v })}
                >
                  <SelectTrigger className="w-auto min-w-[80px] h-9 text-xs font-semibold">
                    <span className="truncate">
                      {SCOPE_OPERATORS.find((o) => o.value === sc.operator)?.label ?? sc.operator}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {SCOPE_OPERATORS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs font-semibold">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sc.targetColumn || "_placeholder"}
                  onValueChange={(v) => { if (v !== "_placeholder") updateCondition(idx, { targetColumn: v }); }}
                >
                  <SelectTrigger className={cn(
                    "w-auto min-w-[220px] h-9 text-xs font-mono",
                    !sc.targetColumn && "text-muted-foreground"
                  )}>
                    <span className="truncate">
                      {sc.targetColumn || "Select column..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="z-[10000] min-w-[280px]">
                    {targetOptions.length > 0 ? (
                      targetOptions.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs font-mono">
                          {t.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_placeholder" disabled className="text-xs text-muted-foreground">
                        No columns available for selected resource
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setScopeConditions(scopeConditions.filter((_, i) => i !== idx))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScopeConditions([...scopeConditions, { ...defaultScopeCondition }])}
            className="mt-2 gap-1 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Scope Condition
          </Button>
        </div>
      )}

      {scopeEnabled && !usingNamedScope && scopeConditions.length === 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setScopeConditions([{ ...defaultScopeCondition }])}
          className="gap-1 text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Add Scope Condition
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

// ============================================================================
// Helper: extract human-readable summary from a policy's definition_json
// ============================================================================

type RuleCondition = { field: string; operator: string; values: string[] };
type RuleGroup = { conditions?: RuleCondition[]; connector?: string; scope?: string };

function summarizeConditions(policy: OrgPolicyRow): string {
  const def = policy.definition_json as {
    conditions?: RuleCondition[];
    rules?: RuleGroup[];
    connector?: string;
    allow_internal_users?: boolean;
  };
  const compiled = policy.compiled_config as {
    rules?: RuleGroup[];
    allow_internal_users?: boolean;
  };

  const fieldLabels: Record<string, string> = {
    org_role: "Org Role",
    member_role: "Member Role",
    org_type: "Org Type",
    internal_user: "User Type",
  };

  function conditionText(conds: RuleCondition[], connector = "AND"): string {
    const parts = conds.map((c) => {
      const label = fieldLabels[c.field] ?? c.field;
      const op = c.operator === "is_not" ? "≠" : "=";
      return `${label} ${op} ${c.values.join(" / ")}`;
    });
    return parts.join(` ${connector} `);
  }

  // V3: prefer compiled_config.rules, fall back to definition_json.rules
  const rules: RuleGroup[] | undefined = compiled?.rules ?? def?.rules;

  if (rules?.length) {
    const nonEmptyRules = rules.filter((r) => r.conditions?.length);
    if (!nonEmptyRules.length) {
      return compiled?.allow_internal_users ? "Internal users only" : "No conditions";
    }
    if (nonEmptyRules.length === 1) {
      const r = nonEmptyRules[0];
      return conditionText(r.conditions!, r.connector ?? "AND");
    }
    // Multi-rule (Tier 1-3 style): show each rule's conditions separated by " OR "
    return nonEmptyRules
      .map((r) => `(${conditionText(r.conditions!, r.connector ?? "AND")})`)
      .join(" OR ");
  }

  // V2 fallback: top-level conditions array
  if (!def?.conditions?.length) {
    return def?.allow_internal_users ? "Internal users only" : "No conditions";
  }
  const joined = conditionText(def.conditions, def.connector ?? "AND");
  if (def.allow_internal_users) return `${joined} (+ internal bypass)`;
  return joined;
}

// Represents a single V3 rule group as stored in compiled_config / definition_json
type V3Rule = {
  conditions?: Array<{ field: string; operator: string; values: string[] }>;
  connector?: "AND" | "OR";
  scope?: string;
  named_scope_conditions?: Array<{ name: string }>;
};

function loadPolicyIntoForm(
  policy: OrgPolicyRow,
  setters: {
    setConditions: (c: ConditionState[]) => void;
    setConnector: (c: "AND" | "OR") => void;
    setAllowInternalUsers: (b: boolean) => void;
    setSelectedActions: (a: string[]) => void;
    setSelectedResources: (r: string[]) => void;
    setSelectedScope: (s: PolicyScope) => void;
    setScopeConditions: (c: ScopeConditionState[]) => void;
    setScopeConnector: (c: "AND" | "OR") => void;
    setSelectedEffect: (e: PolicyEffect) => void;
    setEditingPolicyId: (id: string | null) => void;
    setSelectedNamedScopes: (s: string[]) => void;
  }
) {
  const def = policy.definition_json as {
    conditions?: Array<{ field: string; operator: string; values: string[] }>;
    rules?: V3Rule[];
    connector?: "AND" | "OR";
    allow_internal_users?: boolean;
    scope?: PolicyScope;
    effect?: PolicyEffect;
    scope_conditions?: Array<{ column: string; operator: string; reference: string }>;
    scope_connector?: "AND" | "OR";
    named_scope_conditions?: Array<{ name: string }>;
  };

  const compiled = policy.compiled_config as {
    rules?: V3Rule[];
    allow_internal_users?: boolean;
  };

  // For V3 policies, conditions live in rules[]. Use the first rule as the
  // editable representation. If compiled_config has rules, prefer that since
  // it is always authoritative (definition_json may omit rules for seeded policies).
  const v3Rules = compiled?.rules ?? def?.rules ?? [];
  const firstRule: V3Rule | undefined = v3Rules[0];

  // Prefer definition_json top-level conditions (UI-created V2/V3 single-rule),
  // then fall back to first V3 rule's conditions.
  const resolvedConditions =
    def?.conditions?.length
      ? def.conditions
      : firstRule?.conditions ?? [];

  const resolvedConnector =
    def?.connector ?? firstRule?.connector ?? "AND";

  // Scope: prefer definition_json.scope, then first rule's scope (strip 'named:' prefix
  // for legacy scope resolution — named scopes are handled separately below).
  const rawFirstRuleScope = firstRule?.scope ?? "";
  const resolvedLegacyScope: PolicyScope =
    def?.scope ??
    (rawFirstRuleScope.startsWith("named:")
      ? "all"
      : (rawFirstRuleScope as PolicyScope) || policy.scope || "all");

  setters.setConditions(
    resolvedConditions.length
      ? resolvedConditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          values: c.values,
        }))
      : [{ ...defaultCondition }]
  );
  setters.setConnector(resolvedConnector as "AND" | "OR");
  setters.setAllowInternalUsers(
    def?.allow_internal_users ?? compiled?.allow_internal_users ?? false
  );
  setters.setSelectedActions([policy.action === "all" ? "select" : policy.action]);
  setters.setSelectedResources([`${policy.resource_type}:${policy.resource_name}`]);
  setters.setSelectedEffect(policy.effect ?? def?.effect ?? "ALLOW");
  setters.setEditingPolicyId(policy.id);

  // Restore named scope conditions — check definition_json, then first V3 rule
  const namedFromDef = def?.named_scope_conditions ?? [];
  const namedFromRule = firstRule?.named_scope_conditions ?? [];
  const resolvedNamedScopes = namedFromDef.length ? namedFromDef : namedFromRule;

  if (resolvedNamedScopes.length) {
    setters.setSelectedNamedScopes(resolvedNamedScopes.map((c) => c.name));
    setters.setScopeConditions([]);
    setters.setScopeConnector("OR");
  } else if (def?.scope_conditions?.length) {
    setters.setSelectedNamedScopes([]);
    setters.setScopeConditions(
      def.scope_conditions.map((c) => ({
        subject: c.reference,
        operator: c.operator,
        targetColumn: c.column,
      }))
    );
    setters.setScopeConnector(def.scope_connector ?? "OR");
  } else {
    setters.setSelectedNamedScopes([]);
    setters.setScopeConditions(legacyScopeToConditions(resolvedLegacyScope));
    setters.setScopeConnector("OR");
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function OrgPolicyBuilder({
  initialPolicies,
  orgDisplayName = "This Organization",
}: {
  initialPolicies: OrgPolicyRow[];
  orgDisplayName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit mode
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // WHEN state
  const [conditions, setConditions] = useState<ConditionState[]>([
    { ...defaultCondition },
  ]);
  const [connector, setConnector] = useState<"AND" | "OR">("AND");

  // THEN state
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  // Resource selection: format is "type:name" e.g. "table:*", "table:deals", "storage_bucket:deals"
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  // Scope (composable conditions derive the legacy PolicyScope value)
  const [scopeConditions, setScopeConditions] = useState<ScopeConditionState[]>([]);
  const [scopeConnector, setScopeConnector] = useState<"AND" | "OR">("OR");
  const selectedScope = scopeConditionsToLegacyScope(scopeConditions);
  const setSelectedScope = (s: PolicyScope) => setScopeConditions(legacyScopeToConditions(s));

  // Effect (ALLOW or DENY)
  const [selectedEffect, setSelectedEffect] = useState<PolicyEffect>("ALLOW");

  // Global override
  const [allowInternalUsers, setAllowInternalUsers] = useState(false);

  // Named scope state
  const [selectedNamedScopes, setSelectedNamedScopes] = useState<string[]>([]);
  const [namedScopeRegistry, setNamedScopeRegistry] = useState<NamedScopeRow[]>([]);

  // Column filters (for conditional scope selector)
  const [columnFilters, setColumnFilters] = useState<
    Array<{ table_name: string; org_column: string | null; user_column: string | null; named_scopes: string[] }>
  >([]);

  // Policies in local state for optimistic updates (synced from server)
  const [policies, setPolicies] = useState<OrgPolicyRow[]>(initialPolicies);
  useEffect(() => {
    setPolicies(initialPolicies);
  }, [initialPolicies]);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Dynamic member role options
  const [memberRoleValueOptions, setMemberRoleValueOptions] = useState<
    Array<{ value: string; label: string; description?: string | null }>
  >([]);

  // Available resources for per-table/per-bucket granularity
  const [resourceOptions, setResourceOptions] = useState<
    Array<{ value: string; label: string }>
  >([...resourceScopeOptions]);

  useEffect(() => {
    async function loadDynamicData() {
      // Load member roles
      try {
        const roles = await getMemberRolesForPolicies();
        setMemberRoleValueOptions(
          roles
            .filter((r) => r.value !== "_all")
            .map((r) => ({
              value: r.value,
              label: r.label,
              description: r.description,
            }))
        );
      } catch (err) {
        console.error("Failed to load member roles:", err);
      }

      // Load available tables, buckets, and features
      try {
        const resources = await getAvailableResources();
        const opts: Array<{ value: string; label: string }> = [
          ...resourceScopeOptions,
        ];
        if (resources.tables.length > 0) {
          for (const table of resources.tables) {
            opts.push({ value: `table:${table}`, label: table });
          }
        }
        if (resources.buckets.length > 0) {
          for (const bucket of resources.buckets) {
            opts.push({
              value: `storage_bucket:${bucket}`,
              label: bucket,
            });
          }
        }
        // Add feature resources
        for (const feat of resources.features) {
          opts.push({
            value: `feature:${feat.name}`,
            label: feat.label,
          });
        }
        // Add dynamic integration feature resources
        for (const feat of resources.integrationFeatures) {
          opts.push({
            value: `feature:${feat.name}`,
            label: feat.label,
          });
        }
        setResourceOptions(opts);
      } catch (err) {
        console.error("Failed to load available resources:", err);
      }

      // Load column filters and named scope registry
      try {
        const [filters, namedScopes] = await Promise.all([
          getColumnFilters(),
          getNamedScopeRegistry(),
        ]);
        setColumnFilters(filters);
        setNamedScopeRegistry(namedScopes);
      } catch (err) {
        console.error("Failed to load column filters / named scope registry:", err);
      }
    }
    loadDynamicData();
  }, []);

  // Build field options with dynamic member roles
  const fieldOptions: ConditionFieldOption[] = [
    {
      value: "org_role",
      label: "Organization Role",
      operators: standardOperators,
      valueOptions: orgRoleValueOptions,
    },
    {
      value: "member_role",
      label: "Member Role",
      operators: standardOperators,
      valueOptions: memberRoleValueOptions,
    },
    {
      value: "org_type",
      label: "Organization Type",
      operators: standardOperators,
      valueOptions: orgTypeValueOptions,
    },
    {
      value: "internal_user",
      label: "User Type",
      operators: [{ value: "is", label: "is" }],
      valueOptions: userTypeValueOptions,
    },
  ];

  // Condition CRUD
  function updateCondition(index: number, updated: ConditionState) {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? updated : c))
    );
  }

  function addCondition() {
    setConditions((prev) => [...prev, { ...defaultCondition }]);
  }

  function removeCondition(index: number) {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }

  // Determine if any selected resource is a feature
  const hasFeatureSelected = selectedResources.some((r) => r.startsWith("feature:"));
  const hasDataSelected = selectedResources.some(
    (r) => r.startsWith("table:") || r.startsWith("storage_bucket:")
  );

  // Derive allowed actions from the specific selected feature resources
  const activeFeatureActionOptions = useMemo(() => {
    const selectedFeatureNames = selectedResources
      .filter((r) => r.startsWith("feature:"))
      .map((r) => r.slice("feature:".length));

    const actionSet = new Set<string>();
    for (const name of selectedFeatureNames) {
      const feat = FEATURE_RESOURCES.find((f) => f.name === name);
      feat?.actions.forEach((a) => actionSet.add(a));
    }
    // Fallback for unregistered features
    if (actionSet.size === 0) actionSet.add("submit");

    return [...actionSet].map((a) => ({
      value: a,
      label: a.charAt(0).toUpperCase() + a.slice(1),
    }));
  }, [selectedResources]);

  // Contextual action options: features get their registered actions, data gets CRUD
  const activeActionOptions = hasFeatureSelected && !hasDataSelected
    ? activeFeatureActionOptions
    : hasDataSelected && !hasFeatureSelected
      ? dataActionOptions
      : [...dataActionOptions, ...activeFeatureActionOptions];

  // Reset selected actions when switching between data and feature modes
  useEffect(() => {
    if (hasFeatureSelected && !hasDataSelected) {
      // Only keep actions valid for the selected features
      const featureVals = new Set(activeFeatureActionOptions.map((o) => o.value));
      setSelectedActions((prev) => {
        const valid = prev.filter((a) => featureVals.has(a));
        return valid.length > 0 ? valid : [activeFeatureActionOptions[0]?.value ?? "submit"];
      });
    } else if (hasDataSelected && !hasFeatureSelected) {
      // Only keep data-valid actions
      const dataVals = new Set(dataActionOptions.map((o) => o.value));
      setSelectedActions((prev) => {
        const valid = prev.filter((a) => dataVals.has(a));
        return valid.length > 0 ? valid : ["select", "insert", "update", "delete"];
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFeatureSelected, hasDataSelected, selectedResources]);

  // Determine if row-level scope selector should be enabled based on selected data resources.
  // Features never have row-level scope; when mixed with data resources, only the data
  // resources determine whether WHERE conditions are applicable.
  const scopeEnabled = (() => {
    if (!hasDataSelected) return false;
    // If "All Tables" or "All Buckets" is selected, scope is always meaningful
    if (selectedResources.some((r) =>
      (r.startsWith("table:") || r.startsWith("storage_bucket:")) && r.endsWith(":*")
    )) return true;
    // For specific tables/buckets, check if they have ownership columns
    return selectedResources
      .filter((r) => r.startsWith("table:") || r.startsWith("storage_bucket:"))
      .some((r) => {
        const name = r.split(":")[1];
        const filter = columnFilters.find((f) => f.table_name === name);
        return filter && (filter.org_column || filter.user_column);
      });
  })();

  // For feature resources: show the "Applies To" org-level scope selector alongside the row-level builder
  const featureScopeEnabled = hasFeatureSelected;

  function resetForm() {
    setEditingPolicyId(null);
    setConditions([{ ...defaultCondition }]);
    setConnector("AND");
    setSelectedActions([]);
    setSelectedResources([]);
    setScopeConditions([]);
    setScopeConnector("OR");
    setSelectedNamedScopes([]);
    setSelectedEffect("ALLOW");
    setAllowInternalUsers(false);
    setError(null);
    setStatus(null);
  }

  async function handleSave() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        const conditionInputs: ConditionInput[] = conditions.map((c) => ({
          field: c.field,
          operator: c.operator as "is" | "is_not",
          values: c.values,
        }));

        const scopeConditionInputs: ScopeConditionInput[] = scopeConditions
          .filter((c) => c.targetColumn)
          .map((c) => ({
            column: c.targetColumn,
            operator: c.operator,
            reference: c.subject,
          }));

        const definition: PolicyDefinitionInput = {
          allowInternalUsers,
          conditions: conditionInputs,
          connector,
          scope: selectedScope,
          effect: selectedEffect,
          // Named scopes take priority; suppress column conditions if any are selected
          scopeConditions: selectedNamedScopes.length > 0 ? [] : scopeConditionInputs,
          scopeConnector: scopeConnector,
          namedScopeConditions: selectedNamedScopes.map((name) => ({ name })),
        };

        if (editingPolicyId) {
          const res = selectedResources[0] ?? "table:*";
          const colonIdx = res.indexOf(":");
          const resType = res.substring(0, colonIdx) as ResourceType;
          const resName = res.substring(colonIdx + 1);

          await updateOrgPolicy({
            id: editingPolicyId,
            definition,
            action: (selectedActions[0] ?? "select") as PolicyAction,
            resourceType: resType,
            resourceName: resName,
          });

          router.refresh();
          resetForm();
        } else {
          for (const resource of selectedResources) {
            const colonIdx = resource.indexOf(":");
            const resourceType = resource.substring(0, colonIdx) as ResourceType;
            const resourceName = resource.substring(colonIdx + 1);

            await saveOrgPolicy({
              resourceType,
              resourceName: resourceName === "*" ? undefined : resourceName,
              actions: selectedActions as PolicyAction[],
              definition,
            });
          }
          setStatus("Policy saved successfully.");
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save policy.");
      }
    });
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setError(null);
    setStatus(null);
    const previous = policies.find((p) => p.id === id);
    if (!previous) return;
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p))
    );
    startTransition(async () => {
      try {
        await setOrgPolicyActive({ id, isActive });
        router.refresh();
      } catch (err) {
        setPolicies((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: previous.is_active } : p))
        );
        setError(
          err instanceof Error ? err.message : "Failed to update policy."
        );
      }
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        await deleteOrgPolicy({ id });
        if (editingPolicyId === id) resetForm();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete policy."
        );
      }
    });
  }

  function handleEdit(policy: OrgPolicyRow) {
    loadPolicyIntoForm(policy, {
      setConditions,
      setConnector,
      setAllowInternalUsers,
      setSelectedActions,
      setSelectedResources,
      setSelectedScope,
      setScopeConditions,
      setScopeConnector,
      setSelectedEffect,
      setEditingPolicyId,
      setSelectedNamedScopes,
    });
    setError(null);
    setStatus(null);
  }

  const editingPolicy = editingPolicyId
    ? policies.find((p) => p.id === editingPolicyId) ?? null
    : null;

  // Derive flags from the policy currently being edited
  const editingCompiledConfig = editingPolicy?.compiled_config as
    | { rules?: unknown[]; allow_internal_users?: boolean }
    | undefined;
  const isMultiRulePolicy = (editingCompiledConfig?.rules?.length ?? 0) > 1;
  const isProtectedPolicy = !!(
    editingPolicy as (OrgPolicyRow & { is_protected_policy?: boolean }) | null
  )?.is_protected_policy;

  const policyFormBody = (
    <div className="space-y-6">

      {/* Protected policy — read-only notice */}
      {editingPolicyId && isProtectedPolicy && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-600 dark:text-amber-400">System-protected policy</p>
            <p className="text-muted-foreground mt-0.5">
              This policy is managed by the platform and cannot be modified or deleted via the UI.
              Apply a SQL migration to make changes.
            </p>
          </div>
        </div>
      )}

      {/* Multi-rule policy — first-rule-only edit warning */}
      {editingPolicyId && isMultiRulePolicy && !isProtectedPolicy && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              Multi-rule policy ({editingCompiledConfig?.rules?.length} rules)
            </p>
            <p className="text-muted-foreground mt-0.5">
              This policy contains multiple rule groups (e.g. Tier 1 + Tier 2 + …). The form
              shows only the <strong>first rule</strong> for reference. Saving will replace all
              rules with a single rule — use a SQL migration to edit multi-rule policies safely.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <RadioGroup
          value={selectedEffect}
          onValueChange={(v) => setSelectedEffect(v as PolicyEffect)}
          className="flex gap-2"
        >
          <label className={cn(
            "flex items-center rounded-md border px-4 py-2 cursor-pointer transition-colors text-sm font-semibold",
            selectedEffect === "ALLOW"
              ? "bg-success-muted text-success border-success/30"
              : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
          )}>
            <RadioGroupItem value="ALLOW" className="sr-only" />
            Allow
          </label>
          <label className={cn(
            "flex items-center rounded-md border px-4 py-2 cursor-pointer transition-colors text-sm font-semibold",
            selectedEffect === "DENY"
              ? "bg-danger-muted text-danger border-danger/30"
              : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
          )}>
            <RadioGroupItem value="DENY" className="sr-only" />
            Deny
          </label>
        </RadioGroup>
        <span className="text-xs text-muted-foreground">
          {selectedEffect === "DENY"
            ? "Deny policies override Allow policies"
            : "Grant access when conditions match"}
        </span>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">IF</h3>
        </div>

        <div className="space-y-2 rounded-lg border p-4">
          {conditions.map((condition, index) => (
            <div key={`condition-${index}`}>
              {index > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConnector(connector === "AND" ? "OR" : "AND")
                    }
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {connector}
                  </button>
                  <Separator className="flex-1" />
                </div>
              )}

              <PolicyConditionRow
                condition={condition}
                fieldOptions={fieldOptions}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
                canRemove={conditions.length > 1}
              />
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={addCondition}
            className="mt-2 gap-1 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Condition
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">THEN</h3>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold shrink-0">SET PERMISSIONS TO</span>
        <div className="min-w-[160px]">
          <ChipsSelect
            options={activeActionOptions}
            selected={selectedActions}
            onChange={setSelectedActions}
            placeholder="Select actions..."
          />
        </div>
        <span className="text-sm font-semibold shrink-0">ON</span>
        <div className="min-w-[200px] flex-1">
          <ResourceChipsSelect
            options={resourceOptions}
            selected={selectedResources}
            onChange={setSelectedResources}
            placeholder="Select resources (tables, buckets)..."
          />
        </div>
      </div>

      {featureScopeEnabled && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">APPLIES TO</h3>
            <span className="text-xs text-muted-foreground">
              which organization(s) does this policy cover?
            </span>
          </div>
          <RadioGroup
            value={selectedScope === "all" ? "all" : "org_records"}
            onValueChange={(v) => setSelectedScope(v as PolicyScope)}
            className="space-y-2"
          >
            <label
              className={cn(
                "flex items-start gap-3 rounded-md p-3 cursor-pointer border transition-colors",
                selectedScope !== "all"
                  ? "bg-accent/50 border-primary/30"
                  : "hover:bg-muted/50 border-border"
              )}
            >
              <RadioGroupItem value="org_records" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">Active Organization Only</div>
                <div className="text-xs text-muted-foreground">
                  User can only perform this action within their own organization
                </div>
              </div>
            </label>
            <label
              className={cn(
                "flex items-start gap-3 rounded-md p-3 cursor-pointer border transition-colors",
                selectedScope === "all"
                  ? "bg-accent/50 border-primary/30"
                  : "hover:bg-muted/50 border-border"
              )}
            >
              <RadioGroupItem value="all" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">All Organizations</div>
                <div className="text-xs text-muted-foreground">
                  User can perform this action across any organization
                </div>
              </div>
            </label>
          </RadioGroup>
        </div>
      )}

        <ScopeConditionBuilder
          scopeConditions={scopeConditions}
          setScopeConditions={setScopeConditions}
          scopeConnector={scopeConnector}
          setScopeConnector={setScopeConnector}
          scopeEnabled={scopeEnabled}
          hasOnlyFeatures={hasFeatureSelected && !hasDataSelected}
          selectedResources={selectedResources}
          columnFilters={columnFilters}
          namedScopeRegistry={namedScopeRegistry}
          selectedNamedScopes={selectedNamedScopes}
          setSelectedNamedScopes={setSelectedNamedScopes}
        />

      <Separator />

      <div className="flex items-center gap-3">
        <Switch
          checked={allowInternalUsers}
          onCheckedChange={setAllowInternalUsers}
        />
        <div>
          <Label className="cursor-pointer">
            Bypass for internal users
          </Label>
          <p className="text-xs text-muted-foreground">
            Internal users skip all conditions above
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="text-sm text-emerald-600" role="status">
          {status}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        {editingPolicyId && (
          <Button variant="outline" onClick={resetForm} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={
            isPending ||
            selectedActions.length === 0 ||
            selectedResources.length === 0 ||
            isProtectedPolicy ||
            isMultiRulePolicy
          }
          title={
            isProtectedPolicy
              ? "System-protected policies cannot be edited via the UI"
              : isMultiRulePolicy
                ? "Multi-rule policies must be edited via SQL migration"
                : undefined
          }
        >
          {isPending
            ? "Saving..."
            : editingPolicyId
              ? "Update policy"
              : "Save policy"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <Card>
        <CardHeader>
          <CardTitle>Create Access Policy</CardTitle>
          <CardDescription>
            Define who can access what using conditions and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!editingPolicyId && policyFormBody}
          {editingPolicyId && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              Editing policy in side panel&hellip;
              <Button variant="link" size="sm" onClick={resetForm} className="ml-1">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!editingPolicyId} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Edit Access Policy
            </SheetTitle>
            <SheetDescription>
              Update the conditions and actions for{" "}
              {editingPolicy
                ? `${editingPolicy.action.toUpperCase()} on ${resolveResourceName(editingPolicy)}`
                : "this policy"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {policyFormBody}
          </div>
        </SheetContent>
      </Sheet>

      <ExistingPoliciesCard
        policies={policies}
        editingPolicyId={editingPolicyId}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        orgDisplayName={orgDisplayName}
      />
    </div>
  );
}

// ============================================================================
// Display settings for policy table columns
// ============================================================================

type DisplayColumn = "resourceType" | "resourceName" | "scope" | "action" | "organization" | "conditions" | "effect" | "version" | "isActive";

const POLICY_DISPLAY_COLUMNS: { key: DisplayColumn; label: string }[] = [
  { key: "resourceType", label: "Resource Type" },
  { key: "resourceName", label: "Resource Name" },
  { key: "scope", label: "Scope" },
  { key: "action", label: "Action" },
  { key: "organization", label: "Organization" },
  { key: "conditions", label: "Conditions" },
  { key: "effect", label: "Effect" },
  { key: "version", label: "Version" },
  { key: "isActive", label: "Is Active" },
];

type PolicyViewType = "table" | "board";
type GroupByField = DisplayColumn | "none";
type OrderByField = DisplayColumn;

const VIEW_OPTIONS: { value: PolicyViewType; label: string; icon: typeof Table2 }[] = [
  { value: "table", label: "Table", icon: Table2 },
  { value: "board", label: "Board", icon: LayoutGrid },
];

const GROUPABLE_COLUMNS: { value: GroupByField; label: string }[] = [
  { value: "none", label: "None" },
  { value: "resourceType", label: "Resource Type" },
  { value: "resourceName", label: "Resource Name" },
  { value: "scope", label: "Scope" },
  { value: "action", label: "Action" },
  { value: "organization", label: "Organization" },
  { value: "effect", label: "Effect" },
  { value: "isActive", label: "Is Active" },
];

const ORDERABLE_COLUMNS: { value: OrderByField; label: string }[] = [
  { value: "resourceType", label: "Resource Type" },
  { value: "resourceName", label: "Resource Name" },
  { value: "scope", label: "Scope" },
  { value: "action", label: "Action" },
  { value: "organization", label: "Organization" },
  { value: "effect", label: "Effect" },
  { value: "version", label: "Version" },
  { value: "isActive", label: "Is Active" },
];

const RESOURCE_TYPE_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "table", label: "Tables" },
  { value: "storage_bucket", label: "Buckets" },
  { value: "feature", label: "Features" },
  { value: "route", label: "Routes" },
];

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  table: "Table",
  storage_bucket: "Storage Bucket",
  feature: "Feature",
  route: "Route",
};

// ============================================================================
// Policy Toolbar — Linear-style Display popover
// ============================================================================

const selectTriggerCls =
  "h-7 w-auto min-w-0 rounded-md border bg-muted/60 px-2 text-xs [&>svg]:h-3 [&>svg]:w-3 gap-1";

function PolicyToolbar({
  visibleColumns,
  onToggleColumn,
  showInactive,
  onSetShowInactive,
  groupBy,
  onSetGroupBy,
  subGroupBy,
  onSetSubGroupBy,
  orderBy,
  onSetOrderBy,
  orderAsc,
  onToggleOrderDir,
  viewType,
  onSetViewType,
  activeTab,
  onSetTab,
  counts,
  onReset,
}: {
  visibleColumns: Record<DisplayColumn, boolean>;
  onToggleColumn: (col: DisplayColumn) => void;
  showInactive: boolean;
  onSetShowInactive: (v: boolean) => void;
  groupBy: GroupByField;
  onSetGroupBy: (g: GroupByField) => void;
  subGroupBy: GroupByField;
  onSetSubGroupBy: (g: GroupByField) => void;
  orderBy: OrderByField;
  onSetOrderBy: (o: OrderByField) => void;
  orderAsc: boolean;
  onToggleOrderDir: () => void;
  viewType: PolicyViewType;
  onSetViewType: (v: PolicyViewType) => void;
  activeTab: string;
  onSetTab: (tab: string) => void;
  counts: Record<string, number>;
  onReset: () => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!settingsOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        settingsPopoverRef.current?.contains(target) ||
        settingsBtnRef.current?.contains(target) ||
        (target instanceof Element &&
          (target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("[role='listbox']") ||
            target.closest("[role='option']")))
      ) return;
      setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

  useEffect(() => {
    if (settingsOpen && settingsBtnRef.current) {
      const rect = settingsBtnRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [settingsOpen]);

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      {/* Resource type filter buttons */}
      <div className="flex items-center gap-0.5">
        {RESOURCE_TYPE_TABS.map((tab) => {
          const count = counts[tab.value] ?? 0;
          if (tab.value !== "all" && count === 0) return null;
          const isActive = activeTab === tab.value;
          const colorKey = tab.value === "storage_bucket" ? "storage" : tab.value;
          const hasColor = tab.value !== "all";
          return (
            <button
              key={tab.value}
              onClick={() => onSetTab(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 h-7 text-xs font-medium transition-colors",
                isActive
                  ? hasColor
                    ? `text-resource-${colorKey} bg-transparent`
                    : "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  isActive && hasColor
                    ? `badge-resource-${colorKey}`
                    : "border-transparent bg-muted/80 text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <Button
            ref={settingsBtnRef}
            variant="secondary"
            size="sm"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="h-7 gap-1.5 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Display</span>
          </Button>

          {settingsOpen &&
            createPortal(
              <div
                ref={settingsPopoverRef}
                className="fixed z-[9999] w-[320px] rounded-lg border bg-card shadow-lg"
                style={{ top: popoverPos.top, left: popoverPos.left }}
              >
                {/* View switcher */}
                <div className="p-3 pb-0">
                  <div className="flex rounded-lg bg-muted/60 p-0.5">
                    {VIEW_OPTIONS.map((opt) => {
                      const active = viewType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => onSetViewType(opt.value)}
                          className={cn(
                            "flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-xs font-medium transition-all",
                            active
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <opt.icon className="h-4 w-4" />
                          <span className="text-[10px]">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grouping / Sub-grouping / Ordering */}
                <div className="px-3 py-3 space-y-2.5">
                  {/* Grouping */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Kanban className="h-3.5 w-3.5" />
                      <span>{viewType === "board" ? "Columns" : "Grouping"}</span>
                    </div>
                    <Select value={groupBy} onValueChange={(v) => onSetGroupBy(v as GroupByField)}>
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {GROUPABLE_COLUMNS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sub-grouping */}
                  {viewType === "table" && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Kanban className="h-3.5 w-3.5" />
                        <span>Sub-grouping</span>
                      </div>
                      <Select value={subGroupBy} onValueChange={(v) => onSetSubGroupBy(v as GroupByField)}>
                        <SelectTrigger className={selectTriggerCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          {GROUPABLE_COLUMNS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Ordering */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span>Ordering</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={orderBy} onValueChange={(v) => onSetOrderBy(v as OrderByField)}>
                        <SelectTrigger className={selectTriggerCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          {ORDERABLE_COLUMNS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={onToggleOrderDir}
                        className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                        title={orderAsc ? "Ascending" : "Descending"}
                      >
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* Inactive policies */}
                <div className="px-3 py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Inactive policies</span>
                    <Select value={showInactive ? "show" : "hide"} onValueChange={(v) => onSetShowInactive(v === "show")}>
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="show" className="text-xs">Show</SelectItem>
                        <SelectItem value="hide" className="text-xs">Hide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t" />

                {/* Display properties */}
                <div className="px-3 py-3">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-2">Display properties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POLICY_DISPLAY_COLUMNS.map((col) => {
                      const active = visibleColumns[col.key];
                      return (
                        <button
                          key={col.key}
                          onClick={() => onToggleColumn(col.key)}
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            active
                              ? "border-primary/30 bg-primary/10 text-foreground"
                              : "border-transparent bg-muted/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset */}
                <div className="border-t px-3 py-2.5 flex justify-center">
                  <button
                    onClick={onReset}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// Helper: resolve display values for a policy
// ============================================================================

function resolveResourceName(policy: OrgPolicyRow): string {
  if (policy.resource_type === "feature") {
    return FEATURE_RESOURCES.find((f) => f.name === policy.resource_name)?.label ?? policy.resource_name;
  }
  if (policy.resource_name === "*") return "Wildcard";
  return policy.resource_name;
}

function resolveOrgLabel(policy: OrgPolicyRow, orgDisplayName: string): string {
  return policy.org_id ? orgDisplayName : "Global";
}

function getPolicyFieldValue(p: OrgPolicyRow, field: DisplayColumn | "none", orgDisplayName: string): string {
  switch (field) {
    case "resourceType": return RESOURCE_TYPE_LABELS[p.resource_type] ?? p.resource_type;
    case "resourceName": return resolveResourceName(p);
    case "scope": return p.scope ?? "all";
    case "action": return p.action;
    case "organization": return resolveOrgLabel(p, orgDisplayName);
    case "conditions": return summarizeConditions(p);
    case "effect": return p.effect ?? "ALLOW";
    case "version": return `v${p.version}`;
    case "isActive": return p.is_active ? "Active" : "Inactive";
    case "none": return "";
    default: return "";
  }
}

function getRawResourceType(p: OrgPolicyRow, field: DisplayColumn | "none"): string | undefined {
  if (field === "resourceType") return p.resource_type;
  return undefined;
}

const RESOURCE_TYPE_BORDER_L: Record<string, string> = {
  table: "border-l-resource-table",
  storage_bucket: "border-l-resource-storage",
  feature: "border-l-resource-feature",
  route: "border-l-resource-route",
};

const RESOURCE_TYPE_BADGE_CLS: Record<string, string> = {
  table: "badge-resource-table",
  storage_bucket: "badge-resource-storage",
  feature: "badge-resource-feature",
  route: "badge-resource-route",
};

// ============================================================================
// Active toggle badge with hover text swap
// ============================================================================

function ActiveToggleBadge({
  isActive,
  isProtected,
  onToggle,
  small,
}: {
  isActive: boolean;
  isProtected: boolean;
  onToggle: () => void;
  small?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const showActive = hovered ? !isActive : isActive;
  const label = showActive ? "Active" : "Inactive";

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize whitespace-nowrap select-none transition-colors",
        small && "text-[10px]",
        isProtected
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer",
        showActive
          ? "bg-success-muted text-success border-success/30"
          : "bg-danger-muted text-danger border-danger/30"
      )}
      onMouseEnter={() => { if (!isProtected) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!isProtected) onToggle();
      }}
      title={isProtected ? "Protected policy" : isActive ? "Click to deactivate" : "Click to activate"}
    >
      {label}
    </Badge>
  );
}

// ============================================================================
// Conditions cell — per-condition chips
// ============================================================================

const CONDITION_FIELD_LABELS: Record<string, string> = {
  org_role: "Org Role",
  member_role: "Member Role",
  org_type: "Org Type",
  internal_user: "User Type",
};

function PolicyConditionChips({
  policy,
  isMultiRule,
  ruleCount,
}: {
  policy: OrgPolicyRow;
  isMultiRule: boolean;
  ruleCount: number;
}) {
  const compiled = policy.compiled_config as { rules?: RuleGroup[]; allow_internal_users?: boolean } | undefined;
  const def = policy.definition_json as {
    conditions?: RuleCondition[];
    rules?: RuleGroup[];
    connector?: string;
    allow_internal_users?: boolean;
  } | undefined;

  // Get first rule's conditions for display (V3 compiled → V3 def → V2 def)
  const firstRule = compiled?.rules?.[0] ?? def?.rules?.[0];
  const conditions: RuleCondition[] = firstRule?.conditions ?? def?.conditions ?? [];
  const connector: string = firstRule?.connector ?? def?.connector ?? "AND";
  const namedScopes: Array<{ name: string }> =
    (firstRule as unknown as { named_scope_conditions?: Array<{ name: string }> })?.named_scope_conditions ??
    (def as unknown as { named_scope_conditions?: Array<{ name: string }> })?.named_scope_conditions ??
    [];

  const allowInternalOnly =
    (compiled?.allow_internal_users || def?.allow_internal_users) && !conditions.length && !namedScopes.length;

  if (allowInternalOnly) {
    return (
      <span className="text-[11px] text-muted-foreground italic">Internal users</span>
    );
  }

  if (!conditions.length && !namedScopes.length && !isMultiRule) {
    return <span className="text-[11px] text-muted-foreground italic">No conditions</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {isMultiRule && (
        <span className="badge-resource-table inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0">
          {ruleCount} rules
        </span>
      )}
      {namedScopes.map((ns) => (
        <Badge
          key={ns.name}
          variant="outline"
          className="badge-resource-table capitalize whitespace-nowrap"
        >
          {ns.name.replace(/_/g, " ")}
        </Badge>
      ))}
      {conditions.map((c, i) => {
        const label = CONDITION_FIELD_LABELS[c.field] ?? c.field;
        const op = c.operator === "is_not" ? "≠" : "=";
        const vals = c.values.join(", ");
        return (
          <React.Fragment key={i}>
            {i > 0 && !isMultiRule && (
              <span className="text-[9px] font-semibold text-muted-foreground/70 uppercase leading-none px-0.5">
                {connector}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-muted-foreground/70 mx-0.5">{op}</span>
              <span className="text-foreground">{vals}</span>
            </span>
          </React.Fragment>
        );
      })}
      {isMultiRule && conditions.length > 0 && (
        <span className="text-[10px] text-muted-foreground italic whitespace-nowrap">
          +{ruleCount - 1} more
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Policy table row — renders as <tr>
// ============================================================================

function PolicyTableRow({
  policy,
  isEditing,
  onEdit,
  onToggleActive,
  onDelete,
  visibleColumns,
  orgDisplayName,
  colCount,
}: {
  policy: OrgPolicyRow;
  isEditing: boolean;
  onEdit: (p: OrgPolicyRow) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  visibleColumns: Record<DisplayColumn, boolean>;
  orgDisplayName: string;
  colCount: number;
}) {
  const isProtected = !!(policy as OrgPolicyRow & { is_protected_policy?: boolean }).is_protected_policy;
  const rowCompiled = policy.compiled_config as { rules?: unknown[] } | undefined;
  const isMultiRule = (rowCompiled?.rules?.length ?? 0) > 1;
  const tdCls = "px-4 py-2.5";

  const resourceName = resolveResourceName(policy);

  return (
    <tr
      className={cn(
        "border-b border-border cursor-pointer transition-colors group",
        isEditing ? "bg-primary/5" : "hover:bg-accent/50",
        isProtected && "bg-amber-50/30 dark:bg-amber-950/10"
      )}
    >
      {visibleColumns.resourceType && (
        <td className={tdCls}>
          <span className="inline-flex items-center gap-1.5">
            {isProtected && <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />}
            <Badge
              variant="outline"
              className={cn("capitalize whitespace-nowrap", RESOURCE_TYPE_BADGE_CLS[policy.resource_type])}
            >
              {RESOURCE_TYPE_LABELS[policy.resource_type] ?? policy.resource_type}
            </Badge>
          </span>
        </td>
      )}

      {visibleColumns.resourceName && (
        <td className={tdCls}>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-foreground whitespace-nowrap">{resourceName}</span>
            {isProtected && (
              <Badge className="capitalize whitespace-nowrap bg-warning-muted text-warning border-warning/30">
                Protected
              </Badge>
            )}
          </div>
        </td>
      )}

      {visibleColumns.scope && (
        <td className={tdCls}>
          <Badge variant="outline" className="uppercase whitespace-nowrap">
            {policy.scope === "all" && "All"}
            {policy.scope === "org_records" && "Org"}
            {policy.scope === "user_records" && "User"}
            {policy.scope === "org_and_user" && "Org+User"}
            {!policy.scope && "All"}
          </Badge>
        </td>
      )}

      {visibleColumns.action && (
        <td className={tdCls}>
          <Badge variant="outline" className="uppercase whitespace-nowrap">
            {policy.action}
          </Badge>
        </td>
      )}

      {visibleColumns.effect && (
        <td className={tdCls}>
          <Badge variant="outline" className="uppercase whitespace-nowrap">
            {policy.effect ?? "ALLOW"}
          </Badge>
        </td>
      )}

      {visibleColumns.conditions && (
        <td className={cn(tdCls, "max-w-[300px]")}>
          <PolicyConditionChips policy={policy} isMultiRule={isMultiRule} ruleCount={rowCompiled?.rules?.length ?? 0} />
        </td>
      )}

      {visibleColumns.organization && (
        <td className={tdCls}>
          <Badge variant="outline" className="capitalize whitespace-nowrap">
            {resolveOrgLabel(policy, orgDisplayName)}
          </Badge>
        </td>
      )}

      {visibleColumns.isActive && (
        <td className={tdCls}>
          <ActiveToggleBadge
            isActive={policy.is_active}
            isProtected={isProtected}
            onToggle={() => onToggleActive(policy.id, !policy.is_active)}
          />
        </td>
      )}

      {visibleColumns.version && (
        <td className={tdCls}>
          <span className="text-xs text-muted-foreground">v{policy.version}</span>
        </td>
      )}

      {/* Row actions dropdown */}
      <td className={cn(tdCls, "text-right w-10")}>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onEdit(policy)}>
                {isProtected ? (
                  <>
                    <Lock className="mr-2 h-4 w-4 opacity-60" />
                    View (protected)
                  </>
                ) : isMultiRule ? (
                  <>
                    <Workflow className="mr-2 h-4 w-4 opacity-60" />
                    Inspect
                  </>
                ) : (
                  <>
                    <Workflow className="mr-2 h-4 w-4 opacity-60" />
                    Edit
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(policy.id)}
                disabled={isProtected || isMultiRule}
              >
                <Archive className="mr-2 h-4 w-4 opacity-60" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(policy.id)}
                disabled={isProtected || isMultiRule}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ============================================================================
// Collapsible group row header (Linear-style)
// ============================================================================

function GroupHeaderRow({
  label,
  count,
  colCount,
  isCollapsed,
  onToggle,
  depth,
  resourceType,
}: {
  label: string;
  count: number;
  colCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  depth: number;
  resourceType?: string;
}) {
  const borderCls = resourceType ? RESOURCE_TYPE_BORDER_L[resourceType] : undefined;
  const textCls = resourceType
    ? `text-resource-${resourceType === "storage_bucket" ? "storage" : resourceType}`
    : undefined;

  return (
    <tr
      className={cn(
        "border-b border-border cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors",
        borderCls && "border-l-2",
        borderCls
      )}
      onClick={onToggle}
    >
      <td colSpan={colCount} className="px-4 py-2">
        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
          {isCollapsed ? (
            <ChevronRight className={cn("h-3.5 w-3.5", textCls ?? "text-muted-foreground")} />
          ) : (
            <ChevronDown className={cn("h-3.5 w-3.5", textCls ?? "text-muted-foreground")} />
          )}
          <span className={cn("text-xs font-semibold", textCls ?? "text-foreground")}>{label}</span>
          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// Grouped Table View — two-level grouping: resource_type > resource_name
// ============================================================================

function PolicyTableView({
  policies,
  editingPolicyId,
  onEdit,
  onToggleActive,
  onDelete,
  visibleColumns,
  orgDisplayName,
  groupBy,
  subGroupBy,
  orderBy,
  orderAsc,
}: {
  policies: OrgPolicyRow[];
  editingPolicyId: string | null;
  onEdit: (p: OrgPolicyRow) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  visibleColumns: Record<DisplayColumn, boolean>;
  orgDisplayName: string;
  groupBy: GroupByField;
  subGroupBy: GroupByField;
  orderBy: OrderByField;
  orderAsc: boolean;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const thCls =
    "px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap";
  const show = (k: DisplayColumn) => visibleColumns[k];

  const colCount =
    (show("resourceType") ? 1 : 0) +
    (show("resourceName") ? 1 : 0) +
    (show("scope") ? 1 : 0) +
    (show("action") ? 1 : 0) +
    (show("organization") ? 1 : 0) +
    (show("conditions") ? 1 : 0) +
    (show("effect") ? 1 : 0) +
    (show("isActive") ? 1 : 0) +
    (show("version") ? 1 : 0) +
    1;

  const sortFn = useCallback(
    (a: OrgPolicyRow, b: OrgPolicyRow) => {
      const av = getPolicyFieldValue(a, orderBy, orgDisplayName);
      const bv = getPolicyFieldValue(b, orderBy, orgDisplayName);
      const cmp = av.localeCompare(bv);
      return orderAsc ? cmp : -cmp;
    },
    [orderBy, orderAsc, orgDisplayName]
  );

  const groups = useMemo(() => {
    if (groupBy === "none") return null;

    const map = new Map<string, { rawType?: string; items: OrgPolicyRow[] }>();
    for (const p of policies) {
      const key = getPolicyFieldValue(p, groupBy, orgDisplayName);
      if (!map.has(key)) map.set(key, { rawType: getRawResourceType(p, groupBy), items: [] });
      map.get(key)!.items.push(p);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, { rawType, items }]) => ({ label, rawType, items: [...items].sort(sortFn) }));
  }, [policies, groupBy, orgDisplayName, sortFn]);

  const buildSubGroups = useCallback(
    (items: OrgPolicyRow[], parentRawType?: string) => {
      if (subGroupBy === "none" || subGroupBy === groupBy) return null;

      const map = new Map<string, { rawType?: string; items: OrgPolicyRow[] }>();
      for (const p of items) {
        const key = getPolicyFieldValue(p, subGroupBy, orgDisplayName);
        if (!map.has(key))
          map.set(key, { rawType: getRawResourceType(p, subGroupBy) ?? parentRawType, items: [] });
        map.get(key)!.items.push(p);
      }

      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, { rawType, items }]) => ({ label, rawType, items }));
    },
    [subGroupBy, groupBy, orgDisplayName]
  );

  const sortedFlat = useMemo(() => [...policies].sort(sortFn), [policies, sortFn]);

  if (policies.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No policies in this category.
      </div>
    );
  }

  const renderRow = (p: OrgPolicyRow) => (
    <PolicyTableRow
      key={p.id}
      policy={p}
      isEditing={editingPolicyId === p.id}
      onEdit={onEdit}
      onToggleActive={onToggleActive}
      onDelete={onDelete}
      visibleColumns={visibleColumns}
      orgDisplayName={orgDisplayName}
      colCount={colCount}
    />
  );

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {show("resourceType") && <th className={thCls}>Resource Type</th>}
            {show("resourceName") && <th className={thCls}>Resource Name</th>}
            {show("scope") && <th className={thCls}>Scope</th>}
            {show("action") && <th className={thCls}>Action</th>}
            {show("effect") && <th className={thCls}>Effect</th>}
            {show("conditions") && <th className={thCls}>Conditions</th>}
            {show("organization") && <th className={thCls}>Organization</th>}
            {show("isActive") && <th className={thCls}>Active</th>}
            {show("version") && <th className={thCls} />}
            <th className={cn(thCls, "text-right")} />
          </tr>
        </thead>
        <tbody>
          {groupBy === "none" ? (
            sortedFlat.map(renderRow)
          ) : (
            groups!.map((grp) => {
              const grpKey = `grp:${grp.label}`;
              const isGrpCollapsed = collapsed[grpKey];
              const subGroups = buildSubGroups(grp.items, grp.rawType);

              return (
                <React.Fragment key={grpKey}>
                  <GroupHeaderRow
                    label={grp.label}
                    count={grp.items.length}
                    colCount={colCount}
                    isCollapsed={!!isGrpCollapsed}
                    onToggle={() => toggle(grpKey)}
                    depth={0}
                    resourceType={grp.rawType}
                  />
                  {!isGrpCollapsed && (
                    subGroups
                      ? subGroups.map((sg) => {
                          const sgKey = `${grpKey}/${sg.label}`;
                          const isSgCollapsed = collapsed[sgKey];

                          if (sg.items.length === 1 && subGroups.length > 1) {
                            return renderRow(sg.items[0]);
                          }

                          return (
                            <React.Fragment key={sgKey}>
                              <GroupHeaderRow
                                label={sg.label}
                                count={sg.items.length}
                                colCount={colCount}
                                isCollapsed={!!isSgCollapsed}
                                onToggle={() => toggle(sgKey)}
                                depth={1}
                                resourceType={sg.rawType}
                              />
                              {!isSgCollapsed && sg.items.map(renderRow)}
                            </React.Fragment>
                          );
                        })
                      : grp.items.map(renderRow)
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Board / Kanban view — groups policies into columns
// ============================================================================

function PolicyBoardView({
  policies,
  editingPolicyId,
  onEdit,
  onToggleActive,
  orgDisplayName,
  groupBy,
}: {
  policies: OrgPolicyRow[];
  editingPolicyId: string | null;
  onEdit: (p: OrgPolicyRow) => void;
  onToggleActive: (id: string, active: boolean) => void;
  orgDisplayName: string;
  groupBy: GroupByField;
}) {
  const columns = useMemo(() => {
    const grouper = (p: OrgPolicyRow): { label: string; rawType?: string } => {
      switch (groupBy) {
        case "resourceType":
          return { label: RESOURCE_TYPE_LABELS[p.resource_type] ?? p.resource_type, rawType: p.resource_type };
        case "resourceName":
          return { label: resolveResourceName(p), rawType: p.resource_type };
        case "scope":
          return { label: p.scope ?? "all" };
        case "action":
          return { label: p.action };
        case "organization":
          return { label: resolveOrgLabel(p, orgDisplayName) };
        case "effect":
          return { label: p.effect ?? "ALLOW" };
        default:
          return { label: "All Policies" };
      }
    };

    const map = new Map<string, { rawType?: string; items: OrgPolicyRow[] }>();
    for (const p of policies) {
      const { label, rawType } = grouper(p);
      if (!map.has(label)) map.set(label, { rawType, items: [] });
      map.get(label)!.items.push(p);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, { rawType, items }]) => ({ label, rawType, items }));
  }, [policies, groupBy, orgDisplayName]);

  if (policies.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No policies in this category.
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto min-h-[200px]">
      {columns.map((col) => {
        const borderCls = col.rawType ? RESOURCE_TYPE_BORDER_L[col.rawType] : undefined;
        const textCls = col.rawType
          ? `text-resource-${col.rawType === "storage_bucket" ? "storage" : col.rawType}`
          : undefined;
        return (
        <div
          key={col.label}
          className="flex flex-col w-[280px] min-w-[280px] rounded-lg border bg-muted/20"
        >
          <div className={cn("flex items-center justify-between px-3 py-2.5 border-b bg-muted/30", borderCls && "border-l-2", borderCls)}>
            <span className={cn("text-xs font-semibold", textCls ?? "text-foreground")}>{col.label}</span>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              {col.items.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {col.items.map((p) => {
              const isProtected = !!(p as OrgPolicyRow & { is_protected_policy?: boolean }).is_protected_policy;
              return (
                <div
                  key={p.id}
                  onClick={() => onEdit(p)}
                  className={cn(
                    "rounded-lg border bg-card p-3 space-y-2 cursor-pointer transition-colors",
                    editingPolicyId === p.id ? "ring-2 ring-primary/50" : "hover:bg-accent/50",
                    isProtected && "border-amber-500/30"
                  )}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn("capitalize", RESOURCE_TYPE_BADGE_CLS[p.resource_type])}
                    >
                      {RESOURCE_TYPE_LABELS[p.resource_type] ?? p.resource_type}
                    </Badge>
                    {isProtected && <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {resolveResourceName(p)}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.effect === "DENY" && (
                      <Badge className="uppercase bg-danger-muted text-danger border-danger/30">DENY</Badge>
                    )}
                    <Badge variant="outline" className="uppercase">
                      {p.action}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {p.scope === "org_records" ? "Org" : p.scope === "user_records" ? "User" : p.scope === "org_and_user" ? "Org+User" : "All"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {resolveOrgLabel(p, orgDisplayName)}
                    </span>
                    <ActiveToggleBadge
                      isActive={p.is_active}
                      isProtected={isProtected}
                      onToggle={() => onToggleActive(p.id, !p.is_active)}
                      small
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Existing Policies — matches Deal Tasks multi-view layout
// ============================================================================

const DEFAULT_VISIBLE_COLS: Record<DisplayColumn, boolean> = {
  resourceType: true,
  resourceName: true,
  scope: true,
  action: true,
  organization: true,
  conditions: true,
  effect: true,
  version: false,
  isActive: false,
};

const DEFAULT_GROUP_BY: GroupByField = "resourceType";
const DEFAULT_SUB_GROUP_BY: GroupByField = "resourceName";
const DEFAULT_ORDER_BY: OrderByField = "resourceType";

function ExistingPoliciesCard({
  policies,
  editingPolicyId,
  onEdit,
  onToggleActive,
  onDelete,
  orgDisplayName,
}: {
  policies: OrgPolicyRow[];
  editingPolicyId: string | null;
  onEdit: (p: OrgPolicyRow) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  orgDisplayName: string;
}) {
  const [showInactive, setShowInactive] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupByField>(DEFAULT_GROUP_BY);
  const [subGroupBy, setSubGroupBy] = useState<GroupByField>(DEFAULT_SUB_GROUP_BY);
  const [orderBy, setOrderBy] = useState<OrderByField>(DEFAULT_ORDER_BY);
  const [orderAsc, setOrderAsc] = useState(true);
  const [viewType, setViewType] = useState<PolicyViewType>("table");
  const [activeTab, setActiveTab] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<Record<DisplayColumn, boolean>>(
    () => ({ ...DEFAULT_VISIBLE_COLS })
  );

  const toggleColumn = useCallback(
    (col: DisplayColumn) =>
      setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] })),
    []
  );

  const handleReset = useCallback(() => {
    setShowInactive(true);
    setGroupBy(DEFAULT_GROUP_BY);
    setSubGroupBy(DEFAULT_SUB_GROUP_BY);
    setOrderBy(DEFAULT_ORDER_BY);
    setOrderAsc(true);
    setViewType("table");
    setActiveTab("all");
    setVisibleColumns({ ...DEFAULT_VISIBLE_COLS });
  }, []);

  const filteredPolicies = useMemo(
    () => (showInactive ? policies : policies.filter((p) => p.is_active)),
    [policies, showInactive]
  );

  const tabPolicies = useMemo(
    () =>
      activeTab === "all"
        ? filteredPolicies
        : filteredPolicies.filter((p) => p.resource_type === activeTab),
    [filteredPolicies, activeTab]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: filteredPolicies.length };
    for (const p of filteredPolicies) {
      c[p.resource_type] = (c[p.resource_type] ?? 0) + 1;
    }
    return c;
  }, [filteredPolicies]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <PolicyToolbar
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        showInactive={showInactive}
        onSetShowInactive={setShowInactive}
        groupBy={groupBy}
        onSetGroupBy={setGroupBy}
        subGroupBy={subGroupBy}
        onSetSubGroupBy={setSubGroupBy}
        orderBy={orderBy}
        onSetOrderBy={setOrderBy}
        orderAsc={orderAsc}
        onToggleOrderDir={() => setOrderAsc((v) => !v)}
        viewType={viewType}
        onSetViewType={setViewType}
        activeTab={activeTab}
        onSetTab={setActiveTab}
        counts={counts}
        onReset={handleReset}
      />

      <div className="flex-1 min-h-0 overflow-auto">
        {viewType === "board" ? (
          <PolicyBoardView
            policies={tabPolicies}
            editingPolicyId={editingPolicyId}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            orgDisplayName={orgDisplayName}
            groupBy={groupBy}
          />
        ) : (
          <PolicyTableView
            policies={tabPolicies}
            editingPolicyId={editingPolicyId}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
            visibleColumns={visibleColumns}
            orgDisplayName={orgDisplayName}
            groupBy={groupBy}
            subGroupBy={subGroupBy}
            orderBy={orderBy}
            orderAsc={orderAsc}
          />
        )}
      </div>
    </div>
  );
}
