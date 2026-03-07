import { NextRequest, NextResponse } from "next/server";
import { finishParse } from "@/lib/parse-document";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // LlamaParse webhook payload: { event_type, data: { id, status, project_id } }
    const jobId = body.data?.id ?? body.id ?? body.job_id ?? body.job?.id;

    console.log("[webhook] LlamaParse callback received:", JSON.stringify(body).slice(0, 500));

    if (!jobId || typeof jobId !== "string") {
      console.error("[webhook] No job ID in payload:", body);
      return NextResponse.json(
        { error: "No job ID in webhook payload" },
        { status: 400 }
      );
    }

    // Run the finish pipeline (fetch results, chunk, embed, store)
    await finishParse(jobId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/documents/parse/webhook]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
