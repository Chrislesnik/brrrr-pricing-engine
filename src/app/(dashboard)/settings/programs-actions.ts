"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getOrgUuidFromClerkId } from "@/lib/orgs"

export async function addProgramAction(formData: FormData) {
  const { userId, orgId: authOrgId } = await auth()
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

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) {
    return { ok: false, error: "Unable to resolve organization. Try reloading and selecting an org." }
  }

  const { error } = await supabaseAdmin.from("programs").insert({
    loan_type: loanType,
    internal_name: internalName,
    external_name: externalName,
    webhook_url: webhookUrl || null,
    status,
    user_id: userId,
    organization_id: orgUuid,
  })
  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/settings")
  return { ok: true }
}

export async function updateProgramAction(formData: FormData) {
  const { userId, orgId: authOrgId } = await auth()
  const formOrgId = String(formData.get("orgId") || "") || null
  const orgId = formOrgId || authOrgId || null
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }
  if (!orgId) {
    return { ok: false, error: "No active organization. Select or create one first." }
  }

  const id = String(formData.get("id") || "").trim()
  const loanType = String(formData.get("loanType") || "").toLowerCase() as "dscr" | "bridge"
  const status = String(formData.get("status") || "active").toLowerCase() as "active" | "inactive"
  const internalName = String(formData.get("internalName") || "").trim()
  const externalName = String(formData.get("externalName") || "").trim()
  const webhookUrl = String(formData.get("webhookUrl") || "").trim()

  if (!id) {
    return { ok: false, error: "Missing id" }
  }
  if (!loanType || !internalName || !externalName) {
    return { ok: false, error: "Missing required fields" }
  }

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) {
    return { ok: false, error: "Unable to resolve organization. Try reloading and selecting an org." }
  }

  const { error } = await supabaseAdmin
    .from("programs")
    .update({
      loan_type: loanType,
      internal_name: internalName,
      external_name: externalName,
      webhook_url: webhookUrl || null,
      status,
    })
    .eq("id", id)
    .eq("organization_id", orgUuid)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/settings")
  return { ok: true }
}

export async function deleteProgramAction(formData: FormData) {
  const { userId, orgId: authOrgId } = await auth()
  const formOrgId = String(formData.get("orgId") || "") || null
  const orgId = formOrgId || authOrgId || null
  if (!userId) {
    return { ok: false, error: "Unauthorized" }
  }
  if (!orgId) {
    return { ok: false, error: "No active organization. Select or create one first." }
  }
  const id = String(formData.get("id") || "").trim()
  if (!id) {
    return { ok: false, error: "Missing id" }
  }

  const orgUuid = await getOrgUuidFromClerkId(orgId)
  if (!orgUuid) {
    return { ok: false, error: "Unable to resolve organization. Try reloading and selecting an org." }
  }

  const { error } = await supabaseAdmin.from("programs").delete().eq("id", id).eq("organization_id", orgUuid)
  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/settings")
  return { ok: true }
}

