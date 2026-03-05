import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightLeft,
  CheckSquare,
  FileText,
  Kanban,
  Keyboard,
  PlusCircle,
  Users,
} from "lucide-react";
import {
  PageShell,
  Section,
  Step,
  Callout,
  ScreenshotDemo,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "Managing Deals",
  description:
    "Create, configure, and manage lending deals from origination to closing.",
};

export default function DealsGuidePage() {
  const toc = [
    { id: "what-is-a-deal", title: "What is a Deal?", level: 2 },
    { id: "creating-a-deal", title: "Creating a Deal", level: 2 },
    { id: "deal-pipeline", title: "Deal Pipeline", level: 2 },
    { id: "borrowers-entities", title: "Adding Borrowers & Entities", level: 2 },
    { id: "deal-documents", title: "Deal Documents", level: 2 },
    { id: "deal-tasks", title: "Deal Tasks", level: 2 },
    { id: "keyboard-shortcuts", title: "Keyboard Shortcuts", level: 2 },
  ];

  return (
    <PageShell
      title="Managing Deals"
      description="Create, configure, and manage lending deals from origination to closing."
      toc={toc}
    >
      <Section id="what-is-a-deal" title="What is a Deal?">
        <p className="text-sm text-muted-foreground">
          A deal is the central unit of work in the dscr.ai. It represents a single
          loan transaction — from initial inquiry through underwriting, approval, and closing.
        </p>
        <p className="text-sm text-muted-foreground">
          Each deal acts as a hub that connects all related data:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>
            <strong className="text-foreground">Borrowers</strong> — the individuals applying for
            the loan
          </li>
          <li>
            <strong className="text-foreground">Entities</strong> — business entities (LLCs,
            partnerships) involved in the transaction
          </li>
          <li>
            <strong className="text-foreground">Documents</strong> — uploaded files, generated
            templates, and AI-analyzed documents
          </li>
          <li>
            <strong className="text-foreground">Applications</strong> — formal loan applications
            with structured data
          </li>
          <li>
            <strong className="text-foreground">Tasks</strong> — action items assigned to team
            members with due dates and status tracking
          </li>
        </ul>
      </Section>

      <Section id="creating-a-deal" title="Creating a Deal">
        <Step number={1} title="Navigate to the Deals page">
          <p>
            From the sidebar, click <strong className="text-foreground">Deals</strong> to open your
            deal pipeline. You&apos;ll see all active deals organized by stage.
          </p>
        </Step>
        <Step number={2} title="Click &quot;New Deal&quot;">
          <p>
            Click the <strong className="text-foreground">New Deal</strong> button in the top-right
            corner. A creation dialog will open.
          </p>
        </Step>
        <Step number={3} title="Select a loan program (optional)">
          <p>
            If your organization has configured loan programs, you can select one to pre-populate
            pricing rules and default settings. You can always change or remove the program later.
          </p>
        </Step>
        <Step number={4} title="Fill in deal details">
          <p>
            Enter the basic information — property address, loan amount, deal type, and any notes.
            Once saved, you&apos;ll be taken to the deal detail page where you can add borrowers,
            entities, and documents.
          </p>
        </Step>
        <ScreenshotDemo src="/screenshots/deals-pipeline.png" alt="Deals list with filter and add controls" caption="The Deals view — filter, sort, and add new deals with the + Add Deal button" />
      </Section>

      <Section id="deal-pipeline" title="Deal Pipeline">
        <p className="text-sm text-muted-foreground">
          Deals move through a pipeline of stages that reflect your lending workflow. Common stages
          include <em>Lead</em>, <em>Application</em>, <em>Underwriting</em>, <em>Approved</em>,
          and <em>Closed</em>.
        </p>
        <p className="text-sm text-muted-foreground">
          Pipeline stages are fully configurable per organization. Admins can add, rename, reorder,
          and remove stages from{" "}
          <strong className="text-foreground">Settings → Deal Pipeline</strong>. To move a deal
          between stages, drag it on the Kanban board or use the stage selector on the deal detail
          page.
        </p>
        <Callout type="info">
          Stage changes are logged in the deal&apos;s activity timeline, so your team always has a
          clear audit trail of how a deal progressed.
        </Callout>
      </Section>

      <Section id="borrowers-entities" title="Adding Borrowers & Entities">
        <p className="text-sm text-muted-foreground">
          From the deal detail page, use the{" "}
          <strong className="text-foreground">Borrowers</strong> and{" "}
          <strong className="text-foreground">Entities</strong> tabs to link people and businesses
          to the deal.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>
            <strong className="text-foreground">Search existing</strong> — type a name to find
            borrowers or entities already in your organization.
          </li>
          <li>
            <strong className="text-foreground">Create new</strong> — add a new borrower or entity
            inline without leaving the deal.
          </li>
          <li>
            <strong className="text-foreground">Set roles</strong> — designate primary borrower,
            co-borrower, guarantor, or sponsor as needed.
          </li>
        </ul>
        <Callout type="tip" title="Entity ownership structure">
          When adding entities, consider documenting the ownership structure. Link borrowers as
          members or managers of the entity to clearly represent who controls the business. This is
          especially important for commercial lending where ownership percentages affect
          underwriting decisions.
        </Callout>
      </Section>

      <Section id="deal-documents" title="Deal Documents">
        <p className="text-sm text-muted-foreground">
          The <strong className="text-foreground">Documents</strong> tab on each deal lets you
          manage all files related to the transaction.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            <strong className="text-foreground">Upload files</strong> — drag and drop or browse to
            upload documents. Files are automatically organized into the categories defined by your
            organization.
          </li>
          <li>
            <strong className="text-foreground">Categorize</strong> — assign documents to categories
            like &quot;Appraisal&quot;, &quot;Title&quot;, or &quot;Insurance&quot; for easy filtering and
            retrieval.
          </li>
          <li>
            <strong className="text-foreground">AI analysis</strong> — run AI-powered analysis to
            extract key data points, validate document completeness, and flag potential issues.
          </li>
          <li>
            <strong className="text-foreground">Permissions</strong> — document access can be
            controlled at the category level, so sensitive documents (e.g., credit reports) are only
            visible to authorized roles.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          For more details, see the{" "}
          <Link href="/docs/guides/documents" className="text-primary underline">
            Document Management
          </Link>{" "}
          guide.
        </p>
      </Section>

      <Section id="deal-tasks" title="Deal Tasks">
        <p className="text-sm text-muted-foreground">
          Tasks keep your team organized and accountable throughout the deal lifecycle.
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            <strong className="text-foreground">Task templates</strong> — admins can create
            reusable task templates that automatically populate when a deal enters a specific stage.
          </li>
          <li>
            <strong className="text-foreground">Assignments</strong> — assign tasks to specific
            team members with due dates and priority levels.
          </li>
          <li>
            <strong className="text-foreground">Status tracking</strong> — tasks move through
            statuses (To Do, In Progress, Complete) and appear in each member&apos;s personal task
            list.
          </li>
        </ul>
      </Section>

      <Section id="keyboard-shortcuts" title="Keyboard Shortcuts">
        <p className="text-sm text-muted-foreground mb-3">
          Speed up your workflow with these keyboard shortcuts when viewing deals.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium">Shortcut</th>
                <th className="px-4 py-2.5 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <ShortcutRow keys="N" action="Create new deal" />
              <ShortcutRow keys="E" action="Edit current deal" />
              <ShortcutRow keys="D" action="Open documents tab" />
              <ShortcutRow keys="B" action="Open borrowers tab" />
              <ShortcutRow keys="T" action="Open tasks tab" />
              <ShortcutRow keys="⌘ K" action="Open command palette" />
              <ShortcutRow keys="Esc" action="Close dialog / go back" />
            </tbody>
          </table>
        </div>
      </Section>
    </PageShell>
  );
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2.5">
        <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
          {keys}
        </kbd>
      </td>
      <td className="px-4 py-2.5 text-muted-foreground">{action}</td>
    </tr>
  );
}
