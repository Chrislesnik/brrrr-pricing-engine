import { NextResponse } from "next/server"
import { mkdir, appendFile } from "fs/promises"

export const runtime = "nodejs"

const INGEST_ENDPOINT = "http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc"
const LOG_PATH = "/Users/christopherlesnik/brrrr-pricing-engine/.cursor/debug.log"

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 })
    }
    const payload = {
      ...body,
      timestamp: Date.now(),
    }
    // Forward to ingest server (best-effort)
    try {
      await fetch(INGEST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch {}
    // Also write to local NDJSON file (best-effort)
    try {
      await mkdir("/Users/christopherlesnik/brrrr-pricing-engine/.cursor", { recursive: true })
      await appendFile(LOG_PATH, JSON.stringify(payload) + "\n")
    } catch {}
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}


