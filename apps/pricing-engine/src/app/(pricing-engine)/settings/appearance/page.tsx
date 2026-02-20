import { notFound } from "next/navigation"
import ContentSection from "../components/content-section"
import { AppearanceForm } from "./appearance-form"
import { checkPolicyAccess } from "@/lib/orgs"

export default async function SettingsAppearancePage() {
  const canEdit = await checkPolicyAccess("table", "organization_themes", "update").catch(() => false)
  if (!canEdit) {
    notFound()
  }

  return (
    <ContentSection 
      title="Appearance" 
      desc="Customize the theme colors for your organization."
      className="w-full lg:max-w-full"
    >
      <AppearanceForm />
    </ContentSection>
  )
}
