import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/** Derive the project ref from the configured Supabase URL (e.g. "iufoslzvcjmtgsazttkt"). */
const CONFIGURED_PROJECT_REF =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

async function assertInternalAdmin(): Promise<{ error: NextResponse } | { error: null }> {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return { error: NextResponse.json({ message: 'Unauthorized.' }, { status: 401 }) }
  }

  const isInternal = sessionClaims?.is_internal_yn === true
  const orgRole = sessionClaims?.org_role as string | undefined
  const isAdminOrOwner = orgRole === 'org:admin' || orgRole === 'org:owner'

  if (!isInternal || !isAdminOrOwner) {
    return { error: NextResponse.json({ message: 'Forbidden.' }, { status: 403 }) }
  }

  return { error: null }
}

async function forwardToSupabaseAPI(
  request: Request,
  method: string,
  params: { path: string[] }
) {
  if (!process.env.SUPABASE_MANAGEMENT_API_TOKEN) {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 })
  }

  const guard = await assertInternalAdmin()
  if (guard.error) return guard.error

  const { path } = params
  const apiPath = path.join('/')

  // Lock proxy to only the configured Supabase project
  const requestedRef = path[2]
  if (CONFIGURED_PROJECT_REF && requestedRef && requestedRef !== CONFIGURED_PROJECT_REF) {
    return NextResponse.json(
      { message: 'You do not have permission to access this project.' },
      { status: 403 }
    )
  }

  const url = new URL(request.url)
  url.protocol = 'https'
  url.hostname = 'api.supabase.com'
  url.port = '443'
  url.pathname = '/' + apiPath

  try {
    const forwardHeaders: HeadersInit = {
      Authorization: `Bearer ${process.env.SUPABASE_MANAGEMENT_API_TOKEN}`,
    }

    const contentType = request.headers.get('content-type')
    if (contentType) {
      forwardHeaders['Content-Type'] = contentType
    }

    const fetchOptions: RequestInit = {
      method,
      headers: forwardHeaders,
    }

    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) fetchOptions.body = body
      } catch (err) {
        console.warn('Could not read request body:', err)
      }
    }

    const response = await fetch(url, fetchOptions)
    const responseText = await response.text()
    let responseData: unknown

    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch {
      responseData = responseText
    }

    return NextResponse.json(responseData, { status: response.status })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred.'
    console.error('Supabase API proxy error:', error)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardToSupabaseAPI(request, 'GET', await params)
}

export async function HEAD(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardToSupabaseAPI(request, 'HEAD', await params)
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardToSupabaseAPI(request, 'POST', await params)
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardToSupabaseAPI(request, 'PUT', await params)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return forwardToSupabaseAPI(request, 'DELETE', await params)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return forwardToSupabaseAPI(request, 'PATCH', await params)
}
