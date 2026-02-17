import { Webhook } from "svix"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

function getHeader(req: NextRequest, name: string): string | undefined {
  return req.headers.get(name) ?? undefined
}

export async function POST(req: NextRequest) {
  const svixId = getHeader(req, "svix-id")
  const svixTimestamp = getHeader(req, "svix-timestamp")
  const svixSignature = getHeader(req, "svix-signature")
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 })
  }

  const payload = await req.text()
  const secret =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET ??
    process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error("Missing CLERK_WEBHOOK_SIGNING_SECRET env var")
    return new Response("Webhook secret not configured", { status: 500 })
  }
  const wh = new Webhook(secret)

  let evt: unknown
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  if (typeof evt !== "object" || evt === null) {
    return new Response("Invalid event payload", { status: 400 })
  }
  const { type, data } = evt as {
    type?: string
    data?: Record<string, unknown>
  }

  switch (type) {
    case "organization.created":
    case "organization.updated": {
      const org = data ?? {}
      const { error } = await supabaseAdmin
        .from("organizations")
        .upsert(
          {
            clerk_organization_id: org.id as string,
            name: (org.name as string) ?? null,
            slug: (org.slug as string) ?? null,
          },
          { onConflict: "clerk_organization_id" }
        )
      if (error) return new Response(error.message, { status: 500 })
      break
    }
    case "organization.deleted": {
      const orgId = (data as { id?: string } | undefined)?.id
      if (!orgId) {
        return new Response("Missing organization id", { status: 400 })
      }
      const { error } = await supabaseAdmin
        .from("organizations")
        .delete()
        .eq("clerk_organization_id", orgId as string)
      if (error) return new Response(error.message, { status: 500 })
      break
    }
    case "organizationMembership.created":
    case "organizationMembership.updated": {
      type ClerkMembershipPayload = {
        id?: string
        user_id?: string
        public_user_data?: {
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          identifier?: string
        }
        organization_id?: string
        organization?: { id?: string }
        role?: string
        public_metadata?: { org_member_role?: string | null }
      }
      const m = (data ?? {}) as ClerkMembershipPayload
      const userId = m.user_id ?? m.public_user_data?.user_id ?? ""
      const organizationId = m.organization_id ?? m.organization?.id ?? ""
      const role = (m.role ?? "member").replace(/^org:/, "")
      let memberRole =
        typeof m.public_metadata?.org_member_role === "string"
          ? m.public_metadata?.org_member_role
          : role
      const firstName = (m.public_user_data?.first_name ?? "") || null
      const lastName = (m.public_user_data?.last_name ?? "") || null
      const memberEmail = m.public_user_data?.identifier ?? ""

      // Resolve Supabase org UUID by Clerk organization id
      const { data: orgRow, error: orgErr } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("clerk_organization_id", organizationId)
        .single()
      if (orgErr) return new Response(orgErr.message, { status: 500 })
      const orgUuid = orgRow?.id as string | undefined
      if (!orgUuid) {
        return new Response("Organization not found for membership", { status: 400 })
      }

      // Check for a pending invite role (set when the invitation was sent)
      if (type === "organizationMembership.created" && memberEmail) {
        const { data: pendingRow } = await supabaseAdmin
          .from("pending_invite_roles")
          .select("clerk_member_role")
          .eq("organization_id", orgUuid)
          .ilike("email", memberEmail)
          .single()

        if (pendingRow?.clerk_member_role) {
          memberRole = pendingRow.clerk_member_role as string
          // Clean up the pending record
          await supabaseAdmin
            .from("pending_invite_roles")
            .delete()
            .eq("organization_id", orgUuid)
            .ilike("email", memberEmail)
        }
      }

      // Upsert on the composite unique key (organization_id, user_id).
      const upsertPayload = {
        organization_id: orgUuid,
        user_id: userId,
        clerk_org_role: role,
        clerk_member_role: memberRole,
        first_name: firstName,
        last_name: lastName,
      }
      const { error } = await supabaseAdmin
        .from("organization_members")
        .upsert(upsertPayload, { onConflict: "organization_id,user_id" })
      if (error) return new Response(error.message, { status: 500 })
      break
    }
    case "user.updated":
    case "user.created": {
      const u = (data ?? {}) as { id?: string; first_name?: string | null; last_name?: string | null }
      const userId = u.id as string | undefined
      if (!userId) break
      const { error } = await supabaseAdmin
        .from("organization_members")
        .update({
          first_name: (u.first_name ?? "") || null,
          last_name: (u.last_name ?? "") || null,
        })
        .eq("user_id", userId)
      if (error) return new Response(error.message, { status: 500 })
      break
    }
    case "organizationMembership.deleted": {
      type ClerkMembershipDeletePayload = {
        user_id?: string
        public_user_data?: { user_id?: string }
        organization_id?: string
        organization?: { id?: string }
      }
      const m = (data ?? {}) as ClerkMembershipDeletePayload
      const delUserId = m.user_id ?? m.public_user_data?.user_id ?? ""
      const delClerkOrgId = m.organization_id ?? m.organization?.id ?? ""
      if (!delUserId || !delClerkOrgId) {
        return new Response("Missing user_id or organization_id for membership delete", { status: 400 })
      }
      // Resolve Supabase org UUID
      const { data: delOrgRow } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("clerk_organization_id", delClerkOrgId)
        .single()
      if (delOrgRow?.id) {
        const { error } = await supabaseAdmin
          .from("organization_members")
          .delete()
          .eq("organization_id", delOrgRow.id as string)
          .eq("user_id", delUserId)
        if (error) return new Response(error.message, { status: 500 })
      }
      break
    }
    default:
      break
  }

  return Response.json({ ok: true })
}


