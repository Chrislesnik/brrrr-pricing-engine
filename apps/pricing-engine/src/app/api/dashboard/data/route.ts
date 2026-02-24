import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getOrgUuidFromClerkId,
  getUserRoleInOrg,
  isPrivilegedRole,
} from "@/lib/orgs";

interface DashboardWidget {
  id: number;
  slot: string;
  widget_type: string;
  title: string;
  subtitle: string | null;
  trend_label: string | null;
  trend_description: string | null;
  value_format: string | null;
  value_prefix: string | null;
  value_suffix: string | null;
  chart_type: string | null;
  x_axis_key: string | null;
  y_axis_key: string | null;
  sql_query: string | null;
}

function sqlEscape(val: string): string {
  return val.replace(/'/g, "''");
}

function resolveTemplateVariables(
  sql: string,
  ctx: {
    orgUuid: string;
    userId: string;
    isInternal: boolean;
    isPrivileged: boolean;
  }
): string {
  let resolved = sql;
  resolved = resolved.replace(/\{\{org_uuid\}\}/g, sqlEscape(ctx.orgUuid));
  resolved = resolved.replace(/\{\{user_id\}\}/g, sqlEscape(ctx.userId));
  resolved = resolved.replace(
    /\{\{is_internal\}\}/g,
    ctx.isInternal ? "TRUE" : "FALSE"
  );
  resolved = resolved.replace(
    /\{\{is_privileged\}\}/g,
    ctx.isPrivileged ? "TRUE" : "FALSE"
  );
  return resolved;
}

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgUuid = await getOrgUuidFromClerkId(orgId);
    if (!orgUuid) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    const [{ data: orgRow }, role] = await Promise.all([
      supabaseAdmin
        .from("organizations")
        .select("is_internal_yn")
        .eq("id", orgUuid)
        .single(),
      getUserRoleInOrg(orgUuid, userId),
    ]);

    const isInternal = orgRow?.is_internal_yn === true;
    const privileged = isPrivilegedRole(role);

    const { data: widgets, error: widgetsErr } = await supabaseAdmin
      .from("dashboard_widgets")
      .select("*")
      .order("id", { ascending: true });

    if (widgetsErr || !widgets) {
      return NextResponse.json(
        { error: widgetsErr?.message ?? "Failed to load widgets" },
        { status: 500 }
      );
    }

    const ctx = {
      orgUuid,
      userId,
      isInternal,
      isPrivileged: privileged,
    };

    const results: Record<
      string,
      {
        config: Omit<DashboardWidget, "sql_query">;
        data: unknown;
        error?: string;
      }
    > = {};

    await Promise.all(
      (widgets as DashboardWidget[]).map(async (w) => {
        const { sql_query, ...config } = w;

        if (!sql_query) {
          results[w.slot] = { config, data: null };
          return;
        }

        try {
          const resolvedSql = resolveTemplateVariables(sql_query, ctx);

          const { data, error } = await supabaseAdmin.rpc("exec_sql", {
            query: resolvedSql,
            params: [],
          });

          if (error) {
            console.error(
              `[dashboard/data] SQL error for ${w.slot}:`,
              error.message
            );
            results[w.slot] = {
              config,
              data: null,
              error: error.message,
            };
            return;
          }

          const rows = Array.isArray(data) ? data : [];

          if (w.widget_type === "kpi") {
            const row = rows[0] as
              | { value?: number; trend_pct?: number }
              | undefined;
            results[w.slot] = {
              config,
              data: row
                ? {
                    value: row.value ?? null,
                    trend_pct: row.trend_pct ?? null,
                  }
                : null,
            };
          } else {
            results[w.slot] = { config, data: rows };
          }
        } catch (err) {
          console.error(`[dashboard/data] Error for ${w.slot}:`, err);
          results[w.slot] = {
            config,
            data: null,
            error:
              err instanceof Error ? err.message : "Query execution failed",
          };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET /api/dashboard/data]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
