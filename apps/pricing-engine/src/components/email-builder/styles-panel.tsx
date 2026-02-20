"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Plus, Minus, Type, Palette, Underline, Weight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/shadcn/popover"
import { cn } from "@repo/lib/cn"
import type { EmailTemplateStyles } from "./types"

// ─── NumberInput ────────────────────────────────────────────────────────────

function NumberInput({
  value,
  onChange,
  suffix = "px",
  min = 0,
  max = 9999,
}: {
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  max?: number
}) {
  return (
    <div className="flex h-6 items-center overflow-hidden rounded border border-border bg-muted/40">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-10 bg-transparent px-1.5 text-right text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="px-0.5 text-[10px] text-muted-foreground">{suffix}</span>
      <div className="ml-auto flex flex-col border-l border-border">
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-3 w-5 items-center justify-center text-muted-foreground hover:bg-accent"
          aria-label="Increment"
        >
          <ChevronUp className="size-2.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-3 w-5 items-center justify-center border-t border-border text-muted-foreground hover:bg-accent"
          aria-label="Decrement"
        >
          <ChevronDown className="size-2.5" />
        </button>
      </div>
    </div>
  )
}

// ─── ColorInput ─────────────────────────────────────────────────────────────

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-6 items-center gap-1.5 overflow-hidden rounded border border-border bg-muted/40 px-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-3.5 cursor-pointer rounded-sm border-0 bg-transparent p-0"
      />
      <input
        type="text"
        value={value.toUpperCase()}
        onChange={(e) => onChange(e.target.value)}
        className="w-14 bg-transparent font-mono text-[11px] text-foreground outline-none"
        maxLength={7}
      />
    </div>
  )
}

// ─── SelectInput ────────────────────────────────────────────────────────────

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex h-6 items-center overflow-hidden rounded border border-border bg-muted/40 px-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[11px] text-foreground outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── StyleRow ───────────────────────────────────────────────────────────────

