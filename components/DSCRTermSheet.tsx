import React from "react";

// Minimal props shape for preview/typing; accepts any placeholder tokens
export type DSCRTermSheetProps = Record<string, string | number | null | undefined>;

// Helper to render the visible value or fallback token
const asText = (props: DSCRTermSheetProps, ...keys: string[]) => {
  for (const k of keys) {
    const v = props[k];
    if (v !== undefined && v !== null && String(v) !== "") return String(v);
  }
  return `{{ ${keys[0]} }}`;
};

const BAR_LINE_HEIGHT = 24; // px for h-6

const DscrSheet = (props: DSCRTermSheetProps) => {
  const borrowerGuarantors = [
    { label: "Borrower", value: asText(props, "buyer_name") },
    { label: "Guarantor(s)", value: asText(props, "guarantor_name") },
    { label: "FICO", value: asText(props, "fico_score") },
    { label: "Experience", value: asText(props, "experience") },
    { label: "Citizenship", value: asText(props, "citizenship") },
  ];

  const subjectProperty = [
    { label: "Street", value: asText(props, "street") },
    { label: "City, State, Zip", value: asText(props, "city_state") },
    { label: "Property Type", value: asText(props, "property_type") },
    { label: "Sq Footage", value: asText(props, "sq_footage") },
    { label: "Date Purchased (refi only)", value: asText(props, "date_purchased") },
  ];

  const loanStructure = [
    { label: "Transaction Type", value: asText(props, "transaction_type") },
    { label: "Loan Structure", value: asText(props, "loan_structure") },
    { label: "IO Period", value: asText(props, "io_period") },
    { label: "Pre-Pay Penalty", value: asText(props, "ppp") },
    { label: "Interest Rates", value: asText(props, "interest_rate") },
    { label: "Leverage (LTV)", value: asText(props, "leverage") },
    { label: "Loan Amount", value: asText(props, "loan_amount") },
  ];

  const lenderFees = [
    { label: "Origination", value: asText(props, "origination") },
    { label: "Rate Buy Down", value: asText(props, "rate_buydown", "lender_fee_rbd", "lender_fee_rate_buy_down") },
    { label: "Underwriting", value: asText(props, "underwriting_fee") },
    { label: "Legal & Doc Prep", value: asText(props, "legal_fee") },
  ];

  const liquidity = [
    { label: "Liquidity Requirement", value: asText(props, "liquidity_required") },
    { label: "Cash to Close", value: asText(props, "cash_to_close") },
    { label: asText(props, "downpayment_payoff_label"), value: asText(props, "downpayment_payoff") },
    { label: "Escrows", value: asText(props, "escrows") },
    { label: asText(props, "reserves_label"), value: asText(props, "reserves") },
    { label: "Mortgage Debt - 100%", value: asText(props, "mortgage_debt") },
    { label: "Cash Out", value: asText(props, "cash_out") },
  ];

  const credits = [
    { label: "Loan Proceeds", value: asText(props, "loan_proceeds") },
    { label: "Cash Due @ Closing", value: asText(props, "cash_due_at_closing") },
  ];

  const debits = [
    { label: asText(props, "purchaseprice_payoff"), value: asText(props, "purchaseprice_payoff") },
    { label: "Lender Fee - Origination", value: asText(props, "lender_fee_origination") },
    { label: "Broker Fee - Origination", value: asText(props, "broker_fee_origination") },
    { label: "Lender Fee - Rate Buy Down", value: asText(props, "lender_fee_rbd", "lender_fee_rate_buy_down", "rate_buydown") },
    { label: "Lender Fee - Diligence & Legal", value: asText(props, "lender_fee_legal") },
    { label: "HOI Escrow - 3 mo @ $116.67 per month", value: "$350.00" },
    { label: "Flood Ins Escrow - 3 mo @ $0.00 per month", value: "$0.00" },
    { label: "Tax Escrow - 3 mo @ $122.42 per month", value: "$3,667.25" },
    { label: "Reserves - 0 mo PITIA @ $2720.43 per month", value: "$0.00" },
    { label: "HOI Premium - Balance Due", value: asText(props, "hoi_premium") },
    { label: "Flood Insurance Premium", value: asText(props, "flood_premium") },
    { label: "Daily Interest from 12/29/2025 to 1/1/2026 @", value: "$122.92 per day" },
    { label: "Title Insurance & Recording Fees", value: asText(props, "title_fee") },
  ];

  return (
    <div
      data-termsheet-root
      className="flex justify-center w-full min-h-screen print:px-0 print:pt-0 print:pb-0 print:min-h-0"
      style={{ backgroundColor: "#ffffff", color: "#000000", boxSizing: "border-box" }}
    >
      <div className="w-[816px] max-w-none print:w-[816px] px-7" style={{ boxSizing: "border-box", outline: "4px solid #f59e0b", outlineOffset: "0px" }}>
        <header className="mt-2 mb-5">
          <h1 className="text-2xl font-bold mb-1">Preliminary Term Sheet</h1>
          <div className="flex items-center">
            <p className="font-semibold" style={{ color: "#f97316" }}>{asText(props, "program")}</p>
          </div>
        </header>

        <div className="flex gap-8 items-stretch">
          <section className="flex flex-col flex-1">
            <div className="mb-5">
              <h2 className="text-base font-bold mb-3 underline">Loan Summary</h2>

              <div className="mb-3">
                <h3 className="text-sm font-bold italic mb-2">Borrower &amp; Guarantors</h3>
                <div className="space-y-1">
                  {borrowerGuarantors.map((it, i) => (
                    <div key={`bor-${i}`} className="flex items-center justify-between text-xs">
                      <span className="pl-4">{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-sm font-bold italic mb-2">Subject Property</h3>
                <div className="space-y-1">
                  {subjectProperty.map((it, i) => (
                    <div key={`subj-${i}`} className="flex items-center justify-between text-xs">
                      <span className="pl-4">{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-sm font-bold italic mb-2">Loan Structure</h3>
                <div className="space-y-1">
                  {loanStructure.map((it, i) => (
                    <div key={`ls-${i}`} className=" flex items-center justify-between text-xs">
                      <span className="pl-4">{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-sm font-bold italic mb-2">Lender Fees</h3>
                <div className="space-y-1">
                  {lenderFees.map((it, i) => (
                    <div key={`lf-${i}`} className="flex items-center justify-between text-xs">
                      <span className="pl-4">{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-sm font-bold mb-2 italic">Liquidity Requirement</h3>
                <div className="space-y-1">
                  {liquidity.map((it, i) => (
                    <div key={`liq-${i}`} className="flex items-center justify-between text-xs">
                      <span className="pl-2">{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="-mt-2">
              <h3 className="text-sm font-bold italic mb-1">Debt Service (DSCR)</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="pl-4">DSCR</span>
                <span>{asText(props, "dscr")}</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col h-full flex-1">
            <div className="flex flex-col flex-1">
              <h2 className="text-base font-bold mb-3 underline">Closing Statement Estimate</h2>

              <div className="border-2 border-black mb-2">
                <div className="px-2 h-6" style={{ backgroundColor: "#000000", color: "#ffffff", display: "grid", alignItems: "center" }}>
                  <h3 className="text-sm font-bold italic m-0 ts-bar-label" style={{ paddingLeft: 8, textAlign: "left" }}>CREDITS</h3>
                </div>
                <div className="space-y-1 px-2 pt-1">
                  {credits.map((it, i) => (
                    <div key={`cr-${i}`} className="flex items-center justify-between text-xs leading-5">
                      <span className="pl-2">{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-2 h-6 flex items-center" style={{ backgroundColor: "#f3f4f6" }}>
                  <div className="flex items-center justify-between w-full text-xs font-bold h-full" style={{ lineHeight: `${BAR_LINE_HEIGHT}px` }}>
                    <span>TOTAL SOURCES</span>
                    <span>{asText(props, "total_sources")}</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-black flex flex-col flex-1">
                <div className="px-2 h-6" style={{ backgroundColor: "#000000", color: "#ffffff", display: "grid", alignItems: "center" }}>
                  <h3 className="text-sm font-bold italic m-0 ts-bar-label" style={{ paddingLeft: 8, textAlign: "left" }}>DEBITS</h3>
                </div>
                <div className="space-y-1 px-2 pt-1 pb-1">
                  {debits.map((it, i) => (
                    <div key={`db-${i}`} className="flex items-center justify-between text-xs leading-5">
                      <span className="pl-2">{it.label}</span>
                      <span>{it.value}</span>
                    </div>
                  ))}
                </div>
                {/* New EMD row above Cash Out */}
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="pl-2">{asText(props, "emd_label")}</span>
                  <span>{asText(props, "emd")}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="pl-2">{asText(props, "cash_out_to_borrower_label")}</span>
                  <span>{asText(props, "cash_out_borrower")}</span>
                </div>
                <div className="px-2 h-6 mt-auto flex items-center" style={{ backgroundColor: "#f3f4f6" }}>
                  <div className="flex items-center justify-between w-full text-xs font-bold h-full" style={{ lineHeight: `${BAR_LINE_HEIGHT}px` }}>
                    <span className="pl-2">TOTAL USES</span>
                    <span>{asText(props, "total_uses")}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-6">
          <div className="text-[6px] ts-disclaimer" style={{ lineHeight: "6px", margin: 0, padding: 0, paddingTop: "10px", whiteSpace: "normal", letterSpacing: 0, wordSpacing: 0, wordBreak: "break-word" }}>
            * Pricing of initial rate is indicative and subject to re-pricing at Lender's discretion based on factors that may include, but are not limited to, prevailing market conditions and underwriting/diligence review. Factors that may affect your rate include, but are not limited to, your credit history/ score, Loan-to-Value ratios, borrower’s liquidity, and asset characteristics. Rates, terms and conditions offered apply only to qualified borrowers in accordance with our guidelines at the time of application. Property factors and geographic limitations are subject to change at any time, without notice. Stated rates and Loan-to-Value ratios are only available to qualified applicants. This is a non-binding expression of interest and does not create any legally binding commitment or obligation. In turn, this expression is subject to our internal credit, legal, and investment approval processes. Lender is in the business of exclusively originating, funding and selling business purpose loans secured by non-owner occupied real estate. All loans referenced herein are non-consumer loans.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DscrSheet;
