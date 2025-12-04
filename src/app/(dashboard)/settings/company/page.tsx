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
  let allowWhiteLabeling = false
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
        const { data, error } = await supabaseAdmin
          .from("brokers")
          .select("id, company_name, company_logo_url, allow_white_labeling")
          .eq("organization_id", orgUuid)
          .eq("organization_member_id", memberId)
          .maybeSingle()
        initialName = (data?.company_name as string) || undefined
        initialLogoUrl = (data?.company_logo_url as string) || undefined
        allowWhiteLabeling = (data as any)?.allow_white_labeling === true
        // Fallback: if column does not exist or null, try custom_broker_settings
        if (!allowWhiteLabeling && (error || (data && (data as any).allow_white_labeling === undefined))) {
          const brokerId = (data as any)?.id as string | undefined
          if (brokerId) {
            const { data: custom } = await supabaseAdmin
              .from("custom_broker_settings")
              .select("allow_white_labeling")
              .eq("organization_id", orgUuid)
              .eq("broker_id", brokerId)
              .maybeSingle()
            allowWhiteLabeling = (custom as any)?.allow_white_labeling === true
          }
        }
      }
    }
  }
  return <CompanyForm initialName={initialName} initialLogoUrl={initialLogoUrl} allowWhiteLabeling={allowWhiteLabeling} />
}


