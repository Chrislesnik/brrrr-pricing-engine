import {
  PageShell,
  Section,
  Callout,
  PropertyTable,
  CodeBlock,
} from "@/components/docs/page-shell";

export const metadata = {
  title: "Database Schema – dscr.ai",
  description:
    "Complete database schema reference for the dscr.ai, including tables, relationships, enums, and security policies.",
};

const toc = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "erd", title: "Entity Relationship Diagram", level: 2 },
  { id: "core-tables", title: "Core Tables", level: 2 },
  { id: "table-organizations", title: "organizations", level: 3 },
  { id: "table-deals", title: "deals", level: 3 },
  { id: "table-applications", title: "applications", level: 3 },
  { id: "table-borrowers", title: "borrowers", level: 3 },
  { id: "table-entities", title: "entities", level: 3 },
  { id: "table-entity-owners", title: "entity_owners", level: 3 },
  { id: "table-programs", title: "programs", level: 3 },
  { id: "table-document-files", title: "document_files", level: 3 },
  { id: "table-credit-reports", title: "credit_reports", level: 3 },
  { id: "table-organization-policies", title: "organization_policies", level: 3 },
  { id: "relationships", title: "Relationships", level: 2 },
  { id: "enums", title: "Enums", level: 2 },
  { id: "security", title: "Security", level: 2 },
];

