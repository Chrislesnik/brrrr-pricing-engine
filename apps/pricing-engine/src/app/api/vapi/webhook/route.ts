import { NextResponse } from "next/server"
import { getVoiceContext } from "../context"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { cleanAiResponse } from "@/lib/clean-ai-response"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body.message

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:entry',message:'webhook hit',data:{type:message?.type,keys:Object.keys(message??{})},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (message?.type === "tool-calls") {
      const toolCallList = message.toolCallList ?? []
      const results = []

      for (const tc of toolCallList) {
        const toolName = tc.function?.name ?? tc.name ?? ""
        const toolArgs = tc.function?.arguments ?? tc.parameters ?? {}
        const toolCallId = tc.id

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:tool-call',message:'processing tool call',data:{toolName,toolCallId,toolArgs},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (toolName === "query_guidelines") {
          const question = String(toolArgs?.question ?? "")
          const ctx = getVoiceContext()
          const programId = ctx.programId
          const sessionId = ctx.sessionId

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:question',message:'extracted question',data:{question,sessionId,programId},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          const webhookUrl =
            process.env.N8N_AI_CHAT_WEBHOOK_URL ||
            "https://n8n.axora.info/webhook/f567d7d1-8d33-4ac5-a7d8-ba6cfd6d720e"

          let answer = ""
          try {
            const n8nPayload = {
              sessionId,
              program_id: programId,
              prompt: question,
            }

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:n8n-request',message:'sending to n8n',data:{webhookUrl,n8nPayload},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            const res = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              cache: "no-store",
              body: JSON.stringify(n8nPayload),
            })

            const rawText = await res.text()

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:n8n-response',message:'n8n responded',data:{status:res.status,statusText:res.statusText,bodyLength:rawText.length,bodyPreview:rawText.slice(0,500)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            if (rawText.trim()) {
              try {
                const json = JSON.parse(rawText) as unknown
                if (Array.isArray(json)) {
                  answer = String((json[0] as Record<string, unknown>)?.response ?? "")
                } else if (json && typeof json === "object") {
                  answer = String((json as Record<string, unknown>)?.response ?? "")
                } else if (typeof json === "string") {
                  answer = json
                }
              } catch {
                answer = rawText
              }
            }
          } catch (err) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:n8n-error',message:'n8n fetch failed',data:{error:String(err)},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            answer = "Sorry, I could not retrieve the information right now."
          }

          answer = cleanAiResponse(answer)
          if (!answer.trim()) {
            answer = "Sorry, I couldn't generate a response."
          }

          // Persist user question + AI answer to the chat, matching /api/ai/send behavior
          if (sessionId && sessionId !== "voice-session" && question.trim() && ctx.userId && ctx.orgUuid) {
            try {
              await supabaseAdmin.from("ai_chat_messages").insert([
                { ai_chat_id: sessionId, user_id: ctx.userId, organization_id: ctx.orgUuid, user_type: "user", content: question },
                { ai_chat_id: sessionId, user_id: ctx.userId, organization_id: ctx.orgUuid, user_type: "agent", content: answer },
              ])
              await supabaseAdmin
                .from("ai_chats")
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", sessionId)
            } catch {
              // non-fatal -- don't block the response to Vapi
            }
          }

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:result',message:'returning result to vapi',data:{toolCallId,answerPreview:answer.slice(0,200)},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
          // #endregion

          results.push({
            name: "query_guidelines",
            toolCallId,
            result: answer,
          })
        } else {
          results.push({
            name: toolName,
            toolCallId,
            result: "Unknown tool",
          })
        }
      }

      return NextResponse.json({ results })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vapi/webhook/route.ts:catch',message:'webhook error',data:{error:msg},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
