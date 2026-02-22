import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { filterProgramsByConditions } from "@/lib/program-condition-evaluator"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inputValuesParam = searchParams.get("inputValues")

    const { data, error } = await supabaseAdmin
      .from("programs")
      .select("id,internal_name,external_name")
      .eq("status", "active")
      .order("internal_name", { ascending: true })

    if (error) return new NextResponse(error.message, { status: 500 })

    let programs = data ?? []

    if (inputValuesParam) {
      try {
        const inputValues = JSON.parse(inputValuesParam) as Record<string, unknown>
        programs = await filterProgramsByConditions(programs, inputValues)
      } catch {
        // If parsing fails, return all programs
      }
    }

    return NextResponse.json({ programs })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}
