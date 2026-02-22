"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "next-themes"
import StudioEditorComponent from "@grapesjs/studio-sdk/react"
import {
  presetPrintable,
  canvasFullSize,
  googleFontsAssetProvider,
  rteProseMirror,
  flexComponent,
  dataSourceHandlebars,
} from "@grapesjs/studio-sdk-plugins"
import aiChat from "@grapesjs/studio-sdk-plugins/dist/aiChat"
import { DocumentTemplate, defaultTemplateHtml } from "./template-types"
import { PropertiesPanel } from "./properties-panel"
import { Variable, typeColorConfig, VariableType } from "./variable-types"

const GRAPEJS_STYLE_ID = "grapesjs-scoped-styles"

const QR_CODE_BLOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><rect width="80" height="80" x="336" y="336" rx="8" ry="8"/><rect width="64" height="64" x="272" y="272" rx="8" ry="8"/><rect width="64" height="64" x="416" y="416" rx="8" ry="8"/><rect width="48" height="48" x="432" y="272" rx="8" ry="8"/><rect width="48" height="48" x="272" y="432" rx="8" ry="8"/><path d="M448 32H304a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32m-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8ZM208 32H64a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32m-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8Zm32 104H64a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V304a32 32 0 0 0-32-32m-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8Z"/></svg>`

function qrCodePlugin(editor: any) {
  function buildQrSrc(attrs: Record<string, string>) {
    const mode = attrs["data-qr-mode"] || "static"
    const size = attrs["data-qr-size"] || "150"
    let qrData: string
    if (mode === "variable" && attrs["data-qr-variable"]) {
      qrData = `{{${attrs["data-qr-variable"]}}}`
    } else {
      qrData = attrs["data-qr-data"] || "https://example.com"
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}`
  }

  editor.Components.addType("qr-code", {
    model: {
      defaults: {
        tagName: "img",
        attributes: {
          "data-gjs-type": "qr-code",
          "data-qr-data": "https://example.com",
          "data-qr-size": "150",
          "data-qr-mode": "static",
          "data-qr-variable": "",
        },
        style: { display: "block" },
        traits: [
          { type: "text", name: "data-qr-data" },
          { type: "text", name: "data-qr-size" },
          { type: "text", name: "data-qr-mode" },
          { type: "text", name: "data-qr-variable" },
        ],
        stylable: ["width", "height", "margin", "padding"],
        resizable: true,
        droppable: false,
      },
      init() {
        this.on("change:attributes:data-qr-data", this.updateQrSrc)
        this.on("change:attributes:data-qr-size", this.updateQrSrc)
        this.on("change:attributes:data-qr-mode", this.updateQrSrc)
        this.on("change:attributes:data-qr-variable", this.updateQrSrc)
        this.updateQrSrc()
      },
      updateQrSrc() {
        const src = buildQrSrc(this.getAttributes())
        this.set("src", src)
        this.addAttributes({ src })
      },
    },
    view: {
      onRender() {
        const attrs = this.model.getAttributes()
        const src = buildQrSrc(attrs)
        const size = attrs["data-qr-size"] || "150"
        this.el.setAttribute("src", src)
        this.el.setAttribute("width", size)
        this.el.setAttribute("height", size)
        this.el.setAttribute("alt", "QR Code")
      },
    },
  })

  editor.Blocks.add("qr-code", {
    label: "QR Code",
    category: "Extra",
    media: QR_CODE_BLOCK_SVG,
    content: { type: "qr-code" },
  })
}

// Suppress React 19 ref warning from @grapesjs/studio-sdk until library updates
if (typeof window !== "undefined") {
  const originalConsoleError = console.error
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Accessing element.ref was removed in React 19")
    ) {
      return
    }
    originalConsoleError.apply(console, args)
  }
}

const ICONS = {
  print: '<svg viewBox="0 0 24 24"><path d="M18 3H6v4h12m1 5a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-3 7H8v-5h8m3-6H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Z"/></svg>',
  zoomOut: '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 21l-4.99-5h-.79M9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14M7 9h5v1H7V9Z"/></svg>',
  zoomIn: '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 21l-4.99-5h-.79M9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1Z"/></svg>',
  zoomFit: '<svg viewBox="0 0 24 24"><path d="M5 5h2V3H5c-1.1 0-2 .9-2 2v2h2V5m14-2h-2v2h2v2h2V5c0-1.1-.9-2-2-2m0 16h-2v2h2c1.1 0 2-.9 2-2v-2h-2v2M5 19H3v2c0 1.1.9 2 2 2h2v-2H5v-2m7-12c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6m0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4"/></svg>',
  aiChat: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2m16 0h2m-7-1v2m-6-2v2"/></g></svg>',
} as const

