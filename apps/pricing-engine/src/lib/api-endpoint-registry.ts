/**
 * Comprehensive registry of all API-key-accessible endpoints.
 *
 * Used by:
 *   - OpenAPI spec generator (/api/org/api-keys/openapi)
 *   - API Reference tab in settings
 *   - Quick-start snippets in the key creation dialog
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

export interface JsonSchemaProperty {
  type: string
  description?: string
  example?: unknown
  format?: string
  enum?: string[]
  items?: JsonSchemaProperty
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  nullable?: boolean
  oneOf?: JsonSchemaProperty[]
}

export interface JsonSchemaObject {
  type: "object" | "array"
  description?: string
  required?: string[]
  properties?: Record<string, JsonSchemaProperty>
  items?: JsonSchemaProperty
  example?: unknown
}

export interface ApiEndpoint {
  method: HttpMethod
  path: string
  summary: string
  description: string
  scope: string
  resource: string
  tags: string[]
  pathParams?: Array<{ name: string; description: string; example: string }>
  queryParams?: Array<{
    name: string
    description: string
    required?: boolean
    example?: string
  }>
  requestBody?: {
    description?: string
    schema: JsonSchemaObject
    example: unknown
  }
  response: {
    description: string
    schema: JsonSchemaObject
    example: unknown
    status?: number
  }
}

/* ------------------------------------------------------------------ */
/*  Endpoint definitions                                               */
/* ------------------------------------------------------------------ */

