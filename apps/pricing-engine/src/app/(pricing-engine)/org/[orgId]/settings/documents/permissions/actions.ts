"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export type DealRoleTypeRow = {
  id: number;
  name: string;
  description?: string | null;
};

export type DocumentCategoryRow = {
  id: number;
  name: string;
  description?: string | null;
  group?: string | null;
};

export type PermissionRow = {
  deal_role_types_id: number;
  document_categories_id: number;
  can_view: boolean;
  can_insert: boolean;
  can_upload: boolean;
  can_delete: boolean;
};

export type RbacMatrixPayload = {
  orgPk: number;
  roles: DealRoleTypeRow[];
  categories: DocumentCategoryRow[];
  permissions: PermissionRow[];
};

function supabaseForUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

async function requireAuthAndOrg() {
  const { userId, orgId, getToken } = await auth();
  if (!userId) throw new Error("Not authenticated");
  if (!orgId) throw new Error("No active organization selected");
  
  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
  } catch (error) {
    console.error("Error getting Supabase token:", error);
    throw new Error(
      "Failed to get Supabase authentication token. Please ensure the Supabase JWT template is configured in Clerk Dashboard."
    );
  }
  
  if (!token) {
    throw new Error(
      "Missing Clerk Supabase token. Please configure the 'supabase' JWT template in your Clerk Dashboard."
    );
  }
  
  return { orgId, token };
}

async function getOrgPk(supabase: ReturnType<typeof supabaseForUser>, orgId: string) {
  const { data, error } = await supabase
    .from("auth_clerk_orgs")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Org not found in auth_clerk_orgs");
  return data.id as number;
}

// Loader
export async function getDocumentRbacMatrix(): Promise<RbacMatrixPayload> {
  const { orgId, token } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  const orgPk = await getOrgPk(supabase, orgId);

  // Roles (columns)
  const rolesRes = await supabase
    .from("deal_role_types")
    .select("id,name,description")
    .order("name", { ascending: true });

  if (rolesRes.error) throw new Error(rolesRes.error.message);

  // Categories (rows)
  const catsRes = await supabase
    .from("document_categories")
    .select("id,name,description,group")
    .order("name", { ascending: true });

  if (catsRes.error) throw new Error(catsRes.error.message);

  // Permissions for org
  const permsRes = await supabase
    .from("document_access_permissions")
    .select("deal_role_types_id,document_categories_id,can_view,can_insert,can_upload,can_delete")
    .eq("clerk_org_id", orgPk);

  if (permsRes.error) throw new Error(permsRes.error.message);

  return {
    orgPk,
    roles: (rolesRes.data ?? []) as DealRoleTypeRow[],
    categories: (catsRes.data ?? []) as DocumentCategoryRow[],
    permissions: (permsRes.data ?? []) as PermissionRow[],
  };
}

// Save (bulk upsert)
export async function saveDocumentRbacMatrix(input: {
  orgPk: number;
  rows: PermissionRow[];
}): Promise<{ ok: true; updated: number }> {
  const { token } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  const upsertRows = input.rows.map(r => ({
    clerk_org_id: input.orgPk,
    deal_role_types_id: r.deal_role_types_id,
    document_categories_id: r.document_categories_id,
    can_view: r.can_view,
    can_insert: r.can_insert,
    can_upload: r.can_upload,
    can_delete: r.can_delete,
  }));

  const { error } = await supabase
    .from("document_access_permissions")
    .upsert(upsertRows, {
      onConflict: "clerk_org_id,deal_role_types_id,document_categories_id",
    });

  if (error) throw new Error(error.message);

  return { ok: true, updated: upsertRows.length };
}

// Reset to template
export async function resetOrgDocumentPermissions(orgPk: number): Promise<{ ok: true }> {
  const { token } = await requireAuthAndOrg();
  const supabase = supabaseForUser(token);

  const { error } = await supabase.rpc("reset_org_document_permissions", { p_org_id: orgPk });
  if (error) throw new Error(error.message);

  return { ok: true };
}
