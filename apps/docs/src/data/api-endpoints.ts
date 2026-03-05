export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface ParamDef {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  tag: string;
  scope: string;
  pathParams: ParamDef[];
  queryParams: ParamDef[];
  requestBody: Record<string, unknown> | null;
  responseExample: Record<string, unknown> | unknown[];
}

export interface EndpointGroup {
  tag: string;
  description: string;
  endpoints: ApiEndpoint[];
}

// ---------------------------------------------------------------------------
// Endpoint definitions
// ---------------------------------------------------------------------------

export const API_ENDPOINTS: ApiEndpoint[] = [
  // ── Deals ────────────────────────────────────────────────────────────
  {
    id: "list-deals",
    method: "GET",
    path: "/api/deals",
    summary: "List deals",
    description:
      "Returns a paginated list of deals visible to the authenticated API key's organization.",
    tag: "Deals",
    scope: "deals:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      deals: [
        {
          id: "deal_01HXYZ",
          heading: "123 Main St – Purchase",
          created_at: "2025-06-15T10:30:00Z",
        },
      ],
    },
  },
  {
    id: "create-deal",
    method: "POST",
    path: "/api/deals",
    summary: "Create a deal",
    description:
      "Creates a new deal with the supplied inputs. Each input is identified by its input_id and input_type.",
    tag: "Deals",
    scope: "deals:write",
    pathParams: [],
    queryParams: [],
    requestBody: {
      deal_inputs: [
        { input_id: "property_address", input_type: "text", value: "123 Main St, Austin TX 78701" },
        { input_id: "purchase_price", input_type: "number", value: 450000 },
      ],
    },
    responseExample: { ok: true, deal: { id: "deal_01HXYZ" } },
  },

  // ── Loans ────────────────────────────────────────────────────────────
  {
    id: "list-loans",
    method: "GET",
    path: "/api/loans/list",
    summary: "List loans",
    description: "Returns all loans visible to the organization.",
    tag: "Loans",
    scope: "loans:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: [
      { id: "loan_01", displayId: "LN-0042", label: "Fix & Flip – 123 Main St" },
    ],
  },
  {
    id: "update-loan",
    method: "PATCH",
    path: "/api/loans/{id}",
    summary: "Update a loan",
    description:
      "Updates an existing loan's status or triggers an action (e.g. submit, approve).",
    tag: "Loans",
    scope: "loans:write",
    pathParams: [{ name: "id", type: "string", required: true, description: "Loan ID" }],
    queryParams: [],
    requestBody: { status: "approved", action: "approve" },
    responseExample: { ok: true },
  },
  {
    id: "archive-loan",
    method: "DELETE",
    path: "/api/loans/{id}",
    summary: "Archive a loan",
    description: "Soft-deletes a loan by moving it to the archive.",
    tag: "Loans",
    scope: "loans:write",
    pathParams: [{ name: "id", type: "string", required: true, description: "Loan ID" }],
    queryParams: [],
    requestBody: null,
    responseExample: { ok: true },
  },

  // ── Applications ─────────────────────────────────────────────────────
  {
    id: "list-applications",
    method: "GET",
    path: "/api/applications/list",
    summary: "List applications",
    description: "Returns all loan applications across the organization pipeline.",
    tag: "Applications",
    scope: "applications:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      items: [
        {
          id: "app_01",
          displayId: "LN-0042",
          appDisplayId: "APP-0012",
          status: "in_review",
          borrowerEntityName: "Acme Holdings LLC",
          propertyAddress: "456 Oak Ave, Dallas TX 75201",
          signingProgressPct: 75,
        },
      ],
    },
  },

  // ── Borrowers ────────────────────────────────────────────────────────
  {
    id: "search-borrowers",
    method: "GET",
    path: "/api/applicants/borrowers",
    summary: "Search borrowers",
    description:
      "Full-text search across borrowers by name, email, or ID. Optionally filter by entity.",
    tag: "Borrowers",
    scope: "borrowers:read",
    pathParams: [],
    queryParams: [
      { name: "q", type: "string", required: false, description: "Search query" },
      { name: "entityId", type: "string", required: false, description: "Filter by entity ID" },
      { name: "includeIds", type: "string", required: false, description: "Comma-separated IDs to always include" },
    ],
    requestBody: null,
    responseExample: {
      borrowers: [
        { id: "brw_01", first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
      ],
    },
  },
  {
    id: "create-borrower",
    method: "POST",
    path: "/api/applicants/borrowers",
    summary: "Create a borrower",
    description: "Creates a new borrower profile attached to the organization.",
    tag: "Borrowers",
    scope: "borrowers:write",
    pathParams: [],
    queryParams: [],
    requestBody: {
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      fico_score: 740,
      phone: "+15125551234",
    },
    responseExample: { ok: true, borrower: { id: "brw_01" } },
  },
  {
    id: "list-borrowers-pipeline",
    method: "GET",
    path: "/api/applicants/borrowers/list",
    summary: "List borrowers pipeline",
    description: "Returns a pipeline view of all borrowers with summary information.",
    tag: "Borrowers",
    scope: "borrowers:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      items: [
        { id: "brw_01", first_name: "Jane", last_name: "Smith", deal_count: 3 },
      ],
    },
  },

  // ── Entities ─────────────────────────────────────────────────────────
  {
    id: "search-entities",
    method: "GET",
    path: "/api/applicants/entities",
    summary: "Search entities",
    description: "Full-text search across entities (LLCs, Trusts, etc.).",
    tag: "Entities",
    scope: "entities:read",
    pathParams: [],
    queryParams: [
      { name: "q", type: "string", required: false, description: "Search query" },
      { name: "includeIds", type: "string", required: false, description: "Comma-separated IDs to always include" },
    ],
    requestBody: null,
    responseExample: {
      entities: [
        { id: "ent_01", entity_name: "Acme Holdings LLC", entity_type: "llc", ein: "12-3456789" },
      ],
    },
  },
  {
    id: "create-entity",
    method: "POST",
    path: "/api/applicants/entities",
    summary: "Create an entity",
    description:
      "Creates a new entity (LLC, Trust, Corporation, etc.) and optionally attaches owners.",
    tag: "Entities",
    scope: "entities:write",
    pathParams: [],
    queryParams: [],
    requestBody: {
      entity_name: "Acme Holdings LLC",
      entity_type: "llc",
      ein: "12-3456789",
      owners: [{ borrower_id: "brw_01", ownership_pct: 100 }],
    },
    responseExample: { ok: true, entity: { id: "ent_01" } },
  },
  {
    id: "list-entities-pipeline",
    method: "GET",
    path: "/api/applicants/entities/list",
    summary: "List entities pipeline",
    description: "Returns a pipeline view of entities with owner mapping.",
    tag: "Entities",
    scope: "entities:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      items: [
        { id: "ent_01", entity_name: "Acme Holdings LLC", entity_type: "llc" },
      ],
      ownersMap: { ent_01: [{ borrower_id: "brw_01", ownership_pct: 100 }] },
    },
  },

  // ── Scenarios ────────────────────────────────────────────────────────
  {
    id: "get-scenario",
    method: "GET",
    path: "/api/scenarios/{id}",
    summary: "Get a scenario",
    description: "Returns a single scenario by ID, including its inputs and outputs.",
    tag: "Scenarios",
    scope: "scenarios:read",
    pathParams: [{ name: "id", type: "string", required: true, description: "Scenario ID" }],
    queryParams: [],
    requestBody: null,
    responseExample: {
      scenario: { id: "scn_01", name: "Base Case", loan_id: "loan_01", primary: true },
    },
  },
  {
    id: "update-scenario",
    method: "POST",
    path: "/api/scenarios/{id}",
    summary: "Update a scenario",
    description: "Updates a scenario's name, inputs, or outputs.",
    tag: "Scenarios",
    scope: "scenarios:write",
    pathParams: [{ name: "id", type: "string", required: true, description: "Scenario ID" }],
    queryParams: [],
    requestBody: { name: "Optimistic Case", inputs: { ltv: 0.75, rate: 8.5 } },
    responseExample: { scenario: { id: "scn_01", name: "Optimistic Case" } },
  },
  {
    id: "archive-scenario",
    method: "DELETE",
    path: "/api/scenarios/{id}",
    summary: "Archive a scenario",
    description:
      "Soft-deletes a scenario. Pass action=restore as a query param to unarchive.",
    tag: "Scenarios",
    scope: "scenarios:write",
    pathParams: [{ name: "id", type: "string", required: true, description: "Scenario ID" }],
    queryParams: [
      { name: "action", type: "string", required: false, description: "Pass 'restore' to unarchive" },
    ],
    requestBody: null,
    responseExample: { ok: true },
  },

  // ── Programs ─────────────────────────────────────────────────────────
  {
    id: "list-programs",
    method: "GET",
    path: "/api/programs",
    summary: "List programs",
    description: "Returns all lending programs configured for the organization.",
    tag: "Programs",
    scope: "programs:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      programs: [
        { id: "prg_01", loan_type: "fix_and_flip", internal_name: "Bridge 12-mo", status: "active" },
      ],
    },
  },

  // ── Appraisals ───────────────────────────────────────────────────────
  {
    id: "list-appraisal-orders",
    method: "GET",
    path: "/api/appraisal-orders",
    summary: "List appraisal orders",
    description: "Returns all appraisal orders for the organization.",
    tag: "Appraisals",
    scope: "appraisals:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      orders: [
        { id: "apo_01", deal_id: "deal_01", order_type: "full", status: "ordered" },
      ],
    },
  },
  {
    id: "create-appraisal-order",
    method: "POST",
    path: "/api/appraisal-orders",
    summary: "Create an appraisal order",
    description: "Creates a new appraisal order for a deal.",
    tag: "Appraisals",
    scope: "appraisals:write",
    pathParams: [],
    queryParams: [],
    requestBody: {
      deal_id: "deal_01",
      order_type: "full",
      property_address: "123 Main St, Austin TX 78701",
      requested_date: "2025-07-01",
    },
    responseExample: { order: { id: "apo_01" } },
  },
  {
    id: "update-appraisal-order",
    method: "PATCH",
    path: "/api/appraisal-orders/{id}",
    summary: "Update an appraisal order",
    description: "Updates an existing appraisal order's status, due date, or other fields.",
    tag: "Appraisals",
    scope: "appraisals:write",
    pathParams: [{ name: "id", type: "string", required: true, description: "Order ID" }],
    queryParams: [],
    requestBody: { order_status: "completed", date_due: "2025-07-15" },
    responseExample: { success: true },
  },

  // ── Documents ────────────────────────────────────────────────────────
  {
    id: "list-document-templates",
    method: "GET",
    path: "/api/document-templates",
    summary: "List document templates",
    description: "Returns all document templates configured for the organization.",
    tag: "Documents",
    scope: "documents:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      templates: [
        { id: "tpl_01", name: "Loan Agreement", created_at: "2025-01-10T08:00:00Z" },
      ],
    },
  },
  {
    id: "create-document-template",
    method: "POST",
    path: "/api/document-templates",
    summary: "Create a document template",
    description: "Creates a new document template with optional HTML content.",
    tag: "Documents",
    scope: "documents:write",
    pathParams: [],
    queryParams: [],
    requestBody: { name: "Loan Agreement", html_content: "<h1>Loan Agreement</h1>" },
    responseExample: { template: { id: "tpl_01" } },
  },

  // ── Credit Reports ──────────────────────────────────────────────────
  {
    id: "list-credit-reports",
    method: "GET",
    path: "/api/credit-reports",
    summary: "List credit reports",
    description:
      "Returns credit report documents for a specific borrower. The borrowerId query parameter is required.",
    tag: "Credit Reports",
    scope: "credit_reports:read",
    pathParams: [],
    queryParams: [
      { name: "borrowerId", type: "string", required: true, description: "Borrower ID (required)" },
    ],
    requestBody: null,
    responseExample: {
      documents: [
        { id: "cr_01", borrower_id: "brw_01", provider: "equifax", pulled_at: "2025-06-01T12:00:00Z" },
      ],
    },
  },

  // ── Background Reports ──────────────────────────────────────────────
  {
    id: "list-background-reports",
    method: "GET",
    path: "/api/background-reports",
    summary: "List background reports",
    description: "Returns all background check reports for the organization.",
    tag: "Background Reports",
    scope: "background_reports:read",
    pathParams: [],
    queryParams: [],
    requestBody: null,
    responseExample: {
      reports: [
        { id: "bg_01", borrower_id: "brw_01", report_type: "criminal", status: "completed" },
      ],
    },
  },
  {
    id: "create-background-report",
    method: "POST",
    path: "/api/background-reports",
    summary: "Create a background report",
    description: "Initiates a background check for a borrower or entity.",
    tag: "Background Reports",
    scope: "background_reports:write",
    pathParams: [],
    queryParams: [],
    requestBody: { borrower_id: "brw_01", entity_id: null, report_type: "criminal" },
    responseExample: { report: { id: "bg_01" } },
  },

  // ── Pipeline ─────────────────────────────────────────────────────────
  {
    id: "get-pipeline",
    method: "GET",
    path: "/api/pipeline",
    summary: "Get pipeline data",
    description:
      "Returns pipeline-view data. The shape depends on the view query parameter.",
    tag: "Pipeline",
    scope: "pipeline:read",
    pathParams: [],
    queryParams: [
      { name: "view", type: "string", required: false, description: "Pipeline view (e.g. 'board', 'table')" },
    ],
    requestBody: null,
    responseExample: {
      items: [
        { id: "deal_01", heading: "123 Main St", stage: "underwriting", updated_at: "2025-06-20T09:00:00Z" },
      ],
    },
  },

  // ── Signature Requests ──────────────────────────────────────────────
  {
    id: "list-signature-requests",
    method: "GET",
    path: "/api/signature-requests",
    summary: "List signature requests",
    description:
      "Returns e-signature requests for a deal. The dealId query parameter is required.",
    tag: "Signature Requests",
    scope: "signature_requests:read",
    pathParams: [],
    queryParams: [
      { name: "dealId", type: "string", required: true, description: "Deal ID (required)" },
    ],
    requestBody: null,
    responseExample: {
      requests: [
        { id: "sig_01", deal_id: "deal_01", status: "pending", signer_email: "jane@example.com" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TAG_ORDER = [
  "Deals",
  "Loans",
  "Applications",
  "Borrowers",
  "Entities",
  "Scenarios",
  "Programs",
  "Appraisals",
  "Documents",
  "Credit Reports",
  "Background Reports",
  "Pipeline",
  "Signature Requests",
] as const;

const TAG_DESCRIPTIONS: Record<string, string> = {
  Deals: "Create and manage lending deals.",
  Loans: "View, update, and archive loans.",
  Applications: "Track loan applications across the pipeline.",
  Borrowers: "Search, create, and manage borrower profiles.",
  Entities: "Manage LLCs, Trusts, and other legal entities.",
  Scenarios: "Model pricing scenarios for loans.",
  Programs: "View lending program configurations.",
  Appraisals: "Manage property appraisal orders.",
  Documents: "Work with document templates.",
  "Credit Reports": "Pull and view credit reports.",
  "Background Reports": "Run background checks on borrowers and entities.",
  Pipeline: "Retrieve pipeline-level analytics.",
  "Signature Requests": "Track e-signature status for deals.",
};

export function groupEndpoints(): EndpointGroup[] {
  const byTag = new Map<string, ApiEndpoint[]>();
  for (const ep of API_ENDPOINTS) {
    const list = byTag.get(ep.tag) ?? [];
    list.push(ep);
    byTag.set(ep.tag, list);
  }

  return TAG_ORDER.filter((t) => byTag.has(t)).map((tag) => ({
    tag,
    description: TAG_DESCRIPTIONS[tag] ?? "",
    endpoints: byTag.get(tag)!,
  }));
}

// ---------------------------------------------------------------------------
// Code snippet generators
// ---------------------------------------------------------------------------

function buildQueryString(ep: ApiEndpoint): string {
  const required = ep.queryParams.filter((p) => p.required);
  if (required.length === 0) return "";
  const pairs = required.map((p) => `${p.name}=<${p.name}>`);
  return `?${pairs.join("&")}`;
}

export function generateCurl(ep: ApiEndpoint, baseUrl = "https://api.example.com"): string {
  const qs = buildQueryString(ep);
  const url = `${baseUrl}${ep.path}${qs}`;
  const lines: string[] = [`curl -X ${ep.method} "${url}" \\`];
  lines.push(`  -H "Authorization: Bearer <api_key_secret>" \\`);
  lines.push(`  -H "Content-Type: application/json"`);
  if (ep.requestBody) {
    lines[lines.length - 1] += " \\";
    lines.push(`  -d '${JSON.stringify(ep.requestBody, null, 2)}'`);
  }
  return lines.join("\n");
}

export function generateJavaScript(ep: ApiEndpoint, baseUrl = "https://api.example.com"): string {
  const qs = buildQueryString(ep);
  const url = `${baseUrl}${ep.path}${qs}`;
  const opts: string[] = [];
  opts.push(`  method: "${ep.method}",`);
  opts.push(`  headers: {`);
  opts.push(`    "Authorization": "Bearer <api_key_secret>",`);
  opts.push(`    "Content-Type": "application/json",`);
  opts.push(`  },`);
  if (ep.requestBody) {
    opts.push(`  body: JSON.stringify(${JSON.stringify(ep.requestBody, null, 4).replace(/\n/g, "\n  ")}),`);
  }

  return [
    `const response = await fetch("${url}", {`,
    ...opts,
    `});`,
    ``,
    `const data = await response.json();`,
    `console.log(data);`,
  ].join("\n");
}

export function generatePython(ep: ApiEndpoint, baseUrl = "https://api.example.com"): string {
  const qs = buildQueryString(ep);
  const url = `${baseUrl}${ep.path}${qs}`;
  const lines: string[] = ["import requests", ""];
  lines.push(`url = "${url}"`);
  lines.push(`headers = {`);
  lines.push(`    "Authorization": "Bearer <api_key_secret>",`);
  lines.push(`    "Content-Type": "application/json",`);
  lines.push(`}`);
  if (ep.requestBody) {
    lines.push(`payload = ${JSON.stringify(ep.requestBody, null, 4)}`);
    lines.push("");
    lines.push(`response = requests.${ep.method.toLowerCase()}(url, headers=headers, json=payload)`);
  } else {
    lines.push("");
    lines.push(`response = requests.${ep.method.toLowerCase()}(url, headers=headers)`);
  }
  lines.push(`print(response.json())`);
  return lines.join("\n");
}