const TOOLBAR_KEEP_LEFT = ["undo", "redo"]
const TOOLBAR_KEEP_RIGHT = ["save"]

const THEME_FALLBACKS = {
  light: {
    background: "#ffffff", foreground: "#020817", primary: "#000000",
    "primary-foreground": "#f8fafc", secondary: "#f1f5f9", muted: "#f1f5f9",
    "muted-foreground": "#64748b", accent: "#f1f5f9", border: "#e2e8f0",
    sidebar: "#fafafa",
  },
  dark: {
    background: "#0f0f0f", foreground: "#fafafa", primary: "#f8fafc",
    "primary-foreground": "#0f172a", secondary: "#1f1f1f", muted: "#1f1f1f",
    "muted-foreground": "#a6a6a6", accent: "#1f1f1f", border: "#333333",
    sidebar: "#0f0f0f",
  },
} as const

function buildCustomThemeFromHex(colors: Record<string, string>, mode: "light" | "dark") {
  const fb = THEME_FALLBACKS[mode]
  const c = (key: string) => colors[key] || fb[key as keyof typeof fb] || "#888888"

  const accentColors = {
    background1: c("primary"),
    background2: c("secondary"),
    background3: c("sidebar"),
    backgroundHover: c("accent"),
    text: c("primary-foreground"),
  }

  return {
    default: {
      colors: {
        global: {
          background1: c("muted"),
          background2: c("sidebar"),
          background3: c("background"),
          backgroundHover: c("accent"),
          text: c("foreground"),
          border: c("border"),
          placeholder: c("muted-foreground"),
        },
        primary: accentColors,
        component: accentColors,
        selector: accentColors,
        symbol: accentColors,
      },
    },
  }
}

interface StudioEditorWrapperProps {
  globalData: Record<string, { data: string }>
  variableOptions: { id: string; label: string }[]
  variables: Variable[]
  template?: DocumentTemplate | null
  onSave?: (html: string, projectData: object) => void
  onEditorReady?: (editor: any) => void
}

/**
 * GrapesJS Studio SDK editor using native layout composition, built-in
 * self-hosted storage, and scoped CSS isolation.
 */
