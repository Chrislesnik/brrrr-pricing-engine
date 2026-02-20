"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { cn } from "@repo/lib/cn"

// ─── Chip renderer ──────────────────────────────────────────────────────────

function MergeTagChip({ node, selected }: { node: { attrs: { name: string; label: string } }; selected: boolean }) {
  return (
    <NodeViewWrapper as="span" className="inline align-baseline">
      <span
        className={cn(
          "mx-0.5 inline-flex cursor-default select-none items-center gap-0.5 whitespace-nowrap rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          selected && "ring-1 ring-ring ring-offset-1"
        )}
        data-merge-tag={node.attrs.name}
        contentEditable={false}
      >
        {"{{"}
        {node.attrs.label || node.attrs.name}
        {"}}"}
      </span>
    </NodeViewWrapper>
  )
}

// ─── Extension ──────────────────────────────────────────────────────────────

export const MergeTagExtension = Node.create({
  name: "mergeTag",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      name: { default: "" },
      label: { default: "" },
    }
  },

  parseHTML() {
    return [{ tag: "span[data-merge-tag]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-merge-tag": HTMLAttributes.name }),
      `{{${HTMLAttributes.label || HTMLAttributes.name}}}`,
    ]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(MergeTagChip as any)
  },
})

// ─── Available merge tags ───────────────────────────────────────────────────

export type MergeTag = {
  name: string
  label: string
  category: string
}

export const MERGE_TAGS: MergeTag[] = [
  // Borrower
  { name: "firstName",       label: "First Name",       category: "Borrower" },
  { name: "lastName",        label: "Last Name",        category: "Borrower" },
  { name: "fullName",        label: "Full Name",        category: "Borrower" },
  { name: "email",           label: "Email",            category: "Borrower" },
  { name: "phone",           label: "Phone",            category: "Borrower" },
  { name: "company",         label: "Company",          category: "Borrower" },
  // Loan
  { name: "loanId",          label: "Loan ID",          category: "Loan" },
  { name: "loanAmount",      label: "Loan Amount",      category: "Loan" },
  { name: "loanType",        label: "Loan Type",        category: "Loan" },
  { name: "interestRate",    label: "Interest Rate",    category: "Loan" },
  { name: "ltv",             label: "LTV",              category: "Loan" },
  { name: "closingDate",     label: "Closing Date",     category: "Loan" },
  // Property
  { name: "propertyAddress", label: "Property Address", category: "Property" },
  { name: "propertyCity",    label: "City",             category: "Property" },
  { name: "propertyState",   label: "State",            category: "Property" },
  // Org
  { name: "lenderName",      label: "Lender Name",      category: "Organization" },
  { name: "lenderEmail",     label: "Lender Email",     category: "Organization" },
  { name: "orgName",         label: "Organization",     category: "Organization" },
]
