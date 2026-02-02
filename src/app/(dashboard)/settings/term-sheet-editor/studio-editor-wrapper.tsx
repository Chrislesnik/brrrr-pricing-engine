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
import { FieldType, typeColorConfig } from "./field-types"

const GRAPEJS_STYLE_ID = "grapesjs-scoped-styles"
const VARIABLE_WIDGET_STYLE_ID = "variable-widget-styles"

// Generate CSS for variable widgets in the canvas
function generateVariableWidgetCSS(): string {
  // Base styles for variable widgets
  // Uses CSS to hide the {{variable}} text and show the label from data-label attribute
  let css = `
    .ts-variable {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      margin: 0 2px;
      border-radius: 4px;
      font-size: 0.875em;
      font-weight: 500;
      white-space: nowrap;
      cursor: default;
      border: 1px solid;
      position: relative;
      /* Hide the actual {{variable}} text */
      color: transparent !important;
      font-size: 0 !important;
    }
    
    /* Show the label using ::before pseudo-element */
    .ts-variable::before {
      content: attr(data-label);
      font-size: 0.875rem;
      font-weight: 500;
    }
  `
  
  // Add color-specific styles for each type
  const types: FieldType[] = ["String", "Number", "Boolean", "Array", "Object", "Binary Data"]
  types.forEach(type => {
    const colors = typeColorConfig[type]
    css += `
    .ts-variable[data-type="${type}"] {
      background-color: ${colors.bgHex};
      border-color: ${colors.borderHex};
    }
    .ts-variable[data-type="${type}"]::before {
      color: ${colors.textHex};
    }
    `
  })
  
  return css
}

// Generate script to style {{variable}} patterns with CSS-only approach
function generateVariableWidgetScript(variableOptions: VariableOption[]): string {
  // Create a map of variable names to their types and labels
  const varDataMap = JSON.stringify(
    Object.fromEntries(variableOptions.map(opt => [
      opt.id, 
      { type: opt.type, label: opt.label }
    ]))
  )
  
  return `
    (function() {
      const varDataMap = ${varDataMap};
      const defaultType = "String";
      
      function formatLabel(name) {
        return name.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
      }
      
      function wrapVariables(element) {
        if (!element || element.nodeType !== 1) return;
        
        // Skip if already processed
        if (element.classList && element.classList.contains('ts-variable')) return;
        if (element.closest && element.closest('.ts-variable')) return;
        
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent && node.textContent.includes('{{')) {
            // Skip if inside a ts-variable span
            if (node.parentNode && node.parentNode.classList && 
                node.parentNode.classList.contains('ts-variable')) continue;
            textNodes.push(node);
          }
        }
        
        textNodes.forEach(textNode => {
          const text = textNode.textContent;
          const regex = /\\{\\{([^}]+)\\}\\}/g;
          
          if (!regex.test(text)) return;
          regex.lastIndex = 0;
          
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          let match;
          
          while ((match = regex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            
            // Create styled variable span
            const varName = match[1];
            const varData = varDataMap[varName] || { type: defaultType, label: formatLabel(varName) };
            const span = document.createElement('span');
            span.className = 'ts-variable';
            span.setAttribute('data-type', varData.type);
            span.setAttribute('data-name', varName);
            span.setAttribute('contenteditable', 'false');
            // Keep the original handlebars syntax inside for data binding
            // but use CSS to show the label instead
            span.setAttribute('data-label', varData.label);
            span.textContent = match[0]; // Keep {{varName}} for data binding
            fragment.appendChild(span);
            
            lastIndex = regex.lastIndex;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
          }
          
          // Replace the text node with our fragment
          if (textNode.parentNode) {
            textNode.parentNode.replaceChild(fragment, textNode);
          }
        });
      }
      
      // Process all content
      function processDocument() {
        wrapVariables(document.body);
      }
      
      // Initial processing with delay to ensure content is loaded
      setTimeout(processDocument, 100);
      
      // Watch for changes using MutationObserver
      const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1 && !node.classList.contains('ts-variable')) {
                shouldProcess = true;
              } else if (node.nodeType === 3 && node.textContent.includes('{{')) {
                shouldProcess = true;
              }
            });
          }
        });
        if (shouldProcess) {
          setTimeout(processDocument, 50);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    })();
  `
}

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

interface VariableOption {
  id: string      // Raw field name
  label: string   // Human-readable label
  type: FieldType // Field type for coloring
}

