"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@repo/ui/shadcn/button"
import { Card } from "@repo/ui/shadcn/card"
import { Input } from "@repo/ui/shadcn/input"
import { PasswordInput } from "@repo/ui/custom/password-input"
import { Label } from "@repo/ui/shadcn/label"
import { Separator } from "@repo/ui/shadcn/separator"
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/shadcn/tabs"
import { Badge } from "@repo/ui/shadcn/badge"
import { Check, Cog, ExternalLink, Plus, Search, Archive } from "lucide-react"
import { IntegrationIcon } from "@/components/workflow-builder/ui/integration-icon"
import { getIntegration } from "@/components/workflow-builder/plugins"
import type { IntegrationType } from "@/components/workflow-builder/lib/types/integration"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/shadcn/dialog"
import { useToast } from "@/hooks/use-toast"

const integrationIcons = {
  floify: (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-card shadow-sm ring-1 ring-border">
      <Image
        src="/integrations/floify-logo.png"
        alt="Floify"
        fill
        sizes="40px"
        className="object-contain p-1"
        priority
      />
    </div>
  ),
  xactus: (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-card shadow-sm ring-1 ring-border">
      <Image
        src="/integrations/xactus-logo.png"
        alt="Xactus"
        fill
        sizes="40px"
        className="object-contain p-1"
        priority
      />
    </div>
  ),
  clear: (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-card shadow-sm ring-1 ring-border">
      <Image
        src="/integrations/clear-thomson-reuters-logo.png"
        alt="Clear (Thomson Reuters)"
        fill
        sizes="40px"
        className="object-contain p-1"
        priority
      />
    </div>
  ),
  nadlan: (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-card shadow-sm ring-1 ring-border">
      <Image
        src="/integrations/nadlan-logo.png"
        alt="Nadlan Valuation"
        fill
        sizes="40px"
        className="object-contain p-1"
        priority
      />
    </div>
  ),
  github: (
    <svg width="40" height="40" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46c6.397 1.185 8.746-2.777 8.746-6.158c0-3.052-.12-13.135-.174-23.83c-35.61 7.742-43.124-15.103-43.124-15.103c-5.823-14.795-14.213-18.73-14.213-18.73c-11.613-7.944.876-7.78.876-7.78c12.853.902 19.621 13.19 19.621 13.19c11.417 19.568 29.945 13.911 37.249 10.64c1.149-8.272 4.466-13.92 8.127-17.116c-28.431-3.236-58.318-14.212-58.318-63.258c0-13.975 5-25.394 13.188-34.358c-1.329-3.224-5.71-16.242 1.24-33.874c0 0 10.749-3.44 35.21 13.121c10.21-2.836 21.16-4.258 32.038-4.307c10.878.049 21.837 1.47 32.066 4.307c24.431-16.56 35.165-13.12 35.165-13.12c6.967 17.63 2.584 30.65 1.255 33.873c8.207 8.964 13.173 20.383 13.173 34.358c0 49.163-29.944 59.988-58.447 63.157c4.591 3.972 8.682 11.762 8.682 23.704c0 17.126-.148 30.91-.148 35.126c0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002C256 57.307 198.691 0 128.001 0m-80.06 182.34c-.282.636-1.283.827-2.194.39c-.929-.417-1.45-1.284-1.15-1.922c.276-.655 1.279-.838 2.205-.399c.93.418 1.46 1.293 1.139 1.931m6.296 5.618c-.61.566-1.804.303-2.614-.591c-.837-.892-.994-2.086-.375-2.66c.63-.566 1.787-.301 2.626.591c.838.903 1 2.088.363 2.66m4.32 7.188c-.785.545-2.067.034-2.86-1.104c-.784-1.138-.784-2.503.017-3.05c.795-.547 2.058-.055 2.861 1.075c.782 1.157.782 2.522-.019 3.08m7.304 8.325c-.701.774-2.196.566-3.29-.49c-1.119-1.032-1.43-2.496-.726-3.27c.71-.776 2.213-.558 3.315.49c1.11 1.03 1.45 2.505.701 3.27m9.442 2.81c-.31 1.003-1.75 1.459-3.199 1.033c-1.448-.439-2.395-1.613-2.103-2.626c.301-1.01 1.747-1.484 3.207-1.028c1.446.436 2.396 1.602 2.095 2.622m10.744 1.193c.036 1.055-1.193 1.93-2.715 1.95c-1.53.034-2.769-.82-2.786-1.86c0-1.065 1.202-1.932 2.733-1.958c1.522-.03 2.768.818 2.768 1.868m10.555-.405c.182 1.03-.875 2.088-2.387 2.37c-1.485.271-2.861-.365-3.05-1.386c-.184-1.056.893-2.114 2.376-2.387c1.514-.263 2.868.356 3.061 1.403"
      />
    </svg>
  ),
  whatsapp: (
    <svg width="40" height="40" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logosWhatsappIcon0" x1="50%" x2="50%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#1FAF38" />
          <stop offset="100%" stopColor="#60D669" />
        </linearGradient>
        <linearGradient id="logosWhatsappIcon1" x1="50%" x2="50%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#F9F9F9" />
          <stop offset="100%" stopColor="#FFF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#logosWhatsappIcon0)"
        d="M5.463 127.456c-.006 21.677 5.658 42.843 16.428 61.499L4.433 252.697l65.232-17.104a123 123 0 0 0 58.8 14.97h.054c67.815 0 123.018-55.183 123.047-123.01c.013-32.867-12.775-63.773-36.009-87.025c-23.23-23.25-54.125-36.061-87.043-36.076c-67.823 0-123.022 55.18-123.05 123.004"
      />
      <path
        fill="url(#logosWhatsappIcon1)"
        d="M1.07 127.416c-.007 22.457 5.86 44.38 17.014 63.704L0 257.147l67.571-17.717c18.618 10.151 39.58 15.503 60.91 15.511h.055c70.248 0 127.434-57.168 127.464-127.423c.012-34.048-13.236-66.065-37.3-90.15C194.633 13.286 162.633.014 128.536 0C58.276 0 1.099 57.16 1.071 127.416m40.24 60.376l-2.523-4.005c-10.606-16.864-16.204-36.352-16.196-56.363C22.614 69.029 70.138 21.52 128.576 21.52c28.3.012 54.896 11.044 74.9 31.06c20.003 20.018 31.01 46.628 31.003 74.93c-.026 58.395-47.551 105.91-105.943 105.91h-.042c-19.013-.01-37.66-5.116-53.922-14.765l-3.87-2.295l-40.098 10.513z"
      />
      <path
        fill="#FFF"
        d="M96.678 74.148c-2.386-5.303-4.897-5.41-7.166-5.503c-1.858-.08-3.982-.074-6.104-.074c-2.124 0-5.575.799-8.492 3.984c-2.92 3.188-11.148 10.892-11.148 26.561s11.413 30.813 13.004 32.94c1.593 2.123 22.033 35.307 54.405 48.073c26.904 10.609 32.379 8.499 38.218 7.967c5.84-.53 18.844-7.702 21.497-15.139c2.655-7.436 2.655-13.81 1.859-15.142c-.796-1.327-2.92-2.124-6.105-3.716s-18.844-9.298-21.763-10.361c-2.92-1.062-5.043-1.592-7.167 1.597c-2.124 3.184-8.223 10.356-10.082 12.48c-1.857 2.129-3.716 2.394-6.9.801c-3.187-1.598-13.444-4.957-25.613-15.806c-9.468-8.442-15.86-18.867-17.718-22.056c-1.858-3.184-.199-4.91 1.398-6.497c1.431-1.427 3.186-3.719 4.78-5.578c1.588-1.86 2.118-3.187 3.18-5.311c1.063-2.126.531-3.986-.264-5.579c-.798-1.593-6.987-17.343-9.819-23.64"
      />
    </svg>
  ),
}

