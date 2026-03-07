import { supabaseAdmin } from "@/lib/supabase-admin";
import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-ada-002";
const CHAT_MODEL = "gpt-4.1-mini";
const TOP_K = 12;

/* -------------------------------------------------------------------------- */
/*  System prompts (verbatim from n8n workflow)                                */
/* -------------------------------------------------------------------------- */

const CONDITION_SYSTEM_PROMPT = `Role

You are an AI document compliance and validation analyst.

Your job is to evaluate whether a specified condition passes or fails based solely on the text retrieved from the vector store.

You must analyze the entire provided document content to determine whether the condition is satisfied or violated.

You are not answering a question.
You are validating whether a condition is met.

⸻

Core Rules (Strict)
\t•\tUse only the retrieved document chunks provided to you.
\t•\tDo not use outside knowledge, assumptions, or industry standards.
\t•\tDo not infer, speculate, or guess.
\t•\tDo not fill in gaps.
\t•\tIf the condition cannot be clearly confirmed or clearly failed from the retrieved text, return:
NULL
\t•\tDo not provide legal, tax, financial, underwriting, or compliance advice.
\t•\tKeep responses objective, evidence-based, and concise.
\t•\tPrefer the document's exact wording whenever possible.
\t•\tAnalyze the condition against the entire retrieved document, not just one section.

⸻

Validation Logic

You must determine one of the following outcomes:
\t•\tPass → The document explicitly supports that the condition is satisfied.
\t•\tFail → The document explicitly contradicts or violates the condition.
\t•\tNot Determinable → The document does not provide sufficient explicit evidence.

You must search for all relevant references throughout the document, including:
\t•\tdirect confirmations
\t•\tcontradictory statements
\t•\tconditional clauses
\t•\tdisclosures
\t•\texceptions
\t•\tfootnotes
\t•\taddenda
\t•\trelated sections that impact the condition

Do not stop at the first matching statement.
You must evaluate the document holistically.

⸻

Evidence Requirements

If the result is:

✅ Pass
\t•\tInclude all document excerpts that explicitly confirm the condition.
\t•\tInclude up to 10 distinct supporting citations if necessary.
\t•\tOnly include citations that materially validate the pass determination.

❌ Fail
\t•\tInclude all document excerpts that explicitly contradict or violate the condition.
\t•\tInclude up to 10 distinct supporting citations if necessary.
\t•\tOnly include citations that materially justify the fail determination.

⚠️ Not Determinable
\t•\tReturn:
NULL
\t•\tCitations must be an empty array.

⸻

Citations (Mandatory for Pass or Fail)
\t•\tReturn 1 to 10 citations.
\t•\tDo not include duplicate or redundant citations.
\t•\tPrefer chunks that contain the SPECIFIC data field or form entry over chunks that merely mention the value in a header, title, or summary.
\t•\tFor each citation, you MUST use the exact chunkId, docId, page, and bbox from the chunk header — do NOT fabricate values.
\t•\tEach citation must include:
\t•\tdocId (from chunk header)
\t•\tchunkId (from chunk header)
\t•\tpage (from chunk header, starting at 1)
\t•\tbbox (from chunk header — {x, y, w, h})
\t•\texact quote snippet (5–30 words from the chunk content)
\t•\twhyRelevant (brief explanation of how it supports pass or fail)

If result is NULL:
\t•\tcitations must be an empty array.

⸻

Output Requirements
\t•\tReturn only valid JSON.
\t•\tThe response must exactly match the required output schema.
\t•\tDo not include explanations, commentary, or markdown outside the JSON.
\t•\tDo not restate the condition unless required by the schema.
\t•\tDo not summarize the document.`;

