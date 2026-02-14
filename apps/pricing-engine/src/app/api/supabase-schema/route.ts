import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * GET /api/supabase-schema
 *
 * Returns schema information for building dynamic dropdowns in the workflow builder.
 * Uses dedicated RPC functions for reliable schema introspection.
 *
 * Query params:
 *   - type: "tables" | "columns" | "functions" | "buckets"
 *   - table: (required when type=columns) the table name
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const type = req.nextUrl.searchParams.get("type")
    const table = req.nextUrl.searchParams.get("table")

    switch (type) {
      case "tables": {
        const { data, error } = await supabaseAdmin.rpc("list_public_tables")

        if (error) {
          console.error("[supabase-schema] list_public_tables error:", error.message)
          return NextResponse.json({ tables: [] })
        }

        const tables = (data ?? []).map((r: { table_name: string }) => r.table_name)
        return NextResponse.json({ tables })
      }

      case "columns": {
        if (!table) {
          return NextResponse.json({ error: "table parameter required" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin.rpc("list_table_columns", {
          p_table_name: table,
        })

        if (error) {
          console.error("[supabase-schema] list_table_columns error:", error.message)
          return NextResponse.json({ columns: [] })
        }

        const columns = (data ?? []).map((r: { column_name: string; data_type: string; is_nullable: boolean }) => ({
          name: r.column_name,
          type: r.data_type,
          nullable: r.is_nullable,
        }))
        return NextResponse.json({ columns })
      }

      case "functions": {
        const { data, error } = await supabaseAdmin.rpc("list_public_functions")

        if (error) {
          console.error("[supabase-schema] list_public_functions error:", error.message)
          return NextResponse.json({ functions: [] })
        }

        const functions = (data ?? []).map((r: { function_name: string; function_args: string }) => ({
          name: r.function_name,
          args: r.function_args,
        }))
        return NextResponse.json({ functions })
      }

      case "buckets": {
        const { data, error } = await supabaseAdmin.storage.listBuckets()

        if (error) {
          console.error("[supabase-schema] listBuckets error:", error.message)
          return NextResponse.json({ buckets: [] })
        }

        const buckets = (data ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          public: b.public,
        }))
        return NextResponse.json({ buckets })
      }

      default:
        return NextResponse.json({ error: "Invalid type. Use: tables, columns, functions, buckets" }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
