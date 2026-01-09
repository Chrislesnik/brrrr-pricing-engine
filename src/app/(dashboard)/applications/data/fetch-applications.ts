import { supabaseAdmin } from "@/lib/supabase-admin"

export type ApplicationRow = {
  id: string
  propertyAddress: string | null
  borrower: string | null
  guarantors: string[] | null
  status: string | null
  updatedAt: string | null
}

export async function getApplicationsForOrg(orgUuid: string): Promise<ApplicationRow[]> {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select(
      "loan_id, organization_id, property_street, property_city, property_state, property_zip, borrower_name, guarantor_names, status, updated_at"
    )
    .eq("organization_id", orgUuid)
    .order("updated_at", { ascending: false })

  if (error) {
    // eslint-disable-next-line no-console
    console.error("getApplicationsForOrg error", error.message)
    return []
  }
  const rows = (data ?? []) as any[]
  return rows.map((r) => {
    const stateZip = [r.property_state, r.property_zip].filter((p: string) => (p ?? "").toString().trim().length > 0).join(" ")
    const addrParts = [r.property_street, r.property_city, stateZip].filter(
      (p: string) => (p ?? "").toString().trim().length > 0
    )
    const address = addrParts.length ? addrParts.join(", ") : null
    return {
      id: String(r.loan_id),
      propertyAddress: address,
      borrower: (r.borrower_name as string) ?? null,
      guarantors: Array.isArray(r.guarantor_names) ? (r.guarantor_names as string[]) : [],
      status: (r.status as string) ?? null,
      updatedAt: (r.updated_at as string) ?? null,
    } as ApplicationRow
  })
}





