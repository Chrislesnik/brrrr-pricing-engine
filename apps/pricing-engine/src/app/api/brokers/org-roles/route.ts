import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

type ClerkRoleJSON = {
  id: string
  key: string
  name: string
  description: string
  is_creator_eligible: boolean
  created_at: number
  updated_at: number
}

type ClerkRolesResponse = {
  data: ClerkRoleJSON[]
  total_count: number
}

/**
 * GET /api/brokers/org-roles
 *
 * Fetches the list of organization roles configured in Clerk via the
 * REST API (GET /v1/organization_roles). Returns them as
 * { roles: [{ value: "org:admin", label: "Admin" }, ...] }
 */
export async function GET() {
  try {
    const { orgId } = await auth()
    if (!orgId) {
      return NextResponse.json({ roles: [] })
    }

    const secretKey = process.env.CLERK_SECRET_KEY
    if (!secretKey) {
      console.error("org-roles: CLERK_SECRET_KEY not set")
      return NextResponse.json({ roles: [] })
    }

    const res = await fetch(
      "https://api.clerk.com/v1/organization_roles?limit=50&order_by=-created_at",
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) {
      console.error(
        "org-roles: Clerk API error",
        res.status,
        await res.text()
      )
      return NextResponse.json({ roles: [] })
    }

    const body = (await res.json()) as ClerkRolesResponse
    const roles = (body.data ?? []).map((r) => ({
      value: r.key,
      label: r.name,
      description: r.description ?? "",
    }))

    return NextResponse.json({ roles })
  } catch (err) {
    console.error("org-roles API error:", err)
    return NextResponse.json({ roles: [] })
  }
}
