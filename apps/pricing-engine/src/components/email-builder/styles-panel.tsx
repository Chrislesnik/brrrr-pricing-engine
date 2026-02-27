"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Minus,
  Type,
  Palette,
  LayoutTemplate,
  ImageIcon,
  RectangleHorizontal,
  Code2,
  FileCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"
import { cn } from "@repo/lib/cn"
import type { EmailTemplateStyles } from "./types"

// ─── Email-safe font stacks ─────────────────────────────────────────────────

const EMAIL_FONTS = [
  { label: "Inter",       value: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: "Arial",       value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica",   value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia",     value: "Georgia, 'Times New Roman', Times, serif" },
  { label: "Times",       value: "'Times New Roman', Times, Georgia, serif" },
  { label: "Verdana",     value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet",   value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Tahoma",      value: "Tahoma, Verdana, Geneva, sans-serif" },
  { label: "Courier",     value: "'Courier New', Courier, monospace" },
  { label: "System UI",   value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
]

// ─── NumberInput ─────────────────────────────────────────────────────────────

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
    <div className="flex h-7 items-center overflow-hidden rounded-md border border-border bg-muted/30 transition-colors focus-within:border-foreground/30">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-10 bg-transparent px-1.5 text-right text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="pr-0.5 text-[10px] text-muted-foreground/60">{suffix}</span>
      <div className="ml-auto flex flex-col border-l border-border">
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-[13px] w-5 items-center justify-center text-muted-foreground/50 hover:bg-accent hover:text-foreground"
          aria-label="Increment"
        >
          <ChevronUp className="size-2.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-[13px] w-5 items-center justify-center border-t border-border text-muted-foreground/50 hover:bg-accent hover:text-foreground"
          aria-label="Decrement"
        >
          <ChevronDown className="size-2.5" />
        </button>
      </div>
    </div>
  )
}

// ─── ColorInput ──────────────────────────────────────────────────────────────

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-7 items-center gap-1.5 overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-4 cursor-pointer rounded border-0 bg-transparent p-0"
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

// ─── SelectInput ─────────────────────────────────────────────────────────────

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
    <div className="flex h-7 items-center overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
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

// ─── AlignmentToggle ─────────────────────────────────────────────────────────

