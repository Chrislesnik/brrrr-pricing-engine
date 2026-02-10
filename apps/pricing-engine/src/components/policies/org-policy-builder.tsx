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
  type OrgPolicyRow,
  type ConditionInput,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/actions";
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
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command";
import { Separator } from "@repo/ui/shadcn/separator";
import { ChevronsUpDown, Check, X, Plus } from "lucide-react";
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

const actionOptions = [
  { value: "select", label: "Select" },
  { value: "insert", label: "Insert" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
];

const resourceOptions = [
  { value: "table", label: "All Tables" },
  { value: "storage_bucket", label: "All Storage Buckets" },
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
// Main Component
// ============================================================================

export default function OrgPolicyBuilder({
  initialPolicies,
}: {
  initialPolicies: OrgPolicyRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
  const [selectedResources, setSelectedResources] = useState<string[]>([
    "table",
  ]);

  // Global override
  const [allowInternalUsers, setAllowInternalUsers] = useState(false);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Dynamic member role options
  const [memberRoleValueOptions, setMemberRoleValueOptions] = useState<
    Array<{ value: string; label: string; description?: string | null }>
  >([]);

  useEffect(() => {
    async function loadMemberRoles() {
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
    }
    loadMemberRoles();
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

  // Save
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

        // Save one policy per action+resource combination
        for (const resourceType of selectedResources) {
          await saveOrgPolicy({
            resourceType: resourceType as "table" | "storage_bucket",
            actions: selectedActions as Array<
              "select" | "insert" | "update" | "delete"
            >,
            definition: {
              allowInternalUsers,
              conditions: conditionInputs,
              connector,
            },
          });
        }
        setStatus("Policy saved successfully.");
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

  return (
    <div className="space-y-8">
      {/* Policy Builder Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Access Policy</CardTitle>
          <CardDescription>
            Define who can access what using conditions and actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                options={actionOptions}
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
              <ChipsSelect
                options={resourceOptions}
                selected={selectedResources}
                onChange={setSelectedResources}
                placeholder="Select resources..."
              />
            </div>
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

          <div className="flex items-center justify-end">
            <Button
              onClick={handleSave}
              disabled={
                isPending ||
                selectedActions.length === 0 ||
                selectedResources.length === 0
              }
            >
              {isPending ? "Saving..." : "Save policy"}
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
        </CardHeader>
        <CardContent className="space-y-4">
          {initialPolicies.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No policies found for this organization.
            </p>
          )}
          {initialPolicies.map((policy) => (
            <div
              key={policy.id}
              className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {policy.resource_type} &bull; {policy.resource_name} &bull;{" "}
                  {policy.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  Version {policy.version} &bull;{" "}
                  {policy.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={policy.is_active}
                  onCheckedChange={(checked) =>
                    handleToggleActive(policy.id, checked)
                  }
                />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
