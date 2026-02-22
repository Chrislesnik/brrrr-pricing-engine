"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Link,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ColorInput } from "@/components/color-input"

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
        <div className="grid grid-cols-2 gap-1.5">
          {sides.map((side, i) => (
            <div key={side} className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">{side}</span>
              <Input
                type="number"
                value={parseStyleValue(values[i]).num}
                onChange={(e) => {
                  const v = e.target.value ? `${e.target.value}px` : "0"
                  onChange(i, v)
                }}
                className="h-7 text-xs"
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
}

export function PropertiesPanel({ editor }: PropertiesPanelProps) {
  const [styles, setStyles] = useState<Record<string, string>>({})
  const [componentType, setComponentType] = useState("")
  const [componentName, setComponentName] = useState("")
  const [paddingLinked, setPaddingLinked] = useState(true)
  const [marginLinked, setMarginLinked] = useState(true)
  const suppressSync = useRef(false)

  const readStyles = useCallback(() => {
    if (!editor || suppressSync.current) return
    const selected = editor.getSelected?.()
    if (!selected) {
      setStyles({})
      setComponentType("")
      setComponentName("")
      return
    }
    const raw = selected.getStyle() || {}
    const flat: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") flat[k] = v
    }
    setStyles(flat)
    setComponentType(selected.get?.("type") || "")
    setComponentName(
      selected.getName?.() ||
      selected.get?.("tagName") ||
      selected.get?.("type") ||
      "Element"
    )
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
            defaultValue={["layout", "size", "space", "typography", "background", "border"]}
            className="w-full"
          >
            {/* Layout */}
            <AccordionItem value="layout">
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
            </AccordionItem>

            {/* Size */}
            <AccordionItem value="size">
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
            </AccordionItem>

            {/* Space */}
            <AccordionItem value="space">
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
            </AccordionItem>

            {/* Typography (only for text components) */}
            {showTypography && (
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
                      <SelectContent>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                        <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                        <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
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
            <AccordionItem value="background">
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
            </AccordionItem>

            {/* Border */}
            <AccordionItem value="border">
              <AccordionTrigger className="py-2 text-xs font-medium">
                Border
              </AccordionTrigger>
              <AccordionContent className="pb-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <Input
                      type="number"
                      value={parseStyleValue(styles["border-width"]).num}
                      onChange={(e) =>
                        setStyle(
                          "border-width",
                          e.target.value ? `${e.target.value}px` : "0"
                        )
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

                <ColorInput
                  label="Border Color"
                  value={styles["border-color"] || "#000000"}
                  onChange={(v) => setStyle("border-color", v)}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  )
}
