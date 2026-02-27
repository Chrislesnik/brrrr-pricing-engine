"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { GlobeLock, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  IconArrowLeft,
  IconLoader2,
  IconDeviceFloppy,
  IconCheck,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { CreateTemplateDialog } from "./create-template-dialog"
import { grapejsThemeStyles } from "./grapesjs-theme-styles"
import { defaultTemplateHtml } from "./template-types"

const StudioEditorWrapper = dynamic(
  () => import("./studio-editor-wrapper").then(mod => ({ default: mod.StudioEditorWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    ),
  }
)

type LandingPageTemplate = {
  id: string
  name: string
  status: "draft" | "published"
  slug: string | null
  html_content: string
  gjs_data: object
  updated_at: string
  created_at: string
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Preview sketch for gallery cards                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function LandingPagePreviewSketch() {
  return (
    <div className="w-full h-full flex flex-col px-4 py-3 gap-1.5 pointer-events-none select-none scale-[0.85] origin-top">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="size-4 rounded bg-foreground/15 shrink-0" />
          <div className="h-2 w-12 rounded-full bg-foreground/15" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 w-8 rounded-full bg-foreground/10" />
          <div className="h-2 w-8 rounded-full bg-foreground/10" />
          <div className="h-4 w-12 rounded bg-foreground/20" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 mt-1 mb-1">
        <div className="h-3.5 w-4/5 rounded-full bg-foreground/20" />
        <div className="h-2 w-3/5 rounded-full bg-foreground/12" />
        <div className="mt-1 h-5 w-24 rounded bg-foreground/20" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 rounded border border-foreground/8 p-1.5">
            <div className="size-3 rounded bg-foreground/12" />
            <div className="h-1.5 w-full rounded-full bg-foreground/10" />
            <div className="h-1 w-4/5 rounded-full bg-foreground/8" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5 mt-auto pt-1.5 border-t border-foreground/10">
        <div className="h-1 w-1/3 rounded-full bg-foreground/8" />
        <div className="h-1 w-1/4 rounded-full bg-foreground/6" />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Gallery                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function LandingPageGallery() {
  const router = useRouter()
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/landing-page-templates")
      if (!res.ok) return
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const openEditor = useCallback(
    (id: string, name: string) => {
      router.push(
        `/platform-settings/integrations/template-editor?tab=sites&template=${id}&name=${encodeURIComponent(name)}`
      )
    },
    [router]
  )

  const createTemplate = useCallback(async (name: string) => {
    setCreating(true)
    try {
      const res = await fetch("/api/landing-page-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Failed to create template")
      const { template } = await res.json()
      openEditor(String(template.id), template.name)
    } catch {
      setCreating(false)
    }
  }, [openEditor])

  const duplicateTemplate = useCallback(async (template: LandingPageTemplate) => {
    try {
      const res = await fetch("/api/landing-page-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          html_content: template.html_content,
        }),
      })
      if (!res.ok) throw new Error("Failed to duplicate")
      const { template: newTemplate } = await res.json()
      setTemplates((prev) => [newTemplate, ...prev])
    } catch {
      alert("Failed to duplicate template")
    }
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    if (!confirm("Delete this landing page template?")) return
    try {
      const res = await fetch(`/api/landing-page-templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setTemplates((prev) => prev.filter((t) => String(t.id) !== String(id)))
    } catch {
      alert("Failed to delete template")
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Landing Pages</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Design and publish branded landing pages for your deals and campaigns
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          disabled={creating}
          size="sm"
        >
          {creating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          New Landing Page
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/20 py-20">
          <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
            <GlobeLock className="size-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">No landing pages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first landing page to get started
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} disabled={creating}>
            <Plus className="mr-2 size-4" />
            New Landing Page
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
              onClick={() => openEditor(String(template.id), template.name)}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted/60 flex items-center justify-center">
                <LandingPagePreviewSketch />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditor(String(template.id), template.name)
                    }}
                  >
                    <IconPencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {format(new Date(template.updated_at), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {format(new Date(template.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
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
                        openEditor(String(template.id), template.name)
                      }}>
                        <IconPencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        duplicateTemplate(template)
                      }}>
                        <IconCopy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTemplate(String(template.id))
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(name) => {
          setCreateDialogOpen(false)
          createTemplate(name)
        }}
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Editor                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function LandingPageEditor({ templateId }: { templateId: string }) {
  const router = useRouter()

  const [currentTemplate, setCurrentTemplate] = useState<LandingPageTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(true)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editableName, setEditableName] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const editableNameRef = useRef<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingTemplate(true)
    setTemplateError(null)

    fetch(`/api/landing-page-templates/${templateId}`)
      .then(res => {
        if (!res.ok) throw new Error("Template not found")
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        setCurrentTemplate(data.template)
        setEditableName(data.template.name)
        editableNameRef.current = data.template.name
      })
      .catch(e => {
        if (!cancelled) setTemplateError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplate(false)
      })

    return () => { cancelled = true }
  }, [templateId])

  const handleBackToGallery = useCallback(() => {
    router.push("/platform-settings/integrations/template-editor?tab=sites")
  }, [router])

  const handleNameChange = useCallback((val: string) => {
    setEditableName(val)
    editableNameRef.current = val
  }, [])

  const saveTemplateName = useCallback(async () => {
    const name = editableNameRef.current
    if (!name?.trim()) return
    try {
      const res = await fetch(`/api/landing-page-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) console.error("Failed to save name:", await res.text())
    } catch (e) {
      console.error("Failed to save template name:", e)
    }
  }, [templateId])

  const handleEditorSave = useCallback(async (html: string, projectData: object) => {
    try {
      await fetch(`/api/landing-page-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html_content: html, gjs_data: projectData }),
      })
    } catch (e) {
      console.error("Failed to persist template:", e)
    }
  }, [templateId])

  const handleManualSave = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    setSaving(true)
    setSaveSuccess(false)
    try {
      await saveTemplateName()
      await editor.store()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (e) {
      console.error("Failed to save template:", e)
    } finally {
      setSaving(false)
    }
  }, [saveTemplateName])

  const handleSaveAndExit = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    setSaving(true)
    try {
      await saveTemplateName()
      await editor.store()
      router.push("/platform-settings/integrations/template-editor?tab=sites")
    } catch (e) {
      console.error("Failed to save template:", e)
      setSaving(false)
    }
  }, [router, saveTemplateName])

  const editorTemplate = useMemo(() => {
    if (!currentTemplate) return null
    return {
      id: String(currentTemplate.id),
      name: currentTemplate.name,
      html_content: currentTemplate.html_content || defaultTemplateHtml,
      gjs_data: currentTemplate.gjs_data || {},
      created_at: currentTemplate.created_at,
      updated_at: currentTemplate.updated_at,
      user_id: "",
    }
  }, [currentTemplate])

  if (loadingTemplate) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 className="h-5 w-5 animate-spin" />
          <span>Loading template...</span>
        </div>
      </div>
    )
  }

  if (templateError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <p className="text-destructive">{templateError}</p>
        <Button variant="outline" onClick={handleBackToGallery}>
          Back to Landing Pages
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: grapejsThemeStyles }} />

      {/* Toolbar */}
      <div className="px-4 py-3 flex-none flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToGallery}
            className="text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            {editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editableName ?? ""}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    setEditingName(false)
                    e.currentTarget.blur()
                  }
                }}
                className="text-lg font-medium bg-transparent border-0 border-b-2 border-primary outline-none px-0 py-0.5 w-auto min-w-[120px] max-w-[400px]"
                style={{ width: `${Math.max(120, (editableName?.length ?? 10) * 10 + 20)}px` }}
                placeholder="Landing page name"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingName(true)
                  setTimeout(() => nameInputRef.current?.select(), 0)
                }}
                className="text-lg font-medium text-left rounded px-1.5 py-0.5 -ml-1.5 hover:bg-accent transition-colors cursor-text"
              >
                {editableName || "Untitled Landing Page"}
              </button>
            )}
            <p className="text-muted-foreground text-sm">
              Edit landing page design
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleManualSave}
            disabled={saving}
          >
            {saving ? (
              <IconLoader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : saveSuccess ? (
              <IconCheck className="h-4 w-4 mr-1.5 text-green-600" />
            ) : (
              <IconDeviceFloppy className="h-4 w-4 mr-1.5" />
            )}
            {saveSuccess ? "Saved" : "Save"}
          </Button>
          <Button
            onClick={handleSaveAndExit}
            disabled={saving}
          >
            {saving ? (
              <IconLoader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <IconDeviceFloppy className="h-4 w-4 mr-1.5" />
            )}
            Save & Exit
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex min-h-0 gap-0 px-4 pb-4">
        <div className="flex-1 min-w-0 h-full rounded-lg border bg-background overflow-hidden isolate">
          <StudioEditorWrapper
            key={`lp-editor-${templateId}`}
            globalData={{}}
            variableOptions={[]}
            variables={[]}
            template={editorTemplate}
            onSave={handleEditorSave}
            onEditorReady={handleEditorReady}
          />
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Exported tab component — routes between gallery & editor                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function WebsitesTab() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template")

  if (templateId) {
    return <LandingPageEditor templateId={templateId} />
  }

  return <LandingPageGallery />
}
