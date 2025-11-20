"use client"

import * as React from "react"

type Value = string | number | null | undefined

// Props accept known fields but also allow arbitrary tokens; missing values render as {{ token }}
export interface DSCRTermSheetProps {
  // Header
  program?: Value
  // Borrower & Guarantors
  borrower_name?: Value
  guarantor_name?: Value
  fico_score?: Value
  experience?: Value
  citizenship?: Value
  // Subject Property
  street_city_state_zip?: Value
  property_type?: Value
  prop_units?: Value
  is_purchased_rehab_only?: Value
  occupancy?: Value
  // Loan Structure
  transaction_type?: Value
  loan_structure?: Value
  io_period?: Value
  interest_rate?: Value
  prepay?: Value
  leverage_ltv?: Value
  loan_amount?: Value
  // Lender Fees
  origination?: Value
  rate_buydown?: Value
  underwriting?: Value
  doc_prep?: Value
  lender_legal?: Value
  // Liquidity Requirement
  liquidity_required?: Value
  reserves_label?: Value
  reserves_months?: Value
  reserves_amount?: Value
  // Debt Service (DSCR)
  dscr?: Value
  // Credits / Sources
  loan_proceeds?: Value
  cash_out_at_closing?: Value
  total_sources?: Value
  // Debits / Uses
  purchaseprice_payoff_label?: Value
  purchaseprice_payoff?: Value
  lender_fee_origination?: Value
  lender_fee_underwriting?: Value
  lender_fee_doc_prep?: Value
  lender_fee_legal?: Value
  escrow_reserves_label?: Value
  escrow_reserves?: Value
  flood_premium?: Value
  hoi_premium?: Value
  prepay_interest?: Value
  title_fee?: Value
  closing_costs_other?: Value
  cash_out_to_borrower_label?: Value
  cash_out_to_borrower?: Value
  total_uses?: Value
  // Index signature for any extra tokens
  [key: string]: Value
}

function valueOrToken(props: DSCRTermSheetProps, key: string): string {
  const v = props[key]
  if (v === null || v === undefined || v === "") return `{{ ${key} }}`
  return String(v)
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-2 text-[11px] leading-tight py-[6px] border-b last:border-b-0">
      <div className="text-black/80">{label}</div>
      <div className="text-right font-medium">{children}</div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 mb-1">
      <div className="h-[18px] w-full bg-black text-white text-[11px] font-semibold leading-[18px] px-2 uppercase">
        {children}
      </div>
    </div>
  )
}

