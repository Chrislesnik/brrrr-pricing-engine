import { supabaseAdmin } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

// GET /api/deals/:id/documents
// Returns all documents for a deal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Get user info
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, is_internal_yn, clerk_user_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch documents for this deal from deal_documents
    const { data: documents, error } = await supabaseAdmin
      .from("deal_documents")
      .select(`
        id,
        file_name,
        file_type,
        file_size,
        storage_path,
        uploaded_by,
        uploaded_at,
        notes,
        document_type_id,
        document_types:document_type_id (
          id,
          document_name,
          document_category_id,
          document_categories:document_category_id (
            id,
            name
          )
        )
      `)
      .eq("deal_id", dealId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get unique uploader IDs
    const uploaderIds = Array.from(
      new Set(
        (documents ?? [])
          .filter((d: any) => d.uploaded_by)
          .map((d: any) => d.uploaded_by)
      )
    );

    // Fetch user information for uploaders
    let uploaderMap = new Map<
      string,
      { name: string; avatarUrl: string | null }
    >();

    if (uploaderIds.length > 0) {
      const { data: uploaders } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id, first_name, last_name, avatar_url")
        .in("clerk_user_id", uploaderIds);

      uploaderMap = new Map(
        (uploaders ?? []).map((u: any) => [
          u.clerk_user_id,
          {
            name:
              [u.first_name, u.last_name].filter(Boolean).join(" ") ||
              "Unknown User",
            avatarUrl: u.avatar_url,
          },
        ])
      );
    }

    // Transform the data
    const transformedDocs = (documents ?? []).map((d: any) => {
      const uploaderInfo = uploaderMap.get(d.uploaded_by) || {
        name: "Unknown User",
        avatarUrl: null,
      };

      // Resolve category name through document_types -> document_categories
      const categoryName =
        d.document_types?.document_categories?.name ||
        d.document_types?.document_name ||
        "Other";

      return {
        id: d.id,
        name: d.file_name,
        type: categoryName,
        size: d.file_size || 0,
        mimeType: d.file_type || "application/octet-stream",
        uploadedBy: d.uploaded_by,
        uploadedByName: uploaderInfo.name,
        uploadedByAvatar: uploaderInfo.avatarUrl,
        uploadedAt: d.uploaded_at,
        storagePath: d.storage_path,
      };
    });

    return NextResponse.json({ documents: transformedDocs });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/deals/:id/documents
// Upload a new document for a deal
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Get user info
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, is_internal_yn, clerk_user_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentName = formData.get("documentName") as string;
    const documentTypeId = formData.get("documentTypeId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const uniqueId = nanoid();
    const fileName = `${uniqueId}.${fileExt}`;
    const storagePath = `${dealId}/${fileName}`;

    // Upload to Supabase Storage in "deals" bucket
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("deals")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Create deal_documents record directly
    const { data: dealDoc, error: docError } = await supabaseAdmin
      .from("deal_documents")
      .insert({
        deal_id: dealId,
        file_name: documentName || file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
        document_type_id: documentTypeId ? parseInt(documentTypeId) : null,
      })
      .select()
      .single();

    if (docError || !dealDoc) {
      console.error("Error creating document record:", docError);
      // Cleanup uploaded file
      await supabaseAdmin.storage.from("deals").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      document: {
        id: dealDoc.id,
        name: dealDoc.file_name,
        size: dealDoc.file_size,
        type: dealDoc.file_type,
        uploadedBy: userId,
        uploadedAt: dealDoc.uploaded_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
