import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import ContentSection from "../components/content-section"
import { AppearanceForm } from "./appearance-form"

export default async function SettingsAppearancePage() {
  const { orgRole } = await auth()
  
  // Only org owners can access appearance settings
  const isOwner = orgRole === "org:owner" || orgRole === "owner"
  if (!isOwner) {
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
