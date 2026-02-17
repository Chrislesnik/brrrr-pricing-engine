import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { checkPolicyAccess } from "@/lib/orgs"

/**
 * POST /api/policy/check
 *
 * Lightweight endpoint for client-side policy checks.
 * Accepts an array of { resourceType, resourceName, action } queries
 * and returns { results: Record<string, boolean> } where keys are
 * "resourceType:resourceName:action".
 *
 * Body: { checks: Array<{ resourceType, resourceName, action }> }
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId } = await auth()
    if (!orgId) {
      return NextResponse.json({ results: {} })
    }

    const body = (await req.json()) as {
      checks?: Array<{
        resourceType: string
        resourceName: string
        action: string
      }>
    }

    if (!body.checks?.length) {
      return NextResponse.json({ results: {} })
    }

    const results: Record<string, boolean> = {}

    await Promise.all(
      body.checks.map(async (check) => {
        const key = `${check.resourceType}:${check.resourceName}:${check.action}`
        try {
          results[key] = await checkPolicyAccess(
            check.resourceType,
            check.resourceName,
            check.action,
          )
        } catch {
          results[key] = false
        }
      }),
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Policy check error:", error)
    return NextResponse.json({ results: {} })
  }
}
