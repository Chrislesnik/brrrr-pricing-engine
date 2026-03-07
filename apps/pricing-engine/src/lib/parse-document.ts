import { supabaseAdmin } from "@/lib/supabase-admin";
import OpenAI from "openai";

const LLAMA_PARSE_BASE = "https://api.cloud.llamaindex.ai/api/v2/parse";
const EMBEDDING_BATCH_SIZE = 100;
const EMBEDDING_MODEL = "text-embedding-ada-002";

/* -------------------------------------------------------------------------- */
/*  Download file from Supabase Storage                                        */
/* -------------------------------------------------------------------------- */

async function downloadFile(
  bucket: string,
  path: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to download file from storage: ${error?.message ?? "no data"}`);
  }
  const arrayBuf = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuf),
    contentType: data.type || "application/octet-stream",
  };
}

/* -------------------------------------------------------------------------- */
/*  Upload file to LlamaParse v2 with webhook callback                         */
/* -------------------------------------------------------------------------- */

async function uploadToLlamaParse(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  webhookUrl: string
): Promise<{ jobId: string; projectId: string }> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) throw new Error("LLAMA_CLOUD_API_KEY is not set");

  const config = JSON.stringify({
    tier: "agentic",
    version: "latest",
    processing_options: {
      ocr_parameters: { languages: ["en"] },
    },
    output_options: {
      markdown: {
        annotate_links: true,
        tables: {
          output_tables_as_markdown: true,
          compact_markdown_tables: false,
          merge_continued_tables: true,
        },
      },
    },
    webhook_configurations: [
      {
        webhook_url: webhookUrl,
        webhook_events: ["parse.success"],
      },
    ],
  });

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: contentType }), fileName);
  form.append("configuration", config);

  const res = await fetch(`${LLAMA_PARSE_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LlamaParse upload failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return { jobId: json.id, projectId: json.project_id };
}

/* -------------------------------------------------------------------------- */
/*  Fetch completed results from LlamaParse                                    */
/* -------------------------------------------------------------------------- */

export async function fetchLlamaResults(jobId: string): Promise<any> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY!;

  const res = await fetch(
    `${LLAMA_PARSE_BASE}/${jobId}?expand=markdown,text,items,metadata`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LlamaParse fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const status = data.job?.status;

  if (status !== "COMPLETED") {
    throw new Error(`LlamaParse job not completed (status: ${status}): ${data.job?.error_message ?? ""}`);
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/*  Transform LlamaParse output into chunks (ported from n8n JS code)          */
/* -------------------------------------------------------------------------- */

interface Chunk {
  content: string;
  metadata: {
    document_id: number;
    page: number | null;
    bbox: { x: number; y: number; w: number; h: number } | null;
  };
}

function norm(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function unionBBox(
  arr: Array<{ x?: number; y?: number; w?: number; h?: number }> | undefined
): { x: number; y: number; w: number; h: number } | null {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const b of arr || []) {
    if (b?.x == null || b?.y == null || b?.w == null || b?.h == null) continue;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function rowsToText(rows: unknown): string {
  if (!rows) return "";
  const rowsArr: unknown[] = Array.isArray(rows) ? rows : Object.values(rows as object);

  const lines: string[] = [];
  for (const r of rowsArr) {
    if (Array.isArray(r)) {
      const cells = r.map((c) => norm(c)).filter(Boolean);
      if (cells.length) lines.push(cells.join(" | "));
    } else if (r && typeof r === "object") {
      const obj = r as Record<string, unknown>;
      const keys = Object.keys(obj).sort((a, b) => {
        const na = Number(a),
          nb = Number(b);
        const ia = Number.isFinite(na),
          ib = Number.isFinite(nb);
        if (ia && ib) return na - nb;
        if (ia) return -1;
        if (ib) return 1;
        return a.localeCompare(b);
      });
      const cells = keys.map((k) => norm(obj[k])).filter(Boolean);
      if (cells.length) lines.push(cells.join(" | "));
    } else {
      const v = norm(r);
      if (v) lines.push(v);
    }
  }
  return lines.join("\n");
}

export function transformChunks(llamaResult: any, documentId: number): Chunk[] {
  const pages: any[] = llamaResult.items?.pages ?? [];
  const allItems: any[] = [];

  for (const page of pages) {
    const pageNum = page.page_number ?? page.page ?? null;
    const items: any[] = page.items ?? [];
    for (const item of items) {
      allItems.push({ ...item, page_number: item.page_number ?? pageNum });
    }
  }

  function isDocIdish(text: string): boolean {
    const t = norm(text);
    if (!t) return true;
    if (t === String(documentId)) return true;
    if (/^pjb-[a-z0-9]+$/i.test(t)) return true;
    return false;
  }

  const chunks: Chunk[] = [];

  for (const it of allItems) {
    const page = it.page_number ?? null;
    const bboxSrc = it.bbox ?? null;
    const bbox = Array.isArray(bboxSrc) ? unionBBox(bboxSrc) : bboxSrc;
    const rows = it.rows ?? null;

    const parts: string[] = [];

    const tableText = rowsToText(rows);
    if (tableText) parts.push("TABLE:\n" + tableText);

    const md = norm(it.md);
    const value = norm(it.value);
    const text = norm(it.text);

    if (md && !isDocIdish(md)) parts.push(md);
    if (value && value !== md && !isDocIdish(value)) parts.push(value);
    if (text && text !== md && text !== value && !isDocIdish(text)) parts.push(text);

    const content = norm(parts.join("\n\n"));

    if (!content) continue;
    if (isDocIdish(content)) continue;
    if (content.length < 10) continue;

    chunks.push({
      content,
      metadata: { document_id: documentId, page, bbox },
    });
  }

  return chunks;
}

/* -------------------------------------------------------------------------- */
/*  Generate OpenAI embeddings in batches                                      */
/* -------------------------------------------------------------------------- */

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    for (const item of res.data) {
      embeddings.push(item.embedding);
    }
  }

  return embeddings;
}

/* -------------------------------------------------------------------------- */
/*  Store chunks + embeddings in Supabase                                      */
/* -------------------------------------------------------------------------- */

export async function storeChunks(
  chunks: Chunk[],
  embeddings: number[][]
): Promise<void> {
  if (chunks.length === 0) return;

  const rows = chunks.map((chunk, i) => ({
    content: chunk.content,
    metadata: chunk.metadata,
    embedding: JSON.stringify(embeddings[i]),
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabaseAdmin
      .from("llama_document_chunks_vs")
      .insert(batch);

    if (error) {
      throw new Error(`Failed to store chunks (batch ${i}): ${error.message}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  startParse: Upload to LlamaParse with webhook, return immediately          */
/* -------------------------------------------------------------------------- */

export async function startParse(documentFileId: number): Promise<{
  parseRowId: number;
  jobId: string;
}> {
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL is not set — needed for LlamaParse webhook callback");

  const webhookUrl = `${appUrl}/api/documents/parse/webhook`;

  // 1. Fetch the document_files row
  const { data: docFile, error: docFileError } = await supabaseAdmin
    .from("document_files")
    .select("id, storage_bucket, storage_path, document_name")
    .eq("id", documentFileId)
    .single();

  if (docFileError || !docFile) {
    throw new Error(`Document file ${documentFileId} not found: ${docFileError?.message}`);
  }

  // 2. Insert llama_document_parsed row (PENDING)
  const { data: parseRow, error: parseInsertError } = await supabaseAdmin
    .from("llama_document_parsed")
    .insert({ document_id: documentFileId, status: "PENDING" })
    .select("id")
    .single();

  if (parseInsertError || !parseRow) {
    throw new Error(`Failed to create parse record: ${parseInsertError?.message}`);
  }

  // 3. Download file from Supabase Storage
  const { buffer, contentType } = await downloadFile(
    docFile.storage_bucket ?? "deals",
    docFile.storage_path
  );

  // 4. Upload to LlamaParse with webhook
  const { jobId, projectId } = await uploadToLlamaParse(
    buffer,
    docFile.document_name ?? "document",
    contentType,
    webhookUrl
  );

  // 5. Update parse row with LlamaParse IDs and set RUNNING
  await supabaseAdmin
    .from("llama_document_parsed")
    .update({
      status: "RUNNING",
      llama_id: jobId,
      llama_project_id: projectId,
    })
    .eq("id", parseRow.id);

  console.log(
    `[startParse] Uploaded document_file ${documentFileId} as LlamaParse job ${jobId}, webhook → ${webhookUrl}`
  );

  return { parseRowId: parseRow.id, jobId };
}

/* -------------------------------------------------------------------------- */
/*  finishParse: Called by webhook when LlamaParse is done.                     */
/*  Fetches results, chunks, embeds, stores, marks COMPLETE.                   */
/* -------------------------------------------------------------------------- */

export async function finishParse(jobId: string): Promise<void> {
  // 1. Look up the parse row by llama_id
  const { data: parseRow, error: lookupError } = await supabaseAdmin
    .from("llama_document_parsed")
    .select("id, document_id, status")
    .eq("llama_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError || !parseRow) {
    throw new Error(`No parse record found for LlamaParse job ${jobId}: ${lookupError?.message ?? "not found"}`);
  }

  const { id: parseRowId, document_id: documentFileId } = parseRow;

  try {
    // 2. Fetch completed results from LlamaParse
    const result = await fetchLlamaResults(jobId);

    // 3. Transform into chunks
    const chunks = transformChunks(result, documentFileId);

    if (chunks.length > 0) {
      // 4. Generate embeddings
      const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

      // 5. Store chunks + embeddings
      await storeChunks(chunks, embeddings);
    }

    // 6. Mark COMPLETE
    await supabaseAdmin
      .from("llama_document_parsed")
      .update({ status: "COMPLETE" })
      .eq("id", parseRowId);

    console.log(
      `[finishParse] Completed for document_file ${documentFileId} (job ${jobId}): ${chunks.length} chunks stored`
    );
  } catch (err) {
    console.error(`[finishParse] Failed for job ${jobId}:`, err);

    await supabaseAdmin
      .from("llama_document_parsed")
      .update({ status: "FAILED" })
      .eq("id", parseRowId)
      .catch((e: unknown) => console.error("[finishParse] Failed to update status:", e));

    throw err;
  }
}
