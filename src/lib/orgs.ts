import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getOrgUuidFromClerkId(clerkOrgId: string | null | undefined): Promise<string | null> {
  if (!clerkOrgId) return null
  function logError(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(...args)
  }
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrgId)
    .single()
  if (error) {
    logError("Failed to resolve organization UUID:", error.message)
    return null
  }
  return (data?.id as string) ?? null
}


