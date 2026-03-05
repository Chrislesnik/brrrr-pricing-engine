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

      // ── Role precedence (matches sync-members.ts resolveMemberRole) ──
      // 1. pending_invite_roles  (highest — set when invite was sent)
      // 2. existing DB value     (preserves manual edits)
      // 3. Clerk metadata        (org_member_role from publicMetadata)
      // 4. Clerk org role        (lowest — derived from membership.role)

      let pendingRole: string | null = null

      // Consume pending invite role (atomic DELETE … RETURNING)
      if (type === "organizationMembership.created" && memberEmail) {
        const { data: pendingRows } = await supabaseAdmin
          .from("pending_invite_roles")
          .delete()
          .eq("organization_id", orgUuid)
          .ilike("email", memberEmail)
          .select("clerk_member_role")

        if (pendingRows?.[0]?.clerk_member_role) {
          pendingRole = pendingRows[0].clerk_member_role as string
        }
      }

      // Fetch existing DB role so we don't overwrite manual edits
      let existingDbRole: string | null = null
      if (!pendingRole) {
        const { data: existingRow } = await supabaseAdmin
          .from("organization_members")
          .select("clerk_member_role")
          .eq("organization_id", orgUuid)
          .eq("user_id", userId)
          .single()

        existingDbRole = (existingRow?.clerk_member_role as string) ?? null
      }

      // Normalize metadata role (strip "org:" prefix if present)
      const clerkMetadataRole =
        typeof memberRole === "string" ? memberRole.replace(/^org:/, "") : null

      // Apply precedence
      const resolvedMemberRole =
        pendingRole ?? existingDbRole ?? clerkMetadataRole ?? role

      // Upsert on the composite unique key (organization_id, user_id).
      const upsertPayload = {
        organization_id: orgUuid,
        user_id: userId,
        clerk_org_role: role,
        clerk_member_role: resolvedMemberRole,
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
      type ClerkEmailAddress = {
        id?: string
        email_address?: string
        verification?: { status?: string }
      }
      type ClerkPhoneNumber = {
        id?: string
        phone_number?: string
      }
      type ClerkUserPayload = {
        id?: string
        first_name?: string | null
        last_name?: string | null
        email_addresses?: ClerkEmailAddress[]
        primary_email_address_id?: string
        phone_numbers?: ClerkPhoneNumber[]
        primary_phone_number_id?: string
        image_url?: string | null
        has_image?: boolean
        username?: string | null
        last_sign_in_at?: number | null
      }

      const u = (data ?? {}) as ClerkUserPayload
      const userId = u.id as string | undefined
      if (!userId) break

      const primaryEmail =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.email_address ?? null
      const primaryEmailVerified =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.verification?.status === "verified"
      const primaryPhone =
        u.phone_numbers?.find((p) => p.id === u.primary_phone_number_id)
          ?.phone_number ?? null

      const firstName = u.first_name ?? null
      const lastName = u.last_name ?? null
      const fullName =
        [firstName, lastName].filter(Boolean).join(" ") || null

      const userPayload = {
        clerk_user_id: userId,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: primaryEmail,
        email_verified: primaryEmailVerified,
        image_url: u.image_url ?? null,
        avatar_url: u.image_url ?? null,
        has_image: u.has_image ?? false,
        clerk_username: u.username ?? null,
        phone_number: primaryPhone,
        last_sign_in_at: u.last_sign_in_at
          ? new Date(u.last_sign_in_at).toISOString()
          : null,
      }

      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", userId)
        .maybeSingle()

      if (existingUser) {
        const { error: userErr } = await supabaseAdmin
          .from("users")
          .update(userPayload)
          .eq("id", existingUser.id)
        if (userErr) {
          console.error("[clerk-webhook] users update error:", userErr.message)
        }
      } else {
        const { error: userErr } = await supabaseAdmin
          .from("users")
          .insert({ ...userPayload, is_internal_yn: false })
        if (userErr) {
          console.error("[clerk-webhook] users insert error:", userErr.message)
        }
      }

      const { error } = await supabaseAdmin
        .from("organization_members")
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
        })
        .eq("user_id", userId)
      if (error) {
        console.error("[clerk-webhook] organization_members update error:", error.message)
      }
      break
    }
    case "user.deleted": {
      const deletedUserId = (data as { id?: string } | undefined)?.id
      if (!deletedUserId) break

      const { error: memDelErr } = await supabaseAdmin
        .from("organization_members")
        .delete()
        .eq("user_id", deletedUserId)
      if (memDelErr) {
        console.error("[clerk-webhook] org_members delete on user.deleted:", memDelErr.message)
      }

      const { error: userDelErr } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("clerk_user_id", deletedUserId)
      if (userDelErr) {
        console.error("[clerk-webhook] users delete error:", userDelErr.message)
      }
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


