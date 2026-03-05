import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Code2,
  UserPlus,
  Settings2,
  FolderOpen,
} from "lucide-react";
import {
  PageShell,
  Section,
  Step,
  Callout,
  FeatureCard,
  ScreenshotDemo,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Get up and running with the dscr.ai in under 10 minutes.",
};

export default function GettingStartedPage() {
  const toc = [
    { id: "prerequisites", title: "Prerequisites", level: 2 },
    { id: "create-organization", title: "Step 1: Create Your Organization", level: 2 },
    { id: "configure-pricing", title: "Step 2: Configure Your Pricing Engine", level: 2 },
    { id: "create-deal", title: "Step 3: Create Your First Deal", level: 2 },
    { id: "document-templates", title: "Step 4: Set Up Document Templates", level: 2 },
    { id: "next-steps", title: "Next Steps", level: 2 },
  ];

  return (
    <PageShell
      title="Getting Started"
      description="Get up and running with the dscr.ai in under 10 minutes."
      badge="Quick Start"
      toc={toc}
    >
      <Section id="prerequisites" title="Prerequisites">
        <p className="text-sm text-muted-foreground">
          Before you begin, make sure you have the following in place:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            A <strong className="text-foreground">Clerk account</strong> — authentication is managed
            through Clerk. If you don&apos;t have an account yet, one will be created during sign-up.
          </li>
          <li>
            <strong className="text-foreground">Organization access</strong> — you need to belong to
            an organization, or have permission to create one.
          </li>
          <li>
            An <strong className="text-foreground">Admin or Member role</strong> within your
            organization. Admins can configure settings, manage members, and set up pricing. Members
            can create and manage deals.
          </li>
        </ul>
        <Callout type="info" title="First time?">
          If you&apos;re signing up for the first time, you&apos;ll be guided through creating your
          organization automatically. You can skip ahead to{" "}
          <Link href="#configure-pricing" className="underline">
            Step 2
          </Link>
          .
        </Callout>
      </Section>

      <Section id="create-organization" title="Step 1: Create Your Organization">
        <Step number={1} title="Create Your Organization">
          <p>
            Organizations are the top-level workspace in the dscr.ai. All deals,
            borrowers, documents, and settings are scoped to your organization.
          </p>
          <p>
            Navigate to the organization switcher in the sidebar and select{" "}
            <strong className="text-foreground">Create Organization</strong>. Give your organization
            a name (e.g., your company name) and optionally upload a logo.
          </p>
        </Step>
        <Step number={2} title="Invite Team Members">
          <p>
            Once your organization is created, invite your team by navigating to{" "}
            <strong className="text-foreground">Settings → Members</strong>. Enter their email
            addresses and assign roles:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Admin</strong> — full access to settings, members,
              and configuration
            </li>
            <li>
              <strong className="text-foreground">Member</strong> — can create and manage deals,
              borrowers, and documents
            </li>
          </ul>
        </Step>
        <ScreenshotDemo src="/screenshots/dashboard.png" alt="Dashboard overview after creating your organization" caption="Your dashboard after creating an organization — key metrics at a glance" />
      </Section>

      <Section id="configure-pricing" title="Step 2: Configure Your Pricing Engine">
        <Step number={3} title="Set Up Pricing Inputs">
          <p>
            Navigate to <strong className="text-foreground">Settings → Pricing Engine</strong> to
            configure the inputs that drive your pricing calculations. Inputs include fields like
            loan amount, property value, credit score, and any custom fields your organization
            requires.
          </p>
        </Step>
        <Step number={4} title="Define Categories &amp; Loan Programs">
          <p>
            Organize your pricing inputs into categories for a cleaner workflow, then create loan
            program templates. Each program defines its own set of pricing rules, rate adjustments,
            and eligibility criteria.
          </p>
        </Step>
        <Callout type="tip" title="Start simple">
          You can always add more inputs and programs later. Start with one loan program and a
          handful of key inputs to get comfortable with the system.
        </Callout>
        <ScreenshotDemo src="/screenshots/pricing-engine.png" alt="Pricing engine scenarios configuration" caption="The Scenarios view — configure loan types, transaction types, and pricing rules" />
      </Section>

      <Section id="create-deal" title="Step 3: Create Your First Deal">
        <Step number={5} title="Create a Deal">
          <p>
            Head to the <strong className="text-foreground">Deals</strong> page and click{" "}
            <strong className="text-foreground">New Deal</strong>. Optionally select a loan program
            to pre-populate pricing rules, then fill in the basic deal information — property
            address, loan amount, and deal type.
          </p>
        </Step>
        <Step number={6} title="Add Borrowers &amp; Entities">
          <p>
            Link borrowers (individual applicants) and entities (LLCs, partnerships) to your deal.
            You can create new borrowers inline or search for existing ones already in your
            organization.
          </p>
        </Step>
        <ScreenshotDemo src="/screenshots/deals-pipeline.png" alt="Deals pipeline showing active deals" caption="The Deals pipeline — create and manage lending deals from origination to closing" />
      </Section>

      <Section id="document-templates" title="Step 4: Set Up Document Templates">
        <Step number={7} title="Configure Document Categories">
          <p>
            Go to{" "}
            <strong className="text-foreground">Settings → Documents → Categories</strong> to
            define how documents are organized within your deals. Common categories include loan
            applications, appraisals, title reports, and insurance documents.
          </p>
        </Step>
        <Step number={8} title="Upload Templates">
          <p>
            Create reusable document templates that can be generated per-deal. Templates support
            variable substitution — borrower name, property address, loan terms, and more — so your
            team can generate consistent documents in seconds.
          </p>
        </Step>
      </Section>

      <Section id="next-steps" title="Next Steps">
        <p className="text-sm text-muted-foreground mb-4">
          You&apos;re all set! Explore these resources to go deeper.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<LayoutDashboard className="h-5 w-5" />}
            title="Platform Overview"
            description="Understand the architecture, core concepts, and key features."
            href="/docs/platform-overview"
          />
          <FeatureCard
            icon={<BookOpen className="h-5 w-5" />}
            title="User Guides"
            description="Step-by-step guides for managing deals, borrowers, and documents."
            href="/docs/guides/deals"
          />
          <FeatureCard
            icon={<Code2 className="h-5 w-5" />}
            title="API Reference"
            description="Integrate with the dscr.ai using the REST API."
            href="/docs/api-reference"
          />
        </div>
      </Section>
    </PageShell>
  );
}
