import type { Metadata } from "next";
import Link from "next/link";
import { Database, BarChart3, ArrowRight } from "lucide-react";
import {
  PageShell,
  Section,
  Callout,
  CodeBlock,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "SQL & Data Access",
  description:
    "Common database query patterns using the Supabase JS client and raw SQL.",
};

export default function SqlDataAccessPage() {
  const toc = [
    { id: "common-queries", title: "Common Queries", level: 2 },
  ];

  return (
    <PageShell
      title="SQL & Data Access"
      description="Common database query patterns using the Supabase JS client and raw SQL."
      badge="Advanced"
      toc={toc}
    >
      <Callout type="info" title="Looking for RLS & security?">
        Supabase client configuration, Row-Level Security policies, custom
        reports, and performance tips have moved to the{" "}
        <Link
          href="/docs/power-users/rls"
          className="font-medium text-primary underline underline-offset-2"
        >
          Row-Level Security
        </Link>{" "}
        page under Policies &amp; Permissions.
      </Callout>

      <Section id="common-queries" title="Common Queries">
        <p className="text-sm text-muted-foreground">
          These patterns cover the most frequent data access needs. All examples
          use the Supabase JS client, but you can also run raw SQL via{" "}
          <code>supabase.rpc()</code> or the Supabase SQL editor.
        </p>

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" /> Fetch Deals with
          Borrowers
        </h3>
        <CodeBlock
          language="typescript"
          title="Deals + linked borrowers"
          code={`const { data: deals } = await supabase
  .from("deals")
  .select(\`
    id,
    property_address,
    loan_amount,
    status,
    created_at,
    deal_borrowers (
      borrower:borrowers (
        id, first_name, last_name, email
      )
    )
  \`)
  .eq("organization_id", orgId)
  .order("created_at", { ascending: false });`}
        />

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          Entity Ownership Structure
        </h3>
        <CodeBlock
          language="typescript"
          title="Entity hierarchy"
          code={`const { data: entities } = await supabase
  .from("entities")
  .select(\`
    id,
    name,
    entity_type,
    entity_members (
      role,
      ownership_percentage,
      member:borrowers ( id, first_name, last_name )
    )
  \`)
  .eq("organization_id", orgId);`}
        />

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Aggregate Deal Stats
        </h3>
        <CodeBlock
          language="sql"
          title="Deal pipeline summary (raw SQL)"
          code={`SELECT
  status,
  COUNT(*)              AS deal_count,
  SUM(loan_amount)      AS total_volume,
  AVG(loan_amount)      AS avg_loan_size
FROM deals
WHERE organization_id = :org_id
GROUP BY status
ORDER BY deal_count DESC;`}
        />
      </Section>
    </PageShell>
  );
}