const INPUT_SYSTEM_PROMPT = `Role

You are an AI document analysis agent.

Your job is to analyze documents of any type using only the text retrieved from the vector store and respond according to the required input format.

You may encounter contracts, loan files, credit reports, leases, insurance documents, financial statements, corporate filings, appraisals, or other document types.

⸻

Core Rules (Strict)
\t•\tUse only the retrieved document chunks provided to you.
\t•\tDo not use outside knowledge, assumptions, or industry norms.
\t•\tDo not infer, speculate, or guess.
\t•\tIf the information is not clearly stated in the retrieved text, respond exactly with:
NULL
\t•\tDo not provide legal, tax, financial, underwriting, or compliance advice.
\t•\tKeep responses concise, objective, and evidence-based.
\t•\tPrefer the document's exact wording whenever possible.

⸻

Input Type Handling Rules

The user prompt will specify an input type (e.g., text, boolean, dropdown).

You must strictly follow the formatting requirements based on the input type.

⸻

If input_type = "dropdown"
\t•\tThe user prompt will include a list of valid dropdown options.
\t•\tYour response must be exactly one of those dropdown options.
\t•\tThe response must match the option text exactly (including capitalization and spacing).
\t•\tDo not modify, reword, or partially match the options.
\t•\tDo not return multiple options.
\t•\tDo not add commentary or explanation.
\t•\tIf no option is clearly supported by the document, respond exactly:
NULL

You must choose an option only if it is explicitly supported by the retrieved document text.

If evidence is missing, vague, or conflicting, return:
NULL

⸻

If input_type ≠ "dropdown"
\t•\tFollow the formatting instructions provided in the user prompt.
\t•\tMaintain strict adherence to the requested format.
\t•\tIf the requested information is not clearly stated, respond exactly:
NULL

⸻

Evidence & Classification Rules

When selecting a dropdown option or providing a response:
\t•\tBase your determination only on explicit document evidence.
\t•\tDo not apply external standards or assumptions.
\t•\tIf classification evidence is unclear or incomplete, return:
NULL

⸻

Citations (Mandatory Unless NULL)

Every answer must include citations, except when the answer is:
NULL
\t•\tIf information is found, return 1 to 5 citations.
\t•\tIf multiple distinct sections support the answer, include up to 5 of the strongest citations.
\t•\tDo not include more than 5 citations.
\t•\tAvoid duplicates or redundant citations.
\t•\tPrefer chunks that contain the SPECIFIC data field, form entry, or labeled value over chunks that merely mention the value in a header, title, or repeated report name.
\t•\tFor each citation, you MUST use the exact chunkId, docId, page, and bbox from the chunk header — do NOT fabricate or estimate values.
\t•\tEach citation must include:
\t•\tdocId (from chunk header)
\t•\tchunkId (from chunk header)
\t•\tpage (from chunk header, starting at 1)
\t•\tbbox (from chunk header — {x,y,w,h})
\t•\tan exact quote snippet (5–25 words from the chunk content)
\t•\twhyRelevant

If the answer is NULL:
\t•\tcitations must be an empty array.

⸻

Output Requirements
\t•\tReturn only valid JSON.
\t•\tThe response must exactly match the required output schema.
\t•\tDo not include explanations, commentary, or markdown outside the JSON.
\t•\tDo not restate the question unless required by the schema.
\t•\tDo not summarize the document.`;

/* -------------------------------------------------------------------------- */
/*  RAG: retrieve relevant chunks from vector store                            */
/* -------------------------------------------------------------------------- */

interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

async function retrieveChunks(
  documentFileId: number,
  queryText: string
): Promise<ChunkResult[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const embRes = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: queryText,
  });
  const queryEmbedding = embRes.data[0].embedding;

  const { data, error } = await supabaseAdmin.rpc("match_llama_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: TOP_K,
    filter: { document_id: documentFileId },
  });

  if (error) {
    console.error("[retrieveChunks] RPC error:", error);
    return [];
  }

  return (data ?? []) as ChunkResult[];
}

/* -------------------------------------------------------------------------- */
/*  LLM: run extraction with structured output                                 */
/* -------------------------------------------------------------------------- */

const CONDITION_SCHEMA_EXAMPLE = JSON.stringify({
  answer: true,
  notFound: false,
  confidence: 0.95,
  citations: [
    {
      docId: "string",
      chunkId: "string",
      page: 1,
      bbox: { x: 0.0, y: 0.0, w: 0.0, h: 0.0 },
      snippet: "string",
      whyRelevant: "string",
    },
  ],
  highlights: [{ page: 1, bbox: { x: 0.0, y: 0.0, w: 0.0, h: 0.0 } }],
});

function getInputSchemaExample(inputType: string): string {
  let answerExample: unknown = "string";
  if (inputType === "number") answerExample = 1;
  if (inputType === "currency") answerExample = "$500,000.00";
  if (inputType === "percentage") answerExample = "100%";
  if (inputType === "boolean") answerExample = true;
  if (inputType === "date") answerExample = "2026-01-01";

  return JSON.stringify({
    answer: answerExample,
    notFound: false,
    confidence: 0.95,
    citations: [
      {
        docId: "string",
        chunkId: "string",
        page: 1,
        bbox: { x: 0.0, y: 0.0, w: 0.0, h: 0.0 },
        snippet: "string",
        whyRelevant: "string",
      },
    ],
    highlights: [{ page: 1, bbox: { x: 0.0, y: 0.0, w: 0.0, h: 0.0 } }],
  });
}