function AlignmentToggle({
  value,
  onChange,
}: {
  value: "left" | "center" | "right"
  onChange: (v: "left" | "center" | "right") => void
}) {
  const opts: { v: "left" | "center" | "right"; icon: React.ReactNode }[] = [
    { v: "left", icon: <AlignLeft className="size-3" /> },
    { v: "center", icon: <AlignCenter className="size-3" /> },
    { v: "right", icon: <AlignRight className="size-3" /> },
  ]

  return (
    <div className="flex h-7 overflow-hidden rounded-md border border-border">
      {opts.map((o, i) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "flex flex-1 items-center justify-center transition-colors",
            i > 0 && "border-l border-border",
            value === o.v
              ? "bg-accent text-accent-foreground"
              : "bg-muted/30 text-muted-foreground/60 hover:bg-accent/50 hover:text-foreground"
          )}
          title={o.v.charAt(0).toUpperCase() + o.v.slice(1)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}

// ─── Padding side icons (Figma-style directional indicators) ─────────────────

function PadIcon({ side }: { side: "T" | "R" | "B" | "L" | "H" | "V" }) {
  const shared = "size-3 text-muted-foreground/50"
  switch (side) {
    case "T": return <svg className={shared} viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="1.5" rx="0.5" fill="currentColor" /><rect x="3" y="4" width="6" height="5" rx="1" fill="currentColor" opacity="0.25" /></svg>
    case "B": return <svg className={shared} viewBox="0 0 12 12"><rect x="1" y="9.5" width="10" height="1.5" rx="0.5" fill="currentColor" /><rect x="3" y="3" width="6" height="5" rx="1" fill="currentColor" opacity="0.25" /></svg>
    case "L": return <svg className={shared} viewBox="0 0 12 12"><rect x="1" y="1" width="1.5" height="10" rx="0.5" fill="currentColor" /><rect x="4" y="3" width="5" height="6" rx="1" fill="currentColor" opacity="0.25" /></svg>
    case "R": return <svg className={shared} viewBox="0 0 12 12"><rect x="9.5" y="1" width="1.5" height="10" rx="0.5" fill="currentColor" /><rect x="3" y="3" width="5" height="6" rx="1" fill="currentColor" opacity="0.25" /></svg>
    case "H": return <svg className={shared} viewBox="0 0 12 12"><rect x="1" y="1" width="1.5" height="10" rx="0.5" fill="currentColor" /><rect x="9.5" y="1" width="1.5" height="10" rx="0.5" fill="currentColor" /><rect x="4" y="3" width="4" height="6" rx="1" fill="currentColor" opacity="0.25" /></svg>
    case "V": return <svg className={shared} viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="1.5" rx="0.5" fill="currentColor" /><rect x="1" y="9.5" width="10" height="1.5" rx="0.5" fill="currentColor" /><rect x="3" y="4" width="6" height="4" rx="1" fill="currentColor" opacity="0.25" /></svg>
  }
}

// ─── PaddingControl ──────────────────────────────────────────────────────────

function PaddingControl({
  top,
  right,
  bottom,
  left,
  onTop,
  onRight,
  onBottom,
  onLeft,
}: {
  top: number; right: number; bottom: number; left: number
  onTop: (v: number) => void; onRight: (v: number) => void
  onBottom: (v: number) => void; onLeft: (v: number) => void
}) {
  const [perSide, setPerSide] = useState(false)

  if (!perSide) {
    return (
      <div className="flex items-center gap-1.5">
        {/* H (left + right) */}
        <div className="flex h-7 flex-1 items-center gap-1 overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
          <PadIcon side="H" />
          <input
            type="number"
            value={left}
            min={0}
            onChange={(e) => { const v = Number(e.target.value); onLeft(v); onRight(v) }}
            className="w-full bg-transparent text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        {/* V (top + bottom) */}
        <div className="flex h-7 flex-1 items-center gap-1 overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
          <PadIcon side="V" />
          <input
            type="number"
            value={top}
            min={0}
            onChange={(e) => { const v = Number(e.target.value); onTop(v); onBottom(v) }}
            className="w-full bg-transparent text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        {/* Toggle */}
        <button
          type="button"
          onClick={() => setPerSide(true)}
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          title="Per-side padding"
        >
          <svg className="size-3.5" viewBox="0 0 14 14"><rect x="0.5" y="0.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-1.5">
      <div className="grid flex-1 grid-cols-2 gap-1">
        {/* Top-left: Left padding */}
        <div className="flex h-7 items-center gap-1 overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
          <PadIcon side="L" />
          <input type="number" value={left} min={0} onChange={(e) => onLeft(Number(e.target.value))}
            className="w-full bg-transparent text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </div>
        {/* Top-right: Top padding */}
        <div className="flex h-7 items-center gap-1 overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
          <PadIcon side="T" />
          <input type="number" value={top} min={0} onChange={(e) => onTop(Number(e.target.value))}
            className="w-full bg-transparent text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </div>
        {/* Bottom-left: Right padding */}
        <div className="flex h-7 items-center gap-1 overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
          <PadIcon side="R" />
          <input type="number" value={right} min={0} onChange={(e) => onRight(Number(e.target.value))}
            className="w-full bg-transparent text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </div>
        {/* Bottom-right: Bottom padding */}
        <div className="flex h-7 items-center gap-1 overflow-hidden rounded-md border border-border bg-muted/30 px-1.5 transition-colors focus-within:border-foreground/30">
          <PadIcon side="B" />
          <input type="number" value={bottom} min={0} onChange={(e) => onBottom(Number(e.target.value))}
            className="w-full bg-transparent text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </div>
      </div>
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setPerSide(false)}
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/50 bg-accent text-accent-foreground transition-colors hover:bg-accent/80"
        title="Linked padding"
      >
        <svg className="size-3.5" viewBox="0 0 14 14">
          <rect x="0.5" y="0.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
        </svg>
      </button>
    </div>
  )
}

// ─── StyleRow ────────────────────────────────────────────────────────────────

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
    <div className="group flex items-center justify-between gap-3 py-1">
      <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <div className="w-[100px]">{children}</div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove property"
            className="flex size-4 items-center justify-center rounded text-muted-foreground/30 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <Minus className="size-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
      >
        <ChevronRight
          className={cn(
            "size-3 shrink-0 text-muted-foreground/50 transition-transform duration-150",
            open && "rotate-90"
          )}
        />
        <span className="text-muted-foreground/70">{icon}</span>
        <span className="text-[12px] font-medium text-foreground">{title}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 px-3 pb-3">{children}</div>
      )}
    </div>
  )
}

