import type { Metadata } from "next";
import Link from "next/link";
import {
  Key,
  Send,
  List,
  AlertTriangle,
  Gauge,
  Webhook,
  Code2,
  FileJson,
  PlusCircle,
  User,
  Upload,
} from "lucide-react";
import {
  PageShell,
  Section,
  Callout,
  CodeBlock,
  PropertyTable,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "API Integration",
  description:
    "Connect your systems to the dscr.ai using our REST API.",
};

export default function ApiIntegrationPage() {
  const toc = [
    { id: "authentication", title: "Authentication", level: 2 },
    { id: "making-requests", title: "Making Requests", level: 2 },
    { id: "common-operations", title: "Common Operations", level: 2 },
    { id: "pagination-filtering", title: "Pagination & Filtering", level: 2 },
    { id: "error-handling", title: "Error Handling", level: 2 },
    { id: "rate-limits", title: "Rate Limits", level: 2 },
    { id: "webhooks", title: "Webhooks", level: 2 },
  ];

  return (
    <PageShell
      title="API Integration"
      description="Connect your systems to the dscr.ai using our REST API."
      badge="Developer"
      toc={toc}
    >
      <Section id="authentication" title="Authentication">
        <p className="text-sm text-muted-foreground">
          All API requests require a Bearer token. Generate an API key from{" "}
          <strong className="text-foreground">Settings → API Keys</strong> in
          your organization dashboard. Each key is scoped to your organization
          and inherits the permissions of the user who created it.
        </p>
        <p className="text-sm text-muted-foreground">
          Include your API key in the <code>Authorization</code> header of every
          request:
        </p>
        <CodeBlock
          language="bash"
          title="Authorization Header"
          code={`curl https://your-domain.com/api/v1/deals \\
  -H "Authorization: Bearer brrrr_sk_live_abc123..."
  -H "Content-Type: application/json"`}
        />
        <Callout type="warning" title="Keep your keys safe">
          API keys grant full access to your organization&apos;s data. Never
          commit them to version control or expose them in client-side code.
          Rotate compromised keys immediately from the Settings page.
        </Callout>
      </Section>

      <Section id="making-requests" title="Making Requests">
        <p className="text-sm text-muted-foreground">
          The API follows REST conventions. All requests and responses use JSON.
          The base URL depends on your deployment — for hosted instances this is
          typically <code>https://your-domain.com/api/v1</code>.
        </p>
        <CodeBlock
          language="bash"
          title="cURL — List Deals"
          code={`curl -X GET https://your-domain.com/api/v1/deals \\
  -H "Authorization: Bearer brrrr_sk_live_abc123..." \\
  -H "Content-Type: application/json"`}
        />
        <CodeBlock
          language="javascript"
          title="JavaScript — Fetch Deals"
          code={`const response = await fetch("https://your-domain.com/api/v1/deals", {
  method: "GET",
  headers: {
    Authorization: "Bearer brrrr_sk_live_abc123...",
    "Content-Type": "application/json",
  },
});

const { data, meta } = await response.json();
console.log(\`Found \${meta.total} deals\`);`}
        />
      </Section>

      <Section id="common-operations" title="Common Operations">
        <p className="text-sm text-muted-foreground">
          Below are the most frequently used endpoints. See the full{" "}
          <Link href="/docs/api-reference" className="underline">
            API Reference
          </Link>{" "}
          for a complete list.
        </p>

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <List className="h-4 w-4 text-primary" /> List Deals
        </h3>
        <CodeBlock
          language="bash"
          title="GET /api/v1/deals"
          code={`curl https://your-domain.com/api/v1/deals \\
  -H "Authorization: Bearer brrrr_sk_live_abc123..."`}
        />

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-primary" /> Create a Deal
        </h3>
        <CodeBlock
          language="bash"
          title="POST /api/v1/deals"
          code={`curl -X POST https://your-domain.com/api/v1/deals \\
  -H "Authorization: Bearer brrrr_sk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "property_address": "123 Main St, Austin, TX",
    "loan_amount": 450000,
    "deal_type": "DSCR",
    "loan_program_id": "lp_abc123"
  }'`}
        />

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Get Borrower Details
        </h3>
        <CodeBlock
          language="bash"
          title="GET /api/v1/borrowers/:id"
          code={`curl https://your-domain.com/api/v1/borrowers/bwr_xyz789 \\
  -H "Authorization: Bearer brrrr_sk_live_abc123..."`}
        />

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" /> Upload a Document
        </h3>
        <CodeBlock
          language="bash"
          title="POST /api/v1/deals/:id/documents"
          code={`curl -X POST https://your-domain.com/api/v1/deals/deal_abc/documents \\
  -H "Authorization: Bearer brrrr_sk_live_abc123..." \\
  -F "file=@appraisal.pdf" \\
  -F "category=appraisal" \\
  -F "name=Property Appraisal"`}
        />
      </Section>

      <Section id="pagination-filtering" title="Pagination & Filtering">
        <p className="text-sm text-muted-foreground">
          List endpoints support pagination and filtering via query parameters.
          All paginated responses include a <code>meta</code> object with total
          count and pagination info.
        </p>
        <PropertyTable
          properties={[
            {
              name: "page",
              type: "number",
              description: "Page number (1-indexed). Defaults to 1.",
            },
            {
              name: "per_page",
              type: "number",
              description:
                "Results per page (max 100). Defaults to 25.",
            },
            {
              name: "sort",
              type: "string",
              description:
                'Field to sort by (e.g. "created_at", "loan_amount").',
            },
            {
              name: "order",
              type: '"asc" | "desc"',
              description: 'Sort direction. Defaults to "desc".',
            },
            {
              name: "search",
              type: "string",
              description: "Full-text search across relevant fields.",
            },
          ]}
        />
        <CodeBlock
          language="bash"
          title="Example — Page 2, 10 per page, sorted by amount"
          code={`curl "https://your-domain.com/api/v1/deals?page=2&per_page=10&sort=loan_amount&order=desc" \\
  -H "Authorization: Bearer brrrr_sk_live_abc123..."`}
        />
      </Section>

      <Section id="error-handling" title="Error Handling">
        <p className="text-sm text-muted-foreground">
          The API uses standard HTTP status codes. Errors return a consistent
          JSON structure with a machine-readable code and human-friendly message.
        </p>
        <PropertyTable
          properties={[
            {
              name: "200",
              type: "OK",
              description: "Request succeeded.",
            },
            {
              name: "400",
              type: "Bad Request",
              description:
                "Invalid parameters or malformed request body.",
            },
            {
              name: "401",
              type: "Unauthorized",
              description: "Missing or invalid API key.",
            },
            {
              name: "403",
              type: "Forbidden",
              description:
                "Valid key but insufficient permissions for this resource.",
            },
            {
              name: "404",
              type: "Not Found",
              description: "The requested resource does not exist.",
            },
            {
              name: "500",
              type: "Server Error",
              description:
                "Internal error. Retry the request or contact support.",
            },
          ]}
        />
        <CodeBlock
          language="json"
          title="Error Response Format"
          code={`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "loan_amount must be a positive number",
    "details": [
      { "field": "loan_amount", "issue": "must be greater than 0" }
    ]
  }
}`}
        />
      </Section>

      <Section id="rate-limits" title="Rate Limits">
        <p className="text-sm text-muted-foreground">
          API requests are rate-limited to ensure fair usage and platform
          stability. The default limit is{" "}
          <strong className="text-foreground">
            1,000 requests per minute
          </strong>{" "}
          per API key. Rate limit status is returned in response headers:
        </p>
        <PropertyTable
          properties={[
            {
              name: "X-RateLimit-Limit",
              type: "number",
              description: "Maximum requests allowed per window.",
            },
            {
              name: "X-RateLimit-Remaining",
              type: "number",
              description: "Requests remaining in the current window.",
            },
            {
              name: "X-RateLimit-Reset",
              type: "number",
              description:
                "Unix timestamp when the rate limit window resets.",
            },
          ]}
        />
        <Callout type="info">
          If you hit the rate limit, the API returns a{" "}
          <code>429 Too Many Requests</code> response. Back off and retry after
          the <code>X-RateLimit-Reset</code> timestamp.
        </Callout>
      </Section>

      <Section id="webhooks" title="Webhooks">
        <p className="text-sm text-muted-foreground">
          Webhooks let your systems react to events in real-time — deal created,
          document uploaded, status changed, and more. Configure webhook
          endpoints in{" "}
          <strong className="text-foreground">Settings → API Keys</strong> and
          select which events to subscribe to.
        </p>
        <p className="text-sm text-muted-foreground">
          Each webhook delivery includes a signature header for verification and
          will be retried up to 3 times on failure. See the{" "}
          <Link href="/docs/guides/deals" className="underline">
            Deals guide
          </Link>{" "}
          for webhook payload examples.
        </p>
      </Section>

      <Callout type="tip" title="Explore more">
        For the full interactive API documentation, visit the{" "}
        <Link href="/docs/api-reference" className="underline font-medium">
          Scalar API Reference
        </Link>
        . For database table schemas and relationships, see the{" "}
        <Link
          href="/docs/reference/database-schema"
          className="underline font-medium"
        >
          Database Schema
        </Link>{" "}
        reference.
      </Callout>
    </PageShell>
  );
}
