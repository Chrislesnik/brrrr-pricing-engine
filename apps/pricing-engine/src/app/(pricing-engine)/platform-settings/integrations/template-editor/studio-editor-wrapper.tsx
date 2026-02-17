"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import StudioEditorComponent from "@grapesjs/studio-sdk/react"
import {
  presetPrintable,
  canvasFullSize,
  layoutSidebarButtons,
  googleFontsAssetProvider,
  rteProseMirror,
  flexComponent,
  dataSourceHandlebars,
} from "@grapesjs/studio-sdk-plugins"
import aiChat from "@grapesjs/studio-sdk-plugins/dist/aiChat"
import { DocumentTemplate, defaultTemplateHtml } from "./template-types"
import { Field, typeColorConfig, FieldType } from "./field-types"

const GRAPEJS_STYLE_ID = "grapesjs-scoped-styles"

// Suppress React 19 ref warning from @grapesjs/studio-sdk until library updates
// This is a temporary workaround - the library uses element.ref which was removed in React 19
if (typeof window !== "undefined") {
  const originalConsoleError = console.error
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Accessing element.ref was removed in React 19")
    ) {
      return // Suppress this specific warning
    }
    originalConsoleError.apply(console, args)
  }
}

interface StudioEditorWrapperProps {
  globalData: Record<string, { data: string }>
  variableOptions: { id: string; label: string }[]
  fields: Field[]
  isPreviewMode?: boolean
  template?: DocumentTemplate | null
  onSave?: (html: string, projectData: object) => void
}

/**
 * GrapesJS Editor with complete CSS isolation.
 * 
 * Strategy: Fetch GrapesJS CSS as raw text, prefix ALL selectors with .gs-studio-root,
 * then inject. This prevents ANY style leakage to the rest of the app.
 */