function normalizeOutput(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };

  // Normalize answer key: the LLM sometimes uses "response" or "result" instead of "answer"
  if (out.answer === undefined) {
    if (out.response !== undefined) {
      out.answer = out.response;
      delete out.response;
    } else if (out.result !== undefined) {
      // Condition results: map "Pass"/"Fail" to boolean
      const r = out.result;
      if (typeof r === "string") {
        if (r.toLowerCase() === "pass") out.answer = true;
        else if (r.toLowerCase() === "fail") out.answer = false;
        else out.answer = r;
      } else {
        out.answer = r;
      }
      delete out.result;
    }
  }

  if (!out.citations) out.citations = [];
  if (!out.highlights) out.highlights = [];
  if (out.confidence === undefined) out.confidence = 0;
  if (out.notFound === undefined) out.notFound = out.answer == null || out.answer === "NULL";

  return out;
}

async function runExtraction(
  chunks: ChunkResult[],
  aiPrompt: string,
  systemPrompt: string,
  schemaExample: string
): Promise<Record<string, unknown>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const contextText = chunks
    .map((c, i) => {
      const meta = c.metadata as any;
      const page = meta?.page ?? null;
      const bbox = meta?.bbox ?? null;
      const docId = meta?.document_id ?? meta?.docId ?? null;
      return [
        `=== CHUNK ${i + 1} ===`,
        `chunkId: ${c.id}`,
        `docId: ${docId}`,
        `page: ${page}`,
        `bbox: ${bbox ? JSON.stringify(bbox) : "null"}`,
        `content:`,
        c.content,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const citationRule =
    "CRITICAL: For every citation, you MUST copy the exact chunkId, docId, page, and bbox values from the chunk header above. " +
    "Do NOT fabricate or estimate bbox values. If a chunk has bbox: null, use {\"x\":0,\"y\":0,\"w\":0,\"h\":0}. " +
    "The snippet must be a direct quote from that chunk's content (5-30 words).";

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here are the relevant document chunks:\n\n${contextText}\n\n---\n\n${citationRule}\n\n${aiPrompt}\n\nYou MUST respond with valid JSON matching this exact schema:\n${schemaExample}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const rawStr = res.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(rawStr);
    return normalizeOutput(parsed);
  } catch {
    console.error("[runExtraction] Failed to parse LLM JSON:", rawStr.slice(0, 500));
    return { answer: null, notFound: true, confidence: 0, citations: [], highlights: [] };
  }
}

/* -------------------------------------------------------------------------- */
/*  Build user prompt for input extraction (type-aware)                        */
/* -------------------------------------------------------------------------- */

function buildInputUserPrompt(
  aiPrompt: string,
  inputType: string,
  dropdownOptions?: string | string[] | null
): string {
  let prompt = `prompt: ${aiPrompt}\ninput type: ${inputType}`;
  if (inputType === "dropdown" && dropdownOptions) {
    const opts =
      typeof dropdownOptions === "string" ? dropdownOptions : dropdownOptions.join(", ");
    prompt += `\nDropdown Options: ${opts}`;
  }
  return prompt;
}

/* -------------------------------------------------------------------------- */
/*  Bulk extraction: all inputs + conditions for a document type               */
/* -------------------------------------------------------------------------- */

export interface ExtractionResult {
  type: "input" | "condition";
  document_type_ai_input?: number;
  document_type_ai_condition?: number;
  deal_document_id?: number;
  output: Record<string, unknown>;
}

export async function extractAllForDocument(
  documentTypeId: number,
  documentFileId: number,
  dealDocumentId: number
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];

  // Load condition prompts
  const { data: conditionRows } = await supabaseAdmin
    .from("document_type_ai_condition")
    .select("id, condition_label, ai_prompt")
    .eq("document_type", documentTypeId);

  // Load input prompts with input details
  const { data: inputRows } = await supabaseAdmin
    .from("document_type_ai_input")
    .select("id, input_id, ai_prompt, inputs:input_id ( input_type, dropdown_options )")
    .eq("document_type_id", documentTypeId);

  // Process conditions
  for (const cond of conditionRows ?? []) {
    if (!cond.ai_prompt) continue;
    try {
      const chunks = await retrieveChunks(documentFileId, cond.ai_prompt);
      const output = await runExtraction(chunks, cond.ai_prompt, CONDITION_SYSTEM_PROMPT, CONDITION_SCHEMA_EXAMPLE);
      results.push({
        type: "condition",
        document_type_ai_condition: cond.id,
        deal_document_id: dealDocumentId,
        output,
      });
    } catch (err) {
      console.error(`[extractAll] Condition ${cond.id} failed:`, err);
      results.push({
        type: "condition",
        document_type_ai_condition: cond.id,
        deal_document_id: dealDocumentId,
        output: { answer: null, notFound: true, confidence: 0, citations: [], highlights: [] },
      });
    }
  }

  // Process inputs
  for (const inp of inputRows ?? []) {
    if (!inp.ai_prompt) continue;
    const inputMeta = inp.inputs as any;
    const inputType = inputMeta?.input_type ?? "text";
    const dropdownOptions = inputMeta?.dropdown_options ?? null;

    const userPrompt = buildInputUserPrompt(inp.ai_prompt, inputType, dropdownOptions);
    try {
      const chunks = await retrieveChunks(documentFileId, inp.ai_prompt);
      const output = await runExtraction(chunks, userPrompt, INPUT_SYSTEM_PROMPT, getInputSchemaExample(inputType));
      results.push({
        type: "input",
        document_type_ai_input: inp.id,
        deal_document_id: dealDocumentId,
        output,
      });
    } catch (err) {
      console.error(`[extractAll] Input ${inp.id} failed:`, err);
      results.push({
        type: "input",
        document_type_ai_input: inp.id,
        deal_document_id: dealDocumentId,
        output: { answer: null, notFound: true, confidence: 0, citations: [], highlights: [] },
      });
    }
  }

  return results;
}

