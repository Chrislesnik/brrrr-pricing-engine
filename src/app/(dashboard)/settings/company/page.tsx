import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import CompanyForm from "./company-form"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export default async function SettingsCompanyPage() {
  const { orgRole, orgId, userId } = await auth()
  const isBroker = orgRole === "org:broker" || orgRole === "broker"
  if (!isBroker) {
    notFound()
  }
  // Prefetch existing company branding for this broker (if present)
  let initialName: string | undefined
  let initialLogoUrl: string | undefined
  if (orgId && userId) {
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (orgUuid) {
      const { data: member } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .maybeSingle()
      const memberId = (member?.id as string) ?? null
      if (memberId) {
        const { data } = await supabaseAdmin
          .from("brokers")
          .select("company_name, company_logo_url")
          .eq("organization_id", orgUuid)
          .eq("organization_member_id", memberId)
          .maybeSingle()
        initialName = (data?.company_name as string) || undefined
        initialLogoUrl = (data?.company_logo_url as string) || undefined
      }
    }
  }
  return <CompanyForm initialName={initialName} initialLogoUrl={initialLogoUrl} />
}


