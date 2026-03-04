import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const CONTEXT_FILE = join(process.cwd(), ".vapi-voice-context.json")

interface VoiceContext {
  programId: string | null
  sessionId: string
  userId: string | null
  orgUuid: string | null
}

export function setVoiceContext(ctx: VoiceContext) {
  writeFileSync(CONTEXT_FILE, JSON.stringify(ctx), "utf-8")
}

export function getVoiceContext(): VoiceContext {
  try {
    const raw = readFileSync(CONTEXT_FILE, "utf-8")
    return JSON.parse(raw) as VoiceContext
  } catch {
    return { programId: null, sessionId: "voice-session", userId: null, orgUuid: null }
  }
}