export function StudioEditorWrapper({
  globalData,
  variableOptions,
  fields,
  isPreviewMode = false,
  template,
  onSave,
}: StudioEditorWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [stylesReady, setStylesReady] = useState(false)
  const { resolvedTheme } = useTheme()

  // Map app theme to GrapesJS theme
  const grapejsTheme = resolvedTheme === "dark" ? "dark" : "light"

  // Get the HTML content for the editor
  const templateHtml = template?.html_content || defaultTemplateHtml

  // Load and scope GrapesJS CSS (persists across remounts since it's static)
  useEffect(() => {
    let cancelled = false

    // If styles are already injected, just mark ready
    if (document.getElementById(GRAPEJS_STYLE_ID)) {
      setStylesReady(true)
      setMounted(true)
      return
    }

    const loadAndScopeStyles = async () => {
      try {
        const response = await fetch("/grapesjs-style.css")
        if (!response.ok) {
          throw new Error(`Failed to fetch GrapesJS CSS: ${response.status}`)
        }
        
        let css = await response.text()
        css = scopeCSSToRoot(css, ".gs-studio-root")
        
        // Double-check another instance didn't inject while we fetched
        if (!document.getElementById(GRAPEJS_STYLE_ID)) {
          const styleEl = document.createElement("style")
          styleEl.id = GRAPEJS_STYLE_ID
          styleEl.textContent = css
          document.head.appendChild(styleEl)
        }
        
        if (!cancelled) {
          setStylesReady(true)
          setMounted(true)
        }
      } catch (error) {
        console.error("Failed to load GrapesJS styles:", error)
        if (!cancelled) {
          setStylesReady(true)
          setMounted(true)
        }
      }
    }

    loadAndScopeStyles()

    return () => { cancelled = true }
  }, [])

  // Show loading state
  if (!mounted || !stylesReady) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  // Build field name -> type map for dropdown coloring
  const fieldTypeMap = new Map<string, FieldType>()
  fields.forEach(f => fieldTypeMap.set(f.name, f.type))

  // Create styled variable options with colored pill labels
  const styledVariableOptions = variableOptions.map(opt => {
    // Extract field name from {{field_name}}
    const fieldName = opt.id.replace(/^\{\{|\}\}$/g, "")
    const fieldType = fieldTypeMap.get(fieldName) || "String"
    const colors = typeColorConfig[fieldType] || typeColorConfig["String"]
    return {
      id: opt.id,
      label: `<span style="display:inline-flex;align-items:center;padding:1px 8px;border-radius:9999px;font-size:11px;font-weight:500;background:${colors.bgHex};color:${colors.textHex};border:1px solid ${colors.borderHex}">${opt.label}</span>`,
    }
  })

  return (
    <div className="h-full w-full">
      <StudioEditorComponent
        key={grapejsTheme}
        options={{
          licenseKey: "",
          theme: grapejsTheme,
          fonts: {
            enableFontManager: true,
          },
          dataSources: {
            globalData: globalData,
            blocks: true,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: (layoutSidebarButtons as any).createLayoutConfig({
            sidebarButtons: ({ sidebarButtons, createSidebarButton }: any) => [
              ...sidebarButtons,
              createSidebarButton({
                id: "aiChatPanel",
                tooltip: "AI Assistant",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2m16 0h2m-7-1v2m-6-2v2"/></g></svg>',
                layoutCommand: { header: false },
                layoutComponent: { type: "aiChatPanel" },
              }),
            ],
            rootLayout: ({ rootLayout }: any) => {
              // Inject custom toolbar buttons into canvasSidebarTop
              const children = rootLayout?.children
              if (Array.isArray(children)) {
                const canvasIdx = children.findIndex((c: any) => c?.type === "canvasSidebarTop")
                if (canvasIdx !== -1) {
                  const canvas = { ...children[canvasIdx] }
                  canvas.sidebarTop = {
                    ...canvas.sidebarTop,
                    rightContainer: {
                      ...canvas.sidebarTop?.rightContainer,
                      buttons: ({ items, editor }: { items: any[]; editor: any }) => [
                        {
                          id: "print",
                          icon: '<svg viewBox="0 0 24 24"><path d="M18 3H6v4h12m1 5a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-3 7H8v-5h8m3-6H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Z"/></svg>',
                          tooltip: "Print",
                          onClick: () => editor.runCommand("presetPrintable:print"),
                        },
                        ...items.filter(
                          (item: { id: string }) =>
                            !["showImportCode", "fullscreen", "settings", "openSettings"].includes(item.id)
                        ),
                        {
                          id: "zoom-out",
                          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
                          tooltip: "Zoom Out",
                          onClick: () => {
                            const zoom = editor.Canvas.getZoom()
                            editor.Canvas.setZoom(Math.max(zoom - 10, 10))
                          },
                        },
                        {
                          id: "zoom-in",
                          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
                          tooltip: "Zoom In",
                          onClick: () => {
                            const zoom = editor.Canvas.getZoom()
                            editor.Canvas.setZoom(Math.min(zoom + 10, 200))
                          },
                        },
                        {
                          id: "zoom-fit",
                          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
                          tooltip: "Fit to Screen (100%)",
                          onClick: () => {
                            editor.Canvas.setZoom(100)
                          },
                        },
                      ],
                    },
                  }
                  children[canvasIdx] = canvas
                }
              }
              return rootLayout
            },
          }),
          plugins: [
            presetPrintable,
            canvasFullSize,
            layoutSidebarButtons.init({ skipLayoutConfig: true }),
            googleFontsAssetProvider.init({
              apiKey: process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || "",
            }),
            dataSourceHandlebars,
            rteProseMirror.init({
              toolbar({ items, layouts, commands }) {
                return [
                  ...items,
                  layouts.separator,
                  {
                    id: "variables",
                    type: "selectField",
                    emptyState: "Insert Variable",
                    options: styledVariableOptions,
                    onChange: ({ value }: { value: string }) =>
                      commands.text.replace(value, { select: true }),
                  },
                ]
              },
            }),
            flexComponent,
            aiChat.init({
              chatApi: "/api/ai-chat",
            }),
          ],
          project: {
            type: "document",
            default: {
              pages: [
                {
                  name: template?.name || "Document",
                  component: templateHtml,
                },
              ],
            },
          },
        }}
        onReady={(editor) => {
          // Persist HTML + project data on every save (Ctrl+S / autosave)
          editor.on('storage:store', () => {
            try {
              const html = editor.getHtml() ?? ""
              const projectData = editor.getProjectData() ?? {}
              onSave?.(html, projectData)
            } catch (e) {
              console.error("Failed to extract editor data on save:", e)
            }
          })

          // Fix for GrapesJS selection/focus issues after drag operations
          editor.on('component:drag:end', () => {
            setTimeout(() => {
              const selected = editor.getSelected()
              if (selected) {
                editor.select(selected)
              }
            }, 50)
          })
          
          editor.on('block:drag:stop', () => {
            setTimeout(() => {
              editor.refresh()
            }, 50)
          })

          // Inject variable tag styling into the canvas iframe (edit mode only)
          const injectVariableStyles = () => {
            // Skip pill styling in preview mode -- show actual values as plain text
            if (isPreviewMode) return
            try {
              const canvasDoc = editor.Canvas.getDocument()
              if (!canvasDoc) return

              // Remove old injection if present
              const existingStyle = canvasDoc.getElementById("variable-tag-styles")
              if (existingStyle) existingStyle.remove()

              // Build a map of field name -> type color
              const fieldMap = new Map<string, FieldType>()
              fields.forEach(f => fieldMap.set(f.name, f.type))

              // Base pill styles for all handlebars expressions
              let css = `
                [data-variable], [data-gjs-type="data-variable"] {
                  display: inline-flex !important;
                  align-items: center !important;
                  padding: 1px 8px !important;
                  border-radius: 9999px !important;
                  font-size: 0.75rem !important;
                  font-weight: 500 !important;
                  line-height: 1.5 !important;
                  white-space: nowrap !important;
                  vertical-align: baseline !important;
                  /* Default String color */
                  background-color: ${typeColorConfig["String"].bgHex} !important;
                  color: ${typeColorConfig["String"].textHex} !important;
                  border: 1px solid ${typeColorConfig["String"].borderHex} !important;
                }
              `

              // Per-field color overrides based on type
              fields.forEach(field => {
                const colors = typeColorConfig[field.type] || typeColorConfig["String"]
                // Target by content - handlebars variables contain the field name
                css += `
                  [data-variable*="${field.name}"],
                  [data-gjs-type="data-variable"][title*="${field.name}"] {
                    background-color: ${colors.bgHex} !important;
                    color: ${colors.textHex} !important;
                    border: 1px solid ${colors.borderHex} !important;
                  }
                `
              })

              const styleEl = canvasDoc.createElement("style")
              styleEl.id = "variable-tag-styles"
              styleEl.textContent = css
              canvasDoc.head.appendChild(styleEl)
            } catch (e) {
              console.warn("Failed to inject variable styles into canvas:", e)
            }
          }

          // Inject immediately and also after canvas loads
          setTimeout(injectVariableStyles, 500)
          editor.on('canvas:frame:load', () => setTimeout(injectVariableStyles, 300))
        }}
      />
    </div>
  )
}

/**
 * Scopes all CSS selectors to a root element.
 * Handles @media, @keyframes, @supports, etc.
 */
function scopeCSSToRoot(css: string, rootSelector: string): string {
  // Remove comments to simplify parsing
  css = css.replace(/\/\*[\s\S]*?\*\//g, "")
  
  const result: string[] = []
  let i = 0
  
  while (i < css.length) {
    // Skip whitespace
    while (i < css.length && /\s/.test(css[i])) i++
    if (i >= css.length) break
    
    // Check for @ rules
    if (css[i] === "@") {
      const atRuleMatch = css.slice(i).match(/^@([a-z-]+)\s*/i)
      if (atRuleMatch) {
        const atRuleName = atRuleMatch[1].toLowerCase()
        
        // @keyframes, @font-face - keep as-is (no scoping needed)
        if (atRuleName === "keyframes" || atRuleName === "font-face") {
          const start = i
          i += atRuleMatch[0].length
          // Find the name for keyframes
          if (atRuleName === "keyframes") {
            const nameMatch = css.slice(i).match(/^[\w-]+\s*/)
            if (nameMatch) i += nameMatch[0].length
          }
          // Find matching brace
          if (css[i] === "{") {
            let depth = 1
            i++
            while (i < css.length && depth > 0) {
              if (css[i] === "{") depth++
              else if (css[i] === "}") depth--
              i++
            }
          }
          result.push(css.slice(start, i))
          continue
        }
        
        // @media, @supports - scope inner rules
        if (atRuleName === "media" || atRuleName === "supports" || atRuleName === "layer") {
          const start = i
          i += atRuleMatch[0].length
          // Get the condition
          let condition = ""
          while (i < css.length && css[i] !== "{") {
            condition += css[i]
            i++
          }
          if (css[i] === "{") {
            i++ // skip {
            let innerCSS = ""
            let depth = 1
            const innerStart = i
            while (i < css.length && depth > 0) {
              if (css[i] === "{") depth++
              else if (css[i] === "}") depth--
              if (depth > 0) innerCSS += css[i]
              i++
            }
            // Recursively scope inner CSS
            const scopedInner = scopeCSSToRoot(innerCSS, rootSelector)
            result.push(`@${atRuleName} ${condition.trim()} {\n${scopedInner}\n}`)
          }
          continue
        }
        
        // Other @ rules (like @import, @charset) - keep as-is
        const start = i
        while (i < css.length && css[i] !== ";" && css[i] !== "{") i++
        if (css[i] === ";") i++
        else if (css[i] === "{") {
          let depth = 1
          i++
          while (i < css.length && depth > 0) {
            if (css[i] === "{") depth++
            else if (css[i] === "}") depth--
            i++
          }
        }
        result.push(css.slice(start, i))
        continue
      }
    }
    
    // Regular rule - find selector and body
    let selector = ""
    while (i < css.length && css[i] !== "{") {
      selector += css[i]
      i++
    }
    
    if (css[i] === "{") {
      i++ // skip {
      let body = ""
      let depth = 1
      while (i < css.length && depth > 0) {
        if (css[i] === "{") depth++
        else if (css[i] === "}") depth--
        if (depth > 0) body += css[i]
        i++
      }
      
      selector = selector.trim()
      if (selector) {
        // Scope each selector in the comma-separated list
        const scopedSelectors = selector.split(",").map(s => {
          s = s.trim()
          if (!s) return s
          
          // Don't scope these special selectors
          if (
            s === ":root" ||
            s === "html" ||
            s === "body" ||
            s.startsWith(rootSelector) ||
            /^\d+%$/.test(s) ||
            s === "from" ||
            s === "to"
          ) {
            // Replace :root, html, body with rootSelector
            if (s === ":root" || s === "html" || s === "body") {
              return rootSelector
            }
            return s
          }
          
          // Handle :root pseudo-class at start
          if (s.startsWith(":root")) {
            return rootSelector + s.slice(5)
          }
          
          // Prefix with root selector
          return `${rootSelector} ${s}`
        }).join(", ")
        
        result.push(`${scopedSelectors} {\n${body}\n}`)
      }
    }
  }
  
  return result.join("\n\n")
}