function StyleRow({
  label,
  children,
  onRemove,
}: {
  label: string
  children: React.ReactNode
  onRemove?: () => void
}) {
  return (
    <div className="group flex items-center justify-between gap-2 py-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <div className="w-[90px]">{children}</div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove property"
            className="flex size-4 items-center justify-center rounded text-muted-foreground/30 opacity-0 transition-opacity hover:text-muted-foreground group-hover:opacity-100"
          >
            <Minus className="size-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Optional field definitions ─────────────────────────────────────────────

type OptionalField = {
  key: string
  label: string
  icon: React.ReactNode
}

const SECTION_OPTIONAL_FIELDS: Record<string, OptionalField[]> = {
  typography: [
    { key: "fontWeight", label: "Font weight", icon: <Weight className="size-3.5 text-[#888]" /> },
    { key: "textColor", label: "Text color", icon: <Palette className="size-3.5 text-[#888]" /> },
    { key: "textDecoration", label: "Text decoration", icon: <Underline className="size-3.5 text-[#888]" /> },
  ],
  container: [
    { key: "background", label: "Background", icon: <Palette className="size-3.5 text-[#888]" /> },
  ],
  body: [
    { key: "fontFamily", label: "Font family", icon: <Type className="size-3.5 text-[#888]" /> },
  ],
}

// ─── Section ────────────────────────────────────────────────────────────────

function Section({
  title,
  sectionId,
  activeExtras,
  onAddExtra,
  children,
}: {
  title: string
  sectionId: string
  activeExtras: string[]
  onAddExtra: (field: string) => void
  children: React.ReactNode
}) {
  const available = (SECTION_OPTIONAL_FIELDS[sectionId] ?? []).filter(
    (f) => !activeExtras.includes(f.key)
  )

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Add property"
              className={cn(
                "flex size-5 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-accent hover:text-accent-foreground",
                available.length === 0 && "invisible"
              )}
            >
              <Plus className="size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-44 p-1">
            <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">{title}</p>
            {available.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => onAddExtra(field.key)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground transition-colors hover:bg-accent"
              >
                {field.icon}
                {field.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-0.5 px-4 pb-4">{children}</div>
    </div>
  )
}

// ─── StylesPanel ────────────────────────────────────────────────────────────

type Props = {
  styles: EmailTemplateStyles
  onChange: (styles: EmailTemplateStyles) => void
  onReset?: () => void
  onClose?: () => void
}

export function StylesPanel({ styles, onChange, onReset, onClose }: Props) {
  // Track which optional fields are active per section
  const [extras, setExtras] = useState<Record<string, string[]>>({
    body: [],
    container: [],
    typography: [
      // Auto-show optional fields that already have non-default values
      ...(styles.typography.fontWeight !== undefined ? ["fontWeight"] : []),
      ...(styles.typography.textColor !== undefined ? ["textColor"] : []),
      ...(styles.typography.textDecoration !== undefined ? ["textDecoration"] : []),
    ],
    link: [],
    image: [],
    button: [],
    codeBlock: [],
    inlineCode: [],
  })

  const addExtra = (section: string, field: string) => {
    setExtras((prev) => ({ ...prev, [section]: [...(prev[section] ?? []), field] }))
  }

  const removeExtra = (section: string, field: string) => {
    setExtras((prev) => ({
      ...prev,
      [section]: (prev[section] ?? []).filter((f) => f !== field),
    }))
  }

  const set = <K extends keyof EmailTemplateStyles>(
    category: K,
    key: keyof EmailTemplateStyles[K],
    value: EmailTemplateStyles[K][typeof key]
  ) => {
    onChange({ ...styles, [category]: { ...styles[category], [key]: value } })
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">

        {/* Body */}
        <Section title="Body" sectionId="body" activeExtras={extras.body} onAddExtra={(f) => addExtra("body", f)}>
          <StyleRow label="Background">
            <ColorInput value={styles.body.background} onChange={(v) => set("body", "background", v)} />
          </StyleRow>
        </Section>

        {/* Container */}
        <Section title="Container" sectionId="container" activeExtras={extras.container} onAddExtra={(f) => addExtra("container", f)}>
          <StyleRow label="Align">
            <SelectInput
              value={styles.container.align}
              options={[
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" },
              ]}
              onChange={(v) => set("container", "align", v as "left" | "center" | "right")}
            />
          </StyleRow>
          <StyleRow label="Width">
            <NumberInput value={styles.container.width} onChange={(v) => set("container", "width", v)} min={320} max={900} />
          </StyleRow>
          <StyleRow label="Padding Left">
            <NumberInput value={styles.container.paddingLeft} onChange={(v) => set("container", "paddingLeft", v)} />
          </StyleRow>
          <StyleRow label="Padding Right">
            <NumberInput value={styles.container.paddingRight} onChange={(v) => set("container", "paddingRight", v)} />
          </StyleRow>
        </Section>

        {/* Typography */}
        <Section title="Typography" sectionId="typography" activeExtras={extras.typography} onAddExtra={(f) => addExtra("typography", f)}>
          <StyleRow label="Font size">
            <NumberInput value={styles.typography.fontSize} onChange={(v) => set("typography", "fontSize", v)} min={8} max={72} />
          </StyleRow>
          <StyleRow label="Line Height">
            <NumberInput value={styles.typography.lineHeight} onChange={(v) => set("typography", "lineHeight", v)} suffix="%" min={100} max={300} />
          </StyleRow>
          {extras.typography.includes("fontWeight") && (
            <StyleRow label="Font weight" onRemove={() => removeExtra("typography", "fontWeight")}>
              <NumberInput
                value={styles.typography.fontWeight ?? 400}
                onChange={(v) => set("typography", "fontWeight", v)}
                suffix=""
                min={100}
                max={900}
              />
            </StyleRow>
          )}
          {extras.typography.includes("textColor") && (
            <StyleRow label="Text color" onRemove={() => removeExtra("typography", "textColor")}>
              <ColorInput
                value={styles.typography.textColor ?? "#000000"}
                onChange={(v) => set("typography", "textColor", v)}
              />
            </StyleRow>
          )}
          {extras.typography.includes("textDecoration") && (
            <StyleRow label="Decoration" onRemove={() => removeExtra("typography", "textDecoration")}>
              <SelectInput
                value={styles.typography.textDecoration ?? "none"}
                options={[
                  { label: "None", value: "none" },
                  { label: "Underline", value: "underline" },
                  { label: "Strike", value: "line-through" },
                ]}
                onChange={(v) => set("typography", "textDecoration", v as "none" | "underline" | "line-through")}
              />
            </StyleRow>
          )}
        </Section>

        {/* Link */}
        <Section title="Link" sectionId="link" activeExtras={extras.link} onAddExtra={(f) => addExtra("link", f)}>
          <StyleRow label="Color">
            <ColorInput value={styles.link.color} onChange={(v) => set("link", "color", v)} />
          </StyleRow>
          <StyleRow label="Decoration">
            <SelectInput
              value={styles.link.decoration}
              options={[
                { label: "Underline", value: "underline" },
                { label: "None", value: "none" },
              ]}
              onChange={(v) => set("link", "decoration", v as "underline" | "none")}
            />
          </StyleRow>
        </Section>

        {/* Image */}
        <Section title="Image" sectionId="image" activeExtras={extras.image} onAddExtra={(f) => addExtra("image", f)}>
          <StyleRow label="Border radius">
            <NumberInput value={styles.image.borderRadius} onChange={(v) => set("image", "borderRadius", v)} />
          </StyleRow>
        </Section>

        {/* Button */}
        <Section title="Button" sectionId="button" activeExtras={extras.button} onAddExtra={(f) => addExtra("button", f)}>
          <StyleRow label="Background">
            <ColorInput value={styles.button.background} onChange={(v) => set("button", "background", v)} />
          </StyleRow>
          <StyleRow label="Text color">
            <ColorInput value={styles.button.textColor} onChange={(v) => set("button", "textColor", v)} />
          </StyleRow>
          <StyleRow label="Radius">
            <NumberInput value={styles.button.radius} onChange={(v) => set("button", "radius", v)} />
          </StyleRow>
          <StyleRow label="Padding Top">
            <NumberInput value={styles.button.paddingTop} onChange={(v) => set("button", "paddingTop", v)} />
          </StyleRow>
          <StyleRow label="Padding Right">
            <NumberInput value={styles.button.paddingRight} onChange={(v) => set("button", "paddingRight", v)} />
          </StyleRow>
          <StyleRow label="Padding Bottom">
            <NumberInput value={styles.button.paddingBottom} onChange={(v) => set("button", "paddingBottom", v)} />
          </StyleRow>
          <StyleRow label="Padding Left">
            <NumberInput value={styles.button.paddingLeft} onChange={(v) => set("button", "paddingLeft", v)} />
          </StyleRow>
        </Section>

        {/* Code Block */}
        <Section title="Code Block" sectionId="codeBlock" activeExtras={extras.codeBlock} onAddExtra={(f) => addExtra("codeBlock", f)}>
          <StyleRow label="Border Radius">
            <NumberInput value={styles.codeBlock.borderRadius} onChange={(v) => set("codeBlock", "borderRadius", v)} />
          </StyleRow>
          <StyleRow label="Padding Top">
            <NumberInput value={styles.codeBlock.paddingV} onChange={(v) => set("codeBlock", "paddingV", v)} />
          </StyleRow>
          <StyleRow label="Padding H">
            <NumberInput value={styles.codeBlock.paddingH} onChange={(v) => set("codeBlock", "paddingH", v)} />
          </StyleRow>
          <StyleRow label="Background">
            <ColorInput value={styles.codeBlock.background} onChange={(v) => set("codeBlock", "background", v)} />
          </StyleRow>
          <StyleRow label="Text color">
            <ColorInput value={styles.codeBlock.textColor} onChange={(v) => set("codeBlock", "textColor", v)} />
          </StyleRow>
        </Section>

        {/* Inline Code */}
        <Section title="Inline Code" sectionId="inlineCode" activeExtras={extras.inlineCode} onAddExtra={(f) => addExtra("inlineCode", f)}>
          <StyleRow label="Border Radius">
            <NumberInput value={styles.inlineCode.borderRadius} onChange={(v) => set("inlineCode", "borderRadius", v)} />
          </StyleRow>
          <StyleRow label="Background">
            <ColorInput value={styles.inlineCode.background} onChange={(v) => set("inlineCode", "background", v)} />
          </StyleRow>
          <StyleRow label="Text color">
            <ColorInput value={styles.inlineCode.textColor} onChange={(v) => set("inlineCode", "textColor", v)} />
          </StyleRow>
        </Section>

        {/* Global CSS */}
        <Section title="Global CSS" sectionId="globalCss" activeExtras={[]} onAddExtra={() => {}}>
          <div className="pt-1">
            <textarea
              value={styles.globalCss}
              onChange={(e) => onChange({ ...styles, globalCss: e.target.value })}
              placeholder={"/* Custom CSS */\n.email-body {\n  font-family: sans-serif;\n}"}
              rows={8}
              spellCheck={false}
              className="w-full resize-none rounded border border-border bg-muted/40 p-2 font-mono text-[10px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-muted-foreground/30"
            />
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="flex flex-shrink-0 items-center justify-between border-t border-border px-4 py-2.5">
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Reset Styles
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}
