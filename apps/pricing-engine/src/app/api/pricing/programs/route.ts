import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { filterProgramsByConditions } from "@/lib/program-condition-evaluator"

export const runtime = "nodejs"

async function fetchAndFilter(inputValues?: Record<string, unknown> | null) {
  const { data, error } = await supabaseAdmin
    .from("programs")
    .select("id,internal_name,external_name")
    .eq("status", "active")
    .order("internal_name", { ascending: true })

  if (error) return { programs: null, error: error.message }

  let programs = data ?? []

  if (inputValues && Object.keys(inputValues).length > 0) {
    programs = await filterProgramsByConditions(programs, inputValues)
  }

  return { programs, error: null }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const inputValuesParam = searchParams.get("inputValues")

    let inputValues: Record<string, unknown> | null = null
    if (inputValuesParam) {
      try { inputValues = JSON.parse(inputValuesParam) } catch { /* ignore */ }
    }

    const { programs, error } = await fetchAndFilter(inputValues)
    if (error) return new NextResponse(error, { status: 500 })
    return NextResponse.json({ programs })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { inputValues?: Record<string, unknown> }
    const { programs, error } = await fetchAndFilter(body.inputValues)
    if (error) return new NextResponse(error, { status: 500 })
    return NextResponse.json({ programs })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    return new NextResponse(`Server error: ${msg}`, { status: 500 })
  }
}
