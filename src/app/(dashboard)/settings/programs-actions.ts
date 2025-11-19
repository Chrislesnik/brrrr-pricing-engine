"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function addProgramAction(formData: FormData) {
  const { userId, orgId: authOrgId } = auth()
  // Prefer orgId sent from the page (since middleware may not run for server actions),
  // and fall back to auth().orgId.
  const formOrgId = String(formData.get("orgId") || "") || null
  const orgId = formOrgId || authOrgId || null
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }
  if (!orgId) {
    return { ok: false, error: "No active organization. Select or create one first." }
  }

  const loanType = String(formData.get("loanType") || "").toLowerCase() as "dscr" | "bridge"
  const status = String(formData.get("status") || "active").toLowerCase() as "active" | "inactive"
  const internalName = String(formData.get("internalName") || "").trim()
  const externalName = String(formData.get("externalName") || "").trim()
  const webhookUrl = String(formData.get("webhookUrl") || "").trim()

  if (!loanType || !internalName || !externalName) {
    return { ok: false, error: "Missing required fields" }
  }

  const { error } = await supabaseAdmin.from("programs").insert({
    loan_type: loanType,
    internal_name: internalName,
    external_name: externalName,
    webhook_url: webhookUrl || null,
    status,
    user_id: userId,
    organization_id: orgId,
  })
  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/settings")
  return { ok: true }
}