export default function DSCRTermSheet(props: DSCRTermSheetProps) {
  return (
    <div
      className="mx-auto w-[816px] h-[1056px] bg-white text-black border shadow-sm p-6"
      role="document"
      aria-label="DSCR Term Sheet"
    >
      {/* Header */}
      <div className="mb-3">
        <div className="text-[13px] font-bold">Preliminary Term Sheet</div>
        <div className="text-[12px] text-amber-600 font-semibold">
          {valueOrToken(props, "program")}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div>
          <div className="text-[12px] font-semibold mb-1">Loan Summary</div>
          <div className="h-[1px] bg-black mb-2" />

          <SectionHeader>Borrower &amp; Guarantors</SectionHeader>
          <div className="border">
            <Row label="Borrower">
              {valueOrToken(props, "borrower_name")}
            </Row>
            <Row label="Guarantor(s)">
              {valueOrToken(props, "guarantor_name")}
            </Row>
            <Row label="FICO">
              {valueOrToken(props, "fico_score")}
            </Row>
            <Row label="Experience">
              {valueOrToken(props, "experience")}
            </Row>
            <Row label="Citizenship">
              {valueOrToken(props, "citizenship")}
            </Row>
          </div>

          <SectionHeader>Subject Property</SectionHeader>
          <div className="border">
            <Row label="Street, City, State, Zip">
              {valueOrToken(props, "street_city_state_zip")}
            </Row>
            <Row label="Property Type">
              {valueOrToken(props, "property_type")}
            </Row>
            <Row label="No. Units">
              {valueOrToken(props, "prop_units")}
            </Row>
            <Row label="Rehab only (if purchased)">
              {valueOrToken(props, "is_purchased_rehab_only")}
            </Row>
            <Row label="Occupancy">
              {valueOrToken(props, "occupancy")}
            </Row>
          </div>

          <SectionHeader>Loan Structure</SectionHeader>
          <div className="border">
            <Row label="Transaction Type">
              {valueOrToken(props, "transaction_type")}
            </Row>
            <Row label="Loan Structure">
              {valueOrToken(props, "loan_structure")}
            </Row>
            <Row label="IO Period">
              {valueOrToken(props, "io_period")}
            </Row>
            <Row label="Interest Rate">
              {valueOrToken(props, "interest_rate")}
            </Row>
            <Row label="Prepay">
              {valueOrToken(props, "prepay")}
            </Row>
            <Row label="Leverage LTV">
              {valueOrToken(props, "leverage_ltv")}
            </Row>
            <Row label="Loan Amount">
              {valueOrToken(props, "loan_amount")}
            </Row>
          </div>

          <SectionHeader>Lender Fees</SectionHeader>
          <div className="border">
            <Row label="Origination">
              {valueOrToken(props, "origination")}
            </Row>
            <Row label="Rate Buy Down">
              {valueOrToken(props, "rate_buydown")}
            </Row>
            <Row label="Underwriting">
              {valueOrToken(props, "underwriting")}
            </Row>
            <Row label="Doc Prep">
              {valueOrToken(props, "doc_prep")}
            </Row>
            <Row label="Lender Legal">
              {valueOrToken(props, "lender_legal")}
            </Row>
          </div>

          <SectionHeader>Liquidity Requirement</SectionHeader>
          <div className="border">
            <Row label="Liquidity Required">
              {valueOrToken(props, "liquidity_required")}
            </Row>
            <Row label="Reserves Label">
              {valueOrToken(props, "reserves_label")}
            </Row>
            <Row label="Reserves Months">
              {valueOrToken(props, "reserves_months")}
            </Row>
            <Row label="Reserves Amount">
              {valueOrToken(props, "reserves_amount")}
            </Row>
          </div>

          <SectionHeader>Debt Service (DSCR)</SectionHeader>
          <div className="border">
            <Row label="DSCR">{valueOrToken(props, "dscr")}</Row>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="text-[12px] font-semibold mb-1">
            Closing Statement Estimate
          </div>
          <div className="h-[1px] bg-black mb-2" />

          <div className="grid grid-cols-1 gap-3">
            <div>
              <SectionHeader>CREDITS</SectionHeader>
              <div className="border">
                <Row label="Loan Proceeds">
                  {valueOrToken(props, "loan_proceeds")}
                </Row>
                <Row label="Cash Out @ Closing">
                  {valueOrToken(props, "cash_out_at_closing")}
                </Row>
                <Row label="TOTAL SOURCES">
                  {valueOrToken(props, "total_sources")}
                </Row>
              </div>
            </div>

            <div>
              <SectionHeader>DEBITS</SectionHeader>
              <div className="border">
                <Row label={String(valueOrToken(props, "purchaseprice_payoff_label"))}>
                  {valueOrToken(props, "purchaseprice_payoff")}
                </Row>
                <Row label="Lender Fee - Origination">
                  {valueOrToken(props, "lender_fee_origination")}
                </Row>
                <Row label="Lender Fee - Underwriting">
                  {valueOrToken(props, "lender_fee_underwriting")}
                </Row>
                <Row label="Lender Fee - Doc Prep">
                  {valueOrToken(props, "lender_fee_doc_prep")}
                </Row>
                <Row label="Lender Fee - Legal">
                  {valueOrToken(props, "lender_fee_legal")}
                </Row>
                <Row label={String(valueOrToken(props, "escrow_reserves_label"))}>
                  {valueOrToken(props, "escrow_reserves")}
                </Row>
                <Row label="HOI Premium">
                  {valueOrToken(props, "hoi_premium")}
                </Row>
                <Row label="Flood Premium">
                  {valueOrToken(props, "flood_premium")}
                </Row>
                <Row label="Prepaid Interest">
                  {valueOrToken(props, "prepay_interest")}
                </Row>
                <Row label="Title Insurance & Recording Fees">
                  {valueOrToken(props, "title_fee")}
                </Row>
                <Row label={String(valueOrToken(props, "cash_out_to_borrower_label"))}>
                  {valueOrToken(props, "cash_out_to_borrower")}
                </Row>
                <Row label="TOTAL USES">
                  {valueOrToken(props, "total_uses")}
                </Row>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 border p-2 text-[9px] leading-snug text-black/70">
        Pricing of initial rate is indicative and subject to a pricing at Lender&apos;s discretion based on factors that may
        include, but are not limited to: history, liquidity, credit, experience, income, and property characteristics.
        Terms are subject to final underwriting and market conditions and may change without notice. Any loan approval is
        subject to satisfactory appraisal, clear title, and other standard due diligence items. This term sheet is for
        discussion purposes only and does not constitute a commitment to lend. All values referenced herein are non‑contractual
        placeholders.
      </div>
    </div>
  )
}


