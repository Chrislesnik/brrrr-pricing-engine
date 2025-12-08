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
        let brokerId = (data as any)?.id as string | undefined
        // Resolve allow_white_labeling from both sources:
        // - Prefer TRUE if present on brokers
        // - OR with custom_broker_settings for the same broker/org
        let brokersFlag = (data as any)?.allow_white_labeling === true
        // Fallback: if member-specific broker row not found, use org broker
        if (!data) {
          const { data: anyBroker } = await supabaseAdmin
            .from("brokers")
            .select("id, company_name, company_logo_url, allow_white_labeling")
            .eq("organization_id", orgUuid)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle()
          if (anyBroker) {
            initialName = (anyBroker?.company_name as string) || initialName
            initialLogoUrl = (anyBroker?.company_logo_url as string) || initialLogoUrl
            brokersFlag = (anyBroker as any)?.allow_white_labeling === true
            brokerId = (anyBroker?.id as string) ?? brokerId
          }
        }
        let customFlag = false
        if (brokerId) {
          const { data: custom } = await supabaseAdmin
            .from("custom_broker_settings")
            .select("allow_white_labeling")
            .eq("organization_id", orgUuid)
            .eq("broker_id", brokerId)
            .maybeSingle()
          customFlag = (custom as any)?.allow_white_labeling === true
        }
        // Also try organization-level custom row if broker-specific not present
        if (!customFlag) {
          const { data: orgCustom } = await supabaseAdmin
            .from("custom_broker_settings")
            .select("allow_white_labeling")
            .eq("organization_id", orgUuid)
            .is("broker_id", null)
            .maybeSingle()
          customFlag = (orgCustom as any)?.allow_white_labeling === true || customFlag
        }
        // If either source enables white labeling, expose the logo input
        allowWhiteLabeling = brokersFlag || customFlag || (!!error && customFlag)
      }
    }
  }
  return <CompanyForm initialName={initialName} initialLogoUrl={initialLogoUrl} allowWhiteLabeling={allowWhiteLabeling} />
}


