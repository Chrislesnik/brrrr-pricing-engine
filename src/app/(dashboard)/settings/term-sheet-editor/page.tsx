"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { IconDatabase, IconArrowLeft, IconLoader2, IconTestPipe, IconDeviceFloppy } from "@tabler/icons-react"
import { Field, defaultFields, fieldsToGlobalData } from "./field-types"
import { FieldEditorModal } from "./field-editor-modal"
import { TemplateGallery } from "./template-gallery"
import { VariablePreviewPanel } from "./variable-preview-panel"
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
    max-height: 90vh !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
  }
  
  .dark .gs-cmp-modal-container {
    background-color: hsl(0 0% 12%) !important;
    color: #f3f4f6 !important;
  }

  /* Ensure GrapesJS modal content and buttons are visible */
  .gs-cmp-modal-container > * {
    overflow: visible !important;
  }

  /* Ensure modal footer/buttons are visible */
  .gs-cmp-modal-container [class*="footer"],
  .gs-cmp-modal-container [class*="button"],
  .gs-cmp-modal-container button,
  .gs-cmp-modal-container [role="button"] {
    visibility: visible !important;
    opacity: 1 !important;
    display: flex !important;
  }

  /* Ensure modal content area allows scrolling but buttons stay visible */
  .gs-cmp-modal-container [class*="content"] {
    overflow-y: auto !important;
    flex: 1 1 auto !important;
    max-height: calc(90vh - 120px) !important;
  }

  /* Ensure modal footer stays at bottom */
  .gs-cmp-modal-container [class*="footer"] {
    flex: 0 0 auto !important;
    padding: 16px !important;
    border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
    display: flex !important;
    gap: 8px !important;
    justify-content: flex-end !important;
  }

  .dark .gs-cmp-modal-container [class*="footer"] {
    border-top-color: rgba(255, 255, 255, 0.1) !important;
  }

  /* Ensure all buttons in GrapesJS modals are visible */
  .gs-studio-root .gs-cmp-modal-container button,
  .gs-studio-root .gs-cmp-modal-container [role="button"],
  .gs-studio-root .gs-cmp-modal-container [type="button"],
  .gs-studio-root .gs-cmp-modal-container [type="submit"],
  .gs-studio-root [data-headlessui-state] button {
    visibility: visible !important;
    opacity: 1 !important;
    display: inline-flex !important;
    pointer-events: auto !important;
  }

  /* Ensure modal doesn't cut off content */
  .gs-cmp-modal-container {
    overflow: visible !important;
  }

  .gs-cmp-modal-container > div {
    overflow: visible !important;
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

  /* ===== Override GrapesJS violet accent colors with org theme primary ===== */
  /* Text colors - light mode */
  .gs-studio-root .gs-utl-text-violet-800,
  .gs-studio-root .gs-utl-text-violet-700,
  .gs-studio-root .gs-utl-text-violet-600,
  .gs-studio-root .gs-utl-text-violet-500 {
    color: hsl(var(--primary)) !important;
  }

  /* Text colors - dark mode */
  .dark .gs-studio-root .gs-utl-text-violet-400,
  .dark .gs-studio-root .gs-utl-text-violet-300,
  .dark .gs-studio-root .gs-utl-text-violet-200 {
    color: hsl(var(--primary)) !important;
  }

  /* Background colors - light mode */
  .gs-studio-root .gs-utl-bg-violet-100,
  .gs-studio-root .gs-utl-bg-violet-50 {
    background-color: hsl(var(--primary) / 0.1) !important;
  }

  /* Background colors - dark mode */
  .dark .gs-studio-root .gs-utl-bg-violet-900,
  .dark .gs-studio-root .gs-utl-bg-violet-800 {
    background-color: hsl(var(--primary) / 0.2) !important;
  }

  /* Selected/active states with violet backgrounds (non-button elements) */
  .gs-studio-root [class*="gs-utl-bg-violet"]:not(button):not([role="button"]) {
    background-color: hsl(var(--primary) / 0.15) !important;
  }

  .dark .gs-studio-root [class*="gs-utl-bg-violet"]:not(button):not([role="button"]) {
    background-color: hsl(var(--primary) / 0.25) !important;
  }

  /* Primary action buttons - solid background */
  .gs-studio-root button.gs-utl-bg-violet-500,
  .gs-studio-root button[class*="gs-utl-bg-violet-500"],
  .gs-studio-root [role="button"].gs-utl-bg-violet-500,
  #headlessui-portal-root button.gs-utl-bg-violet-500,
  #headlessui-portal-root button[class*="gs-utl-bg-violet-500"] {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }

  .gs-studio-root button.gs-utl-bg-violet-500:hover,
  .gs-studio-root button[class*="gs-utl-bg-violet-500"]:hover,
  .gs-studio-root [role="button"].gs-utl-bg-violet-500:hover,
  #headlessui-portal-root button.gs-utl-bg-violet-500:hover,
  #headlessui-portal-root button[class*="gs-utl-bg-violet-500"]:hover {
    background-color: hsl(var(--primary) / 0.9) !important;
  }

  .dark .gs-studio-root button.gs-utl-bg-violet-500,
  .dark .gs-studio-root button[class*="gs-utl-bg-violet-500"],
  .dark .gs-studio-root [role="button"].gs-utl-bg-violet-500,
  .dark #headlessui-portal-root button.gs-utl-bg-violet-500,
  .dark #headlessui-portal-root button[class*="gs-utl-bg-violet-500"] {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }

  .dark .gs-studio-root button.gs-utl-bg-violet-500:hover,
  .dark .gs-studio-root button[class*="gs-utl-bg-violet-500"]:hover,
  .dark .gs-studio-root [role="button"].gs-utl-bg-violet-500:hover,
  .dark #headlessui-portal-root button.gs-utl-bg-violet-500:hover,
  .dark #headlessui-portal-root button[class*="gs-utl-bg-violet-500"]:hover {
    background-color: hsl(var(--primary) / 0.8) !important;
  }

  /* Hover states - override violet hover colors */
  .gs-studio-root .gs-theme-cl-hTAo:hover,
  .gs-studio-root [class*="hover\\:gs-utl-text-violet"]:hover {
    color: hsl(var(--primary)) !important;
  }

  .dark .gs-studio-root .gs-theme-cl-hTAo:hover,
  .dark .gs-studio-root [class*="hover\\:dark\\:gs-utl-text-violet"]:hover {
    color: hsl(var(--primary)) !important;
  }

  /* Border colors */
  .gs-studio-root .gs-utl-border-violet-500,
  .gs-studio-root .gs-utl-border-violet-400,
  .gs-studio-root .gs-utl-border-violet-300 {
    border-color: hsl(var(--primary)) !important;
  }

  /* Ring/focus colors */
  .gs-studio-root .gs-utl-ring-violet-500,
  .gs-studio-root .gs-utl-ring-violet-400 {
    --tw-ring-color: hsl(var(--primary)) !important;
  }

  /* Active/selected item indicators */
  .gs-studio-root .gs-block-item--active,
  .gs-studio-root .gs-layer-item--selected {
    border-color: hsl(var(--primary)) !important;
    background-color: hsl(var(--primary) / 0.1) !important;
  }

  .dark .gs-studio-root .gs-block-item--active,
  .dark .gs-studio-root .gs-layer-item--selected {
    border-color: hsl(var(--primary)) !important;
    background-color: hsl(var(--primary) / 0.2) !important;
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
  // Test data panel toggle - when true, show variable inputs panel alongside editor
  const [showTestPanel, setShowTestPanel] = useState(false)
  // Preview values for testing term sheet with real data
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})
  // Counter to force editor remount when user clicks "Apply to Preview"
  const [previewApplyCounter, setPreviewApplyCounter] = useState(0)
  // Saving state for template content
  const [saving, setSaving] = useState(false)
  // Editor instance ref for triggering save from button
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorInstanceRef = useRef<any>(null)
  
  // Handler for applying preview values - updates values AND triggers remount
  const handleApplyPreviewValues = useCallback((values: Record<string, string>) => {
    setPreviewValues(values)
    setPreviewApplyCounter(prev => prev + 1)
  }, [])

  // Handler for saving template content to Supabase
  const handleSaveTemplate = useCallback(async (html: string, gjsData: object) => {
    if (!templateId) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/term-sheet-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html_content: html,
          gjs_data: gjsData,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save template")
      }
      
      const data = await res.json()
      // Update current template with saved data
      setCurrentTemplate(data.template)
      console.log("[TermSheetEditor] Template saved successfully")
    } catch (e) {
      console.error("[TermSheetEditor] Save failed:", e)
      alert(e instanceof Error ? e.message : "Failed to save template")
    } finally {
      setSaving(false)
    }
  }, [templateId])

  // Handler to receive editor instance from wrapper
  const handleEditorReady = useCallback((editor: any) => {
    editorInstanceRef.current = editor
  }, [])

  // Convert fields to globalData for GrapeJS, merging with preview values
  // GrapesJS expects nested structure: { fieldName: { data: "value" } }
  const globalData = useMemo(() => {
    const baseData = fieldsToGlobalData(fields)
    // Override with preview values (only non-empty values)
    Object.entries(previewValues).forEach(([key, value]) => {
      if (value.trim()) {
        // Ensure the nested structure exists
        if (!baseData[key]) {
          baseData[key] = { data: "" }
        }
        baseData[key].data = value
      }
    })
    return baseData
  }, [fields, previewValues])

  // Generate variable options for RTE toolbar from fields
  // Include type for styled widget rendering in the editor
  const variableOptions = useMemo(() => 
    fields.map(field => ({
      id: field.name,  // Raw field name - wrapper builds the HTML
      label: field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: field.type
    })),
    [fields]
  )

  // Track the last loaded template ID to avoid redundant fetches
  const lastLoadedTemplateIdRef = useRef<string | null>(null)

  // Track if fields have been loaded for current template
  const fieldsLoadedForTemplateRef = useRef<string | null>(null)

  // Fetch template and fields by ID when URL has template param
  useEffect(() => {
    if (!templateId) return
    
    console.log('[TermSheetEditor] useEffect - templateId:', templateId, 
      'lastLoaded:', lastLoadedTemplateIdRef.current,
      'fieldsLoaded:', fieldsLoadedForTemplateRef.current,
      'currentTemplate:', currentTemplate?.id)
    
    // Check if we need to fetch template
    const needsTemplate = !currentTemplate || currentTemplate.id !== templateId
    // Check if we need to fetch fields (always fetch if template changed)
    const needsFields = fieldsLoadedForTemplateRef.current !== templateId
    
    // Skip only if we have both template and fields loaded for this templateId
    if (!needsTemplate && !needsFields) {
      console.log('[TermSheetEditor] Skipping fetch - already loaded')
      return
    }
    
    setLoadingTemplate(needsTemplate)
    setTemplateError(null)
    lastLoadedTemplateIdRef.current = templateId
    
    // Build fetch promises
    const promises: Promise<any>[] = []
    
    if (needsTemplate) {
      promises.push(
        fetch(`/api/term-sheet-templates/${templateId}`).then(res => {
          if (!res.ok) throw new Error("Template not found")
          return res.json()
        })
      )
    } else {
      promises.push(Promise.resolve(null))
    }
    
    // Always fetch fields for the template
    promises.push(
      fetch(`/api/term-sheet-templates/${templateId}/fields`).then(res => {
        if (!res.ok) throw new Error("Failed to load fields")
        return res.json()
      })
    )
    
    Promise.all(promises)
      .then(([templateData, fieldsData]) => {
        console.log('[TermSheetEditor] Fetched - template:', templateData?.template?.name, 'fields:', fieldsData?.fields?.length)
        if (templateData) {
          setCurrentTemplate(templateData.template)
        }
        setFields(fieldsData.fields || [])
        // Mark fields as loaded for this template
        fieldsLoadedForTemplateRef.current = templateId
      })
      .catch(e => {
        setTemplateError(e.message)
      })
      .finally(() => {
        setLoadingTemplate(false)
      })
  }, [templateId, currentTemplate])

  // Handle selecting a template from gallery
  const handleSelectTemplate = useCallback((template: TermSheetTemplate) => {
    // Reset fields state - will be fetched by useEffect
    setFields([])
    setPreviewValues({})
    setPreviewApplyCounter(0)
    // Reset fields loaded ref to force re-fetch
    fieldsLoadedForTemplateRef.current = null
    // Set template immediately (has html_content for editor)
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
      // Reset fields for the new template (it has no fields yet)
      setFields([])
      // Reset preview values
      setPreviewValues({})
      setPreviewApplyCounter(0)
      setCurrentTemplate(data.template)
      router.push(`/settings/term-sheet-editor?template=${data.template.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create template")
    }
  }, [router])

  // Handle going back to gallery
  const handleBackToGallery = useCallback(() => {
    // Reset all template-specific state
    setCurrentTemplate(null)
    setFields([])
    setPreviewValues({})
    setPreviewApplyCounter(0)
    setTemplateError(null)
    // Reset refs
    lastLoadedTemplateIdRef.current = null
    fieldsLoadedForTemplateRef.current = null
    router.push("/settings/term-sheet-editor")
  }, [router])

  // Get the current template for editor
  const editorTemplate = useMemo(() => {
    console.log('[TermSheetEditor] Computing editorTemplate:', { 
      currentTemplate: currentTemplate?.name, 
      html_content_length: currentTemplate?.html_content?.length,
      isNewTemplate, 
      templateName 
    })
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
        <div className="flex items-center gap-2">
          {/* Save Template Button */}
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (editorInstanceRef.current) {
                editorInstanceRef.current.runCommand('save-template')
              }
            }}
            disabled={saving || !templateId}
          >
            {saving ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <IconDeviceFloppy className="h-4 w-4 mr-1.5" />
                Save
              </>
            )}
          </Button>
          {/* Test Data Panel Toggle */}
          <Button
            variant={showTestPanel ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowTestPanel(!showTestPanel)}
          >
            <IconTestPipe className="h-4 w-4 mr-1.5" />
            Test Data
          </Button>
          <Button
            variant="outline"
            onClick={() => setFieldEditorOpen(true)}
            className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          >
            <IconDatabase className="h-4 w-4 mr-2" />
            Edit Fields
          </Button>
        </div>
      </div>

      {/* Main Content - GrapesJS Editor + Optional Test Data Panel */}
      <div className="flex-1 flex min-h-0 gap-0">
        {/* GrapeJS Editor Container */}
        <div className="flex-1 min-w-0 h-full rounded-lg border bg-background overflow-hidden">
          <StudioEditorWrapper
            key={`editor-${templateId}-${fields.length}-${previewApplyCounter}`}
            globalData={globalData}
            variableOptions={variableOptions}
            template={editorTemplate}
            onSave={handleSaveTemplate}
            onEditorReady={handleEditorReady}
          />
        </div>
        
        {/* Test Data Panel - Matches GrapesJS sidebar width and style */}
        {showTestPanel && (
          <div className="w-[280px] flex-shrink-0">
            <VariablePreviewPanel
              fields={fields}
              values={previewValues}
              onValuesChange={handleApplyPreviewValues}
            />
          </div>
        )}
      </div>

      {/* Field Editor Modal */}
      <FieldEditorModal
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        fields={fields}
        onFieldsChange={setFields}
        templateId={templateId || undefined}
      />
    </div>
  )
}
