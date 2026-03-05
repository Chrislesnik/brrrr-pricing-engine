import type { Metadata } from "next";
import Link from "next/link";
import {
  BotMessageSquare,
  FileUp,
  FolderOpen,
  Lock,
  LayoutTemplate,
} from "lucide-react";
import {
  PageShell,
  Section,
  Step,
  Callout,
  ScreenshotDemo,
} from "@/components/docs/page-shell";

export const metadata: Metadata = {
  title: "Document Management",
  description:
    "Upload, organize, and manage documents with templates, categories, and AI-powered analysis.",
};

export default function DocumentsGuidePage() {
  const toc = [
    { id: "document-categories", title: "Document Categories", level: 2 },
    { id: "uploading-documents", title: "Uploading Documents", level: 2 },
    { id: "document-templates", title: "Document Templates", level: 2 },
    { id: "ai-document-analysis", title: "AI Document Analysis", level: 2 },
    { id: "document-permissions", title: "Document Permissions", level: 2 },
  ];

  return (
    <PageShell
      title="Document Management"
      description="Upload, organize, and manage documents with templates, categories, and AI-powered analysis."
      toc={toc}
    >
      <Section id="document-categories" title="Document Categories">
        <p className="text-sm text-muted-foreground">
          Document categories define how files are organized within each deal. Categories provide
          structure, making it easy for your team to find the right documents and ensuring nothing
          is missed during the lending process.
        </p>

        <Step number={1} title="Configure categories">
          <p>
            Admins can manage categories from{" "}
            <strong className="text-foreground">
              Settings → Documents → Categories
            </strong>
            . Create categories that match your workflow — common examples include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Loan Application</li>
            <li>Appraisal &amp; Valuation</li>
            <li>Title &amp; Survey</li>
            <li>Insurance</li>
            <li>Financial Statements</li>
            <li>Credit Reports</li>
            <li>Closing Documents</li>
          </ul>
        </Step>

        <Step number={2} title="Set category requirements">
          <p>
            Mark categories as required or optional for each deal type. Required categories will
            appear as incomplete checklist items until a document is uploaded, helping your team
            track what&apos;s still needed.
          </p>
        </Step>
      </Section>

      <Section id="uploading-documents" title="Uploading Documents">
        <p className="text-sm text-muted-foreground">
          Documents can be uploaded to any deal from the{" "}
          <strong className="text-foreground">Documents</strong> tab on the deal detail page.
        </p>

        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            <strong className="text-foreground">Drag and drop</strong> — drop files directly onto
            the documents area to upload them. Multiple files can be dropped at once.
          </li>
          <li>
            <strong className="text-foreground">Browse</strong> — click the upload button to open a
            file picker. Supports PDF, images, Word documents, Excel spreadsheets, and more.
          </li>
          <li>
            <strong className="text-foreground">Bulk upload</strong> — upload an entire folder of
            documents at once. The system will prompt you to categorize each file after upload.
          </li>
        </ul>

        <Callout type="info">
          Uploaded files are stored securely in Supabase Storage with organization-level isolation.
          Files are scanned for malware on upload and encrypted at rest.
        </Callout>
      </Section>

      <Section id="document-templates" title="Document Templates">
        <p className="text-sm text-muted-foreground">
          Document templates let you generate consistent, pre-filled documents for each deal.
          Templates are defined at the organization level and can be used across all deals.
        </p>

        <Step number={1} title="Create a template">
          <p>
            Go to{" "}
            <strong className="text-foreground">
              Settings → Documents → Templates
            </strong>{" "}
            and click <strong className="text-foreground">New Template</strong>. Upload a document
            file and define the variables that should be dynamically replaced.
          </p>
        </Step>

        <Step number={2} title="Define variables">
          <p>
            Templates support variable placeholders that are automatically filled with deal data
            when the document is generated. Available variables include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {"{{borrower_name}}"}
              </code>{" "}
              — primary borrower&apos;s full name
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {"{{property_address}}"}
              </code>{" "}
              — deal property address
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {"{{loan_amount}}"}
              </code>{" "}
              — formatted loan amount
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {"{{entity_name}}"}
              </code>{" "}
              — borrowing entity name
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {"{{current_date}}"}
              </code>{" "}
              — date of document generation
            </li>
          </ul>
        </Step>

        <Step number={3} title="Generate documents">
          <p>
            From any deal, click{" "}
            <strong className="text-foreground">Generate from Template</strong>, select the
            template, review the pre-filled values, and generate. The document is automatically
            added to the deal and categorized.
          </p>
        </Step>
      </Section>

      <Section id="ai-document-analysis" title="AI Document Analysis">
        <p className="text-sm text-muted-foreground">
          The dscr.ai includes AI-powered document analysis that can extract data,
          validate completeness, and surface insights from uploaded documents.
        </p>

        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            <strong className="text-foreground">Data extraction</strong> — automatically pull key
            data points from documents such as appraisal values, borrower information, and property
            details.
          </li>
          <li>
            <strong className="text-foreground">Validation</strong> — check documents for
            completeness and flag missing signatures, dates, or required fields.
          </li>
          <li>
            <strong className="text-foreground">Credit report insights</strong> — parse credit
            reports to extract scores, tradelines, derogatory marks, and payment history into
            structured data.
          </li>
          <li>
            <strong className="text-foreground">Summary generation</strong> — generate plain-language
            summaries of complex documents like title commitments and environmental reports.
          </li>
        </ul>

        <Callout type="tip" title="Getting the best results">
          AI analysis works best with clear, high-resolution PDFs. Scanned documents should be at
          least 300 DPI for reliable text extraction. The system supports OCR for scanned documents,
          but native PDFs will yield faster and more accurate results.
        </Callout>

        <ScreenshotDemo src="/screenshots/agent-console-actions.png" alt="AI agent console performing automated document analysis actions" caption="AI agent performing automated document analysis — scanning, classifying, extracting values, and updating deal records" />
      </Section>

      <Section id="document-permissions" title="Document Permissions">
        <p className="text-sm text-muted-foreground">
          Control who can view, upload, and manage documents using role-based permissions at the
          category level.
        </p>

        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
          <li>
            <strong className="text-foreground">Category-level access</strong> — restrict specific
            document categories to certain roles. For example, limit credit report access to
            underwriters and admins only.
          </li>
          <li>
            <strong className="text-foreground">Upload permissions</strong> — control which roles
            can upload documents to specific categories, preventing unauthorized file additions.
          </li>
          <li>
            <strong className="text-foreground">Download restrictions</strong> — prevent
            downloading of sensitive documents while still allowing in-app viewing.
          </li>
        </ul>

        <Callout type="warning">
          Changes to document permissions take effect immediately for all deals in your
          organization. Review permission changes carefully before saving, as they may affect team
          members&apos; ability to access documents they previously had access to.
        </Callout>

        <p className="text-sm text-muted-foreground">
          Document permissions are managed from{" "}
          <strong className="text-foreground">
            Settings → Documents → Permissions
          </strong>
          . For broader role and policy management, see{" "}
          <Link href="/docs/platform-overview#security" className="text-primary underline">
            Security &amp; Permissions
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
