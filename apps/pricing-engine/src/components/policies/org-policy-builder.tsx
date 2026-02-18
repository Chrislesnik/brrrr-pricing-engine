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
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/actions";
import {
  FEATURE_RESOURCES,
  type OrgPolicyRow,
  type ConditionInput,
  type PolicyDefinitionInput,
  type PolicyScope,
  type PolicyEffect,
  type PolicyAction,
  type ResourceType,
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui/shadcn/tabs";
import {
  ChevronsUpDown,
  Check,
  X,
  Plus,
  Pencil,
  Archive,
  Lock,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Kanban,
  Table2,
  LayoutGrid,
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

const scopeOptions: Array<{ value: PolicyScope; label: string; description: string }> = [
  { value: "all", label: "All Records", description: "User can access all rows in the table" },
  { value: "org_records", label: "Organization Records", description: "Only rows belonging to the user's organization" },
  { value: "user_records", label: "User's Own Records", description: "Only rows created by or assigned to the user" },
  { value: "org_and_user", label: "Org + User Records", description: "Rows belonging to the org or created by the user" },
];

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

            {tables.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tables">
                  {tables.map(renderItem)}
                </CommandGroup>
              </>
            )}

            {buckets.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Storage Buckets">
                  {buckets.map(renderItem)}
                </CommandGroup>
              </>
            )}

            {features.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Features">
                  {features.map(renderItem)}
                </CommandGroup>
              </>
            )}

            {routes.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Routes">
                  {routes.map(renderItem)}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Main Component
// ============================================================================

// ============================================================================
// Helper: extract human-readable summary from a policy's definition_json
// ============================================================================

function summarizeConditions(policy: OrgPolicyRow): string {
  const def = policy.definition_json as {
    conditions?: Array<{ field: string; operator: string; values: string[] }>;
    connector?: string;
    allow_internal_users?: boolean;
  };

  if (!def?.conditions?.length) {
    return def?.allow_internal_users ? "Internal users only" : "No conditions";
  }

  const fieldLabels: Record<string, string> = {
    org_role: "Org Role",
    member_role: "Member Role",
    org_type: "Org Type",
    internal_user: "User Type",
  };

  const parts = def.conditions.map((c) => {
    const label = fieldLabels[c.field] ?? c.field;
    const op = c.operator === "is_not" ? "is not" : "is";
    return `${label} ${op} ${c.values.join(", ")}`;
  });

  const joined = parts.join(` ${def.connector ?? "AND"} `);
  if (def.allow_internal_users) return `${joined} (+ internal bypass)`;
  return joined;
}

function loadPolicyIntoForm(
  policy: OrgPolicyRow,
  setters: {
    setConditions: (c: ConditionState[]) => void;
    setConnector: (c: "AND" | "OR") => void;
    setAllowInternalUsers: (b: boolean) => void;
    setSelectedActions: (a: string[]) => void;
    setSelectedResources: (r: string[]) => void;
    setSelectedScope: (s: PolicyScope) => void;
    setSelectedEffect: (e: PolicyEffect) => void;
    setEditingPolicyId: (id: string | null) => void;
  }
) {
  const def = policy.definition_json as {
    conditions?: Array<{ field: string; operator: string; values: string[] }>;
    connector?: "AND" | "OR";
    allow_internal_users?: boolean;
    scope?: PolicyScope;
    effect?: PolicyEffect;
  };

  setters.setConditions(
    def?.conditions?.length
      ? def.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          values: c.values,
        }))
      : [{ ...defaultCondition }]
  );
  setters.setConnector(def?.connector ?? "AND");
  setters.setAllowInternalUsers(def?.allow_internal_users ?? false);
  setters.setSelectedActions([policy.action === "all" ? "select" : policy.action]);
  setters.setSelectedResources([`${policy.resource_type}:${policy.resource_name}`]);
  setters.setSelectedScope(policy.scope ?? def?.scope ?? "all");
  setters.setSelectedEffect(policy.effect ?? def?.effect ?? "ALLOW");
  setters.setEditingPolicyId(policy.id);
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
  const [selectedActions, setSelectedActions] = useState<string[]>([
    "select",
    "insert",
    "update",
    "delete",
  ]);
  // Resource selection: format is "type:name" e.g. "table:*", "table:deals", "storage_bucket:deals"
  const [selectedResources, setSelectedResources] = useState<string[]>([
    "table:*",
  ]);

  // Scope
  const [selectedScope, setSelectedScope] = useState<PolicyScope>("all");

  // Effect (ALLOW or DENY)
  const [selectedEffect, setSelectedEffect] = useState<PolicyEffect>("ALLOW");

  // Global override
  const [allowInternalUsers, setAllowInternalUsers] = useState(false);

  // Column filters (for conditional scope selector)
  const [columnFilters, setColumnFilters] = useState<
    Array<{ table_name: string; org_column: string | null; user_column: string | null }>
  >([]);

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
        setResourceOptions(opts);
      } catch (err) {
        console.error("Failed to load available resources:", err);
      }

      // Load column filters for conditional scope selector
      try {
        const filters = await getColumnFilters();
        setColumnFilters(filters);
      } catch (err) {
        console.error("Failed to load column filters:", err);
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

  // Contextual action options: features get submit/view, data gets CRUD
  const activeActionOptions = hasFeatureSelected && !hasDataSelected
    ? featureActionOptions
    : hasDataSelected && !hasFeatureSelected
      ? dataActionOptions
      : [...dataActionOptions, ...featureActionOptions];

  // Reset selected actions when switching between data and feature modes
  useEffect(() => {
    if (hasFeatureSelected && !hasDataSelected) {
      // Only keep feature-valid actions
      const featureVals = new Set(featureActionOptions.map((o) => o.value));
      setSelectedActions((prev) => {
        const valid = prev.filter((a) => featureVals.has(a));
        return valid.length > 0 ? valid : ["submit"];
      });
    } else if (hasDataSelected && !hasFeatureSelected) {
      // Only keep data-valid actions
      const dataVals = new Set(dataActionOptions.map((o) => o.value));
      setSelectedActions((prev) => {
        const valid = prev.filter((a) => dataVals.has(a));
        return valid.length > 0 ? valid : ["select", "insert", "update", "delete"];
      });
    }
  }, [hasFeatureSelected, hasDataSelected]);

  // Determine if scope selector should be enabled based on selected resources
  // Features don't have row-level scope
  const scopeEnabled = (() => {
    if (hasFeatureSelected) return false;
    // If "All Tables" or "All Buckets" is selected, scope is meaningful
    if (selectedResources.some((r) => r.endsWith(":*"))) return true;
    // For specific tables, check if they have ownership columns
    return selectedResources.some((r) => {
      const name = r.split(":")[1];
      const filter = columnFilters.find((f) => f.table_name === name);
      return filter && (filter.org_column || filter.user_column);
    });
  })();

  function resetForm() {
    setEditingPolicyId(null);
    setConditions([{ ...defaultCondition }]);
    setConnector("AND");
    setSelectedActions(["select", "insert", "update", "delete"]);
    setSelectedResources(["table:*"]);
    setSelectedScope("all");
    setSelectedEffect("ALLOW");
    setAllowInternalUsers(false);
    setError(null);
    setStatus(null);
  }

  // Save (create or update)
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

        const definition: PolicyDefinitionInput = {
          allowInternalUsers,
          conditions: conditionInputs,
          connector,
          scope: selectedScope,
          effect: selectedEffect,
        };

        if (editingPolicyId) {
          // Update existing policy
          await updateOrgPolicy({ id: editingPolicyId, definition });
          setStatus("Policy updated successfully.");
          resetForm();
        } else {
          // Create new policies - parse "type:name" format
          for (const resource of selectedResources) {
            const colonIdx = resource.indexOf(":");
            const resourceType = resource.substring(0, colonIdx) as
              | "table"
              | "storage_bucket"
              | "feature";
            const resourceName = resource.substring(colonIdx + 1);

            await saveOrgPolicy({
              resourceType,
              resourceName: resourceName === "*" ? undefined : resourceName,
              actions: selectedActions as PolicyAction[],
              definition,
            });
          }
          setStatus("Policy saved successfully.");
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save policy.");
      }
    });
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        await setOrgPolicyActive({ id, isActive });
        router.refresh();
      } catch (err) {
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
      setSelectedEffect,
      setEditingPolicyId,
    });
    setError(null);
    setStatus(null);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-8 pb-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {editingPolicyId ? "Edit Access Policy" : "Create Access Policy"}
              </CardTitle>
              <CardDescription>
                {editingPolicyId
                  ? "Update the conditions and actions for this policy"
                  : "Define who can access what using conditions and actions"}
              </CardDescription>
            </div>
            {editingPolicyId && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ============================================================ */}
          {/* Effect Toggle (ALLOW / DENY) */}
          {/* ============================================================ */}
          <div className="flex items-center gap-3">
            <RadioGroup
              value={selectedEffect}
              onValueChange={(v) => setSelectedEffect(v as PolicyEffect)}
              className="flex gap-4"
            >
              <label className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors",
                selectedEffect === "ALLOW" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border"
              )}>
                <RadioGroupItem value="ALLOW" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Allow</span>
              </label>
              <label className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors",
                selectedEffect === "DENY" ? "border-destructive bg-destructive/5" : "border-border"
              )}>
                <RadioGroupItem value="DENY" />
                <span className="text-sm font-medium text-destructive">Deny</span>
              </label>
            </RadioGroup>
            <span className="text-xs text-muted-foreground">
              {selectedEffect === "DENY"
                ? "Deny policies override Allow policies"
                : "Grant access when conditions match"}
            </span>
          </div>

          <Separator />

          {/* ============================================================ */}
          {/* WHEN Section */}
          {/* ============================================================ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">When</h3>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              {conditions.map((condition, index) => (
                <div key={`condition-${index}`}>
                  {/* Connector between conditions */}
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

          {/* ============================================================ */}
          {/* SET Section (Actions) */}
          {/* ============================================================ */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold shrink-0">Set permissions to</span>
            <div className="flex-1 min-w-[200px]">
              <ChipsSelect
                options={activeActionOptions}
                selected={selectedActions}
                onChange={setSelectedActions}
                placeholder="Select actions..."
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* ON Section (Resources) */}
          {/* ============================================================ */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold shrink-0">on</span>
            <div className="flex-1 min-w-[200px]">
              <ResourceChipsSelect
                options={resourceOptions}
                selected={selectedResources}
                onChange={setSelectedResources}
                placeholder="Select resources (tables, buckets)..."
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* SCOPE Section (Row Scope) */}
          {/* ============================================================ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">scoped to</span>
              {hasFeatureSelected && !hasDataSelected ? (
                <span className="text-xs text-muted-foreground">
                  (not applicable for feature policies)
                </span>
              ) : !scopeEnabled && (
                <span className="text-xs text-muted-foreground">
                  (selected resource has no ownership columns)
                </span>
              )}
            </div>
            <RadioGroup
              value={selectedScope}
              onValueChange={(v) => setSelectedScope(v as PolicyScope)}
              disabled={!scopeEnabled}
              className="grid grid-cols-2 gap-3"
            >
              {scopeOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                    selectedScope === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                    !scopeEnabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* ============================================================ */}
          {/* Global Override */}
          {/* ============================================================ */}
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

          {/* ============================================================ */}
          {/* Status + Save */}
          {/* ============================================================ */}
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
                selectedResources.length === 0
              }
            >
              {isPending
                ? "Saving..."
                : editingPolicyId
                  ? "Update policy"
                  : "Save policy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Existing Policies — Tabbed by resource_type */}
      {/* ============================================================ */}
      <ExistingPoliciesCard
        policies={initialPolicies}
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

type DisplayColumn = "resourceType" | "resourceName" | "scope" | "action" | "organization" | "conditions" | "effect" | "version";

const POLICY_DISPLAY_COLUMNS: { key: DisplayColumn; label: string }[] = [
  { key: "resourceType", label: "Resource Type" },
  { key: "resourceName", label: "Resource Name" },
  { key: "scope", label: "Scope" },
  { key: "action", label: "Action" },
  { key: "organization", label: "Organization" },
  { key: "conditions", label: "Conditions" },
  { key: "effect", label: "Effect" },
  { key: "version", label: "Version" },
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
];

const ORDERABLE_COLUMNS: { value: OrderByField; label: string }[] = [
  { value: "resourceType", label: "Resource Type" },
  { value: "resourceName", label: "Resource Name" },
  { value: "scope", label: "Scope" },
  { value: "action", label: "Action" },
  { value: "organization", label: "Organization" },
  { value: "effect", label: "Effect" },
  { value: "version", label: "Version" },
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

      {/* Resource type filter tabs (right side) */}
      <Tabs value={activeTab} onValueChange={onSetTab}>
        <TabsList className="h-8">
          {RESOURCE_TYPE_TABS.map((tab) => {
            const count = counts[tab.value] ?? 0;
            if (tab.value !== "all" && count === 0) return null;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs px-2.5 py-1">
                {tab.label}
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-muted/80 px-1 text-[10px] font-medium text-muted-foreground">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
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
  if (policy.resource_name === "*") return "* (All)";
  return policy.resource_name;
}

function resolveOrgLabel(policy: OrgPolicyRow, orgDisplayName: string): string {
  return policy.org_id ? orgDisplayName : "Global";
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
            <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
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
              <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                Protected
              </Badge>
            )}
          </div>
        </td>
      )}

      {visibleColumns.scope && (
        <td className={tdCls}>
          <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
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
          <div className="flex items-center gap-1.5">
            {visibleColumns.effect && policy.effect === "DENY" && (
              <Badge variant="destructive" className="text-[10px] font-mono uppercase whitespace-nowrap">
                DENY
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-mono uppercase whitespace-nowrap">
              {policy.action}
            </Badge>
          </div>
        </td>
      )}

      {visibleColumns.organization && (
        <td className={tdCls}>
          <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
            {resolveOrgLabel(policy, orgDisplayName)}
          </Badge>
        </td>
      )}

      {visibleColumns.conditions && (
        <td className={cn(tdCls, "max-w-[260px]")}>
          <span className="text-xs text-muted-foreground truncate block">
            {summarizeConditions(policy)}
          </span>
        </td>
      )}

      {visibleColumns.version && (
        <td className={tdCls}>
          <span className="text-xs text-muted-foreground">v{policy.version}</span>
        </td>
      )}

      {/* Row actions — always visible column */}
      <td className={cn(tdCls, "text-right sticky right-0 bg-inherit")}>
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Switch
            checked={policy.is_active}
            onCheckedChange={(checked) => onToggleActive(policy.id, checked)}
            className="shrink-0"
            disabled={isProtected}
            title={isProtected ? "Protected policies cannot be disabled" : undefined}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => { e.stopPropagation(); onEdit(policy); }}
            aria-label="Edit policy"
            disabled={isProtected}
            title={isProtected ? "Protected policies cannot be edited" : undefined}
          >
            <Pencil className="h-3 w-3" />
          </Button>

          {isProtected ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-30 cursor-not-allowed"
              disabled
              aria-label="Protected policies cannot be archived"
              title="Protected policies cannot be archived"
            >
              <Archive className="h-3 w-3" />
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  aria-label="Archive policy"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Archive className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive policy?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive the{" "}
                    <strong>{policy.action}</strong> policy for{" "}
                    <strong>{resourceName}</strong>. It can be restored later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(policy.id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
}: {
  label: string;
  count: number;
  colCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  depth: number;
}) {
  return (
    <tr
      className="border-b border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onToggle}
    >
      <td colSpan={colCount} className="px-4 py-2">
        <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-xs font-semibold text-foreground">{label}</span>
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
}: {
  policies: OrgPolicyRow[];
  editingPolicyId: string | null;
  onEdit: (p: OrgPolicyRow) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  visibleColumns: Record<DisplayColumn, boolean>;
  orgDisplayName: string;
  groupBy: GroupByField;
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
    (show("version") ? 1 : 0) +
    1; // actions column

  // Build groups
  const typeGroups = useMemo(() => {
    const map = new Map<string, Map<string, OrgPolicyRow[]>>();

    for (const p of policies) {
      const typeKey = RESOURCE_TYPE_LABELS[p.resource_type] ?? p.resource_type;
      const nameKey = resolveResourceName(p);

      if (!map.has(typeKey)) map.set(typeKey, new Map());
      const nameMap = map.get(typeKey)!;
      if (!nameMap.has(nameKey)) nameMap.set(nameKey, []);
      nameMap.get(nameKey)!.push(p);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, nameMap]) => ({
        type,
        names: Array.from(nameMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, items]) => ({ name, items })),
        count: Array.from(nameMap.values()).reduce((s, arr) => s + arr.length, 0),
      }));
  }, [policies]);

  if (policies.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No policies in this category.
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {show("resourceType") && <th className={thCls}>Resource Type</th>}
            {show("resourceName") && <th className={thCls}>Resource Name</th>}
            {show("scope") && <th className={thCls}>Scope</th>}
            {show("action") && <th className={thCls}>Action</th>}
            {show("organization") && <th className={thCls}>Organization</th>}
            {show("conditions") && <th className={thCls}>Conditions</th>}
            {show("version") && <th className={thCls}>Ver</th>}
            <th className={cn(thCls, "text-right sticky right-0 bg-card")} />
          </tr>
        </thead>
        <tbody>
          {groupBy === "none" ? (
            policies
              .sort((a, b) => a.resource_type.localeCompare(b.resource_type) || a.resource_name.localeCompare(b.resource_name))
              .map((p) => (
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
              ))
          ) : groupBy === "resourceName" ? (
            typeGroups.flatMap((tg) =>
              tg.names.map((ng) => {
                const key = `${tg.type}/${ng.name}`;
                const isC = collapsed[key];
                return (
                  <React.Fragment key={key}>
                    <GroupHeaderRow
                      label={ng.name}
                      count={ng.items.length}
                      colCount={colCount}
                      isCollapsed={!!isC}
                      onToggle={() => toggle(key)}
                      depth={0}
                    />
                    {!isC &&
                      ng.items.map((p) => (
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
                      ))}
                  </React.Fragment>
                );
              })
            )
          ) : (
            typeGroups.map((tg) => {
              const typeKey = `type:${tg.type}`;
              const isTypeCollapsed = collapsed[typeKey];

              return (
                <React.Fragment key={typeKey}>
                  <GroupHeaderRow
                    label={tg.type}
                    count={tg.count}
                    colCount={colCount}
                    isCollapsed={!!isTypeCollapsed}
                    onToggle={() => toggle(typeKey)}
                    depth={0}
                  />
                  {!isTypeCollapsed &&
                    tg.names.map((ng) => {
                      const nameKey = `${typeKey}/${ng.name}`;
                      const isNameCollapsed = collapsed[nameKey];

                      if (ng.items.length === 1) {
                        return (
                          <PolicyTableRow
                            key={ng.items[0].id}
                            policy={ng.items[0]}
                            isEditing={editingPolicyId === ng.items[0].id}
                            onEdit={onEdit}
                            onToggleActive={onToggleActive}
                            onDelete={onDelete}
                            visibleColumns={visibleColumns}
                            orgDisplayName={orgDisplayName}
                            colCount={colCount}
                          />
                        );
                      }

                      return (
                        <React.Fragment key={nameKey}>
                          <GroupHeaderRow
                            label={ng.name}
                            count={ng.items.length}
                            colCount={colCount}
                            isCollapsed={!!isNameCollapsed}
                            onToggle={() => toggle(nameKey)}
                            depth={1}
                          />
                          {!isNameCollapsed &&
                            ng.items.map((p) => (
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
                            ))}
                        </React.Fragment>
                      );
                    })}
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
    const grouper = (p: OrgPolicyRow): string => {
      switch (groupBy) {
        case "resourceType":
          return RESOURCE_TYPE_LABELS[p.resource_type] ?? p.resource_type;
        case "resourceName":
          return resolveResourceName(p);
        case "scope":
          return p.scope ?? "all";
        case "action":
          return p.action;
        case "organization":
          return resolveOrgLabel(p, orgDisplayName);
        case "effect":
          return p.effect ?? "ALLOW";
        default:
          return "All Policies";
      }
    };

    const map = new Map<string, OrgPolicyRow[]>();
    for (const p of policies) {
      const key = grouper(p);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, items]) => ({ label, items }));
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
      {columns.map((col) => (
        <div
          key={col.label}
          className="flex flex-col w-[280px] min-w-[280px] rounded-lg border bg-muted/20"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b">
            <span className="text-xs font-semibold text-foreground">{col.label}</span>
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
                    <Badge variant="secondary" className="text-[10px]">
                      {RESOURCE_TYPE_LABELS[p.resource_type] ?? p.resource_type}
                    </Badge>
                    {isProtected && <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {resolveResourceName(p)}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.effect === "DENY" && (
                      <Badge variant="destructive" className="text-[10px]">DENY</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">
                      {p.action}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {p.scope === "org_records" ? "Org" : p.scope === "user_records" ? "User" : p.scope === "org_and_user" ? "Org+User" : "All"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {resolveOrgLabel(p, orgDisplayName)}
                    </span>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(checked) => onToggleActive(p.id, checked)}
                      className="shrink-0 scale-75"
                      disabled={isProtected}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
          />
        )}
      </div>
    </div>
  );
}
