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
  const deleteIdsRaw = String(formData.get("deleteDocumentIds") || "[]")
  let deleteDocumentIds: string[] = []
  try {
    deleteDocumentIds = JSON.parse(deleteIdsRaw) || []
  } catch {
    deleteDocumentIds = []
  }
  const files = formData.getAll("files") as File[]

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

  // Handle deletions
  if (deleteDocumentIds.length > 0) {
    const { data: docsToDelete, error: fetchErr } = await supabaseAdmin
      .from("program_documents")
      .select("id, storage_path")
      .in("id", deleteDocumentIds)
      .eq("program_id", id)
    if (fetchErr) {
      return { ok: false, error: fetchErr.message }
    }
    if (docsToDelete && docsToDelete.length > 0) {
      const paths = docsToDelete.map((d) => d.storage_path)
      if (paths.length > 0) {
        await supabaseAdmin.storage.from("program-docs").remove(paths)
      }
      const { error: delErr } = await supabaseAdmin.from("program_documents").delete().in("id", deleteDocumentIds)
      if (delErr) {
        return { ok: false, error: delErr.message }
      }
    }
  }

  // Handle uploads
  if (files.length > 0) {
    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== "function") continue
      const documentId = (globalThis.crypto?.randomUUID?.() as string) || require("crypto").randomUUID()
      const fileName = (file as any).name || "file"
      const storagePath = `programs/${id}/${documentId}/${fileName}`
      const arrayBuffer = await file.arrayBuffer()
      const { error: upErr } = await supabaseAdmin.storage.from("program-docs").upload(storagePath, Buffer.from(arrayBuffer), {
        upsert: false,
        contentType: (file as any).type || undefined,
      })
      if (upErr) {
        return { ok: false, error: upErr.message }
      }
      const { error: insErr } = await supabaseAdmin.from("program_documents").insert({
        id: documentId,
        program_id: id,
        storage_path: storagePath,
        title: fileName,
        mime_type: (file as any).type || null,
        status: "pending",
      })
      if (insErr) {
        return { ok: false, error: insErr.message }
      }

      // Optional: kick off webhook for indexing if a URL exists
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ document_id: documentId, program_id: id, storage_path: storagePath }),
          })
        } catch {
          // Non-fatal: leave status 'pending' if webhook fails
        }
      }
    }
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

