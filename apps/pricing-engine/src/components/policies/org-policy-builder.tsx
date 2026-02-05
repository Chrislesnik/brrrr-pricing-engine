"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveOrgPolicy,
  setOrgPolicyActive,
  type OrgPolicyRow,
  type PolicyRuleInput,
} from "@/app/(pricing-engine)/org/[orgId]/settings/policies/actions";
import { Button } from "@repo/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/shadcn/card";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import { Label } from "@repo/ui/shadcn/label";
import { Switch } from "@repo/ui/shadcn/switch";
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
};

const defaultRule: RuleState = { orgRole: "owner", memberRole: "*" };

const orgRoleOptions = [
  { value: "*", label: "Any org role" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "broker", label: "Broker" },
];

const memberRoleOptions = [
  { value: "*", label: "Any member role" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
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
