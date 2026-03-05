import type { Metadata } from "next";
import {
  Database,
  Shield,
  BarChart3,
} from "lucide-react";
import {
  PageShell,
  Section,
  Callout,
  CodeBlock,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "Row-Level Security",
  description:
    "Supabase RLS policies, client configuration, custom reports, and performance optimization.",
};

export default function RlsPage() {
  const toc = [
    { id: "supabase-client", title: "Supabase Client", level: 2 },
    { id: "row-level-security", title: "Row-Level Security", level: 2 },
    { id: "custom-reports", title: "Custom Reports", level: 2 },
    { id: "performance-tips", title: "Performance Tips", level: 2 },
  ];

  return (
    <PageShell
      title="Row-Level Security"
      description="Supabase RLS policies, client configuration, custom reports, and performance best practices."
      badge="Security"
      toc={toc}
    >
      <Section id="supabase-client" title="Supabase Client">
        <p className="text-sm text-muted-foreground">
          The platform provides two pre-configured Supabase clients. Choosing
          the right one is critical for both security and functionality.
        </p>

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> supabaseAdmin
        </h3>
        <p className="text-sm text-muted-foreground">
          Bypasses Row-Level Security entirely. Use only in trusted
          server-side contexts such as server actions, API routes, and cron
          jobs. Never expose this client to the browser.
        </p>
        <CodeBlock
          language="typescript"
          title="Server-only admin client"
          code={`import { supabaseAdmin } from "@/lib/supabase/admin";

const { data, error } = await supabaseAdmin
  .from("deals")
  .select("*")
  .eq("organization_id", orgId);`}
        />

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" /> supabaseForCaller
        </h3>
        <p className="text-sm text-muted-foreground">
          Respects RLS policies — queries only return rows the authenticated
          user is allowed to see. This is the default client for most
          application code.
        </p>
        <CodeBlock
          language="typescript"
          title="RLS-aware client"
          code={`import { supabaseForCaller } from "@/lib/supabase/caller";

const supabase = await supabaseForCaller();

const { data, error } = await supabase
  .from("deals")
  .select("*, borrowers(*)");`}
        />
      </Section>

      <Section id="row-level-security" title="Row-Level Security">
        <p className="text-sm text-muted-foreground">
          Every table in dscr.ai is protected by Supabase
          Row-Level Security (RLS). Policies enforce organization-level
          isolation — users can only access data belonging to their active
          organization.
        </p>
        <p className="text-sm text-muted-foreground">
          The <code>organization_policies</code> table stores per-organization
          rules that govern access patterns. RLS policies reference the
          authenticated user&apos;s JWT claims to determine which organization
          they belong to and what role they hold.
        </p>
        <CodeBlock
          language="sql"
          title="Simplified RLS policy example"
          code={`CREATE POLICY "Users can view their org's deals"
  ON deals FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );`}
        />
        <Callout type="warning" title="Use the right client">
          Always use <code>supabaseForCaller</code> in application code to
          ensure RLS is enforced. Only use <code>supabaseAdmin</code> when you
          explicitly need to bypass RLS — for example, in background jobs or
          cross-org admin operations. Misusing the admin client can leak data
          between organizations.
        </Callout>
      </Section>

      <Section id="custom-reports" title="Custom Reports">
        <p className="text-sm text-muted-foreground">
          For reporting needs beyond the built-in dashboards, you can write
          custom SQL and execute it via the Supabase SQL editor, an RPC
          function, or the API.
        </p>
        <CodeBlock
          language="sql"
          title="Deal pipeline by month"
          code={`SELECT
  DATE_TRUNC('month', created_at) AS month,
  status,
  COUNT(*)                        AS deals,
  SUM(loan_amount)                AS volume,
  ROUND(AVG(loan_amount), 2)      AS avg_size
FROM deals
WHERE organization_id = :org_id
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY month, status
ORDER BY month DESC, deals DESC;`}
        />
        <CodeBlock
          language="typescript"
          title="Calling a custom RPC"
          code={`const { data } = await supabase
  .rpc("deal_pipeline_summary", {
    org_id: orgId,
    months_back: 12,
  });`}
        />
        <Callout type="tip">
          Wrap complex reporting queries in Postgres functions (
          <code>CREATE FUNCTION</code>) and call them via{" "}
          <code>supabase.rpc()</code>. This keeps SQL out of your application
          code and lets you optimize with indexes and query plans.
        </Callout>
      </Section>

      <Section id="performance-tips" title="Performance Tips">
        <p className="text-sm text-muted-foreground">
          Follow these practices to keep queries fast as your data grows.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>
            <strong className="text-foreground">Use indexes</strong> — The
            platform indexes <code>organization_id</code>,{" "}
            <code>created_at</code>, and foreign keys by default. Add indexes
            for any column you frequently filter or sort by.
          </li>
          <li>
            <strong className="text-foreground">Avoid N+1 queries</strong> —
            Use Supabase&apos;s nested <code>select()</code> syntax to fetch
            related data in a single request instead of looping.
          </li>
          <li>
            <strong className="text-foreground">Leverage views</strong> — The{" "}
            <code>entities_view</code> pre-joins entity members and ownership
            data, saving you from writing complex joins repeatedly.
          </li>
          <li>
            <strong className="text-foreground">Paginate large datasets</strong>{" "}
            — Always use <code>.range()</code> or <code>.limit()</code> on list
            queries rather than fetching all rows.
          </li>
          <li>
            <strong className="text-foreground">Select only what you need</strong>{" "}
            — Specify columns in <code>.select()</code> instead of using{" "}
            <code>*</code> to reduce payload size and query time.
          </li>
        </ul>
        <Callout type="tip" title="entities_view">
          The <code>entities_view</code> is a pre-built database view that
          joins entities with their members and ownership percentages. Use it
          anywhere you need entity details to avoid writing the same multi-table
          join repeatedly.
        </Callout>
      </Section>
    </PageShell>
  );
}
