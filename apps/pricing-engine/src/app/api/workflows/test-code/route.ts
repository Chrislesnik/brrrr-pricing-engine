import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

/**
 * POST /api/workflows/test-code
 * Executes user JavaScript code in the Code node sandbox for testing.
 * Body: { code: string, mode: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { code, mode } = body as { code?: string; mode?: string }

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }

    // Import the step function dynamically (server-only)
    const { codeStep } = await import(
      "@/components/workflow-builder/lib/steps/code"
    )

    const result = await codeStep({
      code,
      mode: (mode as "runOnceAllItems" | "runOnceEachItem") || "runOnceAllItems",
      _nodeOutputs: {},
    })

    return NextResponse.json({
      items: result.items,
      logs: result.logs,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
