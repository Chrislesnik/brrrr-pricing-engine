import React from "react";

const DscrTermSheet = (): JSX.Element => {
  const borrowerGuarantorsData = [
    { label: "Borrower", value: "{{ borrower_name }}" },
    { label: "Guarantor(s)", value: "{{ guarantor_name }}" },
    { label: "FICO", value: "{{ fico_score }}" },
    { label: "Experience", value: "{{ experience }}" },
    { label: "Citizenship", value: "{{ citizenship }}" },
  ];

  const subjectPropertyData = [
    { label: "Street", value: "{{ street }}" },
    { label: "City, State, Zip", value: "{{ city_state_zip }}" },
    { label: "Property Type", value: "{{ property_type }}" },
    { label: "Sq Footage", value: "{{ sq_footage }}" },
    { label: "Date Purchased (refi only)", value: "{{ date_purchased }}" },
  ];

  const loanStructureData = [
    { label: "Transaction Type", value: "{{ transaction_type }}" },
    { label: "Loan Structure", value: "{{ loan_structure }}" },
    { label: "IO Period", value: "{{ io_period }}" },
    { label: "Pre-Pay Penalty", value: "{{ ppp }}" },
    { label: "Interest Rates", value: "{{ interest_rate }}" },
    { label: "Leverage (LTV)", value: "{{ leverage }}" },
    { label: "Loan Amount", value: "{{ loan_amount }}" },
  ];

  const lenderFeesData = [
    { label: "Origination", value: "{{ origination }}" },
    { label: "Rate Buy Down", value: "{{ rate_buydown }}" },
    { label: "Underwriting", value: "{{ underwriting_fee }}" },
    { label: "Legal & Doc Prep", value: "{{ legal_fee }}" },
  ];

  const liquidityRequirementData = [
    { label: "Liquidity Requirement", value: "{{ liquidity_required }}" },
    { label: "Cash to Close", value: "{{ cash_to_close }}" },
    { label: "{{ downpayment_payoff_label|wnpayment_payoff_payment }}", value: "" },
    { label: "Escrows", value: "{{ escrows }}" },
    { label: "{{ reserves_label }}", value: "{{ reserves }}" },
    { label: "Mortgage Debt - 100%", value: "{{ mortgage_debt }}" },
    { label: "Cash Out", value: "{{ cash_out }}" },
  ];

  const creditsData = [
    { label: "Loan Proceeds", value: "{{ loan_proceeds }}" },
    { label: "Cash Due @ Closing", value: "{{ cash_due_at_closing }}" },
  ];

  const debitsData = [
    { label: "{{ purchaseprice_payoff_label }}", value: "{{ purchaseprice_payoff }}" },
    { label: "Lender Fee - Origination", value: "{{ lender_fee_origination }}" },
    { label: "Broker Fee - Origination", value: "{{ broker_fee_origination }}" },
    { label: "Lender Fee - Rate Buy Down", value: "{{ lender_fee_legal }}" },
    { label: "Lender Fee - Diligence & Legal", value: "{{ hoi_escrow }}" },
    { label: "{{ hoi_escrow_label }}", value: "{{ flood_escrow }}" },
    { label: "{{ flood_escrow_label }}", value: "{{ tax_escrow }}" },
    { label: "{{ tax_escrow_label }}", value: "{{ pitia_escrow }}" },
    { label: "{{ pitia_escrow_label }}", value: "{{ hoi_premium }}" },
    { label: "HOI Premium - Balance Due", value: "{{ flood_premium }}" },
    { label: "Flood Insurance Premium", value: "{{ per_diem }}" },
    { label: "{{ per_diem_label }}", value: "{{ lawyer_fee }}" },
    { label: "Title Insurance & Recording Fees", value: "{{ title_fee }}" },
  ];

  return (
    <div className="flex justify-center w-full min-h-screen bg-white p-8">
      <div className="w-full max-w-[816px]">
        <header className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Preliminary Term Sheet</h1>
          <p className="text-orange-500 font-semibold">{"{{ program }}"}</p>
        </header>

        <div className="grid grid-cols-2 gap-8">
          <section>
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3 underline">Loan Summary</h2>

              <div className="mb-4">
                <h3 className="text-sm font-bold italic mb-2">Borrower & Guarantors</h3>
                <div className="space-y-1">
                  {borrowerGuarantorsData.map((item, index) => (
                    <div key={`borrower-${index}`} className="flex justify-between text-xs">
                      <span className="pl-4">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold italic mb-2">Subject Property</h3>
                <div className="space-y-1">
                  {subjectPropertyData.map((item, index) => (
                    <div key={`property-${index}`} className="flex justify-between text-xs">
                      <span className="pl-4">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold italic mb-2">Loan Structure</h3>
                <div className="space-y-1">
                  {loanStructureData.map((item, index) => (
                    <div key={`loan-${index}`} className="flex justify-between text-xs">
                      <span className="pl-4">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold italic mb-2">Lender Fees</h3>
                <div className="space-y-1">
                  {lenderFeesData.map((item, index) => (
                    <div key={`fees-${index}`} className="flex justify-between text-xs">
                      <span className="pl-4">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold italic mb-2">Liquidity Requirement</h3>
                <div className="space-y-1">
                  {liquidityRequirementData.map((item, index) => (
                    <div key={`liquidity-${index}`} className="flex justify-between text-xs">
                      <span className="pl-4">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold italic mb-2">Debt Service (DSCR)</h3>
                <div className="flex justify-between text-xs">
                  <span className="pl-4">DSCR</span>
                  <span>{"{{ dscr }}"}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3 underline">Closing Statement Estimate</h2>

              <div className="mb-4">
                <div className="bg-black text-white px-2 py-1 mb-2">
                  <h3 className="text-sm font-bold italic">CREDITS</h3>
                </div>
                <div className="space-y-1">
                  {creditsData.map((item, index) => (
                    <div key={`credits-${index}`} className="flex justify-between text-xs">
                      <span className="pl-2">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-100 px-2 py-1 mb-4">
                <div className="flex justify-between text-xs font-bold">
                  <span>TOTAL SOURCES</span>
                  <span>{"{{ total_sources }}"}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-black text-white px-2 py-1 mb-2">
                  <h3 className="text-sm font-bold italic">DEBITS</h3>
                </div>
                <div className="space-y-1">
                  {debitsData.map((item, index) => (
                    <div key={`debits-${index}`} className="flex justify-between text-xs">
                      <span className="pl-2">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="pl-2">{"{{ cash_out_to_borrower_label }}"}</span>
                  <span>{"{{ cash_out_to_borrower }}"}</span>
                </div>
              </div>

              <div className="bg-gray-100 px-2 py-1 border border-black">
                <div className="flex justify-between text-xs font-bold">
                  <span>TOTAL USES</span>
                  <span>{"{{ total_uses }}"}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-8">
          <p className="text-[8px] leading-tight">
            *Pricing of initial rate is indicative and subject to re-pricing at Lender's discretion based on factors that may include, but are not limited to, prevailing market conditions and underwriting/diligence review. Factors that may affect your rate include but are not limited to your credit history/ score, Loan-to-Value ratios, borrower's liquidity, and asset characteristics. Rates, terms and conditions offered apply only to qualified borrowers in accordance with our guidelines at the time of application. Property factors and geographic limitations are subject to change at any time without notice. Stated rates and Loan-to-Value ratios are only available to qualified applicants. This is a non-binding expression of interest and does not create any legally binding commitment or obligation. In turn, this expression of interest is subject to our internal credit, legal and investment approval process. Lender is in the business of exclusively originating, funding, and selling business purpose loans secured by non-owner occupied real estate. All loans referenced herein are non-consumer loans.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DscrTermSheet;
/* Legacy DSCRTermSheet implementation (commented out)
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

*/
