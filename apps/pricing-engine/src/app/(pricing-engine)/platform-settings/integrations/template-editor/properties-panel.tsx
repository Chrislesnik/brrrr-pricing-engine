"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link,
  Strikethrough,
  Underline,
  Unlink,
  X,
} from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ColorInput } from "@/components/color-input"
import type { Variable } from "./variable-types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseStyleValue(val: string | undefined): { num: string; unit: string } {
  if (!val || val === "auto") return { num: "", unit: "auto" }
  const match = val.match(/^(-?[\d.]+)\s*(px|%|em|rem|vw|vh)?$/)
  if (match) return { num: match[1], unit: match[2] || "px" }
  return { num: val, unit: "" }
}

function buildStyleValue(num: string, unit: string): string {
  if (unit === "auto" || num === "") return "auto"
  return `${num}${unit}`
}

function parseShorthand(val: string | undefined): [string, string, string, string] {
  if (!val) return ["", "", "", ""]
  const parts = val.trim().split(/\s+/)
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  return [parts[0], parts[1], parts[2], parts[3]]
}

function buildShorthand(top: string, right: string, bottom: string, left: string): string {
  const t = top || "0", r = right || "0", b = bottom || "0", l = left || "0"
  if (t === r && r === b && b === l) return t
  if (t === b && r === l) return `${t} ${r}`
  if (r === l) return `${t} ${r} ${b}`
  return `${t} ${r} ${b} ${l}`
}

const TEXT_COMPONENT_TYPES = new Set([
  "text", "textnode", "heading", "paragraph", "link", "label", "span",
])

