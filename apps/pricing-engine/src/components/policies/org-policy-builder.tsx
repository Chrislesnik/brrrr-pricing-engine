"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMemberRolesForPolicies } from "@/app/(pricing-engine)/org/[orgId]/settings/policies/member-roles-api";
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
import { Separator } from "@repo/ui/shadcn/separator";

type RuleState = {
  orgRole: string;
  memberRole: string;
  orgType: string;
  operator: "AND" | "OR";
};

const defaultRule: RuleState = { 
  orgRole: "owner", 
  memberRole: "*",
  orgType: "any",
  operator: "AND"
};

const orgRoleOptions = [
  { value: "*", label: "Any org role" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "broker", label: "Broker" },
];

const defaultMemberRoleOptions = [
  { value: "*", label: "Any member role" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
];

const orgTypeOptions = [
  { value: "any", label: "Any organization" },
  { value: "internal", label: "Internal only" },
  { value: "external", label: "External only" },
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
  const [memberRoleOptions, setMemberRoleOptions] = useState<
    Array<{ value: string; label: string }>
  >(defaultMemberRoleOptions);

  // Load member roles from database
  useEffect(() => {
    async function loadMemberRoles() {
      try {
        const roles = await getMemberRolesForPolicies();
        setMemberRoleOptions(roles);
      } catch (error) {
        console.error("Failed to load member roles:", error);
        // Keep default hardcoded options on error
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
        await saveOrgPolicy({
          resourceType,
          actions: actionList,
          definition: {
            allowInternalUsers,
            rules: rules as PolicyRuleInput[],
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
          <CardTitle>Create Access Policy</CardTitle>
          <CardDescription>
            Define a policy using IF (conditions) THEN (grant access) logic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IF Section */}
          <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="font-mono">IF</Badge>
              <h3 className="text-sm font-semibold">Conditions (who can access)</h3>
            </div>

            <div className="space-y-2">
              <Label>Internal users bypass</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={allowInternalUsers}
                  onCheckedChange={setAllowInternalUsers}
                />
                <span className="text-sm text-muted-foreground">
                  Users with is_internal_yn = true get automatic access
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">OR user matches any of these rules:</h4>
                <p className="text-xs text-muted-foreground">
                  Click AND/OR badges to toggle logical operators in each rule
                </p>
              </div>
                <Button variant="outline" size="sm" onClick={addRule}>
                  Add rule
                </Button>
              </div>

            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div key={`rule-${index}`} className="relative">
                  {index > 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="secondary" className="font-mono text-xs bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                        OR
                      </Badge>
                    </div>
                  )}
                  <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto]">
                    <div className="space-y-2">
                      <Label>Organization type</Label>
                      <Select
                        value={rule.orgType}
                        onValueChange={(value) =>
                          updateRule(index, { orgType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {orgTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateRule(index, { 
                            operator: rule.operator === "AND" ? "OR" : "AND" 
                          });
                        }}
                        className="group"
                      >
                        <Badge 
                          variant="outline" 
                          className="font-mono text-xs cursor-pointer hover:bg-accent transition-colors"
                          title="Click to toggle AND/OR"
                        >
                          {rule.operator}
                        </Badge>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label>Organization role</Label>
                      <Select
                        value={rule.orgRole}
                        onValueChange={(value) =>
                          updateRule(index, { orgRole: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any org role" />
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

                    <div className="flex items-end pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateRule(index, { 
                            operator: rule.operator === "AND" ? "OR" : "AND" 
                          });
                        }}
                        className="group"
                      >
                        <Badge 
                          variant="outline" 
                          className="font-mono text-xs cursor-pointer hover:bg-accent transition-colors"
                          title="Click to toggle AND/OR"
                        >
                          {rule.operator}
                        </Badge>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label>Member role</Label>
                    <Select
                      value={rule.memberRole}
                      onValueChange={(value) =>
                        updateRule(index, { memberRole: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any member role" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberRoleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end justify-end pb-2">
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
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* THEN Section */}
          <div className="space-y-4 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="font-mono bg-green-600">THEN</Badge>
              <h3 className="text-sm font-semibold">Grant Access (what they can do)</h3>
            </div>

            <div className="space-y-2">
              <Label>Actions (database operations)</Label>
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
                      <span className="capitalize">{action}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resource scope (where they can access)</Label>
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
                v1 policies apply globally via resource_name = "*"
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
