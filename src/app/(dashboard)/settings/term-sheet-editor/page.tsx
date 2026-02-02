"use client"

import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { IconDatabase, IconArrowLeft } from "@tabler/icons-react"
import { Field, defaultFields, fieldsToGlobalData } from "./field-types"
import { FieldEditorModal } from "./field-editor-modal"
import { DataPanel } from "./data-panel"
import { TemplateGallery } from "./template-gallery"
import { TermSheetTemplate, defaultTemplateHtml, mockTemplates } from "./template-types"

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

  // Handle selecting a template from gallery
  const handleSelectTemplate = useCallback((template: TermSheetTemplate) => {
    setCurrentTemplate(template)
    router.push(`/settings/term-sheet-editor?template=${template.id}`)
  }, [router])

  // Handle creating a new template
  const handleCreateTemplate = useCallback((name: string) => {
    const newTemplate: TermSheetTemplate = {
      id: `new-${Date.now()}`,
      name,
      html_content: defaultTemplateHtml,
      gjs_data: {},
      created_at: new Date(),
      updated_at: new Date(),
    }
    setCurrentTemplate(newTemplate)
    router.push(`/settings/term-sheet-editor?new=true&name=${encodeURIComponent(name)}`)
  }, [router])

  // Handle going back to gallery
  const handleBackToGallery = useCallback(() => {
    setCurrentTemplate(null)
    router.push("/settings/term-sheet-editor")
  }, [router])

  // Get the current template for editor
  const editorTemplate = useMemo(() => {
    if (currentTemplate) return currentTemplate
    if (templateId) {
      // Find template by ID (mock data for now)
      return mockTemplates.find(t => t.id === templateId) || null
    }
    if (isNewTemplate) {
      return {
        id: `new-${Date.now()}`,
        name: templateName,
        html_content: defaultTemplateHtml,
        gjs_data: {},
        created_at: new Date(),
        updated_at: new Date(),
      }
    }
    return null
  }, [currentTemplate, templateId, isNewTemplate, templateName])

  // Gallery View
  if (!isEditorMode) {
    return (
      <TemplateGallery
        onSelectTemplate={handleSelectTemplate}
        onCreateTemplate={handleCreateTemplate}
      />
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
              {isNewTemplate ? "Create a new template" : "Edit template design"}
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
