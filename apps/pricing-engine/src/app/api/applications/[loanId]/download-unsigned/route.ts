import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { PDFDocument } from "pdf-lib"

export const runtime = "nodejs"

const TEMPLATE_PATH = "BF - ALL - APPLY - Application - 2026-03-06.pdf"

/**
 * Maps AcroForm field names from the fillable PDF to merged_data keys.
 * Keys prefixed with _ are computed at runtime.
 */
const FIELD_MAP: Record<string, { dataKey: string; section: string }> = {
  // --- Setup / General ---
  "Setup_LeadSource":            { dataKey: "howDidYouHear", section: "loan" },
  "Setup_ReferralSource":        { dataKey: "referredBy", section: "loan" },
  "Setup_VestingType":           { dataKey: "loanClosedInNameOf", section: "loan" },
  "Setup_PG_Count":              { dataKey: "numberOfGuarantors", section: "loan" },

  // --- Guarantor 1 (PG1) ---
  "PG1_NameFull":                { dataKey: "_fullName0", section: "guarantor1" },
  "PG1_DOB":                     { dataKey: "dob0", section: "guarantor1" },
  "PG1_SSN":                     { dataKey: "_skip", section: "guarantor1" },
  "PG1_Email_es_:email":         { dataKey: "emailAddress0", section: "guarantor1" },
  "PG1_Phone_Primary":           { dataKey: "primaryPhone0", section: "guarantor1" },
  "PG1_Phone_Alt":               { dataKey: "altPhone0", section: "guarantor1" },
  "PG1_FICO_estimate":           { dataKey: "midFico0", section: "guarantor1" },
  "PG1_CitizenshipStatus":       { dataKey: "citizenship0", section: "guarantor1" },
  "PG1_GreenCard_YN":            { dataKey: "greenCard0", section: "guarantor1" },
  "PG1_Visa_YN":                 { dataKey: "visa0", section: "guarantor1" },
  "PG1_VIsa_Type":               { dataKey: "visaType0", section: "guarantor1" },
  "PG1_Exp_Rentals":             { dataKey: "rentalsOwned0", section: "guarantor1" },
  "PG1_Exp_Flips":               { dataKey: "fixFlipsSold0", section: "guarantor1" },
  "PG1_Exp_GUCs":                { dataKey: "groundUpsSold0", section: "guarantor1" },
  "PG1_Exp_Other_YN":            { dataKey: "realEstateActivities0", section: "guarantor1" },
  "PG1_AddressPR_L1":            { dataKey: "addressLine1_0", section: "guarantor1" },
  "PG1_AddressPR_L2":            { dataKey: "addressLine2_0", section: "guarantor1" },
  "PG1_AddressPR_City":          { dataKey: "city0", section: "guarantor1" },
  "PG1_AddressPR_State":         { dataKey: "state0", section: "guarantor1" },
  "PG1_AddressPR_Zip":           { dataKey: "zipCode0", section: "guarantor1" },
  "PG1_AddressPR_County":        { dataKey: "county0", section: "guarantor1" },

  // --- Guarantor 2 (PG2) ---
  "PG2_NameFull":                { dataKey: "_fullName1", section: "guarantor2" },
  "PG2_DOB":                     { dataKey: "dob1", section: "guarantor2" },
  "PG2_SSN":                     { dataKey: "_skip", section: "guarantor2" },
  "PG2_Email_es_:email":         { dataKey: "emailAddress1", section: "guarantor2" },
  "PG2_Phone_Primary":           { dataKey: "primaryPhone1", section: "guarantor2" },
  "PG2_FICO_estimate":           { dataKey: "midFico1", section: "guarantor2" },
  "PG2_CitizenshipStatus":       { dataKey: "citizenship1", section: "guarantor2" },
  "PG2_GreenCard_YN":            { dataKey: "greenCard1", section: "guarantor2" },
  "PG2_Visa_YN":                 { dataKey: "visa1", section: "guarantor2" },
  "PG2_VIsa_Type":               { dataKey: "visaType1", section: "guarantor2" },
  "PG2_Exp_Rentals":             { dataKey: "rentalsOwned1", section: "guarantor2" },
  "PG2_Exp_Flips":               { dataKey: "fixFlipsSold1", section: "guarantor2" },
  "PG2_Exp_GUCs":                { dataKey: "groundUpsSold1", section: "guarantor2" },
  "PG2_Exp_Other_YN":            { dataKey: "realEstateActivities1", section: "guarantor2" },
  "PG2_AddressPR_L1":            { dataKey: "addressLine1_1", section: "guarantor2" },
  "PG2_AddressPR_L2":            { dataKey: "addressLine2_1", section: "guarantor2" },
  "PG2_AddressPR_City":          { dataKey: "city1", section: "guarantor2" },
  "PG2_AddressPR_State":         { dataKey: "state1", section: "guarantor2" },
  "PG2_AddressPR_Zip":           { dataKey: "zipCode1", section: "guarantor2" },
  "PG2_AddressPR_County":        { dataKey: "county1", section: "guarantor2" },

  // --- Guarantor 3 (PG3) ---
  "PG3_NameFull":                { dataKey: "_fullName2", section: "guarantor3" },
  "PG3_DOB":                     { dataKey: "dob2", section: "guarantor3" },
  "PG3_SSN":                     { dataKey: "_skip", section: "guarantor3" },
  "PG3_Email_es_:email":         { dataKey: "emailAddress2", section: "guarantor3" },
  "PG3_Phone_Primary":           { dataKey: "primaryPhone2", section: "guarantor3" },
  "PG3_Phone_Alt":               { dataKey: "altPhone2", section: "guarantor3" },
  "PG3_FICO_estimate":           { dataKey: "midFico2", section: "guarantor3" },
  "PG3_CitizenshipStatus":       { dataKey: "citizenship2", section: "guarantor3" },
  "PG3_GreenCard_YN":            { dataKey: "greenCard2", section: "guarantor3" },
  "PG3_Visa_YN":                 { dataKey: "visa2", section: "guarantor3" },
  "PG3_VIsa_Type":               { dataKey: "visaType2", section: "guarantor3" },
  "PG3_Exp_Rentals":             { dataKey: "rentalsOwned2", section: "guarantor3" },
  "PG3_Exp_Flips":               { dataKey: "fixFlipsSold2", section: "guarantor3" },
  "PG3_Exp_GUCs":                { dataKey: "groundUpsSold2", section: "guarantor3" },
  "PG3_Exp_Other_YN":            { dataKey: "realEstateActivities2", section: "guarantor3" },
  "PG3_AddressPR_L1":            { dataKey: "addressLine1_2", section: "guarantor3" },
  "PG3_AddressPR_L2":            { dataKey: "addressLine2_2", section: "guarantor3" },
  "PG3_AddressPR_City":          { dataKey: "city2", section: "guarantor3" },
  "PG3_AddressPR_State":         { dataKey: "state2", section: "guarantor3" },
  "PG3_AddressPR_Zip":           { dataKey: "zipCode2", section: "guarantor3" },
  "PG3_AddressPR_County":        { dataKey: "county2", section: "guarantor3" },

  // --- Guarantor 4 (PG4) ---
  "PG4_NameFull":                { dataKey: "_fullName3", section: "guarantor4" },
  "PG4_DOB":                     { dataKey: "dob3", section: "guarantor4" },
  "PG4_SSN":                     { dataKey: "_skip", section: "guarantor4" },
  "PG4_Email_es_:email":         { dataKey: "emailAddress3", section: "guarantor4" },
  "PG4_Phone_Primary":           { dataKey: "primaryPhone3", section: "guarantor4" },
  "PG4_Phone_Alt":               { dataKey: "altPhone3", section: "guarantor4" },
  "PG4_FICO_estimate":           { dataKey: "midFico3", section: "guarantor4" },
  "PG4_CitizenshipStatus":       { dataKey: "citizenship3", section: "guarantor4" },
  "PG4_GreenCard_YN":            { dataKey: "greenCard3", section: "guarantor4" },
  "PG4_Visa_YN":                 { dataKey: "visa3", section: "guarantor4" },
  "PG4_VIsa_Type":               { dataKey: "visaType3", section: "guarantor4" },
  "PG4_Exp_Rentals":             { dataKey: "rentalsOwned3", section: "guarantor4" },
  "PG4_Exp_Flips":               { dataKey: "fixFlipsSold3", section: "guarantor4" },
  "PG4_Exp_GUCs":                { dataKey: "groundUpsSold3", section: "guarantor4" },
  "PG4_Exp_Other_YN":            { dataKey: "realEstateActivities3", section: "guarantor4" },
  "PG4_AddressPR_L1":            { dataKey: "addressLine1_3", section: "guarantor4" },
  "PG4_AddressPR_L2":            { dataKey: "addressLine2_3", section: "guarantor4" },
  "PG4_AddressPR_City":          { dataKey: "city3", section: "guarantor4" },
  "PG4_AddressPR_State":         { dataKey: "state3", section: "guarantor4" },
  "PG4_AddressPR_Zip":           { dataKey: "zipCode3", section: "guarantor4" },
  "PG4_AddressPR_County":        { dataKey: "county3", section: "guarantor4" },

  // --- Entity ---
  "E_Name":                      { dataKey: "legalBusinessName", section: "entity" },
  "E_Members":                   { dataKey: "_entityMembers", section: "entity" },
  "E_EIN":                       { dataKey: "ein", section: "entity" },
  "E_Type":                      { dataKey: "entityType", section: "entity" },
  "E_DOF_es_:date":              { dataKey: "dateFormed", section: "entity" },
  "E_SOF":                       { dataKey: "stateOfFormation", section: "entity" },
  "E_PPB_L1":                    { dataKey: "businessAddressLine1", section: "entity" },
  "E_PPB_L2":                    { dataKey: "businessAddressLine2", section: "entity" },
  "E_PPB_City":                  { dataKey: "businessCity", section: "entity" },
  "E_PPB_State":                 { dataKey: "businessState", section: "entity" },
  "E_PPB_Zip":                   { dataKey: "businessZipCode", section: "entity" },
  "E_PPB_County":                { dataKey: "businessCounty", section: "entity" },
  "E_Account_BN":                { dataKey: "bankOfBusinessAccount", section: "entity" },
  "E_Account_Balance":           { dataKey: "accountBalances", section: "entity" },

  // Entity Members (EM1-EM6)
  "E_M1_Name":                   { dataKey: "_em1Name", section: "entity" },
  "E_M1_Title":                  { dataKey: "_em1Title", section: "entity" },
  "E_M1_SSNEIN":                 { dataKey: "_skip", section: "entity" },
  "E_M1_Ownership":              { dataKey: "_em1Ownership", section: "entity" },
  "E_M1_PR":                     { dataKey: "_em1HomeAddress", section: "entity" },
  "E_M2_Name":                   { dataKey: "_em2Name", section: "entity" },
  "E_M2_Title":                  { dataKey: "_em2Title", section: "entity" },
  "E_M2_SSNEIN":                 { dataKey: "_skip", section: "entity" },
  "E_M2_Ownership":              { dataKey: "_em2Ownership", section: "entity" },
  "E_M2_PR":                     { dataKey: "_em2HomeAddress", section: "entity" },
  "E_M3_Name":                   { dataKey: "_em3Name", section: "entity" },
  "E_M3_Title":                  { dataKey: "_em3Title", section: "entity" },
  "E_M3_SSNEIN":                 { dataKey: "_skip", section: "entity" },
  "E_M3_Ownership":              { dataKey: "_em3Ownership", section: "entity" },
  "E_M3_PR":                     { dataKey: "_em3HomeAddress", section: "entity" },
  "E_M4_Name":                   { dataKey: "_em4Name", section: "entity" },
  "E_M4_Title":                  { dataKey: "_em4Title", section: "entity" },
  "E_M4_SSNEIN":                 { dataKey: "_skip", section: "entity" },
  "E_M4_Ownership":              { dataKey: "_em4Ownership", section: "entity" },
  "E_M4_PR":                     { dataKey: "_em4HomeAddress", section: "entity" },
  "E_M5_Name":                   { dataKey: "_em5Name", section: "entity" },
  "E_M5_Title":                  { dataKey: "_em5Title", section: "entity" },
  "E_M5_SSNEIN":                 { dataKey: "_skip", section: "entity" },
  "E_M5_Ownership":              { dataKey: "_em5Ownership", section: "entity" },
  "E_M5_PR":                     { dataKey: "_em5HomeAddress", section: "entity" },
  "E_M6_Name":                   { dataKey: "_em6Name", section: "entity" },
  "E_M6_Title":                  { dataKey: "_em6Title", section: "entity" },
  "E_M6_SSNEIN":                 { dataKey: "_skip", section: "entity" },
  "E_M6_Ownership":              { dataKey: "_em6Ownership", section: "entity" },
  "E_M6_PR":                     { dataKey: "_em6HomeAddress", section: "entity" },

  // --- Loan ---
  "LS_LoanType_1":               { dataKey: "loanType1", section: "loan" },
  "LS_LoanType_2":               { dataKey: "loanType2", section: "loan" },
  "LS_ProjectType":              { dataKey: "loanProjectType", section: "loan" },
  "LS_TransType":                { dataKey: "loanTransactionType", section: "loan" },
  "LS_LoanStructure":            { dataKey: "loanStructure", section: "loan" },
  "LS_LoanTerm":                 { dataKey: "loanTerm", section: "loan" },
  "LS_UPB_Total":                { dataKey: "loanTotalAmount", section: "loan" },
  "LS_UPB_Initial":              { dataKey: "loanInitialAmount", section: "loan" },
  "LS_Reno_Budget":              { dataKey: "loanConstructionBudget", section: "loan" },
  "LS_UPB_RenoHoldback":         { dataKey: "loanConstructionHoldback", section: "loan" },
  "LS_TargetCOE_es_:date":       { dataKey: "loanTargetClosingDate", section: "loan" },
  "LS_CashOutPurpose":           { dataKey: "loanCashOutPurpose", section: "loan" },
  "BCB_AcquisitionDate_es_:date": { dataKey: "refinanceAcquisitionDate", section: "loan" },
  "BCB_AcquisitionPrice":        { dataKey: "refinanceAcquisitionPrice", section: "loan" },
  "BCB_RenoCompleted":           { dataKey: "refinanceRehabCompleted", section: "loan" },
  "BCB_CostBasis":               { dataKey: "costBasis", section: "loan" },

  // --- Subject Property ---
  "SP_Address_L1":               { dataKey: "subjectPropertyAddress", section: "property" },
  "SP_Address_L2":               { dataKey: "subjectPropertyAddressLine2", section: "property" },
  "SP_Address_City":             { dataKey: "subjectPropertyCity", section: "property" },
  "SP_Address_State":            { dataKey: "subjectPropertyState", section: "property" },
  "SP_PurchasePrice":            { dataKey: "subjectPurchasePrice", section: "property" },
  "SP_AIV":                      { dataKey: "subjectAsIsValue", section: "property" },
  "SP_ARV":                      { dataKey: "subjectAfterRepairValue", section: "property" },
  "SP_Units":                    { dataKey: "subjectPropertyUnits", section: "property" },
  "SP_Type":                     { dataKey: "subjectPropertyType", section: "property" },
  "SP_CondoType":                { dataKey: "subjectCondominiumType", section: "property" },
  "SP_Occupancy":                { dataKey: "subjectOccupancy", section: "property" },
  "SP_STR_YN":                   { dataKey: "subjectShortTermRental", section: "property" },
  "SP_INC_GR_Monthly":           { dataKey: "subjectGrossRent", section: "property" },
  "SP_INC_FMR_Monthly":          { dataKey: "subjectMarketRent", section: "property" },
  "SP_Exp_Tax_Annual":           { dataKey: "subjectPropertyTax", section: "property" },
  "SP_Exp_InsHOI_Annual":        { dataKey: "subjectInsuranceHomeowners", section: "property" },
  "SP_Exp_InsF_Annual":          { dataKey: "subjectInsuranceFlood", section: "property" },
  "SP_Exp_Mgmt_Annual":          { dataKey: "subjectPropertyManagement", section: "property" },
  "SP_Exp_HOA_Annual":           { dataKey: "subjectHOA", section: "property" },
  "SP_HOA_Name":                 { dataKey: "hoaName", section: "property" },
  "SP_HOA_Contact_Name":         { dataKey: "hoaContactPerson", section: "property" },
  "SP_HOA_Contact_Phone":        { dataKey: "hoaContactPhone", section: "property" },
  "SP_HOA_Contact_Email":        { dataKey: "hoaContactEmail", section: "property" },
  "SP_HOA_Dues_Monthly":         { dataKey: "hoaDues", section: "property" },

  // --- Third Parties (loan section) ---
  "3P_Title_Company":            { dataKey: "titleCompany", section: "loan" },
  "3P_Title_Contact_Name":       { dataKey: "titleContactPerson", section: "loan" },
  "3P_Title_Contact_Phone":      { dataKey: "titlePhone", section: "loan" },
  "3P_Title_Contact_Email":      { dataKey: "titleEmail", section: "loan" },
  "3P_Insurance_Carrier":        { dataKey: "insuranceCarrier", section: "loan" },
  "3P_Insurance_Contact_Name":   { dataKey: "insuranceContactPerson", section: "loan" },
  "3P_Insurance_Contact_Phone":  { dataKey: "insurancePhone", section: "loan" },
  "3P_Insurance_Contact_Email":  { dataKey: "insuranceEmail", section: "loan" },
  "3P_ClosingAgent_Company":     { dataKey: "closingAgentCompany", section: "loan" },
  "3P_ClosingAgent_Contact_Name": { dataKey: "closingAgentContactPerson", section: "loan" },
  "3P_ClosingAgent_Contact_Phone": { dataKey: "closingAgentPhone", section: "loan" },
  "3P_ClosingAgent_Contact_Email": { dataKey: "closingAgentEmail", section: "loan" },
  "3P_AppraisalPOC_Name":        { dataKey: "appraisalPOC", section: "loan" },
  "3P_AppraisalPOC_Phone":       { dataKey: "appraisalPhone", section: "loan" },
  "3P_AppraisalPOC_Email":       { dataKey: "appraisalEmail", section: "loan" },
  "3P_AppraisalPOC_Company":     { dataKey: "appraisalCompany", section: "loan" },

  // --- Declarations (loan section) ---
  "Declaration_1_YN":            { dataKey: "felonyCharges", section: "loan" },
  "Declaration_2_YN":            { dataKey: "pendingLawsuits", section: "loan" },
  "Declaration_3_YN":            { dataKey: "bankruptcyProceedings", section: "loan" },
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ loanId: string }> },
) {
  try {
    const { userId, orgId: clerkOrgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!clerkOrgId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const orgUuid = await getOrgUuidFromClerkId(clerkOrgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "Organization mapping not found" }, { status: 400 })
    }

    const { loanId } = await params
    const body = await req.json().catch(() => ({})) as { sections?: string[] }
    const selectedSections = new Set(body.sections ?? [])

    const { data: app, error } = await supabaseAdmin
      .from("applications")
      .select(
        "loan_id, organization_id, display_id, " +
        "form_data, merged_data, entity_id, borrower_name, " +
        "guarantor_ids, guarantor_names, guarantor_emails, " +
        "property_street, property_city, property_state, property_zip",
      )
      .eq("loan_id", loanId)
      .eq("organization_id", orgUuid)
      .maybeSingle()

    if (error || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Download the fillable PDF template from Supabase Storage
    const { data: fileData, error: storageError } = await supabaseAdmin.storage
      .from("templates")
      .download(TEMPLATE_PATH)

    if (storageError || !fileData) {
      return NextResponse.json(
        { error: "PDF template not found in storage" },
        { status: 404 },
      )
    }

    const pdfBytes = new Uint8Array(await fileData.arrayBuffer())

    // Build data map from merged_data + form_data
    const merged = (app.merged_data ?? {}) as Record<string, unknown>
    const formData = (app.form_data ?? {}) as Record<string, unknown>
    const data: Record<string, unknown> = { ...formData, ...merged }

    // Compute derived full-name fields
    for (let i = 0; i < 4; i++) {
      const first = data[`firstName${i}`] ?? ""
      const last = data[`lastName${i}`] ?? ""
      data[`_fullName${i}`] = [first, last].filter(Boolean).join(" ")
    }

    // Entity members from entityOwners array
    const owners = Array.isArray(data.entityOwners)
      ? (data.entityOwners as Array<Record<string, unknown>>)
      : []
    data._entityMembers = owners.length > 0
      ? String(owners.length)
      : (data.members != null ? String(data.members) : "")

    for (let i = 0; i < 6; i++) {
      const o = owners[i]
      data[`_em${i + 1}Name`] = o?.name ?? ""
      data[`_em${i + 1}Title`] = o?.title ?? ""
      data[`_em${i + 1}Ownership`] = o?.ownershipPercent ? `${o.ownershipPercent}%` : ""
      data[`_em${i + 1}HomeAddress`] = o?.homeAddress ?? ""
    }

    // Load and fill the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form = pdfDoc.getForm()

    for (const [fieldName, mapping] of Object.entries(FIELD_MAP)) {
      if (mapping.dataKey === "_skip") continue
      if (!selectedSections.has(mapping.section)) continue

      const value = data[mapping.dataKey]
      if (value === undefined || value === null || value === "") continue
      const text = String(value)

      try {
        const textField = form.getTextField(fieldName)
        textField.setText(text)
      } catch {
        try {
          const dropdown = form.getDropdown(fieldName)
          const options = dropdown.getOptions()
          if (options.includes(text)) {
            dropdown.select(text)
          }
        } catch {
          // Field not found or type mismatch; skip
        }
      }
    }

    // Do NOT flatten -- keep fields editable for the user
    const filledBytes = await pdfDoc.save()

    const safeName = (app.display_id || `application-${loanId.slice(0, 8)}`)
      .replace(/[^a-zA-Z0-9_\-. ]/g, "")
      .trim()

    return new Response(filledBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(filledBytes.byteLength),
        "Content-Disposition": `attachment; filename="${safeName}-unsigned.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("Download unsigned error:", err)
    return NextResponse.json(
      { error: "Failed to generate unsigned document" },
      { status: 500 },
    )
  }
}