export default function DatabaseSchemaPage() {
  return (
    <PageShell
      title="Database Schema"
      description="Complete reference for the dscr.ai database schema, including table definitions, relationships, enums, and row-level security."
      toc={toc}
    >
      {/* ── Overview ── */}
      <Section id="overview" title="Overview">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The dscr.ai uses a PostgreSQL database hosted on Supabase.
          Every table is scoped to an <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">organization_id</code> and
          protected by row-level security (RLS) policies. The schema is designed
          around the lending workflow: organizations create deals, attach
          borrowers and entities, run pricing scenarios through programs, and
          store documents.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Junction tables (<code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">deal_borrower</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">deal_entity</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">deal_documents</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">entity_owners</code>) enable
          many-to-many relationships between core resources.
        </p>
      </Section>

      {/* ── ERD ── */}
      <Section id="erd" title="Entity Relationship Diagram">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The diagram below shows the primary tables and their foreign-key
          relationships. Render it with any Mermaid-compatible viewer.
        </p>
        <CodeBlock
          language="mermaid"
          title="ERD"
          code={`erDiagram
    organizations ||--o{ deals : "has many"
    organizations ||--o{ borrowers : "has many"
    organizations ||--o{ entities : "has many"
    organizations ||--o{ programs : "has many"
    organizations ||--o{ organization_policies : "has many"

    deals ||--|| applications : "has one"
    deals }o--|| programs : "priced by"

    deals ||--o{ deal_borrower : ""
    deal_borrower }o--|| borrowers : ""

    deals ||--o{ deal_entity : ""
    deal_entity }o--|| entities : ""

    deals ||--o{ deal_documents : ""
    deal_documents }o--|| document_files : ""

    entities ||--o{ entity_owners : "owned by"
    entity_owners }o--o| borrowers : "individual owner"
    entity_owners }o--o| entities : "entity owner"

    borrowers ||--o{ credit_reports : "has many"`}
        />
      </Section>

      {/* ── Core Tables ── */}
      <Section id="core-tables" title="Core Tables">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Detailed column definitions for each table in the schema.
        </p>
      </Section>

      {/* organizations */}
      <Section id="table-organizations" title="organizations">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Top-level tenant table. Every resource in the system belongs to exactly
          one organization.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "name", type: "text", required: true, description: "Display name of the organization." },
            { name: "slug", type: "text", required: true, description: "URL-safe unique identifier (unique constraint)." },
            { name: "clerk_organization_id", type: "text", required: true, description: "Clerk organization ID for auth mapping (unique constraint)." },
            { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp, defaults to now()." },
            { name: "updated_at", type: "timestamptz", required: true, description: "Last-modified timestamp, auto-updated." },
          ]}
        />
        <CodeBlock
          language="sql"
          title="Example query"
          code={`SELECT id, name, slug
FROM organizations
WHERE clerk_organization_id = 'org_abc123';`}
        />
      </Section>

      {/* deals */}
      <Section id="table-deals" title="deals">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Central table representing a loan deal. A deal aggregates an
          application, borrowers, entities, documents, and pricing scenarios.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations. Scopes the deal to a tenant." },
            { name: "program_id", type: "uuid", description: "FK → programs (nullable). The pricing program applied to this deal." },
            { name: "status", type: "text", required: true, description: "Current deal status (e.g. draft, submitted, approved, funded)." },
            { name: "assigned_to_user_id", type: "jsonb", description: "JSON array of Clerk user IDs assigned to this deal." },
            { name: "primary_user_id", type: "text", description: "Clerk user ID of the primary deal owner." },
            { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
            { name: "updated_at", type: "timestamptz", required: true, description: "Last-modified timestamp." },
          ]}
        />
        <CodeBlock
          language="sql"
          title="Example query"
          code={`SELECT d.id, d.status, a.borrower_name, a.display_id
FROM deals d
JOIN applications a ON a.loan_id = d.id
WHERE d.organization_id = '...'
ORDER BY d.created_at DESC;`}
        />
      </Section>

      {/* applications */}
      <Section id="table-applications" title="applications">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          One-to-one extension of a deal containing the loan application data.
          The primary key <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">loan_id</code> is
          also a foreign key to <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">deals.id</code>.
        </p>
        <PropertyTable
          properties={[
            { name: "loan_id", type: "uuid", required: true, description: "Primary key and FK → deals.id. Establishes the 1:1 relationship." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations. Denormalized for RLS performance." },
            { name: "display_id", type: "text", description: "Human-readable loan identifier (e.g. LOAN-00042)." },
            { name: "entity_id", type: "uuid", description: "FK → entities (nullable). The borrowing entity on the application." },
            { name: "borrower_name", type: "text", description: "Cached display name of the primary borrower." },
            { name: "status", type: "text", required: true, description: "Application-level status." },
            { name: "form_data", type: "jsonb", description: "Raw form submission data as entered by the user." },
            { name: "merged_data", type: "jsonb", description: "Computed merge of form_data with external_defaults." },
            { name: "external_defaults", type: "jsonb", description: "Default values sourced from external integrations." },
            { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
            { name: "updated_at", type: "timestamptz", required: true, description: "Last-modified timestamp." },
          ]}
        />
      </Section>

      {/* borrowers */}
      <Section id="table-borrowers" title="borrowers">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Individual borrower profiles. Linked to deals through the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">deal_borrower</code> junction table.
          Contains PII fields that are encrypted at rest.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "display_id", type: "text", required: true, description: "Human-readable borrower ID (unique constraint)." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations." },
            { name: "first_name", type: "text", required: true, description: "Borrower's first name." },
            { name: "last_name", type: "text", required: true, description: "Borrower's last name." },
            { name: "email", type: "text", description: "Contact email address." },
            { name: "primary_phone", type: "text", description: "Primary phone number." },
            { name: "date_of_birth", type: "date", description: "Date of birth." },
            { name: "fico_score", type: "integer", description: "Most recent FICO credit score." },
            { name: "ssn_encrypted", type: "bytea", description: "Full SSN, encrypted with pgcrypto." },
            { name: "ssn_last4", type: "text", description: "Last four digits of SSN (for display)." },
            { name: "address_line1", type: "text", description: "Street address line 1." },
            { name: "address_line2", type: "text", description: "Street address line 2." },
            { name: "city", type: "text", description: "City." },
            { name: "state", type: "text", description: "US state (see us_states enum)." },
            { name: "zip_code", type: "text", description: "ZIP / postal code." },
            { name: "citizenship", type: "text", description: "Citizenship status." },
            { name: "assigned_to", type: "text[]", description: "Array of Clerk user IDs with access to this borrower." },
          ]}
        />
        <Callout type="warning" title="PII">
          The <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">ssn_encrypted</code> column
          uses <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">pgcrypto</code> symmetric
          encryption. Never expose raw SSN values through the API. Only{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">ssn_last4</code> is returned in
          standard responses.
        </Callout>
      </Section>

      {/* entities */}
      <Section id="table-entities" title="entities">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Business entities (LLCs, corporations, trusts, etc.) that are
          borrowers or guarantors on a deal.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "display_id", type: "text", required: true, description: "Human-readable entity ID (unique constraint)." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations." },
            { name: "entity_name", type: "text", required: true, description: "Legal name of the entity." },
            { name: "entity_type", type: "text", required: true, description: "Type of entity (see entity_type enum)." },
            { name: "ein", type: "text", description: "Employer Identification Number." },
            { name: "date_formed", type: "date", description: "Date the entity was formed or incorporated." },
            { name: "address_line1", type: "text", description: "Street address line 1." },
            { name: "address_line2", type: "text", description: "Street address line 2." },
            { name: "city", type: "text", description: "City." },
            { name: "state", type: "text", description: "US state." },
            { name: "zip_code", type: "text", description: "ZIP / postal code." },
            { name: "assigned_to", type: "text[]", description: "Array of Clerk user IDs with access to this entity." },
          ]}
        />
      </Section>

      {/* entity_owners */}
      <Section id="table-entity-owners" title="entity_owners">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Ownership records linking individuals (borrowers) or other entities to
          a parent entity. Supports nested ownership structures.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "entity_id", type: "uuid", required: true, description: "FK → entities. The entity being owned." },
            { name: "borrower_id", type: "uuid", description: "FK → borrowers (nullable). Set when the owner is an individual." },
            { name: "entity_owner_id", type: "uuid", description: "FK → entities (nullable). Set when the owner is another entity." },
            { name: "ownership_percent", type: "numeric", description: "Percentage of ownership (0–100)." },
            { name: "name", type: "text", description: "Display name of the owner." },
            { name: "title", type: "text", description: "Title or role within the entity (e.g. Managing Member)." },
            { name: "member_type", type: "text", description: "Type of membership (e.g. member, manager, partner)." },
          ]}
        />
        <Callout type="info">
          Exactly one of <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">borrower_id</code> or{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">entity_owner_id</code> should be
          set per row, enforced by application logic. This allows both
          individuals and entities to appear as owners.
        </Callout>
      </Section>

      {/* programs */}
      <Section id="table-programs" title="programs">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Pricing and loan programs that define rate sheets, eligibility
          conditions, and pricing adjustments. A deal references a program to
          determine its pricing.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations." },
            { name: "name", type: "text", required: true, description: "Program display name." },
            { name: "description", type: "text", description: "Human-readable program description." },
            { name: "conditions", type: "jsonb", description: "Eligibility conditions and pricing rules." },
            { name: "is_active", type: "boolean", required: true, description: "Whether the program is currently available." },
            { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
            { name: "updated_at", type: "timestamptz", required: true, description: "Last-modified timestamp." },
          ]}
        />
      </Section>

      {/* document_files */}
      <Section id="table-document-files" title="document_files">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Central document storage. Files are stored in Supabase Storage and
          referenced here. Linked to deals via the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">deal_documents</code> junction
          table.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations." },
            { name: "file_name", type: "text", required: true, description: "Original file name." },
            { name: "file_type", type: "text", description: "MIME type of the file." },
            { name: "file_size", type: "bigint", description: "File size in bytes." },
            { name: "storage_path", type: "text", required: true, description: "Path within Supabase Storage." },
            { name: "uploaded_by", type: "text", description: "Clerk user ID of the uploader." },
            { name: "created_at", type: "timestamptz", required: true, description: "Upload timestamp." },
          ]}
        />
      </Section>

      {/* credit_reports */}
      <Section id="table-credit-reports" title="credit_reports">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Credit report data pulled for individual borrowers. Each report is
          tied to a single borrower.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "borrower_id", type: "uuid", required: true, description: "FK → borrowers." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations." },
            { name: "report_data", type: "jsonb", description: "Raw credit report payload." },
            { name: "pulled_at", type: "timestamptz", required: true, description: "Timestamp when the report was pulled." },
            { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
          ]}
        />
      </Section>

      {/* organization_policies */}
      <Section id="table-organization-policies" title="organization_policies">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Per-organization configuration for RLS policies, feature flags, and
          operational settings.
        </p>
        <PropertyTable
          properties={[
            { name: "id", type: "uuid", required: true, description: "Primary key, auto-generated." },
            { name: "organization_id", type: "uuid", required: true, description: "FK → organizations." },
            { name: "policy_type", type: "text", required: true, description: "Type of policy (e.g. document_access, deal_visibility)." },
            { name: "policy_data", type: "jsonb", required: true, description: "Policy configuration payload." },
            { name: "created_at", type: "timestamptz", required: true, description: "Row creation timestamp." },
            { name: "updated_at", type: "timestamptz", required: true, description: "Last-modified timestamp." },
          ]}
        />
      </Section>

      {/* ── Relationships ── */}
      <Section id="relationships" title="Relationships">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Foreign-key relationships between tables. Junction tables are used for
          many-to-many associations.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium">From</th>
                <th className="px-4 py-2.5 text-left font-medium">To</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Via</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">organizations</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals</code></td>
                <td className="px-4 py-2.5">1 : many</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals.organization_id</code></td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">applications</code></td>
                <td className="px-4 py-2.5">1 : 1</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">applications.loan_id</code></td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">borrowers</code></td>
                <td className="px-4 py-2.5">many : many</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deal_borrower</code></td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">entities</code></td>
                <td className="px-4 py-2.5">many : many</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deal_entity</code></td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">entities</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">borrowers / entities</code></td>
                <td className="px-4 py-2.5">many : many</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">entity_owners</code></td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">document_files</code></td>
                <td className="px-4 py-2.5">many : many</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deal_documents</code></td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">borrowers</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">credit_reports</code></td>
                <td className="px-4 py-2.5">1 : many</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">credit_reports.borrower_id</code></td>
              </tr>
              <tr className="last:border-0">
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">programs</code></td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals</code></td>
                <td className="px-4 py-2.5">1 : many</td>
                <td className="px-4 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">deals.program_id</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Enums ── */}
      <Section id="enums" title="Enums">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Custom PostgreSQL enum types used across the schema.
        </p>

        <h3 className="text-base font-semibold mt-6 mb-2">entity_type</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Classifies the legal structure of an entity.
        </p>
        <CodeBlock
          language="sql"
          title="entity_type enum"
          code={`CREATE TYPE entity_type AS ENUM (
  'llc',
  'corporation',
  's_corporation',
  'partnership',
  'limited_partnership',
  'trust',
  'sole_proprietorship',
  'other'
);`}
        />

        <h3 className="text-base font-semibold mt-6 mb-2">us_states</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Standard US state and territory abbreviations used for address fields.
        </p>
        <CodeBlock
          language="sql"
          title="us_states enum"
          code={`CREATE TYPE us_states AS ENUM (
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','PR','VI','GU','AS','MP'
);`}
        />
      </Section>

      {/* ── Security ── */}
      <Section id="security" title="Security">
        <p className="text-sm text-muted-foreground leading-relaxed">
          All tables have row-level security (RLS) enabled. Policies are
          evaluated using the authenticated user&apos;s Clerk organization ID,
          which is mapped to the <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">organizations</code> table
          via <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">clerk_organization_id</code>.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Additional per-organization access rules are stored in the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">organization_policies</code> table
          and enforced at the application layer. Sensitive columns such as{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">ssn_encrypted</code> are never
          returned by default API responses.
        </p>
        <CodeBlock
          language="sql"
          title="RLS policy example"
          code={`ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON deals
  USING (
    organization_id = (
      SELECT id FROM organizations
      WHERE clerk_organization_id = auth.jwt() ->> 'org_id'
    )
  );`}
        />
        <Callout type="tip" title="API Reference">
          For details on how to interact with these tables through the REST API,
          see the{" "}
          <a
            href="/docs/api-reference"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            API Reference
          </a>{" "}
          documentation.
        </Callout>
      </Section>
    </PageShell>
  );
}