// ─── StylesPanel ─────────────────────────────────────────────────────────────

type Props = {
  styles: EmailTemplateStyles
  onChange: (styles: EmailTemplateStyles) => void
  onReset?: () => void
}

export function StylesPanel({ styles, onChange, onReset }: Props) {
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

        {/* ── Layout ────────────────────────────────────────────────────────── */}
        <Section title="Layout" icon={<LayoutTemplate className="size-3.5" />}>
          <StyleRow label="Width">
            <NumberInput value={styles.container.width} onChange={(v) => set("container", "width", v)} min={320} max={900} />
          </StyleRow>
          <StyleRow label="Align">
            <AlignmentToggle
              value={styles.container.align}
              onChange={(v) => set("container", "align", v)}
            />
          </StyleRow>
          <div className="mt-1">
            <span className="text-[10px] font-medium text-muted-foreground/50">Padding</span>
            <div className="mt-1">
              <PaddingControl
                top={0}
                right={styles.container.paddingRight}
                bottom={0}
                left={styles.container.paddingLeft}
                onTop={() => {}}
                onRight={(v) => set("container", "paddingRight", v)}
                onBottom={() => {}}
                onLeft={(v) => set("container", "paddingLeft", v)}
              />
            </div>
          </div>
        </Section>

        {/* ── Typography ────────────────────────────────────────────────────── */}
        <Section title="Typography" icon={<Type className="size-3.5" />}>
          <StyleRow label="Font">
            <SelectInput
              value={styles.typography.fontFamily}
              options={EMAIL_FONTS}
              onChange={(v) => set("typography", "fontFamily", v)}
            />
          </StyleRow>
          <StyleRow label="Size">
            <NumberInput value={styles.typography.fontSize} onChange={(v) => set("typography", "fontSize", v)} min={8} max={72} />
          </StyleRow>
          <StyleRow label="Height">
            <NumberInput value={styles.typography.lineHeight} onChange={(v) => set("typography", "lineHeight", v)} suffix="%" min={100} max={300} />
          </StyleRow>
          <StyleRow label="Weight">
            <NumberInput
              value={styles.typography.fontWeight ?? 400}
              onChange={(v) => set("typography", "fontWeight", v)}
              suffix=""
              min={100}
              max={900}
            />
          </StyleRow>
          <StyleRow label="Color">
            <ColorInput
              value={styles.typography.textColor ?? "#000000"}
              onChange={(v) => set("typography", "textColor", v)}
            />
          </StyleRow>
        </Section>

        {/* ── Colors ────────────────────────────────────────────────────────── */}
        <Section title="Colors" icon={<Palette className="size-3.5" />}>
          <StyleRow label="Background">
            <ColorInput value={styles.body.background} onChange={(v) => set("body", "background", v)} />
          </StyleRow>
          <StyleRow label="Link">
            <ColorInput value={styles.link.color} onChange={(v) => set("link", "color", v)} />
          </StyleRow>
          <StyleRow label="Link style">
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

        {/* ── Button ────────────────────────────────────────────────────────── */}
        <Section title="Button" icon={<RectangleHorizontal className="size-3.5" />}>
          <StyleRow label="Background">
            <ColorInput value={styles.button.background} onChange={(v) => set("button", "background", v)} />
          </StyleRow>
          <StyleRow label="Text">
            <ColorInput value={styles.button.textColor} onChange={(v) => set("button", "textColor", v)} />
          </StyleRow>
          <StyleRow label="Radius">
            <NumberInput value={styles.button.radius} onChange={(v) => set("button", "radius", v)} />
          </StyleRow>
          <div className="mt-1">
            <span className="text-[10px] font-medium text-muted-foreground/50">Padding</span>
            <div className="mt-1">
              <PaddingControl
                top={styles.button.paddingTop}
                right={styles.button.paddingRight}
                bottom={styles.button.paddingBottom}
                left={styles.button.paddingLeft}
                onTop={(v) => set("button", "paddingTop", v)}
                onRight={(v) => set("button", "paddingRight", v)}
                onBottom={(v) => set("button", "paddingBottom", v)}
                onLeft={(v) => set("button", "paddingLeft", v)}
              />
            </div>
          </div>
        </Section>

        {/* ── Image ─────────────────────────────────────────────────────────── */}
        <Section title="Image" icon={<ImageIcon className="size-3.5" />} defaultOpen={false}>
          <StyleRow label="Radius">
            <NumberInput value={styles.image.borderRadius} onChange={(v) => set("image", "borderRadius", v)} />
          </StyleRow>
        </Section>

        {/* ── Code ──────────────────────────────────────────────────────────── */}
        <Section title="Code" icon={<Code2 className="size-3.5" />} defaultOpen={false}>
          <span className="mb-1 text-[10px] font-medium text-muted-foreground/50">Block</span>
          <StyleRow label="Radius">
            <NumberInput value={styles.codeBlock.borderRadius} onChange={(v) => set("codeBlock", "borderRadius", v)} />
          </StyleRow>
          <StyleRow label="Background">
            <ColorInput value={styles.codeBlock.background} onChange={(v) => set("codeBlock", "background", v)} />
          </StyleRow>
          <StyleRow label="Text">
            <ColorInput value={styles.codeBlock.textColor} onChange={(v) => set("codeBlock", "textColor", v)} />
          </StyleRow>
          <StyleRow label="Padding H">
            <NumberInput value={styles.codeBlock.paddingH} onChange={(v) => set("codeBlock", "paddingH", v)} />
          </StyleRow>
          <StyleRow label="Padding V">
            <NumberInput value={styles.codeBlock.paddingV} onChange={(v) => set("codeBlock", "paddingV", v)} />
          </StyleRow>

          <div className="my-1.5 border-t border-border" />

          <span className="mb-1 text-[10px] font-medium text-muted-foreground/50">Inline</span>
          <StyleRow label="Radius">
            <NumberInput value={styles.inlineCode.borderRadius} onChange={(v) => set("inlineCode", "borderRadius", v)} />
          </StyleRow>
          <StyleRow label="Background">
            <ColorInput value={styles.inlineCode.background} onChange={(v) => set("inlineCode", "background", v)} />
          </StyleRow>
          <StyleRow label="Text">
            <ColorInput value={styles.inlineCode.textColor} onChange={(v) => set("inlineCode", "textColor", v)} />
          </StyleRow>
        </Section>

        {/* ── Custom CSS ────────────────────────────────────────────────────── */}
        <Section title="Custom CSS" icon={<FileCode className="size-3.5" />} defaultOpen={false}>
          <textarea
            value={styles.globalCss}
            onChange={(e) => onChange({ ...styles, globalCss: e.target.value })}
            placeholder={"/* Custom CSS */\n.email-body {\n  font-family: sans-serif;\n}"}
            rows={8}
            spellCheck={false}
            className="w-full resize-none rounded-md border border-border bg-muted/30 p-2 font-mono text-[10px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/30 transition-colors focus:border-foreground/30"
          />
        </Section>
      </div>

      {/* Footer */}
      <div className="flex flex-shrink-0 items-center border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
