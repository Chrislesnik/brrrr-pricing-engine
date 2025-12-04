import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import CompanyForm from "./company-form"

export default async function SettingsCompanyPage() {
  const { orgRole } = await auth()
  const isBroker = orgRole === "org:broker" || orgRole === "broker"
  if (!isBroker) {
    notFound()
  }
  return <CompanyForm />
}