export const API_ENDPOINTS: ApiEndpoint[] = [
  /* ======================== DEALS ======================== */
  {
    method: "GET",
    path: "/api/deals",
    summary: "List deals",
    description:
      "Returns all non-archived deals for the authenticated organization with computed headings.",
    scope: "read:deals",
    resource: "deals",
    tags: ["Deals"],
    response: {
      description: "Array of deals",
      schema: {
        type: "object",
        properties: {
          deals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                heading: { type: "string", nullable: true },
                created_at: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      example: {
        deals: [
          {
            id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
            heading: "123 Main St — $1,250,000",
            created_at: "2026-02-15T10:30:00Z",
          },
        ],
      },
    },
  },
  {
    method: "POST",
    path: "/api/deals",
    summary: "Create a deal",
    description:
      "Creates a new deal with the provided input values. Automatically provisions a Liveblocks room and deal stepper.",
    scope: "write:deals",
    resource: "deals",
    tags: ["Deals"],
    requestBody: {
      description: "Deal inputs array",
      schema: {
        type: "object",
        required: ["deal_inputs"],
        properties: {
          deal_inputs: {
            type: "array",
            items: {
              type: "object",
              required: ["input_id", "input_type", "value"],
              properties: {
                input_id: { type: "string", description: "Input field UUID" },
                input_type: {
                  type: "string",
                  enum: [
                    "text",
                    "dropdown",
                    "currency",
                    "number",
                    "percentage",
                    "date",
                    "boolean",
                  ],
                },
                value: {
                  type: "string",
                  description: "Value (type depends on input_type)",
                  nullable: true,
                },
              },
            },
          },
        },
      },
      example: {
        deal_inputs: [
          {
            input_id: "abc-123",
            input_type: "text",
            value: "123 Main St",
          },
          {
            input_id: "def-456",
            input_type: "currency",
            value: 1250000,
          },
        ],
      },
    },
    response: {
      description: "Created deal",
      status: 201,
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          deal: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" } },
          },
        },
      },
      example: {
        ok: true,
        deal: { id: "d290f1ee-6c54-4b01-90e6-d701748f0851" },
      },
    },
  },

  /* ======================== LOANS ======================== */
  {
    method: "GET",
    path: "/api/loans/list",
    summary: "List loans",
    description:
      "Returns all loans for the organization with display IDs and labels.",
    scope: "read:loans",
    resource: "loans",
    tags: ["Loans"],
    response: {
      description: "Array of loans",
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            displayId: { type: "string" },
            label: { type: "string" },
          },
        },
      },
      example: [
        { id: "a1b2c3d4", displayId: "LN-001", label: "LN-001 — 456 Oak Ave" },
      ],
    },
  },
  {
    method: "PATCH",
    path: "/api/loans/{id}",
    summary: "Update a loan",
    description:
      "Update loan status or restore from archive.",
    scope: "write:loans",
    resource: "loans",
    tags: ["Loans"],
    pathParams: [
      { name: "id", description: "Loan UUID", example: "a1b2c3d4-..." },
    ],
    requestBody: {
      description: "Loan update fields",
      schema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "inactive"] },
          action: { type: "string", enum: ["restore"] },
        },
      },
      example: { status: "active" },
    },
    response: {
      description: "Success",
      schema: {
        type: "object",
        properties: { ok: { type: "boolean" } },
      },
      example: { ok: true },
    },
  },
  {
    method: "DELETE",
    path: "/api/loans/{id}",
    summary: "Archive a loan",
    description: "Soft-deletes (archives) a loan by ID.",
    scope: "write:loans",
    resource: "loans",
    tags: ["Loans"],
    pathParams: [
      { name: "id", description: "Loan UUID", example: "a1b2c3d4-..." },
    ],
    response: {
      description: "Success",
      schema: {
        type: "object",
        properties: { ok: { type: "boolean" } },
      },
      example: { ok: true },
    },
  },

  /* ======================== APPLICATIONS ======================== */
  {
    method: "GET",
    path: "/api/applications/list",
    summary: "List applications",
    description:
      "Returns all loan applications for the organization with borrower/entity info, signing progress, and status.",
    scope: "read:loans",
    resource: "loans",
    tags: ["Applications"],
    response: {
      description: "Array of applications",
      schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                displayId: { type: "string" },
                appDisplayId: { type: "string" },
                status: { type: "string" },
                borrowerEntityName: { type: "string", nullable: true },
                propertyAddress: { type: "string", nullable: true },
                signingProgressPct: { type: "number" },
              },
            },
          },
        },
      },
      example: {
        items: [
          {
            id: "x1y2z3",
            displayId: "LN-001",
            appDisplayId: "APP-001",
            status: "active",
            borrowerEntityName: "Acme LLC",
            propertyAddress: "789 Pine Rd",
            signingProgressPct: 75,
          },
        ],
      },
    },
  },

  /* ======================== BORROWERS ======================== */
  {
    method: "GET",
    path: "/api/applicants/borrowers",
    summary: "Search borrowers",
    description:
      "Returns borrowers for the organization. Supports search by name/email and filtering by entity.",
    scope: "read:borrowers",
    resource: "borrowers",
    tags: ["Borrowers"],
    queryParams: [
      { name: "q", description: "Search query (name or email)" },
      { name: "entityId", description: "Filter by linked entity UUID" },
      {
        name: "includeIds",
        description: "Comma-separated UUIDs to always include",
      },
    ],
    response: {
      description: "Array of borrowers",
      schema: {
        type: "object",
        properties: {
          borrowers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                display_id: { type: "string" },
                first_name: { type: "string" },
                last_name: { type: "string" },
                email: { type: "string", nullable: true },
                primary_phone: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      example: {
        borrowers: [
          {
            id: "b1b2b3b4",
            display_id: "BRW-001",
            first_name: "Jane",
            last_name: "Doe",
            email: "jane@example.com",
            primary_phone: "+15551234567",
          },
        ],
      },
    },
  },
  {
    method: "POST",
    path: "/api/applicants/borrowers",
    summary: "Create a borrower",
    description:
      "Creates a new borrower record with personal and financial details.",
    scope: "write:borrowers",
    resource: "borrowers",
    tags: ["Borrowers"],
    requestBody: {
      description: "Borrower details",
      schema: {
        type: "object",
        required: ["first_name", "last_name"],
        properties: {
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: "string", format: "email" },
          primary_phone: { type: "string" },
          ssn: { type: "string" },
          date_of_birth: { type: "string", format: "date" },
          fico_score: { type: "number" },
          address_line1: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
        },
      },
      example: {
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        fico_score: 750,
      },
    },
    response: {
      description: "Created borrower",
      status: 201,
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          borrower: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" } },
          },
        },
      },
      example: { ok: true, borrower: { id: "b1b2b3b4" } },
    },
  },
  {
    method: "GET",
    path: "/api/applicants/borrowers/list",
    summary: "List borrowers (pipeline)",
    description:
      "Returns borrowers in the pipeline list format with role assignments.",
    scope: "read:borrowers",
    resource: "borrowers",
    tags: ["Borrowers"],
    response: {
      description: "Array of borrower profiles",
      schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                display_id: { type: "string" },
                first_name: { type: "string" },
                last_name: { type: "string" },
              },
            },
          },
        },
      },
      example: {
        items: [
          {
            id: "b1b2b3b4",
            display_id: "BRW-001",
            first_name: "Jane",
            last_name: "Doe",
          },
        ],
      },
    },
  },

  /* ======================== ENTITIES ======================== */
  {
    method: "GET",
    path: "/api/applicants/entities",
    summary: "Search entities",
    description:
      "Returns entities for the organization with optional search and ID filtering.",
    scope: "read:entities",
    resource: "entities",
    tags: ["Entities"],
    queryParams: [
      { name: "q", description: "Search query (entity name)" },
      {
        name: "includeIds",
        description: "Comma-separated UUIDs to always include",
      },
    ],
    response: {
      description: "Array of entities",
      schema: {
        type: "object",
        properties: {
          entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                display_id: { type: "string" },
                entity_name: { type: "string" },
                entity_type: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      example: {
        entities: [
          {
            id: "e1e2e3e4",
            display_id: "ENT-001",
            entity_name: "Acme Holdings LLC",
            entity_type: "LLC",
          },
        ],
      },
    },
  },
  {
    method: "POST",
    path: "/api/applicants/entities",
    summary: "Create an entity",
    description:
      "Creates a new entity with optional owners and borrower links.",
    scope: "write:entities",
    resource: "entities",
    tags: ["Entities"],
    requestBody: {
      description: "Entity details",
      schema: {
        type: "object",
        required: ["entity_name"],
        properties: {
          entity_name: { type: "string" },
          entity_type: { type: "string" },
          ein: { type: "string" },
          date_formed: { type: "string", format: "date" },
          state_formed: { type: "string" },
          address_line1: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          owners: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                title: { type: "string" },
                ownership_percent: { type: "number" },
                borrower_id: { type: "string", format: "uuid" },
              },
            },
          },
        },
      },
      example: {
        entity_name: "Acme Holdings LLC",
        entity_type: "LLC",
        ein: "12-3456789",
        owners: [{ name: "Jane Doe", ownership_percent: 100 }],
      },
    },
    response: {
      description: "Created entity",
      status: 201,
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          entity: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" } },
          },
        },
      },
      example: { ok: true, entity: { id: "e1e2e3e4" } },
    },
  },
  {
    method: "GET",
    path: "/api/applicants/entities/list",
    summary: "List entities (pipeline)",
    description:
      "Returns entities in the pipeline list format with owner maps.",
    scope: "read:entities",
    resource: "entities",
    tags: ["Entities"],
    response: {
      description: "Array of entity profiles with owners",
      schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                display_id: { type: "string" },
                entity_name: { type: "string" },
                entity_type: { type: "string", nullable: true },
              },
            },
          },
          ownersMap: {
            type: "object",
            description: "Map of entity ID → owner array",
          },
        },
      },
      example: {
        items: [
          {
            id: "e1e2e3e4",
            display_id: "ENT-001",
            entity_name: "Acme Holdings LLC",
            entity_type: "LLC",
          },
        ],
        ownersMap: {},
      },
    },
  },

  /* ======================== SCENARIOS ======================== */
  {
    method: "GET",
    path: "/api/scenarios/{id}",
    summary: "Get a scenario",
    description: "Returns a single pricing scenario by ID.",
    scope: "read:scenarios",
    resource: "scenarios",
    tags: ["Scenarios"],
    pathParams: [
      { name: "id", description: "Scenario UUID", example: "s1s2s3s4-..." },
    ],
    response: {
      description: "Scenario details",
      schema: {
        type: "object",
        properties: {
          scenario: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              loan_id: { type: "string", format: "uuid" },
              primary: { type: "boolean" },
              inputs: { type: "object" },
              outputs: { type: "array" },
              selected: { type: "object" },
            },
          },
        },
      },
      example: {
        scenario: {
          id: "s1s2s3s4",
          name: "Scenario A",
          loan_id: "a1b2c3d4",
          primary: true,
        },
      },
    },
  },
  {
    method: "POST",
    path: "/api/scenarios/{id}",
    summary: "Update a scenario",
    description: "Updates a pricing scenario's name, inputs, or outputs.",
    scope: "write:scenarios",
    resource: "scenarios",
    tags: ["Scenarios"],
    pathParams: [
      { name: "id", description: "Scenario UUID", example: "s1s2s3s4-..." },
    ],
    requestBody: {
      description: "Scenario update fields",
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          inputs: { type: "object" },
          outputs: { type: "array" },
          selected: { type: "object" },
          loanId: { type: "string", format: "uuid" },
        },
      },
      example: { name: "Scenario A — Updated" },
    },
    response: {
      description: "Updated scenario",
      schema: {
        type: "object",
        properties: {
          scenario: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              loan_id: { type: "string", format: "uuid" },
              primary: { type: "boolean" },
            },
          },
        },
      },
      example: {
        scenario: { id: "s1s2s3s4", name: "Scenario A — Updated" },
      },
    },
  },
  {
    method: "DELETE",
    path: "/api/scenarios/{id}",
    summary: "Archive a scenario",
    description:
      'Soft-deletes a scenario. Pass `?action=restore` to restore it.',
    scope: "write:scenarios",
    resource: "scenarios",
    tags: ["Scenarios"],
    pathParams: [
      { name: "id", description: "Scenario UUID", example: "s1s2s3s4-..." },
    ],
    queryParams: [
      {
        name: "action",
        description: 'Set to "restore" to unarchive',
        example: "restore",
      },
    ],
    response: {
      description: "Success",
      schema: {
        type: "object",
        properties: { ok: { type: "boolean" } },
      },
      example: { ok: true },
    },
  },

  /* ======================== PROGRAMS ======================== */
  {
    method: "GET",
    path: "/api/programs",
    summary: "List programs",
    description: "Returns all loan programs for the organization.",
    scope: "read:programs",
    resource: "programs",
    tags: ["Programs"],
    response: {
      description: "Array of programs",
      schema: {
        type: "object",
        properties: {
          programs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                loan_type: { type: "string" },
                internal_name: { type: "string" },
                external_name: { type: "string", nullable: true },
                status: { type: "string" },
              },
            },
          },
        },
      },
      example: {
        programs: [
          {
            id: "p1p2p3p4",
            loan_type: "DSCR",
            internal_name: "DSCR 30yr Fixed",
            external_name: "DSCR Loan",
            status: "active",
          },
        ],
      },
    },
  },

  /* ======================== APPRAISALS ======================== */
  {
    method: "GET",
    path: "/api/appraisal-orders",
    summary: "List appraisal orders",
    description: "Returns all appraisal orders for the organization.",
    scope: "read:appraisals",
    resource: "appraisals",
    tags: ["Appraisals"],
    response: {
      description: "Array of appraisal orders",
      schema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                order_status: { type: "string", nullable: true },
                property_address: { type: "string", nullable: true },
                date_due: { type: "string", format: "date", nullable: true },
              },
            },
          },
        },
      },
      example: {
        orders: [
          {
            id: "ap1ap2",
            order_status: "ordered",
            property_address: "123 Main St",
            date_due: "2026-04-01",
          },
        ],
      },
    },
  },
  {
    method: "POST",
    path: "/api/appraisal-orders",
    summary: "Create an appraisal order",
    description:
      "Creates a new appraisal order with property and borrower details.",
    scope: "write:appraisals",
    resource: "appraisals",
    tags: ["Appraisals"],
    requestBody: {
      description: "Appraisal order details",
      schema: {
        type: "object",
        properties: {
          deal_id: { type: "string", format: "uuid" },
          borrower_id: { type: "string", format: "uuid" },
          order_type: { type: "string" },
          order_status: { type: "string" },
          property_address: { type: "string" },
          property_city: { type: "string" },
          property_state: { type: "string" },
          property_zip: { type: "string" },
          date_due: { type: "string", format: "date" },
        },
      },
      example: {
        deal_id: "d290f1ee",
        order_type: "Full",
        property_address: "123 Main St",
        property_city: "Austin",
        property_state: "TX",
        property_zip: "78701",
      },
    },
    response: {
      description: "Created order",
      status: 201,
      schema: {
        type: "object",
        properties: {
          order: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" } },
          },
        },
      },
      example: { order: { id: "ap1ap2" } },
    },
  },
  {
    method: "PATCH",
    path: "/api/appraisal-orders/{id}",
    summary: "Update an appraisal order",
    description: "Updates status, priority, or due date of an appraisal order.",
    scope: "write:appraisals",
    resource: "appraisals",
    tags: ["Appraisals"],
    pathParams: [
      { name: "id", description: "Appraisal order UUID", example: "ap1ap2-..." },
    ],
    requestBody: {
      description: "Appraisal update fields",
      schema: {
        type: "object",
        properties: {
          order_status: { type: "string" },
          priority: { type: "string" },
          date_due: { type: "string", format: "date" },
          borrower_ids: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
      example: { order_status: "completed", date_due: "2026-04-15" },
    },
    response: {
      description: "Success",
      schema: {
        type: "object",
        properties: { success: { type: "boolean" } },
      },
      example: { success: true },
    },
  },

  /* ======================== DOCUMENTS ======================== */
  {
    method: "GET",
    path: "/api/document-templates",
    summary: "List document templates",
    description: "Returns all document templates for the organization.",
    scope: "read:documents",
    resource: "documents",
    tags: ["Documents"],
    response: {
      description: "Array of templates",
      schema: {
        type: "object",
        properties: {
          templates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                created_at: { type: "string", format: "date-time" },
                updated_at: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      example: {
        templates: [
          {
            id: "dt1dt2",
            name: "Loan Estimate",
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
      },
    },
  },
  {
    method: "POST",
    path: "/api/document-templates",
    summary: "Create a document template",
    description: "Creates a new document template with optional HTML content.",
    scope: "write:documents",
    resource: "documents",
    tags: ["Documents"],
    requestBody: {
      description: "Template details",
      schema: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          html_content: { type: "string" },
          gjs_data: { type: "object" },
        },
      },
      example: { name: "Loan Estimate", html_content: "<h1>Loan Estimate</h1>" },
    },
    response: {
      description: "Created template",
      status: 201,
      schema: {
        type: "object",
        properties: {
          template: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" } },
          },
        },
      },
      example: { template: { id: "dt1dt2" } },
    },
  },

  /* ======================== CREDIT REPORTS ======================== */
  {
    method: "GET",
    path: "/api/credit-reports",
    summary: "List credit reports",
    description: "Returns credit reports for a specific borrower.",
    scope: "read:credit_reports",
    resource: "credit_reports",
    tags: ["Credit Reports"],
    queryParams: [
      {
        name: "borrowerId",
        description: "Borrower UUID (required)",
        required: true,
        example: "b1b2b3b4-...",
      },
    ],
    response: {
      description: "Array of credit reports",
      schema: {
        type: "object",
        properties: {
          documents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                status: { type: "string" },
                url: { type: "string", nullable: true },
                created_at: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      example: {
        documents: [
          {
            id: "cr1cr2",
            name: "Credit Report — Jane Doe",
            status: "completed",
            created_at: "2026-02-20T08:00:00Z",
          },
        ],
      },
    },
  },

  /* ======================== BACKGROUND REPORTS ======================== */
  {
    method: "GET",
    path: "/api/background-reports",
    summary: "List background reports",
    description: "Returns all background reports for the organization.",
    scope: "read:background_reports",
    resource: "background_reports",
    tags: ["Background Reports"],
    response: {
      description: "Array of background reports",
      schema: {
        type: "object",
        properties: {
          reports: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                status: { type: "string", nullable: true },
                borrower_id: { type: "string", format: "uuid", nullable: true },
                entity_id: { type: "string", format: "uuid", nullable: true },
              },
            },
          },
        },
      },
      example: {
        reports: [
          { id: "bg1bg2", status: "completed", borrower_id: "b1b2b3b4" },
        ],
      },
    },
  },
  {
    method: "POST",
    path: "/api/background-reports",
    summary: "Create a background report",
    description:
      "Creates a new background report for a borrower or entity.",
    scope: "write:background_reports",
    resource: "background_reports",
    tags: ["Background Reports"],
    requestBody: {
      description: "Background report details",
      schema: {
        type: "object",
        properties: {
          borrower_id: { type: "string", format: "uuid" },
          entity_id: { type: "string", format: "uuid" },
          report_type: { type: "string" },
          status: { type: "string" },
          notes: { type: "string" },
        },
      },
      example: { borrower_id: "b1b2b3b4", report_type: "standard" },
    },
    response: {
      description: "Created report",
      status: 201,
      schema: {
        type: "object",
        properties: {
          report: {
            type: "object",
            properties: { id: { type: "string", format: "uuid" } },
          },
        },
      },
      example: { report: { id: "bg1bg2" } },
    },
  },

  /* ======================== PIPELINE ======================== */
  {
    method: "GET",
    path: "/api/pipeline",
    summary: "Get pipeline data",
    description:
      'Returns pipeline view data. Use `?view=deals` for deals view, otherwise returns loans with starred inputs.',
    scope: "read:pipeline",
    resource: "pipeline",
    tags: ["Pipeline"],
    queryParams: [
      {
        name: "view",
        description: '"deals" for deals pipeline, omit for loans pipeline',
        example: "deals",
      },
    ],
    response: {
      description: "Pipeline data (shape depends on view param)",
      schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Loan rows (default view)",
            items: { type: "object" },
          },
          deals: {
            type: "array",
            description: "Deal rows (view=deals)",
            items: { type: "object" },
          },
        },
      },
      example: {
        items: [
          {
            id: "a1b2c3d4",
            displayId: "LN-001",
            status: "active",
          },
        ],
      },
    },
  },

  /* ======================== SIGNATURE REQUESTS ======================== */
  {
    method: "GET",
    path: "/api/signature-requests",
    summary: "List signature requests",
    description: "Returns e-signature requests for a specific deal.",
    scope: "read:signature_requests",
    resource: "signature_requests",
    tags: ["Signature Requests"],
    queryParams: [
      {
        name: "dealId",
        description: "Deal UUID (required)",
        required: true,
        example: "d290f1ee-...",
      },
    ],
    response: {
      description: "Array of signature requests",
      schema: {
        type: "object",
        properties: {
          requests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                deal_id: { type: "string", format: "uuid" },
              },
            },
          },
        },
      },
      example: {
        requests: [{ id: "sr1sr2", deal_id: "d290f1ee" }],
      },
    },
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Filter endpoints to only those matching the given scopes. */
export function getEndpointsForScopes(scopes: string[]): ApiEndpoint[] {
  return API_ENDPOINTS.filter((ep) => scopes.includes(ep.scope))
}

