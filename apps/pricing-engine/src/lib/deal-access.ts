import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getDealAccess(userId: string) {
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("users")
    .select("id, is_internal_yn")
    .eq("clerk_user_id", userId)
    .maybeSingle()

  if (userErr) {
    throw new Error(userErr.message)
  }

  if (!userRow) {
    return { isInternal: false, allowedDealIds: new Set<string>() }
  }

  const isInternal = Boolean(userRow.is_internal_yn)
  if (isInternal) {
    return { isInternal, allowedDealIds: new Set<string>() }
  }

  const userNumericId = userRow.id as number

  const [directRes, docRes, orgRes] = await Promise.all([
    supabaseAdmin.from("deal_roles").select("deal_id").eq("users_id", userNumericId),
    supabaseAdmin
      .from("document_files_clerk_users")
      .select("document_file_id")
      .eq("clerk_user_id", userNumericId),
    supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId),
  ])

  if (directRes.error) throw new Error(directRes.error.message)
  if (docRes.error) throw new Error(docRes.error.message)
  if (orgRes.error) throw new Error(orgRes.error.message)

  const directDealIds = (directRes.data ?? [])
    .map((row) => row.deal_id)
    .filter(Boolean) as string[]

  const documentFileIds = (docRes.data ?? [])
    .map((row) => row.document_file_id)
    .filter(Boolean) as number[]

  let docDealIds: string[] = []
  if (documentFileIds.length > 0) {
    const { data: ddpRows, error: ddpErr } = await supabaseAdmin
      .from("document_files_deals")
      .select("deal_id")
      .in("document_file_id", documentFileIds)
    if (ddpErr) throw new Error(ddpErr.message)
    docDealIds = (ddpRows ?? [])
      .map((row) => row.deal_id)
      .filter(Boolean) as string[]
  }

  const orgIds = (orgRes.data ?? [])
    .map((row) => row.organization_id)
    .filter(Boolean) as string[]

  let orgDealIds: string[] = []
  if (orgIds.length > 0) {
    const { data: orgDeals, error: orgDealsErr } = await supabaseAdmin
      .from("deal_clerk_orgs")
      .select("deal_id")
      .in("clerk_org_id", orgIds)
    if (orgDealsErr) throw new Error(orgDealsErr.message)
    orgDealIds = (orgDeals ?? [])
      .map((row) => row.deal_id)
      .filter(Boolean) as string[]
  }

  const allowedDealIds = new Set([
    ...directDealIds,
    ...docDealIds,
    ...orgDealIds,
  ])

  return { isInternal, allowedDealIds }
}
