/**
 * Shared types and constants for the policy builder.
 * Separated from actions.ts because "use server" files can only export async functions.
 */

export type ConditionInput = {
  field: string;
  operator: "is" | "is_not";
  values: string[];
};

export type PolicyScope = "all" | "org_records" | "user_records" | "org_and_user";
export type PolicyEffect = "ALLOW" | "DENY";

export type PolicyDefinitionInput = {
  allowInternalUsers: boolean;
  conditions: ConditionInput[];
  connector: "AND" | "OR";
  scope?: PolicyScope;
  effect?: PolicyEffect;
};

export type ResourceType = "table" | "storage_bucket" | "feature" | "route";
export type PolicyAction =
  | "select" | "insert" | "update" | "delete" | "all"
  | "submit" | "view";

export type OrgPolicyRow = {
  id: string;
  org_id: string | null;
  resource_type: ResourceType;
  resource_name: string;
  action: PolicyAction;
  definition_json: Record<string, unknown>;
  compiled_config: Record<string, unknown>;
  scope: PolicyScope;
  effect: PolicyEffect;
  version: number;
  is_active: boolean;
  is_protected_policy: boolean;
  created_at: string;
};

/**
 * Well-known application features that can be governed by policies.
 * Each entry maps to a resource_type = 'feature' row.
 */
export const FEATURE_RESOURCES: Array<{
  name: string;
  label: string;
  description: string;
  actions: PolicyAction[];
}> = [
  {
    name: "organization_invitations",
    label: "Organization Invitations",
    description: "Invite members to join an organization",
    actions: ["submit", "view"],
  },
  {
    name: "permanent_delete",
    label: "Permanent Delete",
    description: "Permanently remove archived records from the database",
    actions: ["delete"],
  },
  {
    name: "settings_general",
    label: "Settings — General",
    description: "Organization profile and general settings",
    actions: ["view"],
  },
  {
    name: "settings_members",
    label: "Settings — Members",
    description: "Manage organization members",
    actions: ["view"],
  },
  {
    name: "settings_domains",
    label: "Settings — Domains",
    description: "Verified domains and SSO configuration",
    actions: ["view"],
  },
  {
    name: "settings_permissions",
    label: "Settings — Permissions",
    description: "Document access permissions",
    actions: ["view"],
  },
  {
    name: "settings_policies",
    label: "Settings — Policies",
    description: "Global access policies",
    actions: ["view"],
  },
  {
    name: "settings_programs",
    label: "Settings — Programs",
    description: "Manage loan programs configuration",
    actions: ["view"],
  },
  {
    name: "settings_inputs",
    label: "Settings — Inputs",
    description: "Manage deal input fields",
    actions: ["view"],
  },
  {
    name: "settings_documents",
    label: "Settings — Documents",
    description: "Manage document requirements",
    actions: ["view"],
  },
  {
    name: "settings_tasks",
    label: "Settings — Tasks",
    description: "Manage task templates and actions",
    actions: ["view"],
  },
  {
    name: "settings_themes",
    label: "Settings — Themes",
    description: "Customize organization appearance",
    actions: ["view"],
  },
];
