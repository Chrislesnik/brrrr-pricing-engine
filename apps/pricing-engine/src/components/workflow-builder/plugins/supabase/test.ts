/**
 * Test Supabase connection
 */
export async function testSupabase(config: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  const url = config.supabaseUrl;
  const key = config.supabaseKey;

  if (!url || !key) {
    return { success: false, error: "Supabase URL and key are required" };
  }

  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    return { success: false, error: `Connection failed: HTTP ${res.status}` };
  }

  return { success: true };
}
