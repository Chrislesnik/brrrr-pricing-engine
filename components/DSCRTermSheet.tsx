import React from "react";

const DscrTermSheet = () => {
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
            *Pricing of initial rate is indicative and subject to re-pricing at Lender&#39;s discretion based on factors that may include, but are not limited to, prevailing market conditions and underwriting/diligence review. Factors that may affect your rate include but are not limited to your credit history/ score, Loan-to-Value ratios, borrower&#39;s liquidity, and asset characteristics. Rates, terms and conditions offered apply only to qualified borrowers in accordance with our guidelines at the time of application. Property factors and geographic limitations are subject to change at any time without notice. Stated rates and Loan-to-Value ratios are only available to qualified applicants. This is a non-binding expression of interest and does not create any legally binding commitment or obligation. In turn, this expression of interest is subject to our internal credit, legal and investment approval process. Lender is in the business of exclusively originating, funding, and selling business purpose loans secured by non-owner occupied real estate. All loans referenced herein are non-consumer loans.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DscrTermSheet;
