"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { IconDatabase, IconArrowLeft, IconLoader2 } from "@tabler/icons-react"
import { Field, defaultFields, fieldsToGlobalData } from "./field-types"
import { FieldEditorModal } from "./field-editor-modal"
import { DataPanel } from "./data-panel"
import { TemplateGallery } from "./template-gallery"
import { TermSheetTemplate, defaultTemplateHtml } from "./template-types"

// Dynamic import the wrapper which contains the GrapeJS styles
// This ensures styles only load when the editor is actually rendered
const StudioEditorWrapper = dynamic(
  () => import("./studio-editor-wrapper").then(mod => ({ default: mod.StudioEditorWrapper })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }
)

// Minimal GrapesJS theme styles - let GrapesJS handle its own layout
const grapejsThemeStyles = `
  /* ===== Radix Dialog protection from GrapesJS ===== */
  /* Ensure our app's dialogs are not affected by GrapesJS */
  [data-radix-dialog-content],
  [role="dialog"][data-state="open"]:not(.gs-cmp-modal-container):not([class*="gs-"]) {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 100001 !important;
    max-height: 85vh !important;
  }
  
  /* Ensure overlay is also properly positioned */
  [data-radix-dialog-overlay] {
    position: fixed !important;
    inset: 0 !important;
    z-index: 100000 !important;
  }

  /* ===== GrapesJS Internal Modals ===== */
  /* Ensure GrapesJS modals (HeadlessUI) appear above the page */
  #headlessui-portal-root {
    position: fixed !important;
    z-index: 99999 !important;
  }
  
  .gs-cmp-modal-wrapper {
    position: fixed !important;
    inset: 0 !important;
    z-index: 99999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: rgba(0, 0, 0, 0.5) !important;
  }
  
  .gs-cmp-modal-container {
    position: relative !important;
    z-index: 100000 !important;
    background-color: white !important;
    border-radius: 8px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  }
  
  .dark .gs-cmp-modal-container {
    background-color: hsl(0 0% 12%) !important;
    color: #f3f4f6 !important;
  }

  /* ===== Data Variable Field Styling ===== */
  .gs-studio-root [data-gjs-type="data-variable"],
  .data-variable-field {
    display: inline-block;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 4px;
    padding: 2px 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #92400e;
    cursor: pointer;
    white-space: nowrap;
  }

  .gs-studio-root [data-gjs-type="data-variable"]:hover,
  .data-variable-field:hover {
    background-color: #fde68a;
    border-color: #d97706;
  }

  .dark .gs-studio-root [data-gjs-type="data-variable"],
  .dark .data-variable-field {
    background-color: #78350f;
    border-color: #d97706;
    color: #fef3c7;
  }
`

export default function TermSheetEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get template ID from URL
  const templateId = searchParams.get("template")
  const isNewTemplate = searchParams.get("new") === "true"
  const templateName = searchParams.get("name") || "Untitled Template"
  
  // Determine if we're in editor mode
  const isEditorMode = templateId !== null || isNewTemplate

  const [fields, setFields] = useState<Field[]>(defaultFields)
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<TermSheetTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Convert fields to globalData for GrapeJS
  const globalData = useMemo(() => fieldsToGlobalData(fields), [fields])

  // Generate variable options for RTE toolbar from fields
  const variableOptions = useMemo(() => 
    fields.map(field => ({
      id: `{{${field.name}}}`,
      label: field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    })),
    [fields]
  )

  // Fetch template by ID when URL has template param
  useEffect(() => {
    if (templateId && !currentTemplate) {
      setLoadingTemplate(true)
      setTemplateError(null)
      
      fetch(`/api/term-sheet-templates/${templateId}`)
        .then(res => {
          if (!res.ok) throw new Error("Template not found")
          return res.json()
        })
        .then(data => {
          setCurrentTemplate(data.template)
        })
        .catch(e => {
          setTemplateError(e.message)
        })
        .finally(() => {
          setLoadingTemplate(false)
        })
    }
  }, [templateId, currentTemplate])

  // Handle selecting a template from gallery
  const handleSelectTemplate = useCallback((template: TermSheetTemplate) => {
    setCurrentTemplate(template)
    router.push(`/settings/term-sheet-editor?template=${template.id}`)
  }, [router])

  // Handle creating a new template - creates in Supabase first
  const handleCreateTemplate = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/term-sheet-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          html_content: defaultTemplateHtml,
          gjs_data: {},
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create template")
      }
      
      const data = await res.json()
      setCurrentTemplate(data.template)
      router.push(`/settings/term-sheet-editor?template=${data.template.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create template")
    }
  }, [router])

  // Handle going back to gallery
  const handleBackToGallery = useCallback(() => {
    setCurrentTemplate(null)
    setTemplateError(null)
    router.push("/settings/term-sheet-editor")
  }, [router])

  // Get the current template for editor
  const editorTemplate = useMemo(() => {
    if (currentTemplate) return currentTemplate
    if (isNewTemplate) {
      return {
        id: `new-${Date.now()}`,
        name: templateName,
        html_content: defaultTemplateHtml,
        gjs_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: "",
      }
    }
    return null
  }, [currentTemplate, isNewTemplate, templateName])

  // Gallery View
  if (!isEditorMode) {
    return (
      <TemplateGallery
        onSelectTemplate={handleSelectTemplate}
        onCreateTemplate={handleCreateTemplate}
      />
    )
  }

  // Loading template state
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

  // Template error state
  if (templateError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <p className="text-destructive">{templateError}</p>
        <Button variant="outline" onClick={handleBackToGallery}>
          Back to Templates
        </Button>
      </div>
    )
  }

  // Editor View
  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: grapejsThemeStyles }} />
      
      {/* Header */}
      <div className="mb-4 flex-none flex items-center justify-between">
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
            <h3 className="text-lg font-medium">
              {editorTemplate?.name || "Term Sheet Editor"}
            </h3>
            <p className="text-muted-foreground text-sm">
              Edit template design
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setFieldEditorOpen(true)}
          className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
        >
          <IconDatabase className="h-4 w-4 mr-2" />
          Edit Fields
        </Button>
      </div>

      {/* Main Content - Editor + Data Panel */}
      <div className="flex-1 flex min-h-0 gap-0 rounded-lg border bg-background overflow-hidden">
        {/* GrapeJS Editor - takes remaining space */}
        <div className="flex-1 min-w-0 h-full">
          <StudioEditorWrapper
            globalData={globalData}
            variableOptions={variableOptions}
            template={editorTemplate}
          />
        </div>
        
        {/* Data Panel - Right Side */}
        <div className="w-[280px] flex-shrink-0 border-l">
          <DataPanel
            fields={fields}
            onOpenFieldEditor={() => setFieldEditorOpen(true)}
          />
        </div>
      </div>

      {/* Field Editor Modal */}
      <FieldEditorModal
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        fields={fields}
        onFieldsChange={setFields}
      />
    </div>
  )
}
