/**
 * Shared types and constants for the policy builder.
 * Separated from actions.ts because "use server" files can only export async functions.
 */

export type ConditionInput = {
  field: string;
  operator: "is" | "is_not";
  values: string[];
};

export type ConditionGroupInput = {
  connector: "AND" | "OR";
  conditions: ConditionInput[];
};

export type ScopeConditionInput = {
  column: string;
  operator: string;
  reference: string;
};

/** A named multi-hop scope predicate, e.g. 'deal_participant'. */
export type NamedScopeConditionInput = {
  name: string;
};

/**
 * A named scope entry from the organization_policy_named_scopes registry.
 * Fetched at runtime and shown as toggles in the policy builder WHERE section.
 */
export type NamedScopeRow = {
  name: string;
  label: string;
  description: string | null;
  uses_precomputed: boolean;
};

export type PolicyScope = "all" | "org_records" | "user_records" | "org_and_user";
export type PolicyEffect = "ALLOW" | "DENY";

/**
 * Scoping for Liveblocks room policies.
 * - level "user": only rooms linked to entities where the user has a deal role
 * - level "org":  rooms linked to entities where any org member has a deal role
 * - dealRoleTypeIds: optional filter to specific deal role type(s); null = any
 */
export type RoomScopeInput = {
  level: "user" | "org";
  dealRoleTypeIds: number[] | null;
};

export type DealRoleTypeRow = {
  id: number;
  name: string;
  code: string;
};

export type PolicyDefinitionInput = {
  allowInternalUsers: boolean;
  conditions: ConditionInput[];
  conditionGroups?: ConditionGroupInput[];
  connector: "AND" | "OR";
  scope?: PolicyScope;
  effect?: PolicyEffect;
  scopeConditions?: ScopeConditionInput[];
  scopeConnector?: "AND" | "OR";
  /** Named multi-hop scope predicates (Option B/C). Mutually exclusive with scopeConditions. */
  namedScopeConditions?: NamedScopeConditionInput[];
  /** Liveblocks room scoping — which rooms does this policy apply to? */
  roomScope?: RoomScopeInput;
};

export type ResourceType = "table" | "storage_bucket" | "feature" | "route" | "liveblocks" | "api_key";
export type PolicyAction =
  | "select" | "insert" | "update" | "delete" | "all"
  | "submit" | "view"
  | "room_write" | "room_read" | "room_presence_write" | "room_private"
  | "read" | "write";

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
    actions: ["view", "update"],
  },
  {
    name: "settings_members",
    label: "Settings — Members",
    description: "Manage organization members",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_domains",
    label: "Settings — Domains",
    description: "Verified domains and SSO configuration",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_permissions",
    label: "Settings — Permissions",
    description: "Document access permissions",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_policies",
    label: "Settings — Policies",
    description: "Global access policies",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_programs",
    label: "Settings — Programs",
    description: "Manage loan programs configuration",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_inputs",
    label: "Settings — Inputs",
    description: "Manage deal input fields",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_documents",
    label: "Settings — Documents",
    description: "Manage document requirements",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_tasks",
    label: "Settings — Tasks",
    description: "Manage task templates and actions",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_themes",
    label: "Settings — Themes",
    description: "Customize organization appearance",
    actions: ["view", "update"],
  },
  {
    name: "settings_integrations",
    label: "Settings — Integrations",
    description: "Manage integration settings",
    actions: ["view", "insert", "update", "delete"],
  },
  {
    name: "settings_api_keys",
    label: "Settings — API Keys",
    description: "Manage organization API keys for third-party integrations",
    actions: ["view", "insert", "delete"],
  },
];

/**
 * Liveblocks resources that can be governed by policies.
 * Each entry maps to a resource_type = 'liveblocks' row.
 * resource_name uses the pattern "room:{entity_type}".
 */