type IntegrationType = {
  name: string
  description: string
  icon: keyof typeof integrationIcons
  enabled: boolean
  hasKey?: boolean
  link?: string
}

const baseIntegrations: IntegrationType[] = [
  {
    name: "Floify",
    description: "Manage loan applications, documents, and borrower communication.",
    icon: "floify",
    enabled: false,
    link: "https://floify.com/",
  },
  {
    name: "Xactus",
    description: "Pull credit reports and borrower verification data.",
    icon: "xactus",
    enabled: false,
    link: "https://xactus.com/",
  },
  {
    name: "Clear (Thomson Reuters)",
    description: "Run background and identity checks.",
    icon: "clear",
    enabled: false,
    link: "https://legal.thomsonreuters.com/en/products/clear",
  },
  {
    name: "Nadlan Valuation",
    description: "Order property appraisals and valuations.",
    icon: "nadlan",
    enabled: false,
    link: "https://nadlanvaluation.com/",
  },
]

type WorkflowIntegrationItem = {
  id: string
  type: string
  name: string
  configured: boolean
}

const allIntegrationMeta: Record<string, { label: string; description: string; link?: string }> = {
  floify: { label: "Floify", description: "Manage loan applications, documents, and borrower communication.", link: "https://floify.com/" },
  xactus: { label: "Xactus", description: "Pull credit reports and borrower verification data.", link: "https://xactus.com/" },
  clear: { label: "Clear (Thomson Reuters)", description: "Run background and identity checks.", link: "https://legal.thomsonreuters.com/en/products/clear" },
  nadlan: { label: "Nadlan Valuation", description: "Order property appraisals and valuations.", link: "https://nadlanvaluation.com/" },
  perplexity: { label: "Perplexity", description: "AI-powered web search.", link: "https://perplexity.ai/settings/api" },
  "ai-gateway": { label: "AI Gateway / OpenAI", description: "Generate text and images with AI models.", link: "https://platform.openai.com/api-keys" },
  fal: { label: "fal.ai", description: "Generate images and video with Flux models.", link: "https://fal.ai/dashboard/keys" },
  slack: { label: "Slack", description: "Send messages to Slack channels.", link: "https://api.slack.com/apps" },
  resend: { label: "Resend", description: "Send transactional emails.", link: "https://resend.com/api-keys" },
  linear: { label: "Linear", description: "Create and manage issues.", link: "https://linear.app/settings" },
  github: { label: "GitHub", description: "Interact with repositories and issues.", link: "https://github.com/settings/tokens" },
  stripe: { label: "Stripe", description: "Process payments and manage billing.", link: "https://dashboard.stripe.com/apikeys" },
  clerk: { label: "Clerk", description: "Manage users and authentication.", link: "https://dashboard.clerk.com" },
  firecrawl: { label: "Firecrawl", description: "Scrape and crawl web pages.", link: "https://firecrawl.dev/app/api-keys" },
  blob: { label: "Vercel Blob", description: "Upload and store files.", link: "https://vercel.com/dashboard/stores" },
  database: { label: "Database", description: "Query a PostgreSQL database." },
  v0: { label: "v0", description: "Generate UI components with AI.", link: "https://v0.dev/chat/settings/keys" },
  webflow: { label: "Webflow", description: "Manage Webflow CMS content.", link: "https://webflow.com" },
  supabase: { label: "Supabase", description: "Database, storage, and edge functions.", link: "https://supabase.com" },
  superagent: { label: "Superagent", description: "Run AI agent workflows.", link: "https://superagent.sh" },
}

