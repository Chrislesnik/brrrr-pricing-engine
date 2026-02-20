import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { supabaseAdmin } from "@/lib/supabase-admin"

type TestResult = { status: "success" | "error"; message: string }

/**
 * Test credentials for a specific integration type.
 * Makes a lightweight API call to verify the credentials work.
 */
async function testCredentialsForType(
  type: string,
  config: Record<string, unknown>
): Promise<TestResult> {
  try {
    switch (type) {
      case "perplexity": {
        const apiKey = config.apiKey as string
        if (!apiKey) return { status: "error", message: "API key is required" }
        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        })
        if (res.status === 401) return { status: "error", message: "Invalid API key" }
        if (!res.ok) {
          const body = await res.text().catch(() => "")
          return { status: "error", message: `Perplexity API error (${res.status}): ${body.slice(0, 200)}` }
        }
        return { status: "success", message: "Perplexity connection successful" }
      }

      case "slack": {
        const apiKey = config.apiKey as string
        if (!apiKey) return { status: "error", message: "Bot token is required" }
        const res = await fetch("https://slack.com/api/auth.test", {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        const data = await res.json().catch(() => ({}))
        if (!data.ok) return { status: "error", message: `Slack auth failed: ${data.error || "unknown"}` }
        return { status: "success", message: `Connected to Slack workspace: ${data.team || "unknown"}` }
      }

      case "resend": {
        const apiKey = config.apiKey as string
        if (!apiKey) return { status: "error", message: "API key is required" }
        const res = await fetch("https://api.resend.com/api-keys", {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (res.status === 401) return { status: "error", message: "Invalid API key" }
        if (!res.ok) return { status: "error", message: `Resend API error (${res.status})` }
        return { status: "success", message: "Resend connection successful" }
      }

      case "linear": {
        const apiKey = config.apiKey as string
        if (!apiKey) return { status: "error", message: "API key is required" }
        const res = await fetch("https://api.linear.app/graphql", {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: "{ viewer { id name } }" }),
        })
        if (res.status === 401) return { status: "error", message: "Invalid API key" }
        const data = await res.json().catch(() => ({}))
        if (data.errors) return { status: "error", message: `Linear error: ${data.errors[0]?.message}` }
        return { status: "success", message: `Connected to Linear as: ${data.data?.viewer?.name || "unknown"}` }
      }

      case "github": {
        const token = config.token as string
        if (!token) return { status: "error", message: "Personal access token is required" }
        const res = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        })
        if (res.status === 401) return { status: "error", message: "Invalid token" }
        const data = await res.json().catch(() => ({}))
        return { status: "success", message: `Connected to GitHub as: ${data.login || "unknown"}` }
      }

      case "stripe": {
        const apiKey = config.apiKey as string
        if (!apiKey) return { status: "error", message: "Secret key is required" }
        const res = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (res.status === 401) return { status: "error", message: "Invalid secret key" }
        if (!res.ok) return { status: "error", message: `Stripe API error (${res.status})` }
        return { status: "success", message: "Stripe connection successful" }
      }

      case "clerk": {
        const clerkSecretKey = config.clerkSecretKey as string
        if (!clerkSecretKey) return { status: "error", message: "Secret key is required" }
        const res = await fetch("https://api.clerk.com/v1/users?limit=1", {
          headers: { Authorization: `Bearer ${clerkSecretKey}` },
        })
        if (res.status === 401) return { status: "error", message: "Invalid secret key" }
        if (!res.ok) return { status: "error", message: `Clerk API error (${res.status})` }
        return { status: "success", message: "Clerk connection successful" }
      }

      case "firecrawl": {
        const apiKey = config.firecrawlApiKey as string
        if (!apiKey) return { status: "error", message: "API key is required" }
        const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: "https://example.com", formats: ["markdown"], limit: 1 }),
        })
        if (res.status === 401) return { status: "error", message: "Invalid API key" }
        if (res.status === 402) return { status: "error", message: "API key valid but insufficient credits" }
        // 200 or other non-auth errors mean the key is valid
        return { status: "success", message: "Firecrawl connection successful" }
      }

      case "fal": {
        const apiKey = config.apiKey as string
        if (!apiKey) return { status: "error", message: "API key is required" }
        // fal.ai doesn't have a simple health endpoint, validate format
        if (!apiKey.startsWith("fal_") && apiKey.length < 10) {
          return { status: "error", message: "API key doesn't look valid (should start with fal_)" }
        }
        return { status: "success", message: "fal.ai API key format looks valid" }
      }

      case "ai-gateway": {
        const apiKey = config.apiKey as string
        if (!apiKey) return { status: "error", message: "API key is required" }
        // Test with a minimal OpenAI-compatible call
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (res.status === 401) return { status: "error", message: "Invalid API key" }
        if (!res.ok) return { status: "error", message: `API error (${res.status})` }
        return { status: "success", message: "AI Gateway connection successful" }
      }

      case "blob": {
        const token = config.token as string
        if (!token) return { status: "error", message: "Read/write token is required" }
        if (!token.startsWith("vercel_blob_rw_")) {
          return { status: "error", message: "Token should start with vercel_blob_rw_" }
        }
        return { status: "success", message: "Vercel Blob token format looks valid" }
      }

      case "database": {
        const url = config.url as string
        if (!url) return { status: "error", message: "Database URL is required" }
        if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
          return { status: "error", message: "URL must start with postgresql:// or postgres://" }
        }
        return { status: "success", message: "Database URL format looks valid" }
      }

      // v0, webflow, superagent — basic validation only
      default: {
        const hasValue = Object.values(config).some(
          (v) => typeof v === "string" && v.trim().length > 0
        )
        if (!hasValue) return { status: "error", message: "At least one credential field is required" }
        return { status: "success", message: "Credentials saved (connection test not available for this type)" }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { status: "error", message: `Test failed: ${msg}` }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth()
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json({ error: "No organization" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    // Option 1: Test by integration ID (existing integration)
    const integrationId = body.integrationId as string | undefined
    if (integrationId) {
      const { data, error } = await supabaseAdmin
        .from("integration_setup")
        .select("type, config")
        .eq("id", integrationId)
        .eq("organization_id", orgUuid)
        .eq("user_id", userId)
        .single()

      if (error || !data) {
        return NextResponse.json({ status: "error", message: "Integration not found" })
      }

      const result = await testCredentialsForType(
        data.type as string,
        (data.config as Record<string, unknown>) || {}
      )
      return NextResponse.json(result)
    }

    // Option 2: Test raw credentials (before saving)
    const type = body.type as string | undefined
    const config = body.config as Record<string, unknown> | undefined

    if (!type || !config) {
      return NextResponse.json(
        { status: "error", message: "Missing type or config" },
        { status: 400 }
      )
    }

    const result = await testCredentialsForType(type, config)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ status: "error", message: msg }, { status: 500 })
  }
}
