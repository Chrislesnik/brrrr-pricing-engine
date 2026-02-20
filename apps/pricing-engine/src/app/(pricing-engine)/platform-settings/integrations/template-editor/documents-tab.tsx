"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { IconDatabase, IconArrowLeft, IconLoader2, IconTestPipe } from "@tabler/icons-react"
import { Variable, defaultVariables, variablesToGlobalData } from "./variable-types"
import { VariableEditorModal } from "./variable-editor-modal"
import { TemplateGallery } from "./template-gallery"
import { VariablePreviewPanel } from "./variable-preview-panel"
import { DocumentTemplate, defaultTemplateHtml } from "./template-types"

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

/* GrapesJS: modal z-index fixes + violet-to-org-primary catch-all */
const grapejsThemeStyles = `
  /* Preview mode: hide all editor chrome */
  .gs-preview-mode .gjs-cv-canvas__frames,
  .gs-preview-mode [class*="gs-canvas"] {
    pointer-events: none !important;
  }
  .gs-preview-mode [class*="spot"],
  .gs-preview-mode [class*="Spot"],
  .gs-preview-mode [class*="toolbar"],
  .gs-preview-mode [class*="Toolbar"],
  .gs-preview-mode [class*="resizer"],
  .gs-preview-mode [class*="Resizer"],
  .gs-preview-mode [class*="badge"],
  .gs-preview-mode [class*="Badge"],
  .gs-preview-mode [class*="highlight"],
  .gs-preview-mode [class*="Highlight"],
  .gs-preview-mode [class*="offset-v"],
  .gs-preview-mode [class*="offset-fixed"] {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }
  .gs-preview-mode iframe {
    pointer-events: none !important;
  }
  /* AI Chat panel: ensure it fills the tab height */
  .variables-only-blocks [class*="aiChat"],
  .variables-only-blocks [class*="ai-chat"] {
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* Preview mode: hide left and right sidebars */
  .gs-preview-mode .blocks-panel-left,
  .gs-preview-mode .variables-only-blocks {
    display: none !important;
  }

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
    border-radius: 8px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
    max-height: 90vh !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
  }
  .gs-cmp-modal-container button,
  .gs-cmp-modal-container [role="button"],
  .gs-studio-root [data-headlessui-state] button {
    visibility: visible !important;
    opacity: 1 !important;
    display: inline-flex !important;
    pointer-events: auto !important;
  }

  /* Ensure sidebar panels are scrollable */
  .blocks-panel-left,
  .variables-only-blocks {
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }
  .blocks-panel-left > *,
  .variables-only-blocks > * {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    min-height: 0 !important;
  }

  /* Right panel: hide block content until JS has cleaned up non-Variable categories */
  .variables-only-blocks:not(.--categories-ready) > * {
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
  }
  .variables-only-blocks.--categories-ready > * {
    visibility: visible !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Remap any remaining violet/purple classes to the org primary */
  .gs-studio-root [class*="gs-utl-text-violet"],
  .gs-studio-root [class*="gs-utl-text-purple"] {
    color: hsl(var(--primary)) !important;
  }
  .gs-studio-root [class*="gs-utl-bg-violet"]:not(button):not([role="button"]),
  .gs-studio-root [class*="gs-utl-bg-purple"]:not(button):not([role="button"]) {
    background-color: hsl(var(--primary) / 0.15) !important;
  }
  .gs-studio-root button[class*="gs-utl-bg-violet"],
  .gs-studio-root [role="button"][class*="gs-utl-bg-violet"],
  .gs-studio-root button[class*="gs-utl-bg-purple"],
  .gs-studio-root [role="button"][class*="gs-utl-bg-purple"],
  #headlessui-portal-root button[class*="gs-utl-bg-violet"],
  #headlessui-portal-root button[class*="gs-utl-bg-purple"] {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }
  .gs-studio-root button[class*="gs-utl-bg-violet"]:hover,
  .gs-studio-root [role="button"][class*="gs-utl-bg-violet"]:hover,
  #headlessui-portal-root button[class*="gs-utl-bg-violet"]:hover {
    background-color: hsl(var(--primary) / 0.85) !important;
  }
  .gs-studio-root [class*="hover\\:gs-utl-text-violet"]:hover,
  .gs-studio-root [class*="hover\\:dark\\:gs-utl-text-violet"]:hover,
  .gs-studio-root .gs-theme-cl-hTAo:hover {
    color: hsl(var(--primary)) !important;
  }
  .gs-studio-root [class*="gs-utl-border-violet"] {
    border-color: hsl(var(--primary)) !important;
  }
  .gs-studio-root [class*="gs-utl-ring-violet"] {
    --tw-ring-color: hsl(var(--primary)) !important;
  }
  .gs-studio-root .gs-block-item--active,
  .gs-studio-root .gs-layer-item--selected {
    border-color: hsl(var(--primary)) !important;
    background-color: hsl(var(--primary) / 0.1) !important;
  }

  /* Override GrapesJS dark mode base chrome (zinc/gray utility classes) with org theme */
  .dark .gs-studio-root [class*="gs-utl-bg-zinc-900"],
  .dark .gs-studio-root [class*="gs-utl-bg-zinc-800"] {
    background-color: hsl(var(--background)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-bg-zinc-700"],
  .dark .gs-studio-root [class*="gs-utl-bg-zinc-600"] {
    background-color: hsl(var(--muted)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-text-gray-400"],
  .dark .gs-studio-root [class*="gs-utl-text-gray-300"] {
    color: hsl(var(--muted-foreground)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-text-gray-200"],
  .dark .gs-studio-root [class*="gs-utl-text-gray-100"],
  .dark .gs-studio-root [class*="gs-utl-text-white"] {
    color: hsl(var(--foreground)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-border-zinc-700"],
  .dark .gs-studio-root [class*="gs-utl-border-zinc-600"] {
    border-color: hsl(var(--border)) !important;
  }
  .dark .gs-studio-root .gs-theme-cl-bg {
    background-color: hsl(var(--background)) !important;
  }
  .dark .gs-studio-root .gs-theme-cl-txt {
    color: hsl(var(--foreground)) !important;
  }
  .dark .gs-studio-root .gs-theme-cl-br {
    border-color: hsl(var(--border)) !important;
  }

  /* Override light mode base chrome too */
  .gs-studio-root [class*="gs-utl-bg-white"] {
    background-color: hsl(var(--background)) !important;
  }
  .gs-studio-root [class*="gs-utl-bg-gray-100"],
  .gs-studio-root [class*="gs-utl-bg-gray-50"] {
    background-color: hsl(var(--muted)) !important;
  }
  .gs-studio-root [class*="gs-utl-text-gray-900"],
  .gs-studio-root [class*="gs-utl-text-gray-800"] {
    color: hsl(var(--foreground)) !important;
  }
  .gs-studio-root [class*="gs-utl-border-gray-300"],
  .gs-studio-root [class*="gs-utl-border-gray-200"] {
    border-color: hsl(var(--border)) !important;
  }
  .gs-studio-root .gs-theme-cl-bg {
    background-color: hsl(var(--background)) !important;
  }
  .gs-studio-root .gs-theme-cl-txt {
    color: hsl(var(--foreground)) !important;
  }
  .gs-studio-root .gs-theme-cl-br {
    border-color: hsl(var(--border)) !important;
  }
`