const PLATFORM_TYPES = ["floify", "xactus", "clear", "nadlan"]
const WORKFLOW_TYPES = Object.keys(allIntegrationMeta).filter((t) => !PLATFORM_TYPES.includes(t))

export default function SettingsIntegrationsPage() {
  const [activeIntegrations, setActiveIntegrations] = React.useState<IntegrationType[]>(baseIntegrations)
  const [tab, setTab] = React.useState<"all" | "active" | "inactive">("all")
  const [query, setQuery] = React.useState("")
  const [_loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  // Workflow integrations state
  const [workflowIntegrations, setWorkflowIntegrations] = React.useState<WorkflowIntegrationItem[]>([])
  const [wfAddModalOpen, setWfAddModalOpen] = React.useState(false)
  const [wfAddType, setWfAddType] = React.useState("")
  const [wfAddFieldValues, setWfAddFieldValues] = React.useState<Record<string, string>>({})
  const [wfAddLoading, setWfAddLoading] = React.useState(false)
  const [wfAddError, setWfAddError] = React.useState<string | null>(null)

  // Platform status is now loaded via loadWorkflowIntegrations which fetches all types

  const loadWorkflowIntegrations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/workflow-integrations", { cache: "no-store" })
      if (!res.ok) return
      const j = await res.json().catch(() => ({}))
      const items = (j.integrations ?? []) as Array<{
        id: string; type: string; name: string; config: Record<string, string>
      }>
      setWorkflowIntegrations(
        items.map((i) => ({
          id: i.id,
          type: i.type,
          name: i.name || allIntegrationMeta[i.type]?.label || i.type,
          configured: Object.values(i.config).some((v) => v === "configured" || (v && v !== "")),
        }))
      )

      // Update platform cards configured state from the same data
      setActiveIntegrations((prev) =>
        prev.map((integration) => {
          const existing = items.find((i) => i.type === integration.icon)
          const hasKey = existing ? Object.values(existing.config).some((v) => v === "configured" || (v && v !== "")) : false
          return { ...integration, hasKey, enabled: hasKey }
        })
      )
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    loadWorkflowIntegrations()
  }, [loadWorkflowIntegrations])

  // Get credential field config dynamically from plugin registry
  const getWfFields = React.useCallback((type: string): { key: string; label: string; isSecret: boolean }[] => {
    // Try to get fields from plugin registry first
    const plugin = getIntegration(type as IntegrationType)
    if (plugin?.formFields?.length) {
      return plugin.formFields.map((f) => ({
        key: f.configKey,
        label: f.label,
        isSecret: f.type === "password",
      }))
    }

    switch (type) {
      case "floify": return [
        { key: "x_api_key", label: "X-API-KEY", isSecret: false },
        { key: "user_api_key", label: "User API Key", isSecret: false },
      ]
      case "xactus": return [
        { key: "account_user", label: "Account User", isSecret: false },
        { key: "account_password", label: "Account Password", isSecret: true },
      ]
      case "clear":
      case "nadlan": return [
        { key: "username", label: "Username", isSecret: false },
        { key: "password", label: "Password", isSecret: true },
      ]
      case "database": return [{ key: "url", label: "Database URL", isSecret: true }]
      default: return [{ key: "apiKey", label: "API Key", isSecret: true }]
    }
  }, [])

  const handleWfAdd = async (type: string) => {
    setWfAddType(type)
    setWfAddFieldValues({})
    setWfAddError(null)
    setWfAddModalOpen(true)

    // If this integration already exists, fetch its current config to pre-fill
    const existing = workflowIntegrations.find((w) => w.type === type)
    if (existing) {
      try {
        const res = await fetch(`/api/workflow-integrations?id=${encodeURIComponent(existing.id)}`, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const config = data.integration?.config as Record<string, string> | undefined
          if (config) {
            const fields = getWfFields(type)
            const prefilled: Record<string, string> = {}
            for (const field of fields) {
              const val = config[field.key]
              if (val) prefilled[field.key] = val
            }
            setWfAddFieldValues(prefilled)
          }
        }
      } catch {
        // ignore fetch errors, user can re-enter
      }
    }
  }

  const handleWfSave = async () => {
    setWfAddLoading(true)
    setWfAddError(null)
    try {
      const fields = getWfFields(wfAddType)
      const existing = workflowIntegrations.find((w) => w.type === wfAddType)
      const config: Record<string, string> = {}

      // Build config from all field values
      for (const field of fields) {
        const val = (wfAddFieldValues[field.key] || "").trim()
        // For secret fields on existing integrations: if left empty, send "configured" to preserve existing value
        config[field.key] = (existing && !val && field.isSecret) ? "configured" : val
      }

      if (existing) {
        // Update existing integration
        const res = await fetch(`/api/workflow-integrations/${encodeURIComponent(existing.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to save" }))
          throw new Error(err.error)
        }
      } else {
        // Create new integration
        const res = await fetch("/api/workflow-integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: wfAddType, name: null, config }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to save" }))
          throw new Error(err.error)
        }
      }

      toast({ title: "Saved", description: `${allIntegrationMeta[wfAddType]?.label || wfAddType} credentials saved.` })
      setWfAddModalOpen(false)
      loadWorkflowIntegrations()
    } catch (e) {
      setWfAddError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setWfAddLoading(false)
    }
  }

  const handleWfDelete = async (id: string) => {
    try {
      await fetch(`/api/workflow-integrations/${id}`, { method: "DELETE" })
      toast({ title: "Archived", description: "Integration archived. It can be restored later." })
      loadWorkflowIntegrations()
    } catch {
      // ignore
    }
  }

  const filtered = activeIntegrations.filter((integration) => {
    const matchesTab =
      tab === "all" ? true : tab === "active" ? integration.enabled : !integration.enabled
    const matchesQuery =
      query.trim().length === 0 ||
      integration.name.toLowerCase().includes(query.toLowerCase()) ||
      integration.description.toLowerCase().includes(query.toLowerCase())
    return matchesTab && matchesQuery
  })

  return (
    <div className="flex w-full flex-col gap-6">
      {error ? <div className="text-sm text-destructive">Failed to load integrations: {error}</div> : null}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full md:w-auto">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="w-full">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="w-full">
              Active
            </TabsTrigger>
            <TabsTrigger value="inactive" className="w-full">
              Inactive
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full md:max-w-xs">
          <Label htmlFor="settings4-search" className="sr-only">
            Search
          </Label>
          <div className="flex items-center gap-2 rounded-md border px-3">
            <Search className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            <Input
              id="settings4-search"
              type="search"
              placeholder="Search"
              autoComplete="off"
              name="integration-search"
              className="h-10 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Platform Integrations */}
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Platform</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {filtered.map((integration) => (
          <Card key={integration.name} className="border shadow-sm">
            <div className="space-y-4 px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="text-foreground">{integrationIcons[integration.icon]}</div>
                <div className="flex items-center gap-1">
                  {integration.hasKey && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Check className="h-3 w-3" />
                      Configured
                    </Badge>
                  )}
                  {integration.link ? (
                    <a href={integration.link} target="_blank" rel="noreferrer noopener">
                      <Button variant="ghost" size="icon" aria-label={`Open ${integration.name}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Button variant="ghost" size="icon" aria-label={`No link for ${integration.name}`} disabled>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{integration.name}</h3>
                <p className="text-muted-foreground text-sm">{integration.description}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between px-6 py-4">
              {(() => {
                const existing = workflowIntegrations.find((w) => w.type === integration.icon)
                if (existing) {
                  return (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleWfAdd(integration.icon)}
                      >
                        <Cog className="h-4 w-4" />
                        Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-destructive"
                        onClick={() => handleWfDelete(existing.id)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </Button>
                    </>
                  )
                }
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleWfAdd(integration.icon)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Connection
                  </Button>
                )
              })()}
            </div>
          </Card>
        ))}
      </div>

      {/* Workflow Integrations */}
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-4">Workflow &amp; AI</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {WORKFLOW_TYPES
          .filter((type) => {
            if (query.trim().length === 0) return true
            const meta = allIntegrationMeta[type]
            return (
              meta?.label.toLowerCase().includes(query.toLowerCase()) ||
              meta?.description.toLowerCase().includes(query.toLowerCase())
            )
          })
          .map((type) => {
            const meta = allIntegrationMeta[type]
            const existing = workflowIntegrations.find((w) => w.type === type)
            return (
              <Card key={type} className="border shadow-sm">
                <div className="space-y-4 px-6 py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <IntegrationIcon integration={type} className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {existing?.configured && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Check className="h-3 w-3" />
                          Configured
                        </Badge>
                      )}
                      {meta.link && (
                        <a href={meta.link} target="_blank" rel="noreferrer noopener">
                          <Button variant="ghost" size="icon" aria-label={`Open ${meta.label}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{meta.label}</h3>
                    <p className="text-muted-foreground text-sm">{meta.description}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-6 py-4">
                  {existing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleWfAdd(type)}
                      >
                        <Cog className="h-4 w-4" />
                        Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-destructive"
                        onClick={() => handleWfDelete(existing.id)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleWfAdd(type)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Connection
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
      </div>

      {/* Add Workflow Integration Modal */}
      <Dialog open={wfAddModalOpen} onOpenChange={setWfAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{allIntegrationMeta[wfAddType]?.label || wfAddType} Credentials</DialogTitle>
            <DialogDescription>Enter your API credentials for {allIntegrationMeta[wfAddType]?.label || wfAddType}.</DialogDescription>
          </DialogHeader>
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-3">
            {getWfFields(wfAddType).map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`wf-field-${field.key}`}>{field.label}</Label>
                {field.isSecret ? (
                  <PasswordInput
                    id={`wf-field-${field.key}`}
                    autoComplete="new-password"
                    value={wfAddFieldValues[field.key] || ""}
                    onChange={(e) => setWfAddFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Enter ${field.label}`}
                    disabled={wfAddLoading}
                  />
                ) : (
                  <Input
                    id={`wf-field-${field.key}`}
                    autoComplete="off"
                    value={wfAddFieldValues[field.key] || ""}
                    onChange={(e) => setWfAddFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Enter ${field.label}`}
                    disabled={wfAddLoading}
                  />
                )}
              </div>
            ))}
            {wfAddError ? <p className="text-sm text-destructive">{wfAddError}</p> : null}
          </form>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setWfAddModalOpen(false)} disabled={wfAddLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => handleWfSave()}
              disabled={wfAddLoading || !getWfFields(wfAddType).some((f) => (wfAddFieldValues[f.key] || "").trim())}
            >
              {wfAddLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
