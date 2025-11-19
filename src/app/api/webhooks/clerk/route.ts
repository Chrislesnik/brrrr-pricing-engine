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
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string)

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
      const org = data
      const { error } = await supabaseAdmin
        .from("organizations")
        .delete()
        .eq("clerk_organization_id", org.id as string)
      if (error) return new Response(error.message, { status: 500 })
      break
    }
    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const m = data ?? {}
      const userId = (m.user_id as string) ?? (m.public_user_data?.user_id as string)
      const organizationId = (m.organization_id as string) ?? (m.organization?.id as string)
      const role = (m.role as string) ?? "member"
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
      const { error } = await supabaseAdmin.from("organization_members").upsert(
        {
          id: m.id as string,
          organization_id: orgUuid,
          user_id: userId,
          role,
        },
        { onConflict: "id" }
      )
      if (error) return new Response(error.message, { status: 500 })
      break
    }
    case "organizationMembership.deleted": {
      const m = data ?? {}
      const { error } = await supabaseAdmin.from("organization_members").delete().eq("id", m.id as string)
      if (error) return new Response(error.message, { status: 500 })
      break
    }
    default:
      break
  }

  return Response.json({ ok: true })
}


