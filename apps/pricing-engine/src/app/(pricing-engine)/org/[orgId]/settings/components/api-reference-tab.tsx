"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  ChevronRight,
  Copy,
  Check,
  Download,
  Search,
  Code2,
  FileJson2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@repo/lib/cn"
import {
  API_ENDPOINTS,
  type ApiEndpoint,
  type HttpMethod,
  groupEndpointsByTag,
  generateCurl,
  generateFetch,
  generatePython,
  methodColor,
} from "@/lib/api-endpoint-registry"

type SnippetLang = "curl" | "javascript" | "python"

const LANG_LABELS: Record<SnippetLang, string> = {
  curl: "cURL",
  javascript: "JavaScript",
  python: "Python",
}

interface APIReferenceTabProps {
  availableScopes: string[]
  apiKeys: Array<{
    id: string
    name: string
    scopes: string[] | null
    revoked: boolean
    expired: boolean
  }>
}

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wide shrink-0",
        methodColor(method),
      )}
    >
      {method}
    </span>
  )
}

function CodeBlock({
  code,
  lang,
  onCopy,
}: {
  code: string
  lang: string
  onCopy: (text: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative rounded-lg border bg-[#0d1117] dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
          {lang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12px] leading-relaxed text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function EndpointCard({
  endpoint,
  baseUrl,
  selectedKeySecret,
  defaultOpen,
}: {
  endpoint: ApiEndpoint
  baseUrl: string
  selectedKeySecret: string
  defaultOpen: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [activeLang, setActiveLang] = useState<SnippetLang>("curl")

  const snippetGenerators: Record<SnippetLang, () => string> = {
    curl: () => generateCurl(endpoint, baseUrl, selectedKeySecret),
    javascript: () => generateFetch(endpoint, baseUrl, selectedKeySecret),
    python: () => generatePython(endpoint, baseUrl, selectedKeySecret),
  }

  const snippet = snippetGenerators[activeLang]()

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all hover:bg-muted/50",
            isOpen && "rounded-b-none border-b-0 bg-muted/30",
          )}
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-90",
            )}
          />
          <MethodBadge method={endpoint.method} />
          <code className="text-[13px] font-mono font-medium flex-1 truncate">
            {endpoint.path}
          </code>
          <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[200px]">
            {endpoint.summary}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 bg-card px-4 py-4 space-y-4">
          <div className="space-y-1">
            <p className="text-sm">{endpoint.description}</p>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-mono"
              >
                {endpoint.scope}
              </Badge>
            </div>
          </div>

          {/* Path params */}
          {endpoint.pathParams && endpoint.pathParams.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Path Parameters
              </h4>
              <div className="rounded-md border divide-y">
                {endpoint.pathParams.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <code className="font-mono font-medium text-foreground">
                      {p.name}
                    </code>
                    <span className="text-muted-foreground">
                      {p.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query params */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Query Parameters
              </h4>
              <div className="rounded-md border divide-y">
                {endpoint.queryParams.map((q) => (
                  <div key={q.name} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <code className="font-mono font-medium text-foreground">
                      {q.name}
                    </code>
                    {q.required && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0">
                        required
                      </Badge>
                    )}
                    <span className="text-muted-foreground flex-1">
                      {q.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request body */}
          {endpoint.requestBody && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Request Body
              </h4>
              <CodeBlock
                code={JSON.stringify(endpoint.requestBody.example, null, 2)}
                lang="json"
                onCopy={copyToClipboard}
              />
            </div>
          )}

          {/* Response */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Response {endpoint.response.status ?? 200}
            </h4>
            <CodeBlock
              code={JSON.stringify(endpoint.response.example, null, 2)}
              lang="json"
              onCopy={copyToClipboard}
            />
          </div>

          {/* Code snippets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {(Object.keys(LANG_LABELS) as SnippetLang[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    activeLang === lang
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>
            <CodeBlock
              code={snippet}
              lang={LANG_LABELS[activeLang]}
              onCopy={copyToClipboard}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function APIReferenceTab({
  availableScopes,
  apiKeys,
}: APIReferenceTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [downloadingSpec, setDownloadingSpec] = useState(false)

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const placeholder = "sk_live_••••••••••••••••"

  const filteredEndpoints = useMemo(() => {
    let endpoints = API_ENDPOINTS.filter((ep) =>
      availableScopes.includes(ep.scope),
    )

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      endpoints = endpoints.filter(
        (ep) =>
          ep.path.toLowerCase().includes(q) ||
          ep.summary.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q) ||
          ep.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    return endpoints
  }, [availableScopes, searchQuery])

  const grouped = useMemo(
    () => groupEndpointsByTag(filteredEndpoints),
    [filteredEndpoints],
  )

  const handleDownloadSpec = useCallback(async () => {
    setDownloadingSpec(true)
    try {
      const res = await fetch("/api/org/api-keys/openapi")
      if (!res.ok) throw new Error("Failed to fetch spec")
      const spec = await res.json()
      const blob = new Blob([JSON.stringify(spec, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "openapi.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to download OpenAPI spec:", err)
    } finally {
      setDownloadingSpec(false)
    }
  }, [])

  if (availableScopes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
            <Code2 className="size-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-base">No API endpoints enabled</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
            Enable API access policies in the Policy Builder to see available
            endpoints and generate documentation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="pl-8 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSpec}
            disabled={downloadingSpec}
          >
            <Download className="size-3.5 mr-1.5" />
            OpenAPI Spec
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.open(
                `/api/org/api-keys/openapi`,
                "_blank",
              )
            }}
          >
            <FileJson2 className="size-3.5 mr-1.5" />
            View JSON
          </Button>
        </div>
      </div>

      {/* Auth info */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Code2 className="size-3.5 text-muted-foreground" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-medium text-sm">Authentication</p>
              <p className="text-muted-foreground">
                All endpoints require a Bearer token. Include your API key in
                the <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">Authorization</code> header:
              </p>
              <code className="block rounded-md border bg-[#0d1117] dark:bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-300">
                Authorization: Bearer {placeholder}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">
            {filteredEndpoints.length}
          </span>{" "}
          endpoint{filteredEndpoints.length !== 1 ? "s" : ""}
        </span>
        <div className="h-4 w-px bg-border" />
        <span>
          <span className="font-medium text-foreground">
            {Object.keys(grouped).length}
          </span>{" "}
          resource{Object.keys(grouped).length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Endpoint groups */}
      {Object.entries(grouped).map(([tag, endpoints]) => (
        <div key={tag} className="space-y-2">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            {tag}
            <Badge variant="secondary" className="text-[10px] font-normal">
              {endpoints.length}
            </Badge>
          </h3>
          <div className="space-y-1.5">
            {endpoints.map((ep) => (
              <EndpointCard
                key={`${ep.method}-${ep.path}`}
                endpoint={ep}
                baseUrl={baseUrl}
                selectedKeySecret={placeholder}
                defaultOpen={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
