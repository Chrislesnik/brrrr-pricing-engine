"use client";

import * as React from "react";
import {
  getDocumentRbacMatrix,
  resetOrgDocumentPermissions,
  saveDocumentRbacMatrix,
  type RbacMatrixPayload,
  type PermissionRow,
} from "@/app/(pricing-engine)/org/[orgId]/settings/permissions/actions";

import { DocumentCategoryPermissionMatrix } from "@/components/documents/document-category-permission-matrix";

type ActionKey = "can_view" | "can_insert" | "can_upload" | "can_delete";
type DocPermission = Record<ActionKey, boolean>;
type PermissionState = Record<string, Record<string, DocPermission>>; // roleId -> categoryId -> perms

function buildState(initial: RbacMatrixPayload): PermissionState {
  const state: PermissionState = {};

  for (const role of initial.roles) {
    const roleKey = String(role.id);
    state[roleKey] = {};
    for (const cat of initial.categories) {
      state[roleKey][String(cat.id)] = {
        can_view: false,
        can_insert: false,
        can_upload: false,
        can_delete: false,
      };
    }
  }

  for (const r of initial.permissions) {
    const roleKey = String(r.deal_role_types_id);
    const catKey = String(r.document_categories_id);
    if (!state[roleKey]?.[catKey]) continue;
    state[roleKey][catKey] = {
      can_view: !!r.can_view,
      can_insert: !!r.can_insert,
      can_upload: !!r.can_upload,
      can_delete: !!r.can_delete,
    };
  }

  return state;
}

function stateToRows(
  roles: RbacMatrixPayload["roles"],
  categories: RbacMatrixPayload["categories"],
  state: PermissionState
): PermissionRow[] {
  const rows: PermissionRow[] = [];
  for (const role of roles) {
    for (const cat of categories) {
      const cell = state[String(role.id)]?.[String(cat.id)];
      rows.push({
        deal_role_types_id: role.id,
        document_categories_id: cat.id,
        can_view: !!cell?.can_view,
        can_insert: !!cell?.can_insert,
        can_upload: !!cell?.can_upload,
        can_delete: !!cell?.can_delete,
      });
    }
  }
  return rows;
}

export default function RbacMatrixClient({
  initial,
}: {
  initial: RbacMatrixPayload;
}) {
  console.log("RbacMatrixClient received initial data:", {
    rolesCount: initial.roles?.length || 0,
    categoriesCount: initial.categories?.length || 0,
    permissionsCount: initial.permissions?.length || 0,
  });

  const [data, setData] = React.useState(initial);
  const [permissionState, setPermissionState] = React.useState<PermissionState>(
    () => buildState(initial)
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    setError(null);
    const next = await getDocumentRbacMatrix();
    setData(next);
    setPermissionState(buildState(next));
  }

  async function onSave(nextState: PermissionState) {
    setSaving(true);
    setError(null);
    try {
      const rows = stateToRows(data.roles, data.categories, nextState);
      await saveDocumentRbacMatrix({ orgPk: data.orgPk, rows });
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function onReset() {
    setSaving(true);
    setError(null);
    try {
      await resetOrgDocumentPermissions(data.orgPk);
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Reset failed";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <DocumentCategoryPermissionMatrix
        roles={data.roles.map((r) => ({
          id: String(r.id),
          name: r.name,
          description: r.description ?? "",
          // Mark internal admin role as system/locked
          isSystem:
            r.name.toLowerCase().includes("internal") ||
            r.name.toLowerCase().includes("admin (locked)"),
        }))}
        categories={data.categories.map((c) => ({
          id: String(c.id),
          name: c.name,
          description: c.description ?? "",
          group: c.group ?? "Documents",
        }))}
        value={permissionState}
        onChange={setPermissionState}
        onSave={() => onSave(permissionState)}
        onReset={onReset}
        saving={saving}
      />
    </div>
  );
}