/* -------------------------------------------------------------------------- */
/*  Single-item extraction: re-run one input or condition                       */
/* -------------------------------------------------------------------------- */

export async function extractSingleItem(
  item: {
    id: number;
    type: "input" | "condition";
    label?: string;
    input_id?: string | number;
    input_type?: string;
    dropdown_options?: string | string[] | null;
    document_type_ai_input_id?: number;
    document_type_ai_condition_id?: number;
  },
  dealDocument: {
    id: number;
    document_type_id: number;
    document_file_id: number;
  }
): Promise<ExtractionResult[]> {
  if (item.type === "condition") {
    const condId = item.document_type_ai_condition_id ?? item.id;

    const { data: condRow } = await supabaseAdmin
      .from("document_type_ai_condition")
      .select("id, ai_prompt")
      .eq("id", condId)
      .single();

    if (!condRow?.ai_prompt) {
      return [
        {
          type: "condition",
          document_type_ai_condition: condId,
          deal_document_id: dealDocument.id,
          output: { answer: null, notFound: true, confidence: 0, citations: [], highlights: [] },
        },
      ];
    }

    const chunks = await retrieveChunks(dealDocument.document_file_id, condRow.ai_prompt);
    const output = await runExtraction(chunks, condRow.ai_prompt, CONDITION_SYSTEM_PROMPT, CONDITION_SCHEMA_EXAMPLE);

    return [
      {
        type: "condition",
        document_type_ai_condition: condRow.id,
        deal_document_id: dealDocument.id,
        output,
      },
    ];
  }

  // Input type
  const dtaiId = item.document_type_ai_input_id;

  let aiPrompt: string | null = null;
  let inputType = item.input_type ?? "text";
  let dropdownOptions = item.dropdown_options ?? null;
  let resolvedDtaiId = dtaiId;

  if (dtaiId) {
    const { data: dtaiRow } = await supabaseAdmin
      .from("document_type_ai_input")
      .select("id, ai_prompt, input_id, inputs:input_id ( input_type, dropdown_options )")
      .eq("id", dtaiId)
      .single();

    if (dtaiRow) {
      aiPrompt = dtaiRow.ai_prompt;
      const inputMeta = dtaiRow.inputs as any;
      inputType = inputMeta?.input_type ?? inputType;
      dropdownOptions = inputMeta?.dropdown_options ?? dropdownOptions;
      resolvedDtaiId = dtaiRow.id;
    }
  }

  if (!aiPrompt) {
    // Try looking up by input_id + document_type_id
    if (item.input_id && dealDocument.document_type_id) {
      const { data: dtaiRow } = await supabaseAdmin
        .from("document_type_ai_input")
        .select("id, ai_prompt, inputs:input_id ( input_type, dropdown_options )")
        .eq("input_id", item.input_id)
        .eq("document_type_id", dealDocument.document_type_id)
        .maybeSingle();

      if (dtaiRow) {
        aiPrompt = dtaiRow.ai_prompt;
        const inputMeta = dtaiRow.inputs as any;
        inputType = inputMeta?.input_type ?? inputType;
        dropdownOptions = inputMeta?.dropdown_options ?? dropdownOptions;
        resolvedDtaiId = dtaiRow.id;
      }
    }
  }

  if (!aiPrompt) {
    return [
      {
        type: "input",
        document_type_ai_input: resolvedDtaiId ?? 0,
        deal_document_id: dealDocument.id,
        output: { answer: null, notFound: true, confidence: 0, citations: [], highlights: [] },
      },
    ];
  }

  const userPrompt = buildInputUserPrompt(aiPrompt, inputType, dropdownOptions);
  const chunks = await retrieveChunks(dealDocument.document_file_id, aiPrompt);
  const output = await runExtraction(chunks, userPrompt, INPUT_SYSTEM_PROMPT, getInputSchemaExample(inputType));

  return [
    {
      type: "input",
      document_type_ai_input: resolvedDtaiId ?? 0,
      deal_document_id: dealDocument.id,
      output,
    },
  ];
}
