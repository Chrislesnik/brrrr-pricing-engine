import React from "react"
import { Card, CardContent } from "@/components/ui/card"

export type BridgeTermSheetProps = Record<string, string | number | null | undefined>

function asText(props: BridgeTermSheetProps, ...keys: string[]) {
  for (const k of keys) {
    const v = props[k]
    if (v !== undefined && v !== null && String(v) !== "") return String(v)
  }
  return `{{ ${keys[0]} }}`
}

const BridgeTermSheet = (props: BridgeTermSheetProps): React.ReactElement => {
  const subjectPropertyData = [
    { label: "Street", value: asText(props, "street") },
    { label: "City, State Zip", value: asText(props, "city_state_zip") },
    { label: "Type", value: asText(props, "property_type") },
    { label: "Units", value: asText(props, "number_of_units") },
  ]

  const borrowerGuarantorData = [
    { label: "Borrower Type", value: asText(props, "borrower_type") },
    { label: "Borrower", value: asText(props, "borrower_name") },
    { label: "Guarantor(s)", value: asText(props, "guarantor_name") },
    { label: "FICO", value: asText(props, "fico_score") },
    { label: "Experience Tier", value: asText(props, "experience_tier") },
    { label: "Citizenship", value: asText(props, "citizenship") },
  ]

  const loanStructureData = [
    { label: "Loan Type", value: asText(props, "loan_type") },
    { label: "Term", value: asText(props, "term") },
    { label: "Term - Extension Included", value: asText(props, "term_extension_included") },
    { label: "Amortization", value: asText(props, "amortization") },
    { label: "Pre Pay Penalty", value: asText(props, "ppp") },
    { label: "Minimum Payments Due", value: asText(props, "minimum_payments_due") },
    { label: "Transaction Type", value: asText(props, "transaction_type") },
    { label: "Interest Rate", value: asText(props, "interest_rate") },
    { label: "Loan Amount - Total", value: asText(props, "loan_amount_total") },
    { label: "Rehab Holdback", value: asText(props, "rehab_holdback") },
    { label: "Loan Amount - Initial", value: asText(props, "loan_amount_initial") },
  ]

  const monthlyPaymentData = [
    { label: "Monthly Payment - Initial", value: asText(props, "monthly_payment_initial") },
    { label: "Monthly Payment - Fully Funded", value: asText(props, "monthly_payment_fully_funded") },
  ]

  const liquidityRequirementData = [
    { label: "Liquidity Requirement", value: asText(props, "liquidity_requirement") },
    { label: "Cash to Close", value: asText(props, "cash_to_close") },
    { label: "Down Payment", value: asText(props, "down_payment") },
    { label: "Closing Costs", value: asText(props, "closing_costs") },
    { label: asText(props, "reserves_monthly_label"), value: asText(props, "reserves_months") },
    { label: asText(props, "reserves_budget_label"), value: asText(props, "reserves_budget") },
  ]

  const creditsData = [
    { label: "Loan Proceeds - Lender", value: asText(props, "loan_proceeds") },
    { label: "Cash Due @ Closing - Borrower", value: asText(props, "cash_due_at_closing") },
  ]

  const debitsData = [
    { label: asText(props, "purchaseprice_payoff_label"), value: asText(props, "purchaseprice_payoff") },
    { label: "Title Charges (est)", value: asText(props, "title_fee") },
    { label: "Lender Fee - Rate Discount", value: asText(props, "lender_rbd_fee") },
    { label: "Lender Fee - Origination", value: asText(props, "lender_origination_fee") },
    { label: "Broker Fee - Origination", value: asText(props, "broker_origination_fee") },
    { label: "Lender Fee - Misc", value: asText(props, "lender_misc_fee") },
    { label: "Lender Fee - Diligence & Legal", value: asText(props, "lender_diligence_legal_fee") },
    { label: "Lender Fee - Draw Management", value: asText(props, "lender_draw_management_fee") },
    { label: "Lender Fee - Admin", value: asText(props, "lender_admin_fee") },
    { label: "Lender Fee - Extension Fee", value: asText(props, "lender_extension_fee") },
    { label: "Lender Construction Holdback", value: asText(props, "lender_construction_holdback") },
    { label: asText(props, "per_diem_label"), value: asText(props, "per_diem") },
    { label: "HOI Premium - Balance Due", value: asText(props, "hoi_premium") },
    { label: asText(props, "buyer_credit_seller_concession_label"), value: asText(props, "buyer_credit_seller_concession") },
    { label: asText(props, "buyer_credit_emd_label"), value: asText(props, "buyer_credit_emd") },
    { label: asText(props, "cash_out_to_borrower_label"), value: asText(props, "cash_out_to_borrower") },
  ]
  // Split debits around the buyer credit rows to allow inserting blank spacing before them
  const debitsBeforeSpacer = debitsData.slice(0, debitsData.length - 3)
  const debitsAfterSpacer = debitsData.slice(debitsData.length - 3)

  // Render a block of empty rows to visually pad the table while preserving alignment
  function EmptyRows({ count, prefix }: { count: number; prefix: string }) {
    return (
      <>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={`${prefix}-${idx}`}
            className="flex justify-between text-[11px] font-medium leading-[18px]"
          >
            <span>&nbsp;</span>
            <span className="text-right">&nbsp;</span>
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="overflow-x-hidden w-full min-w-[816px] min-h-[1056px] flex bg-white text-black">
      {/* Reduce page padding to 'zoom out' slightly */}
      <div className="w-[816px] max-w-none mx-auto p-3 relative print:p-2">
        {/* Option number bracketed by solid black rules */}
        <div className="mb-3">
          <div className="h-[2px] bg-black" />
          {/* Tighten vertical padding around option number */}
          <div className="text-center text-lg font-bold italic text-black my-1">
            {asText(props, "option_number")}
          </div>
          <div className="h-[2px] bg-black" />
        </div>

        {/* Dotted box with tighter padding */}
        <Card className="border-2 border-dashed border-black mb-4">
          <CardContent className="p-3">
            <h1 className="text-center text-lg font-semibold text-black mb-1">PRELIMINARY TERM SHEET</h1>
            <p className="text-center text-[11px] font-medium text-black">
              Terms &amp; Conditions Displayed as of {asText(props, "date")} @ {asText(props, "time")}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <section className="border-2 border-solid border-black">
            {/* Make header bar a bit shorter */}
            <header className="bg-black text-white py-1.5 px-2">
              <h2 className="text-[15px] font-bold text-center leading-tight">LOAN DETAILS</h2>
            </header>
            <div className="p-2">
              <h3 className="text-[13px] font-bold italic text-black mb-1">Subject Property</h3>
              <div className="mb-3">
                {subjectPropertyData.map((item, index) => (
                  <div key={index} className="flex justify-between text-[11px] font-medium leading-[16px]">
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-[13px] font-bold italic text-black mb-1">Borrower &amp; Guarantor(s)</h3>
              <div className="mb-3">
                {borrowerGuarantorData.map((item, index) => (
                  <div key={index} className="flex justify-between text-[11px] font-medium leading-[16px]">
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-[13px] font-bold italic text-black mb-1">Loan Structure I</h3>
              <div className="mb-3">
                {loanStructureData.map((item, index) => (
                  <div key={index} className="flex justify-between text-[11px] font-medium leading-[16px]">
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-[13px] font-bold italic text-black mb-1">Monthly Payment</h3>
              <div className="mb-3">
                {monthlyPaymentData.map((item, index) => (
                  <div key={index} className="flex justify-between text-[11px] font-medium leading-[16px]">
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-[13px] font-bold italic text-black mb-1">Liquidity Requirement</h3>
              <div>
                {liquidityRequirementData.map((item, index) => (
                  <div key={index} className="flex justify-between text-[11px] font-medium leading-[16px]">
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right column border stops after TOTAL USES since content ends there */}
          <section className="border-2 border-solid border-black">
            <header className="bg-black text-white py-1 px-2">
              <h2 className="text-[15px] font-bold text-center leading-tight">CLOSING STATEMENT ESTIMATE</h2>
            </header>
            <div className="p-3 flex flex-col">
              <div className="flex-1">
                {/* CREDITS header height smaller */}
                <div className="bg-black text-white py-1 px-4 mb-2 mx-[-12px]">
                  <h3 className="text-[15px] font-bold italic leading-tight">CREDITS</h3>
              </div>
                <div className="mb-3">
                {creditsData.map((item, index) => (
                  <div key={index} className="flex justify-between text-[11px] font-medium leading-[18px]">
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>

                {/* TOTAL SOURCES height smaller */}
                <div className="bg-[#808080] border-2 border-solid border-black text-white py-1 px-4 mb-2 mx-[-12px]">
                <div className="flex justify-between items-center">
                  <h3 className="text-[15px] font-bold italic">TOTAL SOURCES</h3>
                  <span className="text-[15px] font-medium">{asText(props, "total_sources")}</span>
                </div>
              </div>

                {/* DEBITS header height smaller */}
                <div className="bg-black text-white py-1 px-4 mb-2 mx-[-12px]">
                  <h3 className="text-[15px] font-bold italic leading-tight">DEBITS</h3>
              </div>
                <div className="">
                  {debitsBeforeSpacer.map((item, index) => (
                  <div key={index} className="flex justify-between text-[11px] font-medium leading-[18px]">
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
                  {/* Add a few empty rows under HOI Premium - Balance Due for alignment */}
                  <EmptyRows count={3} prefix="spacer-under-hoi" />
                  {/* Show the first buyer credit row, then add more empty rows before the remaining rows */}
                  {debitsAfterSpacer.length > 0 && (
                    <div className="flex justify-between text-[11px] font-medium leading-[18px] pt-48">
                      <span>{debitsAfterSpacer[0].label}</span>
                      <span className="text-right">{debitsAfterSpacer[0].value}</span>
                    </div>
                  )}
                  {/* Additional small spacer between buyer credit (seller concession) and the remaining items */}
                  <EmptyRows count={2} prefix="spacer-between-buyer-credit" />
                  {debitsAfterSpacer.slice(1).map((item, index) => (
                    <div key={`tail-${index}`} className="flex justify-between text-[11px] font-medium leading-[18px]">
                      <span>{item.label}</span>
                      <span className="text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTAL USES anchored to bottom, no extra spacer lines */}
              <div className="bg-[#808080] border-2 border-solid border-black text-white py-1 px-4 mx-[-12px] mt-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-[15px] font-bold italic">TOTAL USES</h3>
                  <span className="text-[15px] font-medium">{asText(props, "total_uses")}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
        {/* Disclaimer under left column only (outside left border) */}
        <div className="mt-2 w-1/2 text-left text-[6px] font-medium text-black leading-[8px]">
          <p>
            *Pricing of initial rate is indicative and subject to re-pricing at Lender&apos;s discretion based on factors
            that may include, but are not limited to, prevailing market conditions and underwriting/diligence review.
            Factors that may affect your rate include but are not limited to your credit history/score, Loan-to-Value
            ratios, borrower&apos;s liquidity, and asset characteristics. Rates, terms and conditions offered apply only to
            qualified borrowers in accordance with our guidelines at the time of application. Property factors and
            geographic limitations are subject to change at any time without notice. Stated rates and Loan-to-Value ratios
            are only available to qualified applicants. This is a non-binding expression of interest and does not create
            any legally binding commitment or obligation on the part of Lender. This expression of interest is subject to
            our internal credit, legal and investment approval process. Lender is in the business of exclusively
            originating, funding, and selling business purpose loans secured by non-owner occupied real estate. All loans
            referenced herein are non-consumer loans.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BridgeTermSheet


