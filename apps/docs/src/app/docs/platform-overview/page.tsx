import type { Metadata } from "next";
import {
  Blocks,
  BotMessageSquare,
  FileSearch,
  GitBranch,
  Lock,
  Network,
  Shield,
  Sliders,
  Webhook,
} from "lucide-react";
import {
  PageShell,
  Section,
  Callout,
  FeatureCard,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "Platform Overview",
  description:
    "Understand the architecture, core concepts, and key features of the dscr.ai.",
};

export default function PlatformOverviewPage() {
  const toc = [
    { id: "architecture", title: "Architecture", level: 2 },
    { id: "core-concepts", title: "Core Concepts", level: 2 },
    { id: "key-features", title: "Key Features", level: 2 },
    { id: "security", title: "Security", level: 2 },
  ];

  return (
    <PageShell
      title="Platform Overview"
      description="Understand the architecture, core concepts, and key features of the dscr.ai."
      toc={toc}
    >
      <Section id="architecture" title="Architecture">
        <p className="text-sm text-muted-foreground">
          The dscr.ai is a multi-tenant SaaS platform purpose-built for lending
          operations. It&apos;s designed around a modern, scalable stack:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            <strong className="text-foreground">Next.js</strong> — server-rendered React application
            with App Router, Server Components, and Server Actions for a fast, interactive
            experience.
          </li>
          <li>
            <strong className="text-foreground">Supabase (PostgreSQL)</strong> — managed Postgres
            database with real-time subscriptions, storage, and edge functions. All data is
            organization-scoped using Row Level Security (RLS).
          </li>
          <li>
            <strong className="text-foreground">Clerk</strong> — authentication and organization
            management with SSO support, role-based access control, and session management.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Every piece of data — deals, borrowers, documents, pricing rules — is scoped to the
          active organization. RLS policies at the database layer guarantee that data never leaks
          across tenant boundaries, even in the event of application-level bugs.
        </p>
      </Section>

      <Section id="core-concepts" title="Core Concepts">
        <p className="text-sm text-muted-foreground mb-4">
          These are the building blocks you&apos;ll work with throughout the platform.
        </p>
        <div className="space-y-3">
          <ConceptDefinition
            term="Organizations"
            definition="Multi-tenant workspaces that isolate all data, settings, and team members. Each organization has its own pricing configuration, deal pipeline, and document templates."
          />
          <ConceptDefinition
            term="Deals"
            definition="The central unit of work — a deal represents a single loan transaction from origination through closing. Deals link to borrowers, entities, documents, applications, and tasks."
          />
          <ConceptDefinition
            term="Borrowers"
            definition="Individual loan applicants. Borrowers store personal and financial information (with encrypted PII) and can be linked to multiple deals across your organization."
          />
          <ConceptDefinition
            term="Entities"
            definition="Business entities such as LLCs, limited partnerships, corporations, and trusts. Entities have ownership structures that link to borrowers and can be associated with multiple deals."
          />
          <ConceptDefinition
            term="Applications"
            definition="Formal loan applications tied to a specific deal. Applications capture structured data required for underwriting and compliance."
          />
          <ConceptDefinition
            term="Programs"
            definition="Configurable loan program templates that define pricing rules, rate adjustments, eligibility criteria, and default settings. Programs can be assigned to deals to auto-populate pricing."
          />
          <ConceptDefinition
            term="Documents"
            definition="File management system with categories, permissions, and templates. Documents can be uploaded, generated from templates, and analyzed using AI-powered extraction."
          />
        </div>
      </Section>

      <Section id="key-features" title="Key Features">
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureCard
            icon={<Sliders className="h-5 w-5" />}
            title="Dynamic Pricing Engine"
            description="Configurable inputs, pricing rules, and rate adjustments. Build loan programs with custom eligibility criteria and automated rate calculations."
          />
          <FeatureCard
            icon={<FileSearch className="h-5 w-5" />}
            title="Document Management"
            description="Templates with variable substitution, document categories, bulk upload, and AI-powered analysis for automated data extraction and validation."
          />
          <FeatureCard
            icon={<GitBranch className="h-5 w-5" />}
            title="Workflow Automation"
            description="Visual workflow builder powered by React Flow. Create automated pipelines for deal processing, notifications, and task assignments."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Role-Based Access"
            description="Granular organization policies and permissions. Control access to deals, documents, settings, and sensitive data at the role and category level."
          />
          <FeatureCard
            icon={<Webhook className="h-5 w-5" />}
            title="API & Integrations"
            description="REST API with API key authentication, webhooks for real-time event notifications, and third-party integrations for CRMs and loan origination systems."
          />
          <FeatureCard
            icon={<BotMessageSquare className="h-5 w-5" />}
            title="AI Assistant"
            description="AI-powered chat for deal analysis, document extraction, credit report insights, and natural-language queries across your organization's data."
          />
        </div>
      </Section>

      <Section id="security" title="Security">
        <Callout type="info" title="Security by design">
          <p>
            The dscr.ai implements multiple layers of security to protect your
            sensitive lending data:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Row Level Security (RLS)</strong> — all database queries are enforced at the
              Postgres level, ensuring strict tenant isolation regardless of application logic.
            </li>
            <li>
              <strong>Encrypted PII</strong> — sensitive fields like Social Security Numbers are
              encrypted at rest using AES-256 and only decrypted when explicitly accessed by
              authorized users.
            </li>
            <li>
              <strong>Clerk-managed authentication</strong> — session management, MFA, and SSO are
              handled by Clerk with enterprise-grade security standards.
            </li>
            <li>
              <strong>Organization-scoped API keys</strong> — API access is scoped per organization
              with revocable keys and audit logging.
            </li>
          </ul>
        </Callout>
      </Section>
    </PageShell>
  );
}

function ConceptDefinition({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <dt className="text-sm font-semibold text-foreground">{term}</dt>
      <dd className="mt-1 text-sm text-muted-foreground">{definition}</dd>
    </div>
  );
}
