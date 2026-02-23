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
      // 1) Resolve the exact organization_member row for this user within the active org
      const { data: member } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .maybeSingle()
      const memberId = (member?.id as string) ?? null
      if (!memberId) {
        return <CompanyForm />
      }
      // 2) Find THIS user's broker row inside the same organization to get its broker_id
      const { data: brokerRow } = await supabaseAdmin
        .from("brokers")
        .select("id, company_name, company_logo_url, allow_white_labeling")
        .eq("organization_id", orgUuid)
        .eq("organization_member_id", memberId)
        .maybeSingle()
      initialName = (brokerRow?.company_name as string) || undefined
      initialLogoUrl = (brokerRow?.company_logo_url as string) || undefined
      const brokerId = (brokerRow?.id as string) ?? null
      // 3) Gate white-label strictly by custom_broker_settings for this exact broker_id
      if (brokerId) {
        const { data: custom } = await supabaseAdmin
          .from("custom_broker_settings")
          .select("allow_white_labeling")
          .eq("organization_id", orgUuid)
          .eq("broker_org_id", brokerId)
          .maybeSingle()
        allowWhiteLabeling =
          (custom as any)?.allow_white_labeling === true ||
          ((brokerRow as any)?.allow_white_labeling === true)
        // 3b) If not enabled for this broker_id, fallback to any org-level custom that enables it
        if (!allowWhiteLabeling) {
          const { data: anyCustom } = await supabaseAdmin
            .from("custom_broker_settings")
            .select("allow_white_labeling")
            .eq("organization_id", orgUuid)
            .limit(1)
            .maybeSingle()
          allowWhiteLabeling = (anyCustom as any)?.allow_white_labeling === true || allowWhiteLabeling
        }
      } else {
        allowWhiteLabeling = (brokerRow as any)?.allow_white_labeling === true
        if (!allowWhiteLabeling) {
          const { data: anyCustom } = await supabaseAdmin
            .from("custom_broker_settings")
            .select("allow_white_labeling")
            .eq("organization_id", orgUuid)
            .limit(1)
            .maybeSingle()
          allowWhiteLabeling = (anyCustom as any)?.allow_white_labeling === true || allowWhiteLabeling
        }
      }
    }
  }
  return <CompanyForm initialName={initialName} initialLogoUrl={initialLogoUrl} allowWhiteLabeling={allowWhiteLabeling} />
}


