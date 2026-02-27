"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useCallback, useEffect } from "react"
import { Mail, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmailTemplateBuilder } from "@/components/email-builder/email-template-builder"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconDotsVertical,
  IconPencil,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react"
import { format } from "date-fns"

type EmailTemplate = {
  id: string
  name: string
  status: "draft" | "published"
  updatedAt: string
  createdAt: string
}

function EmailPreviewSketch({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex flex-col px-4 py-3 gap-1.5 pointer-events-none select-none scale-[0.85] origin-top">
      {/* Logo row */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="size-4 rounded bg-foreground/15 shrink-0" />
        <div className="h-2 w-14 rounded-full bg-foreground/15" />
      </div>
      {/* Heading */}
      <div className="h-3 w-4/5 rounded-full bg-foreground/20" />
      {/* Subheading */}
      <div className="h-2 w-3/5 rounded-full bg-foreground/12" />
      {/* Body lines */}
      <div className="flex flex-col gap-1 mt-1">
        <div className="h-1.5 w-full rounded-full bg-foreground/10" />
        <div className="h-1.5 w-[90%] rounded-full bg-foreground/10" />
        <div className="h-1.5 w-[75%] rounded-full bg-foreground/10" />
      </div>
      {/* CTA button */}
      <div className="mt-2 h-5 w-28 rounded bg-foreground/20 self-start" />
      {/* Footer lines */}
      <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-foreground/10">
        <div className="h-1.5 w-2/3 rounded-full bg-foreground/8" />
        <div className="h-1.5 w-1/2 rounded-full bg-foreground/8" />
      </div>
    </div>
  )
}

function EmailTemplateGallery() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/email-templates")
      if (!res.ok) return
      const rows = await res.json()
      setTemplates(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.map((r: any) => ({
          id: r.uuid,
          name: r.name,
          status: r.status,
          updatedAt: r.updated_at,
          createdAt: r.created_at,
        }))
      )
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const openEditor = useCallback(
    (id: string, name: string) => {
      router.push(
        `/platform-settings/integrations/template-editor?tab=emails&template=${id}&name=${encodeURIComponent(name)}`
      )
    },
    [router]
  )

  const createTemplate = useCallback(async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Template" }),
      })
      if (!res.ok) throw new Error("Failed to create template")
      const { uuid, name } = await res.json()
      openEditor(uuid, name)
    } catch {
      setCreating(false)
    }
  }, [openEditor])

  const deleteTemplate = useCallback((id: string) => {
    if (!confirm("Delete this email template?")) return
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Email Templates</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Collaborative email templates powered by Liveblocks
          </p>
        </div>
        <Button onClick={createTemplate} disabled={creating} size="sm">
          {creating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          New Template
        </Button>
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/20 py-20">
          <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
            <Mail className="size-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">No email templates yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first template to get started
            </p>
          </div>
          <Button onClick={createTemplate} disabled={creating}>
            <Plus className="mr-2 size-4" />
            New Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
              onClick={() => openEditor(template.id, template.name)}
            >
              {/* Preview Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted/60 flex items-center justify-center">
                <EmailPreviewSketch name={template.name} />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditor(template.id, template.name)
                    }}
                  >
                    <IconPencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {format(new Date(template.updatedAt), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {format(new Date(template.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        openEditor(template.id, template.name)
                      }}>
                        <IconPencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        openEditor(template.id, template.name)
                      }}>
                        <IconCopy className="h-4 w-4 mr-2" />
                        Open &amp; Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTemplate(template.id)
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status chip */}
                <div className="mt-2">
                  <span
                    className={
                      template.status === "published"
                        ? "inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-foreground"
                        : "inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-muted-foreground"
                    }
                  >
                    {template.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EmailsTab() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const templateId = searchParams.get("template")
  const templateName = searchParams.get("name") ?? "Untitled Template"
  const isEditorMode = templateId !== null

  if (isEditorMode) {
    return (
      <EmailTemplateBuilder
        templateId={templateId}
        templateName={templateName}
        onBack={() =>
          router.push("/platform-settings/integrations/template-editor?tab=emails")
        }
      />
    )
  }

  return <EmailTemplateGallery />
}
