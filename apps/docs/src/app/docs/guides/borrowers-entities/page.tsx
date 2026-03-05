import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Link2,
  Lock,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import {
  PageShell,
  Section,
  Step,
  Callout,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "Borrowers & Entities",
  description:
    "Manage individual borrowers and business entities across your organization.",
};

export default function BorrowersEntitiesPage() {
  const toc = [
    { id: "borrowers", title: "Borrowers", level: 2 },
    { id: "entities", title: "Entities", level: 2 },
    { id: "entity-ownership", title: "Entity Ownership", level: 2 },
    { id: "cross-deal-usage", title: "Cross-Deal Usage", level: 2 },
  ];

  return (
    <PageShell
      title="Borrowers & Entities"
      description="Manage individual borrowers and business entities across your organization."
      toc={toc}
    >
      <Section id="borrowers" title="Borrowers">
        <p className="text-sm text-muted-foreground">
          Borrowers represent individual loan applicants in your organization. They are shared
          across deals, so you only need to enter a borrower&apos;s information once.
        </p>

        <Step number={1} title="Creating a Borrower">
          <p>
            Navigate to <strong className="text-foreground">Borrowers</strong> in the sidebar and
            click <strong className="text-foreground">Add Borrower</strong>. Enter the
            borrower&apos;s name, contact information, and any relevant personal details. You can
            also create borrowers inline when adding them to a deal.
          </p>
        </Step>

        <Step number={2} title="Editing & Searching">
          <p>
            Use the search bar on the Borrowers page to find borrowers by name, email, or phone
            number. Click any borrower to view their profile, edit their information, or see all
            deals they&apos;re connected to.
          </p>
        </Step>

        <Callout type="warning" title="PII Handling">
          Sensitive personally identifiable information — such as Social Security Numbers — is
          encrypted at rest using AES-256 encryption. SSNs are masked in the UI and only revealed
          on explicit request by authorized users. Access to PII fields is logged for compliance.
        </Callout>
      </Section>

      <Section id="entities" title="Entities">
        <p className="text-sm text-muted-foreground">
          Entities represent the business structures involved in lending transactions. These are
          especially important for commercial and investment property loans.
        </p>

        <Step number={1} title="Creating an Entity">
          <p>
            Navigate to <strong className="text-foreground">Entities</strong> and click{" "}
            <strong className="text-foreground">Add Entity</strong>. Provide the entity name, select
            the entity type, and fill in formation details.
          </p>
        </Step>

        <p className="text-sm text-muted-foreground">
          Supported entity types include:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>
            <strong className="text-foreground">LLC</strong> — Limited Liability Company
          </li>
          <li>
            <strong className="text-foreground">LP</strong> — Limited Partnership
          </li>
          <li>
            <strong className="text-foreground">Corporation</strong> — C-Corp or S-Corp
          </li>
          <li>
            <strong className="text-foreground">Trust</strong> — Revocable or Irrevocable Trust
          </li>
          <li>
            <strong className="text-foreground">General Partnership</strong>
          </li>
          <li>
            <strong className="text-foreground">Sole Proprietorship</strong>
          </li>
        </ul>
      </Section>

      <Section id="entity-ownership" title="Entity Ownership">
        <p className="text-sm text-muted-foreground">
          The ownership structure feature lets you define who controls each entity. This is critical
          for underwriting commercial loans where beneficial ownership must be documented.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            <strong className="text-foreground">Link borrowers</strong> — associate individual
            borrowers as members, managers, or officers of an entity with defined ownership
            percentages.
          </li>
          <li>
            <strong className="text-foreground">Nested entities</strong> — model complex structures
            where one entity owns another (e.g., a holding company that owns an operating LLC).
          </li>
          <li>
            <strong className="text-foreground">Guarantor designation</strong> — mark specific
            owners as personal guarantors for the loan.
          </li>
        </ul>

        <Callout type="tip">
          For regulatory compliance, ensure that all individuals with 25% or more beneficial
          ownership are documented. The platform will flag entities with incomplete ownership
          information.
        </Callout>
      </Section>

      <Section id="cross-deal-usage" title="Cross-Deal Usage">
        <p className="text-sm text-muted-foreground">
          Borrowers and entities are organization-level records, not deal-specific. This means:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            A single borrower can be linked to multiple deals — useful for repeat clients or
            co-borrowers who appear across transactions.
          </li>
          <li>
            An entity can be associated with multiple deals simultaneously, reflecting real-world
            scenarios where an LLC is involved in several properties.
          </li>
          <li>
            Updates to a borrower or entity profile propagate across all linked deals, ensuring
            consistency without manual re-entry.
          </li>
        </ul>

        <Callout type="info">
          When you search for a borrower or entity on a deal, the system searches your entire
          organization. This prevents duplicate records and keeps your data clean. If a match is
          found, you can link the existing record instead of creating a new one.
        </Callout>
      </Section>
    </PageShell>
  );
}
