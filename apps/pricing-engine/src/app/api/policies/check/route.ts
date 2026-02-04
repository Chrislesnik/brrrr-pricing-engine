import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type CheckRequest = {
  resourceType: "table" | "storage_bucket";
  resourceName: string;
  action: "select" | "insert" | "update" | "delete";
};

function supabaseForUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anon) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return new Response("Not authenticated", { status: 401 });
  }

  const body = (await req.json()) as CheckRequest;
  if (!body?.resourceType || !body?.resourceName || !body?.action) {
    return new Response("Missing required fields", { status: 400 });
  }

  let token: string | null = null;
  try {
    token = await getToken();
  } catch {
    token = await getToken({ template: "supabase" });
  }

  if (!token) {
    return new Response("Missing Supabase token", { status: 400 });
  }

  const supabase = supabaseForUser(token);
  const { data, error } = await supabase.rpc("can_access_org_resource", {
    p_resource_type: body.resourceType,
    p_resource_name: body.resourceName,
    p_action: body.action,
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json({ allowed: !!data });
}