/** Get unique tags (resource groups) from a set of endpoints. */
export function getEndpointTags(endpoints: ApiEndpoint[]): string[] {
  const tags = new Set<string>()
  for (const ep of endpoints) {
    for (const tag of ep.tags) tags.add(tag)
  }
  return Array.from(tags)
}

/** Group endpoints by tag. */
export function groupEndpointsByTag(
  endpoints: ApiEndpoint[],
): Record<string, ApiEndpoint[]> {
  const groups: Record<string, ApiEndpoint[]> = {}
  for (const ep of endpoints) {
    const tag = ep.tags[0] ?? "Other"
    if (!groups[tag]) groups[tag] = []
    groups[tag]!.push(ep)
  }
  return groups
}

/** Generate a curl command for an endpoint. */
export function generateCurl(
  endpoint: ApiEndpoint,
  baseUrl: string,
  apiKey: string,
): string {
  const path = endpoint.path.replace(/\{(\w+)\}/g, ":$1")
  const parts: string[] = [
    `curl -X ${endpoint.method} "${baseUrl}${path}"`,
    `  -H "Authorization: Bearer ${apiKey}"`,
  ]

  if (endpoint.requestBody) {
    parts.push(`  -H "Content-Type: application/json"`)
    parts.push(
      `  -d '${JSON.stringify(endpoint.requestBody.example, null, 2)}'`,
    )
  }

  return parts.join(" \\\n")
}

