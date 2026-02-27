import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureLiveblocksRoom } from "@/lib/liveblocks";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ error: "No active organization" }, { status: 400 });
  }

  const { templateId } = (await req.json()) as { templateId?: string };
  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  await ensureLiveblocksRoom({
    roomType: "email_template",
    entityId: templateId,
    organizationId: orgId,
    creatorUserId: userId,
  });

  const { data: template } = await supabaseAdmin
    .from("email_templates")
    .select("name, subject, preview_text, from_address, reply_to, styles, blocknote_document")
    .eq("uuid", templateId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    template: template ?? null,
  });
}
