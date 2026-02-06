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

    // Fetch documents for this deal via deal_document_participants
    const { data: documents, error } = await supabaseAdmin
      .from("deal_document_participants")
      .select(`
        document_file_id,
        document_files:document_file_id (
          id,
          uuid,
          document_name,
          file_type,
          file_size,
          storage_bucket,
          storage_path,
          uploaded_by,
          uploaded_at,
          document_category_id,
          document_categories:document_category_id (
            id,
            name
          )
        )
      `)
      .eq("deal_id", dealId);

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
          .filter((d: any) => d.document_files?.uploaded_by)
          .map((d: any) => d.document_files.uploaded_by)
      )
    );

    // Fetch user information for uploaders
    const { data: uploaders } = await supabaseAdmin
      .from("users")
      .select("clerk_user_id, first_name, last_name, avatar_url")
      .in("clerk_user_id", uploaderIds);

    // Create a map of clerk_user_id to user info
    const uploaderMap = new Map(
      (uploaders ?? []).map((u: any) => [
        u.clerk_user_id,
        {
          name: [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unknown User",
          avatarUrl: u.avatar_url,
        },
      ])
    );

    // Transform the data
    const transformedDocs = (documents ?? [])
      .filter((d: any) => d.document_files)
      .map((d: any) => {
        const uploadedBy = d.document_files.uploaded_by;
        const uploaderInfo = uploaderMap.get(uploadedBy) || {
          name: "Unknown User",
          avatarUrl: null,
        };

        return {
          id: d.document_files.id,
          uuid: d.document_files.uuid,
          name: d.document_files.document_name,
          type: d.document_files.document_categories?.name || "Other",
          size: d.document_files.file_size,
          mimeType: d.document_files.file_type,
          uploadedBy: uploadedBy,
          uploadedByName: uploaderInfo.name,
          uploadedByAvatar: uploaderInfo.avatarUrl,
          uploadedAt: d.document_files.uploaded_at,
          storagePath: d.document_files.storage_path,
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
    const categoryId = formData.get("categoryId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const uniqueId = nanoid();
    const storagePath = `deals/${dealId}/${uniqueId}.${fileExt}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
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

    // Create document_files record
    const { data: docFile, error: docError } = await supabaseAdmin
      .from("document_files")
      .insert({
        document_name: documentName || file.name,
        file_type: file.type,
        file_size: file.size,
        storage_bucket: "documents",
        storage_path: storagePath,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
        document_category_id: categoryId ? parseInt(categoryId) : null,
      })
      .select()
      .single();

    if (docError || !docFile) {
      console.error("Error creating document record:", docError);
      // Cleanup uploaded file
      await supabaseAdmin.storage.from("documents").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    // Link document to deal via deal_document_participants
    const { error: linkError } = await supabaseAdmin
      .from("deal_document_participants")
      .insert({
        deal_id: dealId,
        document_file_id: docFile.id,
        source_table: "document_files",
        source_pk: docFile.id,
      });

    if (linkError) {
      console.error("Error linking document to deal:", linkError);
      // Cleanup
      await supabaseAdmin.from("document_files").delete().eq("id", docFile.id);
      await supabaseAdmin.storage.from("documents").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to link document to deal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      document: {
        id: docFile.id,
        uuid: docFile.uuid,
        name: docFile.document_name,
        size: docFile.file_size,
        type: file.type,
        uploadedBy: userId,
        uploadedAt: docFile.uploaded_at,
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
