import React from "react";

// Minimal props shape for preview/typing; accepts any placeholder tokens
export type DSCRTermSheetProps = Record<string, string | number | null | undefined>;

// Helper to render prop value or the merge tag when missing
const asText = (props: DSCRTermSheetProps, ...keys: string[]) => {
  for (const k of keys) {
    const v = props[k];
    if (v !== undefined && v !== null && String(v) !== "") return String(v);
  }
  // fall back to the primary key as a merge tag
  return `{{ ${keys[0]} }}`;
};

const DscrTermSheet = (props: DSCRTermSheetProps) => {
  const borrowerGuarantorsData = [
    { label: "Borrower", value: asText(props, "borrower_name") },
    { label: "Guarantor(s)", value: asText(props, "guarantor_name") },
    { label: "FICO", value: asText(props, "fico_score") },
    { label: "Experience", value: asText(props, "experience") },
    { label: "Citizenship", value: asText(props, "citizenship") },
  ];

  const subjectPropertyData = [
    { label: "Street", value: asText(props, "street") },
    { label: "City, State, Zip", value: asText(props, "city_state_zip") },
    { label: "Property Type", value: asText(props, "property_type") },
    { label: "Sq Footage", value: asText(props, "sq_footage") },
    { label: "Date Purchased (refi only)", value: asText(props, "date_purchased") },
  ];

  const loanStructureData = [
    { label: "Transaction Type", value: asText(props, "transaction_type") },
    { label: "Loan Structure", value: asText(props, "loan_structure") },
    { label: "IO Period", value: asText(props, "io_period") },
    { label: "Pre-Pay Penalty", value: asText(props, "ppp") },
    { label: "Interest Rates", value: asText(props, "interest_rate") },
    { label: "Leverage (LTV)", value: asText(props, "leverage") },
    { label: "Loan Amount", value: asText(props, "loan_amount") },
  ];

  const lenderFeesData = [
    { label: "Origination", value: asText(props, "origination") },
    { label: "Rate Buy Down", value: asText(props, "rate_buydown", "lender_fee_rbd", "lender_fee_rate_buy_down") },
    { label: "Underwriting", value: asText(props, "underwriting_fee") },
    { label: "Legal & Doc Prep", value: asText(props, "legal_fee") },
  ];

  const liquidityRequirementData = [
    { label: "Liquidity Requirement", value: asText(props, "liquidity_required") },
    { label: "Cash to Close", value: asText(props, "cash_to_close") },
    { label: asText(props, "downpayment_payoff_label"), value: asText(props, "downpayment_payoff_payment") },
    { label: "Escrows", value: asText(props, "escrows") },
    { label: asText(props, "reserves_label"), value: asText(props, "reserves") },
    { label: "Mortgage Debt - 100%", value: asText(props, "mortgage_debt") },
    { label: "Cash Out", value: asText(props, "cash_out") },
  ];

  const creditsData = [
    { label: "Loan Proceeds", value: asText(props, "loan_proceeds") },
    { label: "Cash Due @ Closing", value: asText(props, "cash_due_at_closing") },
  ];

  const debitsData = [
    { label: asText(props, "purchaseprice_payoff_label"), value: asText(props, "purchaseprice_payoff") },
    { label: "Lender Fee - Origination", value: asText(props, "lender_fee_origination") },
    { label: "Broker Fee - Origination", value: asText(props, "broker_fee_origination") },
    { label: "Lender Fee - Rate Buy Down", value: asText(props, "lender_fee_rbd", "lender_fee_rate_buy_down", "rate_buydown") },
    { label: "Lender Fee - Diligence & Legal", value: asText(props, "lender_fee_legal") },
    { label: asText(props, "hoi_escrow_label"), value: asText(props, "hoi_escrow") },
    { label: asText(props, "flood_escrow_label"), value: asText(props, "flood_escrow") },
    { label: asText(props, "tax_escrow_label"), value: asText(props, "tax_escrow") },
    { label: asText(props, "pitia_escrow_label"), value: asText(props, "pitia_escrow") },
    { label: "HOI Premium - Balance Due", value: asText(props, "hoi_premium") },
    { label: "Flood Insurance Premium", value: asText(props, "flood_premium") },
    { label: asText(props, "per_diem_label"), value: asText(props, "per_diem") },
    { label: "Title Insurance & Recording Fees", value: asText(props, "title_fee") },
  ];

  return (
    <div className="flex justify-center w-full min-h-screen bg-white px-7 pt-6 pb-1">
      <div className="w-full max-w-[816px]">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Preliminary Term Sheet</h1>
          <p className="text-orange-500 font-semibold">{asText(props, "program")}</p>
        </header>

        <div className="grid grid-cols-2 gap-8 items-stretch">
          <section className="flex flex-col">
            <div className="mb-5">
              <h2 className="text-base font-bold mb-3 underline">Loan Summary</h2>

              <div className="mb-3">
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

      <div className="mb-3">
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

              <div className="mb-3">
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

              <div className="mb-3">
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

          <section className="flex flex-col h-full">
            <div className="mb-5">
              <h2 className="text-base font-bold mb-3 underline">Closing Statement Estimate</h2>

              {/* Credits container with tighter spacing and thicker border */}
              <div className="border-2 border-black mb-2">
                <div className="bg-black text-white px-2 py-1">
                  <h3 className="text-sm font-bold italic">CREDITS</h3>
                </div>
                <div className="space-y-1 px-2">
                  {creditsData.map((item, index) => (
                    <div key={`credits-${index}`} className="flex justify-between text-xs">
                      <span className="pl-2">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-100 px-2 py-0.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>TOTAL SOURCES</span>
                    <span>{"{{ total_sources }}"}</span>
                  </div>
                </div>
              </div>

              {/* Debits container with thicker border; minimal inner padding */}
              <div className="border-2 border-black flex flex-col flex-1">
                <div className="bg-black text-white px-2 py-1">
                  <h3 className="text-sm font-bold italic">DEBITS</h3>
                </div>
                <div className="space-y-1 px-2">
                  {debitsData.map((item, index) => (
                    <div key={`debits-${index}`} className="flex justify-between text-xs">
                      <span className="pl-2">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="pl-2">{"{{ cash_out_to_borrower_label }}"}</span>
                  <span>{"{{ cash_out_to_borrower }}"}</span>
                </div>
                {/* Keep TOTAL USES locked to column bottom for alignment with DSCR baseline */}
                <div className="bg-gray-100 px-2 py-0.5 mt-auto">
                  <div className="flex justify-between text-xs font-bold">
                    <span>TOTAL USES</span>
                    <span>{"{{ total_uses }}"}</span>
              </div>
            </div>
              </div>
            </div>
          </section>
      </div>

        <footer className="mt-1">
          <p className="text-[8px] leading-tight">
            *Pricing of initial rate is indicative and subject to re-pricing at Lender&#39;s discretion based on factors that may include, but are not limited to, prevailing market conditions and underwriting/diligence review. Factors that may affect your rate include but are not limited to your credit history/ score, Loan-to-Value ratios, borrower&#39;s liquidity, and asset characteristics. Rates, terms and conditions offered apply only to qualified borrowers in accordance with our guidelines at the time of application. Property factors and geographic limitations are subject to change at any time without notice. Stated rates and Loan-to-Value ratios are only available to qualified applicants. This is a non-binding expression of interest and does not create any legally binding commitment or obligation. In turn, this expression of interest is subject to our internal credit, legal and investment approval process. Lender is in the business of exclusively originating, funding, and selling business purpose loans secured by non-owner occupied real estate. All loans referenced herein are non-consumer loans.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DscrTermSheet;
