"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getMemberRolesForPolicies,
  type MemberRoleOption,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/member-roles-api";
import {
  saveOrgPolicy,
  setOrgPolicyActive,
  type OrgPolicyRow,
  type PolicyRuleInput,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/actions";
import { Button } from "@repo/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/shadcn/card";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import { Label } from "@repo/ui/shadcn/label";
import { Switch } from "@repo/ui/shadcn/switch";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
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
import { Separator } from "@repo/ui/shadcn/separator";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@repo/lib/cn";

type RuleState = {
  orgRole: string;
  memberRoles: string[];
};

// Sentinel value for "any/all" since Radix Select reserves empty string for clearing selection
const ALL_VALUE = "_all";

const defaultRule: RuleState = { orgRole: "owner", memberRoles: [ALL_VALUE] };

const orgRoleOptions = [
  { value: ALL_VALUE, label: "All" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "broker", label: "Broker" },
];

const defaultMemberRoleOptions: MemberRoleOption[] = [
  { value: ALL_VALUE, label: "All", description: "Matches all member roles", isOrgSpecific: false },
  { value: "admin", label: "Admin", description: null, isOrgSpecific: false },
  { value: "manager", label: "Manager", description: null, isOrgSpecific: false },
  { value: "member", label: "Member", description: null, isOrgSpecific: false },
];

export default function OrgPolicyBuilder({
  initialPolicies,
}: {
  initialPolicies: OrgPolicyRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resourceType, setResourceType] = useState<"table" | "storage_bucket">(
    "table"
  );
  const [actions, setActions] = useState({
    select: true,
    insert: true,
    update: true,
    delete: true,
  });
  const [allowInternalUsers, setAllowInternalUsers] = useState(false);
  const [rules, setRules] = useState<RuleState[]>([{ ...defaultRule }]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [memberRoleOptions, setMemberRoleOptions] = useState<MemberRoleOption[]>(
    defaultMemberRoleOptions
  );

  // Load member roles dynamically from database
  useEffect(() => {
    async function loadMemberRoles() {
      try {
        const roles = await getMemberRolesForPolicies();
        if (roles.length > 0) {
          setMemberRoleOptions(roles);
        }
      } catch (err) {
        console.error("Failed to load member roles:", err);
      }
    }
    loadMemberRoles();
  }, []);

  const actionList = useMemo(
    () =>
      (Object.entries(actions) as Array<[keyof typeof actions, boolean]>)
        .filter(([, enabled]) => enabled)
        .map(([action]) => action),
    [actions]
  );

  function updateRule(index: number, update: Partial<RuleState>) {
    setRules((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, ...update } : rule))
    );
  }

  function addRule() {
    setRules((prev) => [...prev, { ...defaultRule }]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSave() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        // Convert ALL_VALUE sentinel back to wildcard for storage
        const normalizedRules = rules.map((rule) => ({
          orgRole: rule.orgRole === ALL_VALUE ? "*" : rule.orgRole,
          memberRole: rule.memberRoles.includes(ALL_VALUE)
            ? "*"
            : rule.memberRoles.join(","),
        }));
        await saveOrgPolicy({
          resourceType,
          actions: actionList,
          definition: {
            allowInternalUsers,
            rules: normalizedRules as PolicyRuleInput[],
          },
        });
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
      <Card>
        <CardHeader>
          <CardTitle>Global Policy Builder (v1)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Resource scope</Label>
              <Select
                value={resourceType}
                onValueChange={(value) =>
                  setResourceType(
                    value === "storage_bucket" ? "storage_bucket" : "table"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">All tables</SelectItem>
                  <SelectItem value="storage_bucket">All storage buckets</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                v1 policies apply globally via resource_name = "*".
              </p>
            </div>
            <div className="space-y-2">
              <Label>Allow internal users</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={allowInternalUsers}
                  onCheckedChange={setAllowInternalUsers}
                />
                <span className="text-sm text-muted-foreground">
                  Bypass for internal users
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Actions</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(["select", "insert", "update", "delete"] as const).map(
                (action) => (
                  <label
                    key={action}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={actions[action]}
                      onCheckedChange={(checked) =>
                        setActions((prev) => ({
                          ...prev,
                          [action]: Boolean(checked),
                        }))
                      }
                    />
                    {action}
                  </label>
                )
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Allow rules (OR)</h3>
                <p className="text-xs text-muted-foreground">
                  Each rule is an AND between org role and member role.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addRule}>
                Add rule
              </Button>
            </div>

            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div
                  key={`rule-${index}`}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-2">
                    <Label>Organization Role</Label>
                    <Select
                      value={rule.orgRole}
                      onValueChange={(value) =>
                        updateRule(index, { orgRole: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgRoleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Role</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal h-auto min-h-9 shadow-xs"
                        >
                          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {rule.memberRoles.includes(ALL_VALUE) ? (
                              <span className="text-sm">All</span>
                            ) : rule.memberRoles.length === 0 ? (
                              <span className="text-sm text-muted-foreground">Select roles...</span>
                            ) : (
                              rule.memberRoles.map((v) => {
                                const opt = memberRoleOptions.find((o) => o.value === v);
                                return (
                                  <Badge
                                    key={v}
                                    variant="secondary"
                                    className="text-xs gap-1 pr-1"
                                  >
                                    {opt?.label ?? v}
                                    <button
                                      type="button"
                                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const next = rule.memberRoles.filter((r) => r !== v);
                                        updateRule(index, {
                                          memberRoles: next.length === 0 ? [ALL_VALUE] : next,
                                        });
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search roles..." />
                          <CommandList>
                            <CommandEmpty>No roles found.</CommandEmpty>
                            <CommandGroup>
                              {memberRoleOptions.map((option) => {
                                const isSelected =
                                  option.value === ALL_VALUE
                                    ? rule.memberRoles.includes(ALL_VALUE)
                                    : rule.memberRoles.includes(option.value);

                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                      if (option.value === ALL_VALUE) {
                                        updateRule(index, {
                                          memberRoles: isSelected ? [] : [ALL_VALUE],
                                        });
                                      } else {
                                        let next: string[];
                                        if (isSelected) {
                                          next = rule.memberRoles.filter(
                                            (v) => v !== option.value && v !== ALL_VALUE
                                          );
                                        } else {
                                          next = [
                                            ...rule.memberRoles.filter(
                                              (v) => v !== ALL_VALUE
                                            ),
                                            option.value,
                                          ];
                                        }
                                        updateRule(index, {
                                          memberRoles: next.length === 0 ? [ALL_VALUE] : next,
                                        });
                                      }
                                    }}
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
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span>{option.label}</span>
                                        {option.isOrgSpecific && (
                                          <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                            Org
                                          </span>
                                        )}
                                      </div>
                                      {option.description && (
                                        <span className="text-xs text-muted-foreground">
                                          {option.description}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-start justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(index)}
                      disabled={rules.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
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

          <div className="flex items-center justify-end">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save policy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing policies</CardTitle>
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
                  {policy.resource_type} • {policy.resource_name} •{" "}
                  {policy.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  Version {policy.version} • {policy.is_active ? "Active" : "Inactive"}
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