export function StudioEditorWrapper({
  globalData,
  variableOptions,
  variables,
  template,
  onSave,
  onEditorReady,
}: StudioEditorWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [stylesReady, setStylesReady] = useState(false)
  const [themeState, setThemeState] = useState<{ theme: ReturnType<typeof buildCustomThemeFromHex>; mode: string } | null>(null)
  const [hasSelection, setHasSelection] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const editorRef = useRef<any>(null)
  const { resolvedTheme } = useTheme()

  const grapejsTheme = resolvedTheme === "dark" ? "dark" : "light"
  const customTheme = themeState?.mode === grapejsTheme ? themeState.theme : undefined
  const templateHtml = template?.html_content || defaultTemplateHtml

  const hasStoredProject =
    template?.gjs_data &&
    typeof template.gjs_data === "object" &&
    Object.keys(template.gjs_data).length > 0

  // Fetch org theme colors (hex) from the API and build customTheme.
  // themeState tracks which mode it was built for; the editor won't render until mode matches.
  useEffect(() => {
    let cancelled = false

    fetch("/api/org/theme")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return
        const colors = grapejsTheme === "dark" ? data?.dark : data?.light
        const built = buildCustomThemeFromHex(colors && Object.keys(colors).length > 0 ? colors : {}, grapejsTheme)
        setThemeState({ theme: built, mode: grapejsTheme })
      })
      .catch(() => {
        if (!cancelled) setThemeState({ theme: buildCustomThemeFromHex({}, grapejsTheme), mode: grapejsTheme })
      })

    return () => { cancelled = true }
  }, [grapejsTheme])

  useEffect(() => {
    let cancelled = false

    if (document.getElementById(GRAPEJS_STYLE_ID)) {
      setStylesReady(true)
      setMounted(true)
      return
    }

    const loadAndScopeStyles = async () => {
      try {
        const response = await fetch("/grapesjs-style.css")
        if (!response.ok) throw new Error(`Failed to fetch GrapesJS CSS: ${response.status}`)

        let css = await response.text()
        css = scopeCSSToRoot(css, ".gs-studio-root")

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

  if (!mounted || !stylesReady || !customTheme) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  // Colored pill labels for the variable dropdown in the RTE toolbar
  const variableTypeMap = new Map<string, VariableType>()
  variables.forEach(v => variableTypeMap.set(v.name, v.type))

  const styledVariableOptions = variableOptions.map(opt => {
    const varName = opt.id.replace(/^\{\{|\}\}$/g, "")
    const varType = variableTypeMap.get(varName) || "String"
    const colors = typeColorConfig[varType] || typeColorConfig["String"]
    return {
      id: opt.id,
      label: `<span style="display:inline-flex;align-items:center;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:500;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:${colors.bgHex};color:${colors.textHex};border:1px solid ${colors.borderHex}">${opt.label}</span>`,
    }
  })

  return (
    <div className="h-full w-full">
      <StudioEditorComponent
        key={grapejsTheme}
        options={{
          licenseKey: process.env.NEXT_PUBLIC_GRAPESJS_LICENSE_KEY || "",
          theme: grapejsTheme,
          customTheme,
          fonts: { enableFontManager: true },
          dataSources: {
            globalData,
            blocks: true,
          },

          layout: {
            default: {
              type: "row",
              style: { height: "100%" },
              children: [
                {
                  type: "column",
                  className: "blocks-panel-left",
                  width: 320,
                  style: { borderRightWidth: 1 },
                  children: [
                    {
                      type: "tabs",
                      value: "blocks",
                      tabs: [
                        {
                          id: "blocks",
                          label: "Add Blocks",
                          children: {
                            type: "panelBlocks",
                            symbols: false,
                          },
                        },
                      ],
                      editorEvents: {
                        "component:selected": ({ editor, state, setState }: any) => {
                          const baseTabs = (state.tabs || []).filter((t: any) => t.id !== "properties")
                          if (editor.getSelected()) {
                            setState({
                              value: "properties",
                              tabs: [
                                ...baseTabs,
                                {
                                  id: "properties",
                                  label: "Properties",
                                  children: {
                                    type: "column",
                                    className: "custom-properties-portal",
                                    style: { width: "100%", height: "100%", overflow: "hidden" },
                                    children: [],
                                  },
                                },
                              ],
                            })
                          }
                        },
                        "component:deselected": ({ state, setState }: any) => {
                          setState({
                            value: "blocks",
                            tabs: (state.tabs || []).filter((t: any) => t.id !== "properties"),
                          })
                        },
                      },
                    },
                  ],
                },
                {
                  type: "canvasSidebarTop",
                  sidebarTop: {
                    leftContainer: {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      buttons: ({ items }: { items: any[] }) => [
                        ...items.filter((item: any) => TOOLBAR_KEEP_LEFT.includes(item.id)),
                      ],
                    },
                    rightContainer: {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      buttons: ({ items }: { items: any[] }) => [
                        {
                          id: "print",
                          icon: ICONS.print,
                          tooltip: "Print",
                          onClick: ({ editor }: any) =>
                            editor.runCommand("presetPrintable:print"),
                        },
                        ...items.filter((item: any) => TOOLBAR_KEEP_RIGHT.includes(item.id)),
                        {
                          id: "zoom-out",
                          icon: ICONS.zoomOut,
                          tooltip: "Zoom Out",
                          onClick: ({ editor }: any) => {
                            const zoom = editor.Canvas.getZoom()
                            editor.Canvas.setZoom(Math.max(zoom - 10, 10))
                          },
                        },
                        {
                          id: "zoom-in",
                          icon: ICONS.zoomIn,
                          tooltip: "Zoom In",
                          onClick: ({ editor }: any) => {
                            const zoom = editor.Canvas.getZoom()
                            editor.Canvas.setZoom(Math.min(zoom + 10, 200))
                          },
                        },
                        {
                          id: "zoom-fit",
                          icon: ICONS.zoomFit,
                          tooltip: "Fit to Screen (100%)",
                          onClick: ({ editor }: any) => {
                            editor.Canvas.setZoom(100)
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  type: "column",
                  id: "rightSidebar",
                  className: "right-sidebar-panel",
                  width: 320,
                  style: { borderLeftWidth: 1, overflowY: "auto" },
                  children: [
                    {
                      type: "tabs",
                      value: "variables",
                      tabs: [
                        {
                          id: "variables",
                          label: "Variables",
                          children: {
                            type: "panelBlocks",
                            symbols: false,
                            header: { label: "Variables", collapsible: false },
                            blocks: ({ blocks }: any) =>
                              blocks.filter((b: any) => b.category?.getLabel?.() === "Variables"),
                          },
                        },
                        {
                          id: "layers",
                          label: "Layers",
                          children: {
                            type: "panelLayers",
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },

          storage: {
            type: "self" as const,
            autosaveChanges: 5,
            ...(hasStoredProject
              ? { project: template!.gjs_data as object }
              : {
                  onLoad: async () => ({
                    project: {
                      pages: [
                        {
                          name: template?.name || "Document",
                          component: templateHtml,
                        },
                      ],
                    },
                  }),
                }),
            onSave: async ({ project, editor }: { project: object; editor: any }) => {
              try {
                const html = editor.getHtml() ?? ""
                onSave?.(html, project)
              } catch (e) {
                console.error("Failed to extract editor data on save:", e)
              }
            },
          },

          plugins: [
            presetPrintable,
            canvasFullSize,
            ...(googleFontsAssetProvider?.init
              ? [googleFontsAssetProvider.init({
                  apiKey: process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || "",
                })]
              : []),
            dataSourceHandlebars,
            ...(rteProseMirror?.init
              ? [rteProseMirror.init({
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  toolbar({ items, layouts, commands }: any) {
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
                })]
              : []),
            flexComponent,
            qrCodePlugin,
            ...(aiChat?.init
              ? [aiChat.init({ chatApi: "/api/ai-chat" })]
              : []),
          ],

          project: {
            type: "document" as const,
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
        onReady={(editor: any) => {
          editorRef.current = editor
          onEditorReady?.(editor)

          editor.on("component:selected", (component: any) => {
            setHasSelection(true)
            const findTarget = (retries = 15) => {
              const el = document.querySelector(".custom-properties-portal")
              if (el) {
                setPortalTarget(el as HTMLElement)
              } else if (retries > 0) {
                requestAnimationFrame(() => findTarget(retries - 1))
              }
            }
            requestAnimationFrame(() => findTarget())

            // Auto-activate RTE on text components for inline editing on single click
            if (component?.get?.("editable") || component?.get?.("type") === "text") {
              setTimeout(() => component.trigger("active"), 50)
            }
          })
          editor.on("component:deselected", () => {
            setHasSelection(false)
            setPortalTarget(null)
          })

          // ── Fix tooltips & popovers in the left panel ──────────────────
          // Inject a <style> AFTER the SDK's scoped CSS so !important wins.
          // CSS !important in a stylesheet overrides inline styles (Floating UI)
          // that don't use !important.
          const injectLeftPanelFixes = () => {
            const id = "gs-left-panel-fixes"
            if (document.getElementById(id)) return
            const style = document.createElement("style")
            style.id = id
            style.textContent = `
              /* Break overflow:hidden chain in the left panel */
              .blocks-panel-left,
              .blocks-panel-left [class*="gs-utl-overflow-hidden"],
              .blocks-panel-left [class*="gs-cmp-tabs__panels"] {
                overflow: visible !important;
              }

              /* Keep the style property list scrollable */
              .blocks-panel-left .gs-cmp-styles-provider {
                overflow-y: auto !important;
                overflow-x: hidden !important;
              }

              /* Tooltip content: position to the RIGHT of trigger */
              .blocks-panel-left .gs-cmp-tooltip-content {
                position: absolute !important;
                left: 100% !important;
                top: 50% !important;
                bottom: auto !important;
                right: auto !important;
                transform: translateY(-50%) !important;
                margin-left: 8px !important;
                z-index: 99999 !important;
              }

              /* Color picker & other popovers */
              .blocks-panel-left [id^="headlessui-popover-panel"] {
                z-index: 99999 !important;
              }
              .blocks-panel-left [id^="headlessui-listbox-options"],
              .blocks-panel-left [id^="headlessui-menu-items"],
              .blocks-panel-left [id^="headlessui-combobox-options"] {
                z-index: 99999 !important;
              }
            `
            document.head.appendChild(style)
          }

          injectLeftPanelFixes()

          // Remove unwanted blocks from Basic category (keep only Text, Image, Link)
          const keepBasic = ["text", "image", "link"]
          const toRemove: string[] = []
          editor.Blocks.getAll().forEach((block: any) => {
            if (!block) return
            const id = block.getId?.() || block.get?.("id") || ""
            const label = (block.getLabel?.() || block.get?.("label") || "").toLowerCase()
            const category = (typeof block.getCategoryLabel === "function"
              ? block.getCategoryLabel()
              : block.get?.("category") || "").toString().toLowerCase()
            if (category === "basic" && !keepBasic.some(k => label.includes(k) || id.includes(k))) {
              toRemove.push(id)
            }
            if (category === "data sources") {
              toRemove.push(id)
            }
          })
          toRemove.forEach(id => { try { editor.Blocks.remove(id) } catch { /* already removed */ } })

          // Limit style properties on data-variable inline tags
          try {
            const dvType = editor.Components.getType("data-variable")
            if (dvType) {
              editor.Components.addType("data-variable", {
                extend: "data-variable",
                model: {
                  defaults: {
                    ...dvType.model?.prototype?.defaults,
                    stylable: ["color", "font-size", "font-weight", "font-family"],
                  },
                },
              })
            }
          } catch {
            // data-variable type may not exist yet
          }

          // Register each variable as a draggable block.
          let skipNextModal = false
          const hasDataVariable = !!editor.Components.getType("data-variable")

          variables.forEach(variable => {
            const resolverPath = variable.path || variable.name

            if (hasDataVariable) {
              editor.Blocks.add(`variable-${variable.name}`, {
                label: variable.name,
                category: "Variables",
                select: true,
                content: {
                  type: "text",
                  tagName: "p",
                  editable: true,
                  style: { margin: "0", padding: "0" },
                  components: [
                    {
                      type: "data-variable",
                      dataResolver: {
                        path: resolverPath,
                        defaultValue: variable.name,
                      },
                    },
                  ],
                },
              })
            } else {
              editor.Blocks.add(`variable-${variable.name}`, {
                label: variable.name,
                category: "Variables",
                select: true,
                content: `<p><span style="display:inline-block;padding:2px 6px;background:#fef3c7;border-radius:4px;font-family:monospace;font-size:13px;color:#92400e">{{${variable.name}}}</span></p>`,
              })
            }
          })

          // Skip the data-variable config modal when dropping from the blocks panel
          editor.on("block:drag:start", (block: any) => {
            const blockId = block?.getId?.() || block?.get?.("id") || ""
            if (blockId.startsWith("variable-")) {
              skipNextModal = true
            }
          })

          // Auto-close the "Edit variable" modal since path is already set
          editor.on("modal:open", () => {
            if (skipNextModal) {
              skipNextModal = false
              setTimeout(() => editor.Modal.close(), 50)
            }
          })

          // MutationObserver: hide "Variables" category from the left panel
          const setupLeftPanelFilter = () => {
            const container = document.querySelector(".blocks-panel-left")
            if (!container) return

            const filterLeftCategories = () => {
              container.querySelectorAll("[data-state], [class*='accordion'], [class*='Accordion'], [class*='category'], [class*='Category']").forEach(el => {
                const htmlEl = el as HTMLElement
                if (htmlEl.parentElement?.closest("[data-state], [class*='accordion'], [class*='Accordion']")) return

                const text = htmlEl.textContent?.trim() || ""
                if (text.includes("Variables")) {
                  htmlEl.style.display = "none"
                }
              })
            }

            filterLeftCategories()
            const observer = new MutationObserver(filterLeftCategories)
            observer.observe(container, { childList: true, subtree: true })
          }
          setTimeout(setupLeftPanelFilter, 500)
          editor.on("block:add", () => setTimeout(setupLeftPanelFilter, 100))

          editor.on("component:drag:end", () => {
            setTimeout(() => {
              const selected = editor.getSelected()
              if (selected) editor.select(selected)
            }, 50)
          })

          editor.on("block:drag:stop", () => {
            setTimeout(() => editor.refresh(), 50)
            setTimeout(() => { skipNextModal = false }, 500)
          })

          // Double-click on empty canvas space creates a new text paragraph and activates RTE
          editor.on("canvas:dblclick", (event: any) => {
            const target = event.target
            const canvasDoc = editor.Canvas.getDocument()
            const wrapperEl = editor.DomComponents.getWrapper()?.getEl()

            if (target === wrapperEl || target === canvasDoc?.body) {
              const wrapper = editor.DomComponents.getWrapper()
              const newText = wrapper.append({ type: "text", tagName: "p", editable: true, style: { margin: "0", padding: "0" }, content: "<br>" })[0]
              if (newText) {
                editor.select(newText)
                setTimeout(() => newText.trigger("active"), 50)
              }
            }
          })

          const injectVariableStyles = () => {
            try {
              const canvasDoc = editor.Canvas.getDocument()
              if (!canvasDoc) return

              const existingStyle = canvasDoc.getElementById("variable-tag-styles")
              if (existingStyle) existingStyle.remove()

              const variableMap = new Map<string, VariableType>()
              variables.forEach(v => variableMap.set(v.name, v.type))

              let css = `
                [data-variable], [data-gjs-type="data-variable"] {
                  display: inline-flex !important;
                  align-items: center !important;
                  padding: 1px 8px !important;
                  border-radius: 4px !important;
                  font-size: 0.75rem !important;
                  font-weight: 500 !important;
                  line-height: 1.5 !important;
                  white-space: nowrap !important;
                  vertical-align: baseline !important;
                  background-color: ${typeColorConfig["String"].bgHex} !important;
                  color: ${typeColorConfig["String"].textHex} !important;
                  border: 1px solid ${typeColorConfig["String"].borderHex} !important;
                }
              `

              variables.forEach(variable => {
                const colors = typeColorConfig[variable.type] || typeColorConfig["String"]
                css += `
                  [data-variable*="${variable.name}"],
                  [data-gjs-type="data-variable"][title*="${variable.name}"] {
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

          setTimeout(injectVariableStyles, 500)
          editor.on("canvas:frame:load", () => setTimeout(injectVariableStyles, 300))

        }}
      />
      {hasSelection && portalTarget && editorRef.current &&
        createPortal(
          <PropertiesPanel editor={editorRef.current} variables={variables} />,
          portalTarget
        )
      }
    </div>
  )
}

/**
 * Scopes all CSS selectors to a root element.
 * Handles @media, @keyframes, @supports, etc.
 */
function scopeCSSToRoot(css: string, rootSelector: string): string {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "")

  const result: string[] = []
  let i = 0

  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i++
    if (i >= css.length) break

    if (css[i] === "@") {
      const atRuleMatch = css.slice(i).match(/^@([a-z-]+)\s*/i)
      if (atRuleMatch) {
        const atRuleName = atRuleMatch[1].toLowerCase()

        if (atRuleName === "keyframes" || atRuleName === "font-face") {
          const start = i
          i += atRuleMatch[0].length
          if (atRuleName === "keyframes") {
            const nameMatch = css.slice(i).match(/^[\w-]+\s*/)
            if (nameMatch) i += nameMatch[0].length
          }
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

        if (atRuleName === "media" || atRuleName === "supports" || atRuleName === "layer") {
          i += atRuleMatch[0].length
          let condition = ""
          while (i < css.length && css[i] !== "{") {
            condition += css[i]
            i++
          }
          if (css[i] === "{") {
            i++
            let innerCSS = ""
            let depth = 1
            while (i < css.length && depth > 0) {
              if (css[i] === "{") depth++
              else if (css[i] === "}") depth--
              if (depth > 0) innerCSS += css[i]
              i++
            }
            const scopedInner = scopeCSSToRoot(innerCSS, rootSelector)
            result.push(`@${atRuleName} ${condition.trim()} {\n${scopedInner}\n}`)
          }
          continue
        }

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

    let selector = ""
    while (i < css.length && css[i] !== "{") {
      selector += css[i]
      i++
    }

    if (css[i] === "{") {
      i++
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
        const scopedSelectors = selector
          .split(",")
          .map(s => {
            s = s.trim()
            if (!s) return s

            if (
              s === ":root" ||
              s === "html" ||
              s === "body" ||
              s.startsWith(rootSelector) ||
              /^\d+%$/.test(s) ||
              s === "from" ||
              s === "to"
            ) {
              if (s === ":root" || s === "html" || s === "body") {
                return rootSelector
              }
              return s
            }

            if (s.startsWith(":root")) {
              return rootSelector + s.slice(5)
            }

            return `${rootSelector} ${s}`
          })
          .join(", ")

        result.push(`${scopedSelectors} {\n${body}\n}`)
      }
    }
  }

  return result.join("\n\n")
}