function isTextComponent(component: any): boolean {
  const type = (component?.get?.("type") || "").toLowerCase()
  if (TEXT_COMPONENT_TYPES.has(type)) return true
  const tagName = (component?.get?.("tagName") || "").toLowerCase()
  return ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "label", "li", "td", "th", "blockquote"].includes(tagName)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SizeInput({
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  label: string
  value: string
  unit: string
  onValueChange: (v: string) => void
  onUnitChange: (u: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1">
        <Input
          type={unit === "auto" ? "text" : "number"}
          value={unit === "auto" ? "auto" : value}
          disabled={unit === "auto"}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-8 text-xs flex-1 min-w-0"
          placeholder="auto"
        />
        <Select value={unit || "px"} onValueChange={onUnitChange}>
          <SelectTrigger className="h-8 w-16 text-xs px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="px">px</SelectItem>
            <SelectItem value="%">%</SelectItem>
            <SelectItem value="auto">auto</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function SpacingInputs({
  label,
  values,
  linked,
  onToggleLink,
  onChange,
}: {
  label: string
  values: [string, string, string, string]
  linked: boolean
  onToggleLink: () => void
  onChange: (idx: number, val: string) => void
}) {
  const sides = ["Top", "Right", "Bottom", "Left"] as const

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <button
          type="button"
          onClick={onToggleLink}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title={linked ? "Unlink sides" : "Link all sides"}
        >
          {linked ? <Link className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
        </button>
      </div>
      {linked ? (
        <Input
          type="number"
          value={parseStyleValue(values[0]).num}
          onChange={(e) => {
            const v = e.target.value ? `${e.target.value}px` : "0"
            for (let i = 0; i < 4; i++) onChange(i, v)
          }}
          className="h-8 text-xs"
          placeholder="0"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {sides.map((side, i) => (
            <div key={side} className="space-y-1">
              <span className="text-[10px] text-muted-foreground">{side}</span>
              <Input
                type="number"
                value={parseStyleValue(values[i]).num}
                onChange={(e) => {
                  const v = e.target.value ? `${e.target.value}px` : "0"
                  onChange(i, v)
                }}
                className="h-8 text-xs"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PropertiesPanelProps {
  editor: any
  variables?: Variable[]
  orgLogos?: { light: string | null; dark: string | null }
}

export function PropertiesPanel({ editor, variables = [], orgLogos }: PropertiesPanelProps) {
  const [styles, setStyles] = useState<Record<string, string>>({})
  const [componentType, setComponentType] = useState("")
  const [componentName, setComponentName] = useState("")
  const [paddingLinked, setPaddingLinked] = useState(true)
  const [marginLinked, setMarginLinked] = useState(true)
  const [borderLinked, setBorderLinked] = useState(true)
  const [qrAttrs, setQrAttrs] = useState<Record<string, string>>({})
  const [brandLogoMode, setBrandLogoMode] = useState<string | null>(null)
  const suppressSync = useRef(false)

  const readStyles = useCallback(() => {
    if (!editor || suppressSync.current) return
    let selected: ReturnType<typeof editor.getSelected> | undefined
    try { selected = editor.getSelected?.() } catch { /* editor not ready */ }
    if (!selected) {
      setStyles({})
      setComponentType("")
      setComponentName("")
      setQrAttrs({})
      return
    }
    const raw = selected.getStyle() || {}
    const flat: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") flat[k] = v
    }

    // Merge computed styles from the canvas DOM element for box-model
    // properties that may come from plugin defaults or CSS classes
    const el = selected.getEl?.()
    if (el) {
      try {
        const canvasWin = el.ownerDocument?.defaultView
        if (canvasWin) {
          const computed = canvasWin.getComputedStyle(el)
          const boxProps = [
            "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
            "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
            "width", "height", "display",
            "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
            "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
            "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
          ]
          for (const prop of boxProps) {
            if (!flat[prop]) {
              const val = computed.getPropertyValue(prop)
              if (val) flat[prop] = val
            }
          }
        }
      } catch {
        // Canvas element may not be accessible yet
      }
    }

    setStyles(flat)
    const type = selected.get?.("type") || ""
    setComponentType(type)
    setComponentName(
      selected.getName?.() ||
      selected.get?.("tagName") ||
      selected.get?.("type") ||
      "Element"
    )
    if (type === "qr-code") {
      const attrs = selected.getAttributes?.() || {}
      setQrAttrs({
        "data-qr-data": attrs["data-qr-data"] || "",
        "data-qr-size": attrs["data-qr-size"] || "150",
        "data-qr-mode": attrs["data-qr-mode"] || "static",
        "data-qr-variable": attrs["data-qr-variable"] || "",
      })
    } else {
      setQrAttrs({})
    }
    if (type === "brand-logo") {
      const attrs = selected.getAttributes?.() || {}
      setBrandLogoMode(attrs["data-brand-logo"] || "light")
    } else if (type === "image") {
      const attrs = selected.getAttributes?.() || {}
      setBrandLogoMode(attrs["data-brand-logo"] || null)
    } else {
      setBrandLogoMode(null)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    readStyles()

    const onSelect = () => readStyles()
    const onDeselect = () => {
      setStyles({})
      setComponentType("")
      setComponentName("")
    }
    const onStyleUpdate = () => readStyles()

    editor.on("component:selected", onSelect)
    editor.on("component:deselected", onDeselect)
    editor.on("component:styleUpdate", onStyleUpdate)
    editor.on("style:custom", onStyleUpdate)

    return () => {
      editor.off("component:selected", onSelect)
      editor.off("component:deselected", onDeselect)
      editor.off("component:styleUpdate", onStyleUpdate)
      editor.off("style:custom", onStyleUpdate)
    }
  }, [editor, readStyles])

  const setStyle = useCallback(
    (prop: string, value: string) => {
      if (!editor) return
      const selected = editor.getSelected?.()
      if (!selected) return

      suppressSync.current = true
      selected.addStyle({ [prop]: value })
      setStyles((prev) => ({ ...prev, [prop]: value }))
      setTimeout(() => {
        suppressSync.current = false
      }, 50)
    },
    [editor]
  )

  const removeStyle = useCallback(
    (prop: string) => {
      if (!editor) return
      const selected = editor.getSelected?.()
      if (!selected) return
      selected.removeStyle(prop)
      setStyles((prev) => {
        const next = { ...prev }
        delete next[prop]
        return next
      })
    },
    [editor]
  )

  const setQrAttr = useCallback(
    (attr: string, value: string) => {
      if (!editor) return
      const selected = editor.getSelected?.()
      if (!selected) return
      selected.addAttributes({ [attr]: value })
      setQrAttrs((prev) => ({ ...prev, [attr]: value }))
    },
    [editor]
  )

  const toggleBrandLogo = useCallback(
    (enabled: boolean, mode: string = "light") => {
      if (!editor) return
      const selected = editor.getSelected?.()
      if (!selected) return
      if (enabled) {
        const originalSrc = selected.getAttributes?.()?.src || ""
        if (!selected.getAttributes?.()?.["data-original-src"]) {
          selected.addAttributes({ "data-original-src": originalSrc })
        }
        selected.addAttributes({ "data-brand-logo": mode })
        const logoUrl = mode === "dark" ? orgLogos?.dark : orgLogos?.light
        if (logoUrl) {
          selected.set("src", logoUrl)
          selected.addAttributes({ src: logoUrl })
        }
        setBrandLogoMode(mode)
      } else {
        const originalSrc = selected.getAttributes?.()?.["data-original-src"] || ""
        selected.addAttributes({ "data-brand-logo": "" })
        selected.addAttributes({ "data-original-src": "" })
        if (originalSrc) {
          selected.set("src", originalSrc)
          selected.addAttributes({ src: originalSrc })
        }
        setBrandLogoMode(null)
      }
    },
    [editor, orgLogos]
  )

  const setBrandLogoVariant = useCallback(
    (mode: string) => {
      if (!editor) return
      const selected = editor.getSelected?.()
      if (!selected) return
      selected.addAttributes({ "data-brand-logo": mode })
      const logoUrl = mode === "dark" ? orgLogos?.dark : orgLogos?.light
      if (logoUrl) {
        selected.set("src", logoUrl)
        selected.addAttributes({ src: logoUrl })
      }
      setBrandLogoMode(mode)
    },
    [editor, orgLogos]
  )

  const handleClose = useCallback(() => {
    if (!editor) return
    editor.select(null)
  }, [editor])

  let selected: ReturnType<NonNullable<typeof editor>["getSelected"]> | undefined
  try {
    selected = editor?.getSelected?.()
  } catch {
    // editor internal state may be inconsistent during initialization
  }
  if (!selected) return null

  const showTypography = isTextComponent(selected)
  const isQrCode = componentType === "qr-code"
  const isBrandLogo = componentType === "brand-logo"
  const isImage = componentType === "image"
  const showBrandLogoSection = isBrandLogo || isImage
  const isDataVariable = componentType === "data-variable"
  const isInlineOnly = isDataVariable
  const stringVariables = variables.filter(v => v.type === "String")

  // Parse current values
  const width = parseStyleValue(styles["width"])
  const height = parseStyleValue(styles["height"])

  const padding = parseShorthand(styles["padding"])
  const paddingTop = styles["padding-top"] || padding[0]
  const paddingRight = styles["padding-right"] || padding[1]
  const paddingBottom = styles["padding-bottom"] || padding[2]
  const paddingLeft = styles["padding-left"] || padding[3]
  const paddingValues: [string, string, string, string] = [paddingTop, paddingRight, paddingBottom, paddingLeft]

  const margin = parseShorthand(styles["margin"])
  const marginTop = styles["margin-top"] || margin[0]
  const marginRight = styles["margin-right"] || margin[1]
  const marginBottom = styles["margin-bottom"] || margin[2]
  const marginLeft = styles["margin-left"] || margin[3]
  const marginValues: [string, string, string, string] = [marginTop, marginRight, marginBottom, marginLeft]

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium truncate">{componentName}</span>
          {componentType && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {componentType}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 py-2">
          <Accordion
            type="multiple"
            defaultValue={["qrcode", "brandlogo", "layout", "size", "space", "typography", "background", "border"]}
            className="w-full"
          >
            {/* QR Code settings */}
            {isQrCode && (
              <AccordionItem value="qrcode">
                <AccordionTrigger className="py-2 text-xs font-medium">
                  QR Code
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Source</Label>
                    <ToggleGroup
                      type="single"
                      value={qrAttrs["data-qr-mode"] || "static"}
                      onValueChange={(v) => {
                        if (v) setQrAttr("data-qr-mode", v)
                      }}
                      className="justify-start w-full"
                      size="sm"
                    >
                      <ToggleGroupItem value="static" className="flex-1 h-8 text-xs">
                        Static URL
                      </ToggleGroupItem>
                      <ToggleGroupItem value="variable" className="flex-1 h-8 text-xs">
                        Variable
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {(qrAttrs["data-qr-mode"] || "static") === "static" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <Input
                        type="text"
                        value={qrAttrs["data-qr-data"] || ""}
                        onChange={(e) => setQrAttr("data-qr-data", e.target.value)}
                        className="h-8 text-xs font-mono"
                        placeholder="https://example.com"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Variable</Label>
                      {stringVariables.length > 0 ? (
                        <Select
                          value={qrAttrs["data-qr-variable"] || ""}
                          onValueChange={(v) => setQrAttr("data-qr-variable", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select a variable" />
                          </SelectTrigger>
                          <SelectContent>
                            {stringVariables.map((v) => (
                              <SelectItem key={v.id} value={v.name}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No String variables defined. Add one via Edit Variables.
                        </p>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Size (px)</Label>
                    <Input
                      type="number"
                      value={qrAttrs["data-qr-size"] || "150"}
                      onChange={(e) => setQrAttr("data-qr-size", e.target.value || "150")}
                      className="h-8 text-xs"
                      placeholder="150"
                      min={50}
                      max={500}
                      step={10}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Brand Logo settings */}
            {showBrandLogoSection && (
              <AccordionItem value="brandlogo">
                <AccordionTrigger className="py-2 text-xs font-medium">
                  Brand Logo
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Use org branding</Label>
                    <Switch
                      checked={!!brandLogoMode}
                      onCheckedChange={(checked) => toggleBrandLogo(checked, brandLogoMode || "light")}
                    />
                  </div>
                  {brandLogoMode && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Variant</Label>
                        <ToggleGroup
                          type="single"
                          value={brandLogoMode}
                          onValueChange={(v) => { if (v) setBrandLogoVariant(v) }}
                          className="justify-start w-full"
                          size="sm"
                        >
                          <ToggleGroupItem value="light" className="flex-1 h-8 text-xs">
                            Light
                          </ToggleGroupItem>
                          <ToggleGroupItem value="dark" className="flex-1 h-8 text-xs">
                            Dark
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                      {!orgLogos?.light && !orgLogos?.dark && (
                        <p className="text-xs text-amber-600">
                          No branding logos uploaded. Go to Settings &gt; General &gt; Document Branding to add them.
                        </p>
                      )}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Layout */}
            {!isInlineOnly && <AccordionItem value="layout">
              <AccordionTrigger className="py-2 text-xs font-medium">
                Layout
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Display</Label>
                  <Select
                    value={styles["display"] || "block"}
                    onValueChange={(v) => setStyle("display", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="flex">Flex</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                      <SelectItem value="inline-block">Inline Block</SelectItem>
                      <SelectItem value="inline-flex">Inline Flex</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(styles["display"] === "flex" || styles["display"] === "inline-flex") && (
                  <>
                    <div className="space-y-1.5 mt-3">
                      <Label className="text-xs text-muted-foreground">Direction</Label>
                      <Select
                        value={styles["flex-direction"] || "row"}
                        onValueChange={(v) => setStyle("flex-direction", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="row">Row</SelectItem>
                          <SelectItem value="column">Column</SelectItem>
                          <SelectItem value="row-reverse">Row Reverse</SelectItem>
                          <SelectItem value="column-reverse">Column Reverse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      <Label className="text-xs text-muted-foreground">Justify</Label>
                      <Select
                        value={styles["justify-content"] || "flex-start"}
                        onValueChange={(v) => setStyle("justify-content", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flex-start">Start</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="flex-end">End</SelectItem>
                          <SelectItem value="space-between">Space Between</SelectItem>
                          <SelectItem value="space-around">Space Around</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      <Label className="text-xs text-muted-foreground">Align Items</Label>
                      <Select
                        value={styles["align-items"] || "stretch"}
                        onValueChange={(v) => setStyle("align-items", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stretch">Stretch</SelectItem>
                          <SelectItem value="flex-start">Start</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="flex-end">End</SelectItem>
                          <SelectItem value="baseline">Baseline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      <Label className="text-xs text-muted-foreground">Gap</Label>
                      <Input
                        type="number"
                        value={parseStyleValue(styles["gap"]).num}
                        onChange={(e) =>
                          setStyle("gap", e.target.value ? `${e.target.value}px` : "0")
                        }
                        className="h-8 text-xs"
                        placeholder="0"
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>}

            {/* Size */}
            {!isInlineOnly && <AccordionItem value="size">
              <AccordionTrigger className="py-2 text-xs font-medium">
                Size
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <SizeInput
                    label="Width"
                    value={width.num}
                    unit={width.unit}
                    onValueChange={(v) =>
                      setStyle("width", buildStyleValue(v, width.unit))
                    }
                    onUnitChange={(u) =>
                      setStyle("width", buildStyleValue(width.num, u))
                    }
                  />
                  <SizeInput
                    label="Height"
                    value={height.num}
                    unit={height.unit}
                    onValueChange={(v) =>
                      setStyle("height", buildStyleValue(v, height.unit))
                    }
                    onUnitChange={(u) =>
                      setStyle("height", buildStyleValue(height.num, u))
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>}

            {/* Space */}
            {!isInlineOnly && <AccordionItem value="space">
              <AccordionTrigger className="py-2 text-xs font-medium">
                Space
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-4">
                <SpacingInputs
                  label="Padding"
                  values={paddingValues}
                  linked={paddingLinked}
                  onToggleLink={() => setPaddingLinked((p) => !p)}
                  onChange={(idx, val) => {
                    const props = ["padding-top", "padding-right", "padding-bottom", "padding-left"]
                    if (paddingLinked) {
                      removeStyle("padding")
                      props.forEach((p) => setStyle(p, val))
                    } else {
                      removeStyle("padding")
                      setStyle(props[idx], val)
                    }
                  }}
                />
                <Separator />
                <SpacingInputs
                  label="Margin"
                  values={marginValues}
                  linked={marginLinked}
                  onToggleLink={() => setMarginLinked((m) => !m)}
                  onChange={(idx, val) => {
                    const props = ["margin-top", "margin-right", "margin-bottom", "margin-left"]
                    if (marginLinked) {
                      removeStyle("margin")
                      props.forEach((p) => setStyle(p, val))
                    } else {
                      removeStyle("margin")
                      setStyle(props[idx], val)
                    }
                  }}
                />
              </AccordionContent>
            </AccordionItem>}

            {/* Typography (for text components and inline data-variables) */}
            {(showTypography || isDataVariable) && (
              <AccordionItem value="typography">
                <AccordionTrigger className="py-2 text-xs font-medium">
                  Typography
                </AccordionTrigger>
                <AccordionContent className="pb-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Font Family</Label>
                    <Select
                      value={styles["font-family"] || ""}
                      onValueChange={(v) => setStyle("font-family", v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Default" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                        <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                        <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                        <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                        <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                        <SelectItem value="Nunito, sans-serif">Nunito</SelectItem>
                        <SelectItem value="Raleway, sans-serif">Raleway</SelectItem>
                        <SelectItem value="'Source Sans 3', sans-serif">Source Sans 3</SelectItem>
                        <SelectItem value="'Work Sans', sans-serif">Work Sans</SelectItem>
                        <SelectItem value="'DM Sans', sans-serif">DM Sans</SelectItem>
                        <SelectItem value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</SelectItem>
                        <SelectItem value="Outfit, sans-serif">Outfit</SelectItem>
                        <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                        <Separator className="my-1" />
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                        <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                        <SelectItem value="Merriweather, serif">Merriweather</SelectItem>
                        <SelectItem value="Lora, serif">Lora</SelectItem>
                        <SelectItem value="'PT Serif', serif">PT Serif</SelectItem>
                        <SelectItem value="'Libre Baskerville', serif">Libre Baskerville</SelectItem>
                        <SelectItem value="'EB Garamond', serif">EB Garamond</SelectItem>
                        <Separator className="my-1" />
                        <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                        <SelectItem value="'Fira Code', monospace">Fira Code</SelectItem>
                        <SelectItem value="'JetBrains Mono', monospace">JetBrains Mono</SelectItem>
                        <SelectItem value="'Source Code Pro', monospace">Source Code Pro</SelectItem>
                        <SelectItem value="'IBM Plex Mono', monospace">IBM Plex Mono</SelectItem>
                        <SelectItem value="'Roboto Mono', monospace">Roboto Mono</SelectItem>
                        <Separator className="my-1" />
                        <SelectItem value="Oswald, sans-serif">Oswald</SelectItem>
                        <SelectItem value="'Bebas Neue', sans-serif">Bebas Neue</SelectItem>
                        <SelectItem value="Anton, sans-serif">Anton</SelectItem>
                        <Separator className="my-1" />
                        <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <Input
                        type="number"
                        value={parseStyleValue(styles["font-size"]).num}
                        onChange={(e) =>
                          setStyle(
                            "font-size",
                            e.target.value ? `${e.target.value}px` : ""
                          )
                        }
                        className="h-8 text-xs"
                        placeholder="16"
                        min={1}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Weight</Label>
                      <Select
                        value={styles["font-weight"] || ""}
                        onValueChange={(v) => setStyle("font-weight", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">Thin</SelectItem>
                          <SelectItem value="300">Light</SelectItem>
                          <SelectItem value="400">Normal</SelectItem>
                          <SelectItem value="500">Medium</SelectItem>
                          <SelectItem value="600">Semi Bold</SelectItem>
                          <SelectItem value="700">Bold</SelectItem>
                          <SelectItem value="900">Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Style</Label>
                    <ToggleGroup
                      type="multiple"
                      value={[
                        ...(styles["font-weight"] === "700" || styles["font-weight"] === "bold" ? ["bold"] : []),
                        ...(styles["font-style"] === "italic" ? ["italic"] : []),
                        ...(styles["text-decoration"]?.includes("underline") ? ["underline"] : []),
                        ...(styles["text-decoration"]?.includes("line-through") ? ["strikethrough"] : []),
                      ]}
                      onValueChange={(vals) => {
                        setStyle("font-weight", vals.includes("bold") ? "700" : "400")
                        setStyle("font-style", vals.includes("italic") ? "italic" : "normal")
                        const decorations = [
                          ...(vals.includes("underline") ? ["underline"] : []),
                          ...(vals.includes("strikethrough") ? ["line-through"] : []),
                        ]
                        setStyle("text-decoration", decorations.length > 0 ? decorations.join(" ") : "none")
                      }}
                      className="justify-start"
                      size="sm"
                    >
                      <ToggleGroupItem value="bold" className="h-8 w-8 p-0">
                        <Bold className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="italic" className="h-8 w-8 p-0">
                        <Italic className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="underline" className="h-8 w-8 p-0">
                        <Underline className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="strikethrough" className="h-8 w-8 p-0">
                        <Strikethrough className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Line Height</Label>
                    <Input
                      type="number"
                      value={parseStyleValue(styles["line-height"]).num}
                      onChange={(e) =>
                        setStyle(
                          "line-height",
                          e.target.value ? `${e.target.value}px` : ""
                        )
                      }
                      className="h-8 text-xs"
                      placeholder="auto"
                      min={0}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Text Align</Label>
                    <ToggleGroup
                      type="single"
                      value={styles["text-align"] || ""}
                      onValueChange={(v) => {
                        if (v) setStyle("text-align", v)
                      }}
                      className="justify-start"
                      size="sm"
                    >
                      <ToggleGroupItem value="left" className="h-8 w-8 p-0">
                        <AlignLeft className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" className="h-8 w-8 p-0">
                        <AlignCenter className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" className="h-8 w-8 p-0">
                        <AlignRight className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="justify" className="h-8 w-8 p-0">
                        <AlignJustify className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-1.5">
                    <ColorInput
                      label="Text Color"
                      value={styles["color"] || "#000000"}
                      onChange={(v) => setStyle("color", v)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Background */}
            {!isInlineOnly && <AccordionItem value="background">
              <AccordionTrigger className="py-2 text-xs font-medium">
                Background
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ColorInput
                  label="Background Color"
                  value={styles["background-color"] || "#ffffff"}
                  onChange={(v) => setStyle("background-color", v)}
                />
              </AccordionContent>
            </AccordionItem>}

            {/* Border */}
            {!isInlineOnly && <AccordionItem value="border">
              <AccordionTrigger className="py-2 text-xs font-medium">
                Border
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Sides</Label>
                  <button
                    type="button"
                    onClick={() => setBorderLinked((b) => !b)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={borderLinked ? "Configure each side" : "Link all sides"}
                  >
                    {borderLinked ? <Link className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {borderLinked ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Width</Label>
                        <Input
                          type="number"
                          value={parseStyleValue(styles["border-width"]).num}
                          onChange={(e) =>
                            setStyle("border-width", e.target.value ? `${e.target.value}px` : "0")
                          }
                          className="h-8 text-xs"
                          placeholder="0"
                          min={0}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Style</Label>
                        <Select
                          value={styles["border-style"] || "none"}
                          onValueChange={(v) => setStyle("border-style", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <ColorInput
                      label="Color"
                      value={styles["border-color"] || "#000000"}
                      onChange={(v) => setStyle("border-color", v)}
                    />
                  </>
                ) : (
                  <div className="space-y-3">
                    {(["top", "right", "bottom", "left"] as const).map((side) => (
                      <div key={side} className="space-y-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground capitalize">{side}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={parseStyleValue(styles[`border-${side}-width`]).num}
                            onChange={(e) =>
                              setStyle(`border-${side}-width`, e.target.value ? `${e.target.value}px` : "0")
                            }
                            className="h-8 text-xs"
                            placeholder="0"
                            min={0}
                          />
                          <Select
                            value={styles[`border-${side}-style`] || "none"}
                            onValueChange={(v) => setStyle(`border-${side}-style`, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <ColorInput
                          label=""
                          value={styles[`border-${side}-color`] || "#000000"}
                          onChange={(v) => setStyle(`border-${side}-color`, v)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Radius</Label>
                  <Input
                    type="number"
                    value={parseStyleValue(styles["border-radius"]).num}
                    onChange={(e) =>
                      setStyle(
                        "border-radius",
                        e.target.value ? `${e.target.value}px` : "0"
                      )
                    }
                    className="h-8 text-xs"
                    placeholder="0"
                    min={0}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  )
}
