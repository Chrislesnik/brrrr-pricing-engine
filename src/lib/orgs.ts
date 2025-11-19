import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getOrgUuidFromClerkId(clerkOrgId: string | null | undefined): Promise<string | null> {
  if (!clerkOrgId) return null
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("clerk_organization_id", clerkOrgId)
    .single()
  if (error) {
    console.error("Failed to resolve organization UUID:", error.message)
    return null
  }
  return (data?.id as string) ?? null
}


