import { NextResponse } from "next/server"

/**
 * POST /api/grapesjs-token
 *
 * Generates a short-lived access token for the GrapesJS Chat Platform API.
 * Requires GRAPES_PLATFORM_API_KEY in environment variables.
 * See: https://app.grapesjs.com/docs-sdk/plugins/ai/ai-chat#chat-platform-api
 */
export async function POST() {
  const apiKey = process.env.GRAPES_PLATFORM_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GRAPES_PLATFORM_API_KEY not configured" },
      { status: 501 }
    )
  }

  const response = await fetch("https://app.grapesjs.com/platform-api/access-tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  const result = await response.json()

  if (!response.ok) {
    return NextResponse.json(
      { error: result.message || "Failed to generate token" },
      { status: response.status }
    )
  }

  return NextResponse.json(result)
}