interface StudioEditorWrapperProps {
  globalData: Record<string, { data: string }>
  variableOptions: VariableOption[]
  template?: TermSheetTemplate | null
  onSave?: (html: string, gjsData: object) => void
  onEditorReady?: (editor: any) => void // Expose editor instance to parent
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
  onEditorReady,
}: StudioEditorWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [stylesReady, setStylesReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  // Track initial globalData to avoid updating on mount
  const initialGlobalDataRef = useRef(globalData)

  // Get the HTML content for the editor
  // Use template html_content if it exists and is non-empty, otherwise use default blank template
  const templateHtml = (template?.html_content && template.html_content.trim().length > 0) 
    ? template.html_content 
    : defaultTemplateHtml
  
  // Debug: log template state
  console.log('[StudioEditor] template:', template?.name, 'html_content length:', template?.html_content?.length, 'using:', templateHtml.substring(0, 100))

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

  // Update editor's globalData when props change (without remounting)
  useEffect(() => {
    if (!editorRef.current) return
    // Skip the initial render - data is already set via options
    if (globalData === initialGlobalDataRef.current) return
    
    try {
      const editor = editorRef.current
      // Access the DataSources manager and update globalData
      const dsm = editor.DataSources || editor.dataSources
      if (dsm && typeof dsm.setValue === 'function') {
        // Update each field individually
        Object.entries(globalData).forEach(([key, value]) => {
          dsm.setValue(key, value.data)
        })
      } else if (dsm && dsm.getAll) {
        // Alternative: try to find the global data source and update it
        const sources = dsm.getAll()
        const globalSource = sources.find((s: { id: string }) => s.id === 'globalData')
        if (globalSource && typeof globalSource.setRecords === 'function') {
          globalSource.setRecords(globalData)
        }
      }
    } catch (err) {
      // Silently handle - editor may not support dynamic updates
      console.debug('Could not update globalData dynamically:', err)
    }
  }, [globalData])

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
          // Disable built-in storage to remove the "Save content" button
          // We handle saving ourselves via the custom Save button
          storage: false,
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
                    options: variableOptions.map(opt => ({
                      id: opt.id,
                      label: opt.label,
                    })),
                    onChange: ({ value }) => {
                      // Insert handlebars syntax - the injected script will style it
                      commands.text.replace(`{{${value}}}`, { select: true })
                    },
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
        onReady={(editor) => {
          editorRef.current = editor
          
          // Expose editor instance to parent component
          if (onEditorReady) {
            onEditorReady(editor)
          }
          
          // Remove the "Save content" button from the toolbar
          // We use our own Save button instead
          setTimeout(() => {
            try {
              // Find and hide any button with "Save content" tooltip
              const container = document.querySelector('.gs-studio-root')
              if (container) {
                const allButtons = container.querySelectorAll('button')
                allButtons.forEach((btn) => {
                  const tooltip = btn.getAttribute('data-tooltip') || 
                                  btn.getAttribute('title') || 
                                  btn.getAttribute('aria-label') ||
                                  btn.textContent
                  if (tooltip && tooltip.toLowerCase().includes('save')) {
                    btn.style.display = 'none'
                    console.log('[StudioEditor] Hidden save button:', tooltip)
                  }
                })
              }
            } catch (err) {
              console.debug('Could not hide save button:', err)
            }
          }, 500)
          
          // Set up save functionality
          if (onSave) {
            // Helper function to extract and save content
            const triggerSave = () => {
              try {
                const html = editor.getHtml()
                const css = editor.getCss()
                const gjsData = editor.getProjectData()
                // Combine HTML and CSS for full output
                const fullHtml = css ? `<style>${css}</style>${html}` : html
                onSave(fullHtml, gjsData)
              } catch (err) {
                console.error('[StudioEditor] Save failed:', err)
              }
            }
            
            // Listen to storage:store event (triggered by GrapesJS save icon or Ctrl+S)
            editor.on('storage:store', triggerSave)
            
            // Add a manual save command that can be triggered from parent
            editor.Commands.add('save-template', {
              run: triggerSave
            })
          }
          
          // CRITICAL: presetPrintable injects its own default content
          // We need to clear it and load our template content AFTER initialization
          try {
            const wrapper = editor.getWrapper()
            if (wrapper && templateHtml) {
              // Check if this is a blank template (our defaultTemplateHtml)
              // If so, clear the preset content
              const isBlankTemplate = templateHtml.includes('data-gjs-type="wrapper"') && 
                                       !templateHtml.includes('TERM SHEET') &&
                                       templateHtml.length < 200
              
              console.log('[StudioEditor] onReady - isBlankTemplate:', isBlankTemplate, 'templateHtml length:', templateHtml.length)
              
              if (isBlankTemplate) {
                // Clear the preset content - set to empty
                wrapper.components().reset()
                console.log('[StudioEditor] Cleared preset content for blank template')
              } else if (template?.html_content && template.html_content.length > 0) {
                // Load the actual template content from database
                // Clear first, then load
                wrapper.components().reset()
                editor.setComponents(template.html_content)
                console.log('[StudioEditor] Loaded template content from database:', template.html_content.substring(0, 100))
              }
            }
          } catch (err) {
            console.debug("Could not set template content:", err)
          }
          
          // Inject variable widget CSS and script into the canvas iframe
          // Delay slightly to ensure canvas is ready after content change
          setTimeout(() => {
            try {
              const canvas = editor.Canvas
              if (canvas) {
                const canvasDoc = canvas.getDocument()
                if (canvasDoc) {
                  // Inject CSS if not already present
                  if (!canvasDoc.getElementById(VARIABLE_WIDGET_STYLE_ID)) {
                    const styleEl = canvasDoc.createElement("style")
                    styleEl.id = VARIABLE_WIDGET_STYLE_ID
                    styleEl.textContent = generateVariableWidgetCSS()
                    canvasDoc.head.appendChild(styleEl)
                  }
                  
                  // Inject script if not already present
                  const scriptId = VARIABLE_WIDGET_STYLE_ID + "-script"
                  if (!canvasDoc.getElementById(scriptId)) {
                    const scriptEl = canvasDoc.createElement("script")
                    scriptEl.id = scriptId
                    scriptEl.textContent = generateVariableWidgetScript(variableOptions)
                    canvasDoc.body.appendChild(scriptEl)
                  }
                }
              }
            } catch (err) {
              console.debug("Could not inject variable widget styles/script:", err)
            }
          }, 100)
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
