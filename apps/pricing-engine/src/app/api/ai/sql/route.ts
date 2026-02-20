import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import createClient from 'openapi-fetch'

import type { paths } from '@/lib/management-api-schema'
import { listTablesSql } from '@/lib/pg-meta'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const managementClient = createClient<paths>({
  baseUrl: 'https://api.supabase.com',
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_MANAGEMENT_API_TOKEN}`,
  },
})

async function getDbSchema(projectRef: string) {
  const token = process.env.SUPABASE_MANAGEMENT_API_TOKEN
  if (!token) throw new Error('Supabase Management API token is not configured.')

  const { data, error } = await managementClient.POST('/v1/projects/{ref}/database/query', {
    params: { path: { ref: projectRef } },
    body: { query: listTablesSql(), read_only: true },
  })

  if (error) throw error
  return data as unknown[]
}

function formatSchemaForPrompt(schema: unknown[]) {
  return schema
    .map((table: any) => {
      const cols = (table.columns ?? []).map((c: any) => `${c.name} (${c.data_type})`).join(', ')
      return `Table "${table.name}" has columns: ${cols}.`
    })
    .join('\n')
}

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  const isInternal = sessionClaims?.is_internal_yn === true
  const orgRole = sessionClaims?.org_role as string | undefined
  const isAdminOrOwner = orgRole === 'org:admin' || orgRole === 'org:owner'

  if (!isInternal || !isAdminOrOwner) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 })
  }

  if (!process.env.NEXT_PUBLIC_ENABLE_AI_QUERIES) {
    return NextResponse.json({ message: 'AI SQL generation is not enabled.' }, { status: 503 })
  }

  try {
    const { prompt, projectRef } = await request.json()

    if (!prompt) return NextResponse.json({ message: 'Prompt is required.' }, { status: 400 })
    if (!projectRef) return NextResponse.json({ message: 'projectRef is required.' }, { status: 400 })

    const schema = await getDbSchema(projectRef)
    const schemaStr = formatSchemaForPrompt(schema)

    const systemPrompt =
      `You are an expert SQL assistant. Given the following database schema, write a SQL query ` +
      `that answers the user's question. Return only the SQL query, no explanations or markdown.\n\nSchema:\n${schemaStr}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    })

    const sql = response.choices[0]?.message?.content?.trim()

    if (!sql) {
      return NextResponse.json({ message: 'Could not generate SQL from the prompt.' }, { status: 500 })
    }

    return NextResponse.json({ sql })
  } catch (error: unknown) {
    console.error('AI SQL generation error:', error)
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
