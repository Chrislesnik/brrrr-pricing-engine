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
        {node.attrs.name}
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
      `{{${HTMLAttributes.name}}}`,
    ]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(MergeTagChip as any)
  },
})

// ─── Available merge tags ───────────────────────────────────────────────────
//
// Naming convention: "table:column" — one merge tag per database column / JSON key.
// This guarantees 1:1 mapping between a template token and its data source.
//
// Prefixes:
//   borrowers:*       → public.borrowers table (joined via loan_scenarios.borrower_entity_id)
//   property:*        → subject property / collateral address (loan_scenarios.inputs["address"])
//   loans:*           → public.loans table
//   loan_inputs:*     → loan_scenarios.inputs JSON keys
//   loan_selected:*   → loan_scenarios.selected JSON keys (computed scenario outputs)
//   organizations:*   → public.organizations table (joined via loans.organization_id)

export type MergeTag = {
  /** Unique token stored in the Tiptap node. Displayed verbatim as {{name}} in the editor. */
  name: string
  /** Human-readable label shown in the picker. */
  label: string
  /** Grouping for the picker UI. */
  category: string
}

export const MERGE_TAGS: MergeTag[] = [
  // ── Borrower (public.borrowers, joined via loan_scenarios.borrower_entity_id) ──
  { name: "borrowers:display_id",           label: "Borrower ID",          category: "Borrower" },
  { name: "borrowers:first_name",           label: "First Name",           category: "Borrower" },
  { name: "borrowers:last_name",            label: "Last Name",            category: "Borrower" },
  { name: "borrowers:full_name",            label: "Full Name",            category: "Borrower" },
  { name: "borrowers:email",                label: "Email",                category: "Borrower" },
  { name: "borrowers:primary_phone",        label: "Phone",                category: "Borrower" },
  { name: "borrowers:alt_phone",            label: "Alt Phone",            category: "Borrower" },
  { name: "borrowers:fico_score",           label: "FICO Score",           category: "Borrower" },
  { name: "borrowers:date_of_birth",        label: "Date of Birth",        category: "Borrower" },
  { name: "borrowers:citizenship",          label: "Citizenship",          category: "Borrower" },
  // Borrower personal address
  { name: "borrowers:address_line1",        label: "Address Line 1",       category: "Borrower" },
  { name: "borrowers:address_line2",        label: "Address Line 2",       category: "Borrower" },
  { name: "borrowers:city",                 label: "City",                 category: "Borrower" },
  { name: "borrowers:state",               label: "State",                category: "Borrower" },
  { name: "borrowers:zip",                  label: "ZIP Code",             category: "Borrower" },
  { name: "borrowers:county",              label: "County",               category: "Borrower" },

  // ── Subject Property / Collateral (loan_scenarios.inputs["address"]) ──────
  { name: "property:street",               label: "Street Address",       category: "Property" },
  { name: "property:city",                 label: "City",                 category: "Property" },
  { name: "property:state",                label: "State",                category: "Property" },
  { name: "property:zip",                  label: "ZIP Code",             category: "Property" },
  { name: "property:county",               label: "County",               category: "Property" },
  { name: "property:full_address",         label: "Full Address",         category: "Property" },

  // ── Loan (public.loans) ───────────────────────────────────────────────────
  { name: "loans:display_id",              label: "Loan ID",              category: "Loan" },
  { name: "loans:status",                  label: "Loan Status",          category: "Loan" },

  // ── Loan Inputs (loan_scenarios.inputs JSON) ──────────────────────────────
  { name: "loan_inputs:loan_type",          label: "Loan Type",            category: "Loan" },
  { name: "loan_inputs:transaction_type",   label: "Transaction Type",     category: "Loan" },
  { name: "loan_inputs:closing_date",       label: "Closing Date",         category: "Loan" },
  { name: "loan_inputs:purchase_price",     label: "Purchase Price",       category: "Loan" },
  { name: "loan_inputs:after_repair_value", label: "After Repair Value",   category: "Loan" },
  { name: "loan_inputs:entity_name",        label: "Borrowing Entity",     category: "Loan" },

  // ── Loan Outputs / Selected Scenario (loan_scenarios.selected JSON) ───────
  { name: "loan_selected:loan_amount",      label: "Loan Amount",          category: "Loan" },
  { name: "loan_selected:rate",             label: "Interest Rate",        category: "Loan" },
  { name: "loan_selected:ltv",              label: "LTV",                  category: "Loan" },

  // ── Deal Inputs (deal_inputs, automatically mapped from input codes) ──────
  { name: "deal_inputs:title_file_number",     label: "Title / File #",       category: "Deal" },
  { name: "deal_inputs:loan_number",           label: "Loan Number",          category: "Deal" },
  { name: "deal_inputs:deal_disposition",      label: "Deal Disposition",     category: "Deal" },
  { name: "deal_inputs:deal_stage_1",          label: "Deal Stage",           category: "Deal" },
  { name: "deal_inputs:property_type",         label: "Property Type",        category: "Deal" },
  { name: "deal_inputs:loan_structure_dscr",   label: "Loan Structure",       category: "Deal" },
  { name: "deal_inputs:loan_term",             label: "Loan Term",            category: "Deal" },
  { name: "deal_inputs:recourse_type",         label: "Recourse Type",        category: "Deal" },
  { name: "deal_inputs:ppp_term",              label: "Prepay Term",          category: "Deal" },
  { name: "deal_inputs:ppp_structure",         label: "Prepay Structure",     category: "Deal" },
  { name: "deal_inputs:io_period",             label: "I/O Period",           category: "Deal" },
  { name: "deal_inputs:cost_of_capital",       label: "Cost of Capital",      category: "Deal" },
  { name: "deal_inputs:note_date",             label: "Note Date",            category: "Deal" },
  { name: "deal_inputs:funding_date",          label: "Funding Date",         category: "Deal" },
  { name: "deal_inputs:date_of_purchase",      label: "Date of Purchase",     category: "Deal" },
  { name: "deal_inputs:vesting_type",          label: "Vesting Type",         category: "Deal" },
  { name: "deal_inputs:lead_source_type",      label: "Lead Source Type",     category: "Deal" },
  { name: "deal_inputs:lead_source_name",      label: "Lead Source Name",     category: "Deal" },
  { name: "deal_inputs:guarantor_name",        label: "Guarantor Name",       category: "Deal" },
  { name: "deal_inputs:guarantor_count",       label: "Guarantor Count",      category: "Deal" },
  { name: "deal_inputs:title_company",         label: "Title Company",        category: "Deal" },
  { name: "deal_inputs:loan_buyer",            label: "Loan Buyer",           category: "Deal" },
  { name: "deal_inputs:loan_amount_total",     label: "Total Loan Amount",    category: "Deal" },
  { name: "deal_inputs:note_rate",             label: "Note Rate",            category: "Deal" },
  { name: "deal_inputs:purchase_price",        label: "Purchase Price",       category: "Deal" },
  { name: "deal_inputs:property_address",      label: "Property Address",     category: "Deal" },
  { name: "deal_inputs:transaction_type",      label: "Transaction Type",     category: "Deal" },
  { name: "deal_inputs:target_closing_date",   label: "Target Closing Date",  category: "Deal" },

  // ── Organization (public.organizations, via loans.organization_id) ────────
  { name: "organizations:name",             label: "Organization Name",    category: "Organization" },
  { name: "organizations:clerk_org_id",     label: "Organization ID",      category: "Organization" },
]
