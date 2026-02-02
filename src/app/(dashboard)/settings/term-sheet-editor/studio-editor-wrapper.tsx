"use client"

import { useEffect, useState, useRef } from "react"
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
import { TermSheetTemplate, defaultTemplateHtml } from "./template-types"

const GRAPEJS_STYLE_ID = "grapesjs-scoped-styles"

interface StudioEditorWrapperProps {
  globalData: Record<string, string>
  variableOptions: { id: string; label: string }[]
  template?: TermSheetTemplate | null
  onSave?: (html: string, gjsData: object) => void
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
  template,
  onSave,
}: StudioEditorWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [stylesReady, setStylesReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get the HTML content for the editor
  const templateHtml = template?.html_content || defaultTemplateHtml

  // Load and scope GrapesJS CSS
  useEffect(() => {
    // Check if already loaded
    if (document.getElementById(GRAPEJS_STYLE_ID)) {
      setStylesReady(true)
      setMounted(true)
      return
    }

    const loadAndScopeStyles = async () => {
      try {
        // Fetch the CSS as raw text (NOT importing, which would bundle it globally)
        const response = await fetch("/grapesjs-style.css")
        if (!response.ok) {
          throw new Error(`Failed to fetch GrapesJS CSS: ${response.status}`)
        }
        
        let css = await response.text()
        
        // Scope ALL CSS selectors to .gs-studio-root
        // This is a simplified but effective CSS scoping approach
        css = scopeCSSToRoot(css, ".gs-studio-root")
        
        // Inject the scoped CSS
        const styleEl = document.createElement("style")
        styleEl.id = GRAPEJS_STYLE_ID
        styleEl.textContent = css
        document.head.appendChild(styleEl)
        
        setStylesReady(true)
        setMounted(true)
      } catch (error) {
        console.error("Failed to load GrapesJS styles:", error)
        // Still try to mount without styles
        setStylesReady(true)
        setMounted(true)
      }
    }

    loadAndScopeStyles()

    // Cleanup on unmount
    return () => {
      const styleEl = document.getElementById(GRAPEJS_STYLE_ID)
      if (styleEl) {
        styleEl.remove()
      }
    }
  }, [])

  // Show loading state
  if (!mounted || !stylesReady) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <StudioEditorComponent
        options={{
          licenseKey: "",
          fonts: {
            enableFontManager: true,
          },
          dataSources: {
            globalData: globalData,
            blocks: true,
          },
          plugins: [
            presetPrintable,
            canvasFullSize,
            layoutSidebarButtons,
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
                    options: variableOptions,
                    onChange: ({ value }) =>
                      commands.text.replace(value, { select: true }),
                  },
                ]
              },
            }),
            flexComponent,
          ],
          project: {
            type: "document",
            default: {
              pages: [
                {
                  name: template?.name || "Term Sheet",
                  component: templateHtml,
                },
              ],
            },
          },
          layout: {
            default: {
              type: "row",
              height: "100%",
              children: [
                {
                  type: "sidebarLeft",
                  children: {
                    type: "panelLayers",
                    header: {
                      label: "Layers",
                      collapsible: false,
                      icon: "layers",
                    },
                  },
                },
                {
                  type: "canvasSidebarTop",
                  sidebarTop: {
                    rightContainer: {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      buttons: ({ items, editor }: { items: any[]; editor: any }) => [
                        {
                          id: "print",
                          icon: '<svg viewBox="0 0 24 24"><path d="M18 3H6v4h12m1 5a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-3 7H8v-5h8m3-6H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Z"/></svg>',
                          tooltip: "Print",
                          onClick: () => editor.runCommand("presetPrintable:print"),
                        },
                        ...items.filter(
                          (item: { id: string }) =>
                            !["showImportCode", "fullscreen"].includes(item.id)
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
                  },
                },
                { type: "sidebarRight" },
              ],
            },
          },
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
