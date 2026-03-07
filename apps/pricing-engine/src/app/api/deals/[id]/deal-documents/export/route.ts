import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkRouteAccess, getOrgUuidFromClerkId } from "@/lib/orgs"
import JSZip from "jszip"

export const runtime = "nodejs"
export const maxDuration = 120

const ROUTE_RESOURCE = "/api/deals/[id]/deal-documents"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const orgUuid = await getOrgUuidFromClerkId(orgId)
    if (!orgUuid) {
      return NextResponse.json(
        { error: "No organization context" },
        { status: 401 }
      )
    }
    const canAccess = await checkRouteAccess(ROUTE_RESOURCE, "select").catch(
      () => false
    )
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: dealId } = await params

    const { data: rows, error } = await supabaseAdmin
      .from("deal_documents")
      .select(
        `
        id,
        file_name,
        document_type_id,
        document_file_id,
        archived_at,
        document_files:document_file_id (
          storage_bucket,
          storage_path,
          document_category_id
        )
      `
      )
      .eq("deal_id", dealId)
      .is("archived_at", null)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const docsWithFiles = (rows ?? []).filter(
      (r: any) => r.document_files?.storage_path
    )

    if (docsWithFiles.length === 0) {
      return NextResponse.json(
        { error: "No documents to export" },
        { status: 404 }
      )
    }

    const categoryIds = [
      ...new Set(
        docsWithFiles
          .map((r: any) => r.document_files?.document_category_id)
          .filter(Boolean)
      ),
    ]

    const categoryMap = new Map<number, string>()
    if (categoryIds.length > 0) {
      const { data: cats } = await supabaseAdmin
        .from("document_categories")
        .select("id, name")
        .in("id", categoryIds)
      for (const c of cats ?? []) {
        categoryMap.set(c.id, c.name)
      }
    }

    const zip = new JSZip()
    const usedPaths = new Set<string>()

    for (const row of docsWithFiles) {
      const df = (row as any).document_files
      const bucket = df.storage_bucket ?? "deals"
      const storagePath = df.storage_path as string

      const folder =
        categoryMap.get(df.document_category_id) ?? "Uncategorized"
      const rawName = (row as any).file_name ?? storagePath.split("/").pop()

      let zipPath = `${folder}/${rawName}`
      if (usedPaths.has(zipPath.toLowerCase())) {
        const ext = rawName.includes(".")
          ? "." + rawName.split(".").pop()
          : ""
        const base = ext ? rawName.slice(0, -ext.length) : rawName
        let counter = 2
        while (usedPaths.has(zipPath.toLowerCase())) {
          zipPath = `${folder}/${base} (${counter})${ext}`
          counter++
        }
      }
      usedPaths.add(zipPath.toLowerCase())

      try {
        const { data: blob, error: dlErr } = await supabaseAdmin.storage
          .from(bucket)
          .download(storagePath)

        if (dlErr || !blob) {
          console.warn(
            `[export] Failed to download ${storagePath}:`,
            dlErr?.message
          )
          continue
        }

        const buf = Buffer.from(await blob.arrayBuffer())
        zip.file(zipPath, buf)
      } catch (e) {
        console.warn(`[export] Error downloading ${storagePath}:`, e)
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 5 },
    })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${dealId}-documents.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    })
  } catch (e) {
    console.error("[GET /api/deals/[id]/deal-documents/export]", e)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
