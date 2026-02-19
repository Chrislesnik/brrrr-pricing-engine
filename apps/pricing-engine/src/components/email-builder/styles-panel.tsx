"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/shadcn/collapsible"
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
    <div className="flex h-6 items-center overflow-hidden rounded border border-[#e0e0e0] bg-[#fafafa]">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-10 bg-transparent px-1.5 text-right text-[11px] text-[#111] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="px-0.5 text-[10px] text-[#aaa]">{suffix}</span>
      <div className="ml-auto flex flex-col border-l border-[#e0e0e0]">
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-3 w-5 items-center justify-center text-[#999] hover:bg-[#f0f0f0]"
          aria-label="Increment"
        >
          <ChevronUp className="size-2.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-3 w-5 items-center justify-center border-t border-[#e0e0e0] text-[#999] hover:bg-[#f0f0f0]"
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
    <div className="flex h-6 items-center gap-1.5 overflow-hidden rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5">
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
        className="w-14 bg-transparent font-mono text-[11px] text-[#111] outline-none"
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
    <div className="flex h-6 items-center overflow-hidden rounded border border-[#e0e0e0] bg-[#fafafa] px-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[11px] text-[#111] outline-none"
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

function StyleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-[11px] text-[#666]">{label}</span>
      <div className="w-[90px]">{children}</div>
    </div>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-b border-[#ebebeb]">
      <CollapsibleTrigger className="group flex w-full items-start justify-between px-4 py-3 text-left">
        <div>
          <div className="text-[13px] font-semibold text-[#111]">{title}</div>
          {subtitle && <div className="mt-0.5 text-[11px] text-[#999]">{subtitle}</div>}
        </div>
        <ChevronDown className="mt-0.5 size-3.5 text-[#aaa] transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      {children && (
        <CollapsibleContent>
          <div className="flex flex-col gap-0.5 px-4 pb-4">{children}</div>
        </CollapsibleContent>
      )}
    </Collapsible>
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
  const set = <K extends keyof EmailTemplateStyles>(
    category: K,
    key: keyof EmailTemplateStyles[K],
    value: EmailTemplateStyles[K][typeof key]
  ) => {
    onChange({ ...styles, [category]: { ...styles[category], [key]: value } })
  }

  return (
    <div className="flex h-full w-[210px] flex-shrink-0 flex-col border-r border-[#e5e5e5] bg-white">
      <div className="flex-1 overflow-y-auto">
        <Section title="Body">
          <StyleRow label="Background">
            <ColorInput
              value={styles.body.background}
              onChange={(v) => set("body", "background", v)}
            />
          </StyleRow>
        </Section>

        <Section title="Container">
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
            <NumberInput
              value={styles.container.width}
              onChange={(v) => set("container", "width", v)}
              min={320}
              max={900}
            />
          </StyleRow>
          <StyleRow label="Pad Left">
            <NumberInput
              value={styles.container.paddingLeft}
              onChange={(v) => set("container", "paddingLeft", v)}
            />
          </StyleRow>
          <StyleRow label="Pad Right">
            <NumberInput
              value={styles.container.paddingRight}
              onChange={(v) => set("container", "paddingRight", v)}
            />
          </StyleRow>
        </Section>

        <Section title="Typography" defaultOpen={false}>
          <StyleRow label="Font size">
            <NumberInput
              value={styles.typography.fontSize}
              onChange={(v) => set("typography", "fontSize", v)}
              min={8}
              max={72}
            />
          </StyleRow>
          <StyleRow label="Line height">
            <NumberInput
              value={styles.typography.lineHeight}
              onChange={(v) => set("typography", "lineHeight", v)}
              suffix="%"
              min={100}
              max={300}
            />
          </StyleRow>
        </Section>

        <Section title="Link" defaultOpen={false}>
          <StyleRow label="Color">
            <ColorInput
              value={styles.link.color}
              onChange={(v) => set("link", "color", v)}
            />
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

        <Section title="Image" defaultOpen={false}>
          <StyleRow label="Radius">
            <NumberInput
              value={styles.image.borderRadius}
              onChange={(v) => set("image", "borderRadius", v)}
            />
          </StyleRow>
        </Section>

        <Section title="Button" defaultOpen={false}>
          <StyleRow label="Background">
            <ColorInput
              value={styles.button.background}
              onChange={(v) => set("button", "background", v)}
            />
          </StyleRow>
          <StyleRow label="Text color">
            <ColorInput
              value={styles.button.textColor}
              onChange={(v) => set("button", "textColor", v)}
            />
          </StyleRow>
          <StyleRow label="Radius">
            <NumberInput
              value={styles.button.radius}
              onChange={(v) => set("button", "radius", v)}
            />
          </StyleRow>
          <StyleRow label="Pad Top">
            <NumberInput
              value={styles.button.paddingTop}
              onChange={(v) => set("button", "paddingTop", v)}
            />
          </StyleRow>
          <StyleRow label="Pad Right">
            <NumberInput
              value={styles.button.paddingRight}
              onChange={(v) => set("button", "paddingRight", v)}
            />
          </StyleRow>
          <StyleRow label="Pad Bottom">
            <NumberInput
              value={styles.button.paddingBottom}
              onChange={(v) => set("button", "paddingBottom", v)}
            />
          </StyleRow>
          <StyleRow label="Pad Left">
            <NumberInput
              value={styles.button.paddingLeft}
              onChange={(v) => set("button", "paddingLeft", v)}
            />
          </StyleRow>
        </Section>

        <Section title="Code Block" defaultOpen={false}>
          <StyleRow label="Radius">
            <NumberInput
              value={styles.codeBlock.borderRadius}
              onChange={(v) => set("codeBlock", "borderRadius", v)}
            />
          </StyleRow>
          <StyleRow label="Pad H">
            <NumberInput
              value={styles.codeBlock.paddingH}
              onChange={(v) => set("codeBlock", "paddingH", v)}
            />
          </StyleRow>
          <StyleRow label="Pad V">
            <NumberInput
              value={styles.codeBlock.paddingV}
              onChange={(v) => set("codeBlock", "paddingV", v)}
            />
          </StyleRow>
          <StyleRow label="Background">
            <ColorInput
              value={styles.codeBlock.background}
              onChange={(v) => set("codeBlock", "background", v)}
            />
          </StyleRow>
          <StyleRow label="Text color">
            <ColorInput
              value={styles.codeBlock.textColor}
              onChange={(v) => set("codeBlock", "textColor", v)}
            />
          </StyleRow>
        </Section>

        <Section title="Inline Code" defaultOpen={false}>
          <StyleRow label="Radius">
            <NumberInput
              value={styles.inlineCode.borderRadius}
              onChange={(v) => set("inlineCode", "borderRadius", v)}
            />
          </StyleRow>
          <StyleRow label="Background">
            <ColorInput
              value={styles.inlineCode.background}
              onChange={(v) => set("inlineCode", "background", v)}
            />
          </StyleRow>
          <StyleRow label="Text color">
            <ColorInput
              value={styles.inlineCode.textColor}
              onChange={(v) => set("inlineCode", "textColor", v)}
            />
          </StyleRow>
        </Section>

        <Section title="Global CSS" defaultOpen={false}>
          <div className="pt-1">
            <textarea
              value={styles.globalCss}
              onChange={(e) => onChange({ ...styles, globalCss: e.target.value })}
              placeholder={"/* Custom CSS */\n.email-body {\n  font-family: sans-serif;\n}"}
              rows={8}
              spellCheck={false}
              className="w-full resize-none rounded border border-[#e0e0e0] bg-[#fafafa] p-2 font-mono text-[10px] leading-relaxed text-[#111] outline-none placeholder:text-[#ccc] focus:border-[#ccc]"
            />
          </div>
        </Section>
      </div>

      {/* Footer actions */}
      <div className="flex flex-shrink-0 items-center justify-between border-t border-[#ebebeb] px-4 py-2.5">
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-[#999] transition-colors hover:text-[#555]"
        >
          Reset Styles
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-[#999] transition-colors hover:text-[#555]"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}
