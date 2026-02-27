"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { FileCode2, Mail, GlobeLock, Sparkles } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { DocumentsTab } from "./documents-tab"
import { EmailsTab } from "./emails-tab"
import { WebsitesTab } from "./websites-tab"

type StudioTab = "documents" | "emails" | "sites"

interface NavItem {
  id: StudioTab
  label: string
  icon: typeof FileCode2
  description: string
  aiBadge?: boolean
}

const studioNavItems: NavItem[] = [
  {
    id: "documents",
    label: "Documents",
    icon: FileCode2,
    description: "HTML document templates",
  },
  {
    id: "emails",
    label: "Emails",
    icon: Mail,
    description: "Email templates for campaigns",
    aiBadge: true,
  },
  {
    id: "sites",
    label: "Landing Pages",
    icon: GlobeLock,
    description: "Branded landing pages",
    aiBadge: true,
  },
]

export default function TemplateEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get("tab") as StudioTab | null
  const activeTab: StudioTab = tabParam && ["documents", "emails", "sites"].includes(tabParam)
    ? tabParam
    : "documents"

  useEffect(() => {
    if (!tabParam) {
      router.replace("/platform-settings/integrations/template-editor?tab=documents")
    }
  }, [tabParam, router])

  const isEditorMode = searchParams.get("template") !== null || searchParams.get("new") === "true"

  if (activeTab === "documents" && isEditorMode) {
    return <DocumentsTab />
  }

  if (activeTab === "emails" && isEditorMode) {
    return <EmailsTab />
  }

  if (activeTab === "sites" && isEditorMode) {
    return <WebsitesTab />
  }

  return (
    <div className="w-full px-4 py-8 md:px-6">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Template Studio</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage document, email, and landing page templates.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Left sidebar navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-4">
              <nav className="space-y-1">
                {studioNavItems.map((item) => {
                  const isActive = activeTab === item.id
                  const href = `/platform-settings/integrations/template-editor?tab=${item.id}`

                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 font-medium">
                          {item.label}
                          {item.aiBadge && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 min-w-0">
            {activeTab === "documents" && <DocumentsTab />}
            {activeTab === "emails" && <EmailsTab />}
            {activeTab === "sites" && <WebsitesTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