/** Generate a JavaScript fetch snippet for an endpoint. */
export function generateFetch(
  endpoint: ApiEndpoint,
  baseUrl: string,
  apiKey: string,
): string {
  const path = endpoint.path.replace(/\{(\w+)\}/g, ":$1")

  const opts: string[] = [
    `  method: "${endpoint.method}",`,
    `  headers: {`,
    `    "Authorization": "Bearer ${apiKey}",`,
  ]

  if (endpoint.requestBody) {
    opts.push(`    "Content-Type": "application/json",`)
  }
  opts.push(`  },`)

  if (endpoint.requestBody) {
    opts.push(
      `  body: JSON.stringify(${JSON.stringify(endpoint.requestBody.example, null, 4).replace(/\n/g, "\n  ")}),`,
    )
  }

  return [
    `const response = await fetch("${baseUrl}${path}", {`,
    ...opts,
    `});`,
    ``,
    `const data = await response.json();`,
    `console.log(data);`,
  ].join("\n")
}

/** Generate a Python requests snippet for an endpoint. */
export function generatePython(
  endpoint: ApiEndpoint,
  baseUrl: string,
  apiKey: string,
): string {
  const path = endpoint.path.replace(/\{(\w+)\}/g, ":$1")
  const method = endpoint.method.toLowerCase()
  const lines: string[] = [`import requests`, ``]

  lines.push(`url = "${baseUrl}${path}"`)
  lines.push(
    `headers = {"Authorization": "Bearer ${apiKey}"}`,
  )

  if (endpoint.requestBody) {
    lines.push(`payload = ${JSON.stringify(endpoint.requestBody.example, null, 4)}`)
    lines.push(``)
    lines.push(
      `response = requests.${method}(url, headers=headers, json=payload)`,
    )
  } else {
    lines.push(``)
    lines.push(`response = requests.${method}(url, headers=headers)`)
  }

  lines.push(`print(response.json())`)
  return lines.join("\n")
}

/** Method badge color class. */
export function methodColor(method: HttpMethod): string {
  switch (method) {
    case "GET":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400"
    case "POST":
      return "bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400"
    case "PATCH":
      return "bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400"
    case "DELETE":
      return "bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}