export const LIVEBLOCKS_RESOURCES: Array<{
  name: string;
  label: string;
  description: string;
  actions: PolicyAction[];
}> = [
  {
    name: "room:deal",
    label: "Deal Rooms",
    description: "Real-time collaboration rooms for deals (comments, presence)",
    actions: ["room_write", "room_read", "room_presence_write", "room_private"],
  },
  {
    name: "room:deal_task",
    label: "Deal Task Rooms",
    description: "Real-time collaboration rooms for deal tasks (comments, presence)",
    actions: ["room_write", "room_read", "room_presence_write", "room_private"],
  },
  {
    name: "room:email_template",
    label: "Email Template Rooms",
    description: "Collaborative editing rooms for email templates",
    actions: ["room_write", "room_read", "room_presence_write", "room_private"],
  },
  {
    name: "room:appraisal",
    label: "Appraisal Rooms",
    description: "Real-time collaboration rooms for appraisal orders (comments, presence)",
    actions: ["room_write", "room_read", "room_presence_write", "room_private"],
  },
];

/**
 * Dynamic integration feature resource type.
 * Each integration_settings catalog entry maps to a feature named `integration:<slug>`.
 * These are loaded at runtime from the DB and merged with FEATURE_RESOURCES.
 */
export type IntegrationFeatureResource = {
  name: string;
  label: string;
  description: string;
  actions: PolicyAction[];
  slug: string;
  integrationSettingsId: number;
};

/**
 * API-accessible resources that can be exposed via Clerk API keys.
 *
 * Each entry maps to `resource_type = 'api_key'` rows in organization_policies.
 * When an active policy exists for a given resource + action, two things happen:
 *   1. The corresponding scope (e.g. `read:deals`) appears in the API key creation UI
 *   2. The matching route(s) call `auth({ acceptsToken: ['session_token','api_key'] })`
 *
 * `routePatterns` lists the API route prefixes covered by each resource.
 */
export const API_RESOURCES: Array<{
  name: string;
  label: string;
  description: string;
  actions: PolicyAction[];
  routePatterns: string[];
}> = [
  {
    name: "deals",
    label: "Deals",
    description: "Deal records, tasks, comments, calendar events, and stepper state",
    actions: ["read", "write"],
    routePatterns: ["/api/deals"],
  },
  {
    name: "loans",
    label: "Loans",
    description: "Loan records, activity, assignees, guarantors, and scenarios",
    actions: ["read", "write"],
    routePatterns: ["/api/loans", "/api/applications"],
  },
  {
    name: "borrowers",
    label: "Borrowers",
    description: "Borrower applicant records and assignees",
    actions: ["read", "write"],
    routePatterns: ["/api/applicants/borrowers", "/api/borrowers"],
  },
  {
    name: "entities",
    label: "Entities",
    description: "Entity applicant records, owners, and assignees",
    actions: ["read", "write"],
    routePatterns: ["/api/applicants/entities"],
  },
  {
    name: "scenarios",
    label: "Scenarios",
    description: "Pricing scenarios and primary scenario selection",
    actions: ["read", "write"],
    routePatterns: ["/api/scenarios"],
  },
  {
    name: "programs",
    label: "Programs",
    description: "Loan programs and program documents",
    actions: ["read", "write"],
    routePatterns: ["/api/programs"],
  },
  {
    name: "appraisals",
    label: "Appraisals",
    description: "Appraisal orders, documents, and statuses",
    actions: ["read", "write"],
    routePatterns: ["/api/appraisal-orders"],
  },
  {
    name: "documents",
    label: "Documents",
    description: "Deal documents, document templates, and AI results",
    actions: ["read", "write"],
    routePatterns: ["/api/document-templates"],
  },
  {
    name: "credit_reports",
    label: "Credit Reports",
    description: "Credit report records (not trigger operations)",
    actions: ["read", "write"],
    routePatterns: ["/api/credit-reports"],
  },
  {
    name: "background_reports",
    label: "Background Reports",
    description: "Background report records (not trigger operations)",
    actions: ["read", "write"],
    routePatterns: ["/api/background-reports"],
  },
  {
    name: "pipeline",
    label: "Pipeline",
    description: "Pipeline view data and loan summary",
    actions: ["read"],
    routePatterns: ["/api/pipeline"],
  },
  {
    name: "signature_requests",
    label: "Signature Requests",
    description: "E-signature requests and signed document downloads",
    actions: ["read", "write"],
    routePatterns: ["/api/signature-requests"],
  },
  {
    name: "contacts",
    label: "Contacts",
    description: "Contact records via borrowers and entities",
    actions: ["read", "write"],
    routePatterns: ["/api/applicants/borrowers", "/api/applicants/entities"],
  },
];
