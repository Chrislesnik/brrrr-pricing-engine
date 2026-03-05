import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageSquare,
  FileSearch,
  CreditCard,
  Workflow,
  Code2,
  Sparkles,
  Bot,
  Brain,
  ScanSearch,
} from "lucide-react";
import {
  PageShell,
  Section,
  Callout,
  CodeBlock,
  ScreenshotDemo,
  FeatureCard,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "AI-Powered Features",
  description:
    "Leverage AI for document analysis, credit report insights, and intelligent automation.",
};

export default function AiFeaturesPage() {
  const toc = [
    { id: "ai-chat-assistant", title: "AI Chat Assistant", level: 2 },
    { id: "document-analysis", title: "Document Analysis", level: 2 },
    { id: "credit-report-insights", title: "Credit Report Insights", level: 2 },
    { id: "workflow-automation", title: "Workflow Automation with AI", level: 2 },
    { id: "ai-code-editing", title: "AI Code Editing", level: 2 },
  ];

  return (
    <PageShell
      title="AI-Powered Features"
      description="Leverage AI for document analysis, credit report insights, and intelligent automation."
      badge="Beta"
      toc={toc}
    >
      <Section id="ai-chat-assistant" title="AI Chat Assistant">
        <p className="text-sm text-muted-foreground">
          The in-app AI assistant is available on every deal page. Ask it
          questions about the current deal, request pricing guidance, compare
          loan scenarios, or have it summarize uploaded documents — all within
          natural language conversation.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="Deal Analysis"
            description="Ask questions like 'What's the DSCR on this deal?' or 'Compare the two pricing scenarios.'"
          />
          <FeatureCard
            icon={<FileSearch className="h-5 w-5" />}
            title="Document Q&A"
            description="Query uploaded documents directly — 'What are the conditions in the appraisal?'"
          />
          <FeatureCard
            icon={<Brain className="h-5 w-5" />}
            title="Pricing Guidance"
            description="Get AI-powered rate suggestions based on deal parameters and market data."
          />
          <FeatureCard
            icon={<Bot className="h-5 w-5" />}
            title="Context-Aware"
            description="The assistant knows the current deal, borrower, and organization context automatically."
          />
        </div>
        <ScreenshotDemo src="/screenshots/ai-chatbot-streaming.png" alt="AI Agent streaming a response with tool calls and pricing artifact" caption="The AI Agent streaming a response — calling tools (search_deals, calculate_dscr, get_pricing) and returning a pricing comparison artifact" />
      </Section>

      <Section id="document-analysis" title="Document Analysis">
        <p className="text-sm text-muted-foreground">
          When you upload a document to a deal, the AI pipeline automatically
          processes it for extraction, classification, and condition checking.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>
            <strong className="text-foreground">Auto-classification</strong> —
            Uploaded files are automatically categorized (appraisal, title
            report, insurance, loan application, etc.) based on their content.
          </li>
          <li>
            <strong className="text-foreground">Data extraction</strong> —
            Key fields are extracted from structured documents: property values
            from appraisals, coverage amounts from insurance certificates,
            borrower details from applications.
          </li>
          <li>
            <strong className="text-foreground">Condition checking</strong> —
            The AI flags potential issues: expired insurance, missing signatures,
            value discrepancies between documents, or incomplete information.
          </li>
        </ul>
        <Callout type="info" title="Supported formats">
          Document analysis supports PDF, DOCX, JPG, and PNG files. For best
          results with scanned documents, ensure the scan resolution is at
          least 200 DPI.
        </Callout>
      </Section>

      <Section id="credit-report-insights" title="Credit Report Insights">
        <p className="text-sm text-muted-foreground">
          The credit report AI interface provides a conversational way to
          explore credit data. Instead of manually reviewing pages of credit
          history, ask the assistant targeted questions.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>
            <strong className="text-foreground">Natural language queries</strong>{" "}
            — Ask &quot;What are the borrower&apos;s open tradelines?&quot; or
            &quot;Any late payments in the last 24 months?&quot;
          </li>
          <li>
            <strong className="text-foreground">Risk assessment</strong> —
            Get automated risk scoring with explanations for the factors
            contributing to the assessment.
          </li>
          <li>
            <strong className="text-foreground">Cross-borrower comparison</strong>{" "}
            — Compare credit profiles across multiple borrowers on the same deal.
          </li>
        </ul>
        <ScreenshotDemo src="/screenshots/credit-report-ai-analysis.png" alt="Credit report processed by AI with highlighted fields and extracted insights" caption="AI credit report analysis — fields highlighted with extracted values mapped to structured data columns" />
      </Section>

      <Section id="workflow-automation" title="Workflow Automation with AI">
        <p className="text-sm text-muted-foreground">
          The automation builder uses a visual flow editor (powered by React
          Flow) where you can drag and drop AI-powered nodes alongside
          traditional logic nodes to create intelligent deal processing
          pipelines.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>
            <strong className="text-foreground">AI classification nodes</strong>{" "}
            — Route deals based on AI-determined risk profiles, property types,
            or borrower categories.
          </li>
          <li>
            <strong className="text-foreground">Document verification nodes</strong>{" "}
            — Automatically verify that all required documents are present and
            valid before advancing a deal to the next stage.
          </li>
          <li>
            <strong className="text-foreground">Notification triggers</strong> —
            Send Slack messages, emails, or webhook events when AI detects
            specific conditions (e.g., a deal exceeds risk thresholds).
          </li>
          <li>
            <strong className="text-foreground">Conditional branching</strong> —
            Combine AI analysis output with traditional if/else logic for
            nuanced decision trees.
          </li>
        </ul>
        <Callout type="info">
          The automation builder is available under{" "}
          <strong>Settings → Automations</strong>. Start with one of the
          pre-built templates to see how AI nodes integrate into a workflow.
        </Callout>
      </Section>

      <Section id="ai-code-editing" title="AI Code Editing">
        <p className="text-sm text-muted-foreground">
          Power users can leverage AI-assisted code editors like Cursor to
          extend the platform — writing custom SQL queries, building
          integrations, or creating Supabase Edge Functions.
        </p>

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Tips for Effective
          Prompting
        </h3>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>
            Reference table names from the{" "}
            <Link href="/docs/reference/database-schema" className="underline">
              database schema
            </Link>{" "}
            — AI tools produce better output when given exact schema context.
          </li>
          <li>
            Describe the business intent, not just the SQL — &quot;Find deals
            where the DSCR is below 1.2 and the loan-to-value exceeds
            75%&quot; works better than &quot;write a query with WHERE
            clauses.&quot;
          </li>
          <li>
            Ask the AI to include RLS considerations and to use{" "}
            <code>supabaseForCaller</code> by default.
          </li>
          <li>
            Test generated queries in the Supabase SQL editor before deploying
            to production.
          </li>
        </ul>

        <h3 className="text-base font-semibold mt-4 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" /> Example: AI-Generated
          Supabase Function
        </h3>
        <CodeBlock
          language="sql"
          title="Edge Function — Deal Risk Score"
          code={`CREATE OR REPLACE FUNCTION calculate_deal_risk_score(deal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deal_record RECORD;
  risk_score  NUMERIC;
  risk_factors JSONB := '[]'::JSONB;
BEGIN
  SELECT d.*, b.credit_score
  INTO deal_record
  FROM deals d
  LEFT JOIN deal_borrowers db ON db.deal_id = d.id
  LEFT JOIN borrowers b ON b.id = db.borrower_id
  WHERE d.id = deal_id
  LIMIT 1;

  risk_score := 100;

  IF deal_record.credit_score < 680 THEN
    risk_score := risk_score - 20;
    risk_factors := risk_factors || '["Low credit score"]'::JSONB;
  END IF;

  IF deal_record.loan_amount > 1000000 THEN
    risk_score := risk_score - 10;
    risk_factors := risk_factors || '["High loan amount"]'::JSONB;
  END IF;

  RETURN JSONB_BUILD_OBJECT(
    'score', risk_score,
    'factors', risk_factors,
    'deal_id', deal_id
  );
END;
$$;`}
        />
      </Section>

      <Callout type="tip" title="Combine AI with the API">
        The most powerful workflows combine AI features with the{" "}
        <Link
          href="/docs/power-users/api-integration"
          className="underline font-medium"
        >
          REST API
        </Link>
        . For example, use a webhook to trigger an AI document analysis when a
        file is uploaded, then update the deal status via the API based on the
        AI&apos;s assessment — building a fully automated underwriting pipeline.
      </Callout>
    </PageShell>
  );
}