export function DocumentsTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const templateId = searchParams.get("template")
  const isNewTemplate = searchParams.get("new") === "true"
  const templateName = searchParams.get("name") || "Untitled Template"
  const isEditorMode = templateId !== null || isNewTemplate

  const [variables, setVariables] = useState<Variable[]>(defaultVariables)
  const [variableEditorOpen, setVariableEditorOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<DocumentTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor
  }, [])

  const handleApplyPreviewValues = useCallback((values: Record<string, string>) => {
    setPreviewValues(values)
    if (!editorRef.current) return
    const editor = editorRef.current
    try {
      // Use GrapesJS component API to find all data-variable components
      const wrapper = editor.DomComponents.getWrapper()
      const varComponents = wrapper.findType("data-variable")

      const hasAnyValue = Object.values(values).some(v => v.trim())

      varComponents.forEach((comp: any) => {
        const el = comp.getEl()
        if (!el) return

        // If all values are empty (clear), restore original tags
        if (!hasAnyValue && el.hasAttribute("data-preview-active")) {
          el.innerHTML = el.getAttribute("data-preview-original") || ""
          el.style.cssText = el.getAttribute("data-preview-original-style") || ""
          el.removeAttribute("data-preview-active")
          el.removeAttribute("data-preview-original")
          el.removeAttribute("data-preview-original-style")
          return
        }

        const resolver = comp.get("dataResolver") || {}
        const path = resolver.path || ""
        const pathMatch = path.match(/globalData\.([^.]+)\./)
        const varName = pathMatch?.[1] || ""
        const testValue = values[varName]?.trim()
        if (!testValue) return

        // Save original state for restoration
        if (!el.hasAttribute("data-preview-original")) {
          el.setAttribute("data-preview-original", el.innerHTML)
          el.setAttribute("data-preview-original-style", el.getAttribute("style") || "")
        }
        el.setAttribute("data-preview-active", "true")
        el.textContent = testValue
        el.style.cssText = "display:inline !important;background:none !important;border:none !important;padding:0 !important;font-size:inherit !important;font-weight:inherit !important;font-family:inherit !important;color:inherit !important;line-height:inherit !important;white-space:normal !important;border-radius:0 !important;vertical-align:baseline !important;"
      })
    } catch (e) {
      console.warn("Failed to apply preview values:", e)
    }
  }, [])

  const globalData = useMemo(() => variablesToGlobalData(variables), [variables])

  const handleInsertVariable = useCallback((variableName: string) => {
    const editor = editorRef.current
    if (!editor) return
    const selected = editor.getSelected() || editor.getWrapper()
    if (selected) {
      const resolver = JSON.stringify({
        path: `globalData.${variableName}.data`,
        defaultValue: variableName,
      })
      selected.append(`<data-variable data-gjs-data-resolver='${resolver}'></data-variable>`)
    }
  }, [])

  const variableOptions = useMemo(() => 
    variables.map(variable => ({
      id: `{{${variable.name}}}`,
      label: variable.name
    })),
    [variables]
  )

  useEffect(() => {
    if (!templateId) return

    let cancelled = false
    setLoadingTemplate(true)
    setTemplateError(null)
    setCurrentTemplate(null)
    setVariables(defaultVariables)

    Promise.all([
      fetch(`/api/document-templates/${templateId}`).then(res => {
        if (!res.ok) throw new Error("Template not found")
        return res.json()
      }),
      fetch(`/api/document-templates/${templateId}/variables`).then(res => {
        if (!res.ok) throw new Error("Failed to load variables")
        return res.json()
      })
    ])
      .then(([templateData, variablesData]) => {
        if (cancelled) return
        setCurrentTemplate(templateData.template)
        setVariables(variablesData.variables || [])
      })
      .catch(e => {
        if (cancelled) return
        setTemplateError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplate(false)
      })

    return () => { cancelled = true }
  }, [templateId])

  const handleSelectTemplate = useCallback((template: DocumentTemplate) => {
    router.push(`/platform-settings/integrations/template-editor?tab=documents&template=${template.id}`)
  }, [router])

  const handleCreateTemplate = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/document-templates", {
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
      router.push(`/platform-settings/integrations/template-editor?tab=documents&template=${data.template.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create template")
    }
  }, [router])

  const handleBackToGallery = useCallback(() => {
    setCurrentTemplate(null)
    setTemplateError(null)
    router.push("/platform-settings/integrations/template-editor?tab=documents")
  }, [router])

  const handleEditorSave = useCallback(async (html: string, projectData: object) => {
    const id = currentTemplate?.id ?? templateId
    if (!id || id.startsWith("new-")) return
    try {
      await fetch(`/api/document-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html_content: html,
          gjs_data: projectData,
        }),
      })
    } catch (e) {
      console.error("Failed to persist template:", e)
    }
  }, [currentTemplate?.id, templateId])

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

  if (!isEditorMode) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <TemplateGallery
            onSelectTemplate={handleSelectTemplate}
            onCreateTemplate={handleCreateTemplate}
          />
        </div>
      </div>
    )
  }

  if (loadingTemplate) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconLoader2 className="h-5 w-5 animate-spin" />
            <span>Loading template...</span>
          </div>
        </div>
      </div>
    )
  }

  if (templateError) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <p className="text-destructive">{templateError}</p>
          <Button variant="outline" onClick={handleBackToGallery}>
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: grapejsThemeStyles }} />
      
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
            <h3 className="text-lg font-medium">
              {editorTemplate?.name || "Template Editor"}
            </h3>
            <p className="text-muted-foreground text-sm">
              Edit template design
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showTestPanel ? "secondary" : "outline"}
            className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            onClick={() => {
              const next = !showTestPanel
              setShowTestPanel(next)
              const editor = editorRef.current
              if (!editor) return

              if (next) {
                editor.select(null)
                const root = document.querySelector(".gs-studio-root")
                root?.classList.add("gs-preview-mode")
              } else {
                // Restore original variable tags in the canvas
                try {
                  const wrapper = editor.DomComponents.getWrapper()
                  wrapper.findType("data-variable").forEach((comp: any) => {
                    const el = comp.getEl()
                    if (!el || !el.hasAttribute("data-preview-active")) return
                    el.innerHTML = el.getAttribute("data-preview-original") || ""
                    el.style.cssText = el.getAttribute("data-preview-original-style") || ""
                    el.removeAttribute("data-preview-active")
                    el.removeAttribute("data-preview-original")
                    el.removeAttribute("data-preview-original-style")
                  })
                } catch {}
                const root = document.querySelector(".gs-studio-root")
                root?.classList.remove("gs-preview-mode")
              }
            }}
          >
            <IconTestPipe className="h-4 w-4 mr-1.5" />
            Test Data
          </Button>
          <Button
            variant="outline"
            onClick={() => setVariableEditorOpen(true)}
            className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          >
            <IconDatabase className="h-4 w-4 mr-2" />
            Edit Variables
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 gap-0 px-4 pb-4">
        <div className="flex-1 min-w-0 h-full rounded-lg border bg-background overflow-hidden isolate">
          <StudioEditorWrapper
            key={`editor-${templateId}-${variables.length}`}
            globalData={globalData}
            variableOptions={variableOptions}
            variables={variables}
            template={editorTemplate}
            onSave={handleEditorSave}
            onEditorReady={handleEditorReady}
          />
        </div>

        {showTestPanel && (
          <div className="w-[280px] flex-shrink-0 h-full pl-2">
            <VariablePreviewPanel
              variables={variables}
              values={previewValues}
              onValuesChange={handleApplyPreviewValues}
            />
          </div>
        )}
      </div>

      <VariableEditorModal
        open={variableEditorOpen}
        onOpenChange={setVariableEditorOpen}
        variables={variables}
        onVariablesChange={setVariables}
        templateId={templateId || undefined}
      />
    </div>
  )
}
