import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrgUuidFromClerkId } from "@/lib/orgs"
import { setVoiceContext } from "../context"

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    const orgUuid = orgId ? await getOrgUuidFromClerkId(orgId) : null

    const { program_id, sessionId } = (await req.json()) as {
      program_id?: string | null
      sessionId?: string
    }

    setVoiceContext({
      programId: program_id ?? null,
      sessionId: sessionId ?? "voice-session",
      userId: userId ?? null,
      orgUuid: orgUuid ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
