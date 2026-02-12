/**
 * Documenso API Client
 * 
 * Required environment variables:
 * - DOCUMENSO_API_KEY: Your Documenso API key from app.documenso.com
 * - DOCUMENSO_API_URL: Base API URL (defaults to https://app.documenso.com/api)
 */

const DOCUMENSO_BASE_URL = process.env.DOCUMENSO_API_URL || "https://app.documenso.com/api"
// Normalize: strip any trailing /v1 or /v2 so we can append the version per-endpoint
const DOCUMENSO_API_URL = DOCUMENSO_BASE_URL.replace(/\/api\/v[12]$/, "/api")
const DOCUMENSO_API_KEY = process.env.DOCUMENSO_API_KEY

if (!DOCUMENSO_API_KEY) {
  console.warn("DOCUMENSO_API_KEY is not set. Documenso features will not work.")
}

interface DocumensoRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: Record<string, unknown>
}

/**
 * Make an authenticated request to the Documenso v1 API
 */
export async function documensoFetch<T = unknown>(
  endpoint: string,
  options: DocumensoRequestOptions = {}
): Promise<T> {
  const { method = "GET", body } = options

  if (!DOCUMENSO_API_KEY) {
    throw new Error("DOCUMENSO_API_KEY is not configured")
  }

  const response = await fetch(`${DOCUMENSO_API_URL}/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${DOCUMENSO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Documenso API error: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Make an authenticated request to the Documenso v2 API
 */
export async function documensoFetchV2<T = unknown>(
  endpoint: string,
  options: DocumensoRequestOptions = {}
): Promise<T> {
  const { method = "GET", body } = options

  if (!DOCUMENSO_API_KEY) {
    throw new Error("DOCUMENSO_API_KEY is not configured")
  }

  const response = await fetch(`${DOCUMENSO_API_URL}/v2${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${DOCUMENSO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Documenso API error: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Create a presign token for embedded document authoring (v2 API)
 * Endpoint: POST /api/v2/embedding/create-presign-token
 * This allows users to create/edit documents within your app
 */
export async function createPresignToken(): Promise<{
  token: string
  expiresAt: string
}> {
  return documensoFetchV2("/embedding/create-presign-token", {
    method: "POST",
    body: {},
  })
}

/**
 * Get document details by ID
 */
export async function getDocument(documentId: string): Promise<{
  id: string
  title: string
  status: string
  recipients: Array<{
    id: string
    email: string
    name: string
    role: string
    signingStatus: string
  }>
}> {
  return documensoFetch(`/documents/${documentId}`)
}

/**
 * Delete/cancel a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await documensoFetch(`/documents/${documentId}`, {
    method: "DELETE",
  })
}

export { DOCUMENSO_API_URL, DOCUMENSO_API_KEY }
