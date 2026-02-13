import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  /api/deals/[id]/deal-documents/[docId]/chat                               */
/*  GET  – Load persisted chat history for the current user + document        */
/*  POST – Send a message, forward to n8n, persist both sides                 */
/* -------------------------------------------------------------------------- */

const WEBHOOK_URL =
  "https://n8n.axora.info/webhook/0d715985-5cc6-40b4-9ddc-864a6c336770";

type RouteContext = {
  params: Promise<{ id: string; docId: string }>;
};

/* ---------------------------------- GET ----------------------------------- */

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;

    const { data, error } = await supabaseAdmin
      .from("deal_document_ai_chat")
      .select("id, deal_document_id, user_id, user_type, message, citations, created_at")
      .eq("deal_document_id", docId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET chat] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to load chat history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (err) {
    console.error("[GET /api/deals/[id]/deal-documents/[docId]/chat]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------------------------------- POST ---------------------------------- */

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;
    const body = await request.json();
    const message: string | undefined = body?.message;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // 1. Persist the user message
    const { error: userInsertErr } = await supabaseAdmin
      .from("deal_document_ai_chat")
      .insert({
        deal_document_id: Number(docId),
        user_id: userId,
        user_type: "user",
        message: message.trim(),
      });

    if (userInsertErr) {
      console.error("[POST chat] Failed to insert user message:", userInsertErr);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // 2. Forward to n8n webhook with deal_document_id
    let answerText = "Sorry, I couldn't process that request.";
    let citations: any[] = [];

    try {
      const webhookRes = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          deal_document_id: Number(docId),
        }),
      });

      const data = await webhookRes.json();

      // Parse the response format: [{ output: { answer, citations } }]
      if (Array.isArray(data) && data.length > 0) {
        const output = data[0]?.output;
        if (output) {
          answerText = output.answer || answerText;
          citations = output.citations || [];
        }
      } else if (data?.output) {
        answerText = data.output.answer || answerText;
        citations = data.output.citations || [];
      } else if (typeof data === "string") {
        answerText = data;
      }
    } catch (webhookErr) {
      console.error("[POST chat] Webhook error:", webhookErr);
      answerText = "Sorry, there was an error connecting to the AI service.";
    }

    // 3. Persist the agent response with citations
    const { error: agentInsertErr } = await supabaseAdmin
      .from("deal_document_ai_chat")
      .insert({
        deal_document_id: Number(docId),
        user_id: userId,
        user_type: "agent",
        message: answerText,
        citations: citations.length > 0 ? citations : null,
      });

    if (agentInsertErr) {
      console.error(
        "[POST chat] Failed to insert agent message:",
        agentInsertErr
      );
      // Still return the response even if persistence fails
    }

    // 4. Return the agent response to the client
    return NextResponse.json({
      answer: answerText,
      citations,
    });
  } catch (err) {
    console.error("[POST /api/deals/[id]/deal-documents/[docId]/chat]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
