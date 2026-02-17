"use client";

import { useState, useTransition, useEffect } from "react";
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
import { ChevronsUpDown, Check, X, Plus, Pencil, Archive } from "lucide-react";
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
    if (value.endsWith(":*")) return label; // "All Tables", "All Storage Buckets"
    if (value.startsWith("table:")) return `Table: ${label}`;
    if (value.startsWith("storage_bucket:")) return `Bucket: ${label}`;
    if (value.startsWith("feature:")) return `Feature: ${label}`;
    return label;
  }

  // Group options by prefix
  const wildcards = options.filter((o) => o.value.endsWith(":*"));
  const tables = options.filter(
    (o) => o.value.startsWith("table:") && !o.value.endsWith(":*")
  );
  const buckets = options.filter(
    (o) => o.value.startsWith("storage_bucket:") && !o.value.endsWith(":*")
  );
  const features = options.filter((o) => o.value.startsWith("feature:"));

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
}: {
  initialPolicies: OrgPolicyRow[];
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
      {/* Existing Policies */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Policies</CardTitle>
          <CardDescription>
            {initialPolicies.length} {initialPolicies.length === 1 ? "policy" : "policies"} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialPolicies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No policies found for this organization.
            </p>
          ) : (
            <div className="divide-y">
              {initialPolicies.map((policy) => {
                const resourceLabel =
                  policy.resource_type === "feature"
                    ? "Features"
                    : policy.resource_type === "storage_bucket"
                      ? "Storage Buckets"
                      : "Tables";
                const featureMeta = policy.resource_type === "feature"
                  ? FEATURE_RESOURCES.find((f) => f.name === policy.resource_name)
                  : null;
                const resourceScope =
                  policy.resource_name === "*"
                    ? `All ${resourceLabel}`
                    : featureMeta?.label ?? policy.resource_name;

                return (
                  <div
                    key={policy.id}
                    className={cn(
                      "flex items-center gap-4 py-3 px-1",
                      editingPolicyId === policy.id && "bg-muted/50 -mx-1 px-2 rounded"
                    )}
                  >
                    {/* Policy info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {policy.effect === "DENY" ? (
                          <Badge variant="destructive" className="text-xs font-mono uppercase">
                            DENY {policy.action}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-mono uppercase">
                            {policy.action}
                          </Badge>
                        )}
                        <span className="text-sm font-medium">{resourceScope}</span>
                        {policy.scope && policy.scope !== "all" && (
                          <Badge variant="secondary" className="text-xs">
                            {policy.scope === "org_records" && "Org Records"}
                            {policy.scope === "user_records" && "User Records"}
                            {policy.scope === "org_and_user" && "Org + User"}
                          </Badge>
                        )}
                        {!policy.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {summarizeConditions(policy)}
                      </p>
                    </div>

                    {/* Active toggle */}
                    <Switch
                      checked={policy.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(policy.id, checked)
                      }
                      className="shrink-0"
                    />

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleEdit(policy)}
                      aria-label="Edit policy"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          aria-label="Archive policy"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive policy?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will archive the{" "}
                            <strong>{policy.action}</strong> policy for{" "}
                            <strong>{resourceScope}</strong>. It can be restored later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(policy.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Archive
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Policy Inventory */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Inventory</CardTitle>
          <CardDescription>
            Overview of all active policies and table coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active policies by resource */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Active Policies</h4>
            {initialPolicies.filter((p) => p.is_active).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active policies.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Resource</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Action</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Scope</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Conditions</th>
                      <th className="py-2 font-medium text-muted-foreground">Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {initialPolicies
                      .filter((p) => p.is_active)
                      .sort((a, b) => {
                        const typeCompare = a.resource_type.localeCompare(b.resource_type);
                        if (typeCompare !== 0) return typeCompare;
                        const nameCompare = a.resource_name.localeCompare(b.resource_name);
                        if (nameCompare !== 0) return nameCompare;
                        return a.action.localeCompare(b.action);
                      })
                      .map((policy) => (
                        <tr key={policy.id}>
                          <td className="py-2 pr-4">
                            <span className="font-mono text-xs">
                              {policy.resource_type === "feature"
                                ? "feature"
                                : policy.resource_type === "storage_bucket"
                                  ? "bucket"
                                  : "table"}
                            </span>
                            <span className="ml-1">
                              {policy.resource_type === "feature"
                                ? (FEATURE_RESOURCES.find((f) => f.name === policy.resource_name)?.label ?? policy.resource_name)
                                : policy.resource_name}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <Badge variant="outline" className="text-xs font-mono uppercase">
                              {policy.action}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4">
                            <Badge
                              variant={policy.scope === "all" ? "secondary" : "default"}
                              className="text-xs"
                            >
                              {policy.scope === "all" && "All"}
                              {policy.scope === "org_records" && "Org"}
                              {policy.scope === "user_records" && "User"}
                              {policy.scope === "org_and_user" && "Org+User"}
                              {!policy.scope && "All"}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-xs text-muted-foreground max-w-[300px] truncate">
                            {summarizeConditions(policy)}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">v{policy.version}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Separator />

          {/* Coverage report */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Coverage</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Tables with specific policies</p>
                <p className="text-2xl font-bold">
                  {new Set(
                    initialPolicies
                      .filter((p) => p.is_active && p.resource_type === "table" && p.resource_name !== "*")
                      .map((p) => p.resource_name)
                  ).size}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Tables using wildcard policy</p>
                <p className="text-2xl font-bold">
                  {columnFilters.filter((f) => !f.org_column && !f.user_column).length > 0
                    ? `${columnFilters.length - new Set(
                        initialPolicies
                          .filter((p) => p.is_active && p.resource_type === "table" && p.resource_name !== "*")
                          .map((p) => p.resource_name)
                      ).size}`
                    : columnFilters.length.toString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Total active policies</p>
                <p className="text-2xl font-bold">
                  {initialPolicies.filter((p) => p.is_active).length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Inactive policies</p>
                <p className="text-2xl font-bold">
                  {initialPolicies.filter((p) => !p.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
