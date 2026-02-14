/**
 * Test Supabase connection
 */
export async function testSupabase(config: Record<string, string>): Promise<void> {
  const url = config.supabaseUrl;
  const key = config.supabaseKey;

  if (!url || !key) {
    throw new Error("Supabase URL and key are required");
  }

  // Test by fetching the health endpoint
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Connection failed: HTTP ${res.status}`);
  }
}
