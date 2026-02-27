"use client"

import { useCallback, useRef, useState, useEffect, useLayoutEffect, createContext, useContext } from "react"
import { createPortal } from "react-dom"
import {
  FormattingToolbar,
  FormattingToolbarController,
  BasicTextStyleButton,
  ColorStyleButton,
  CreateLinkButton,
  TextAlignButton,
  useBlockNoteEditor,
} from "@blocknote/react"
import {
  Sparkles,
  ChevronDown,
  Wand2,
  SpellCheck,
  Minimize2,
  Maximize2,
  BookOpen,
  Briefcase,
  MessageCircle,
  ArrowRight,
  Languages,
  Loader2,
  Check,
  X,
  CornerDownLeft,
  PenLine,
  Send,
} from "lucide-react"
import { cn } from "@repo/lib/cn"

type AiAction = {
  id: string
  label: string
  icon: React.ReactNode
  action: string
}

const AI_EDIT_ACTIONS: AiAction[] = [
  { id: "improve", label: "Improve writing", icon: <Wand2 className="size-3.5" />, action: "improve" },
  { id: "fix", label: "Fix grammar & spelling", icon: <SpellCheck className="size-3.5" />, action: "fix_grammar" },
  { id: "shorter", label: "Make shorter", icon: <Minimize2 className="size-3.5" />, action: "make_shorter" },
  { id: "longer", label: "Make longer", icon: <Maximize2 className="size-3.5" />, action: "make_longer" },
  { id: "simplify", label: "Simplify language", icon: <BookOpen className="size-3.5" />, action: "simplify" },
  { id: "professional", label: "Professional tone", icon: <Briefcase className="size-3.5" />, action: "professional" },
  { id: "casual", label: "Casual tone", icon: <MessageCircle className="size-3.5" />, action: "casual" },
]

const AI_GENERATE_ACTIONS: AiAction[] = [
  { id: "continue", label: "Continue writing", icon: <ArrowRight className="size-3.5" />, action: "continue" },
]

const TRANSLATE_LANGUAGES = [
  "Spanish", "French", "German", "Portuguese", "Italian",
  "Chinese", "Japanese", "Korean", "Russian", "Arabic", "Hebrew",
]

// ─── Shared state between toolbar button and portal dropdown ─────────────────

type AiDropdownState = {
  open: boolean
  pos: { top: number; left: number } | null
  toggle: (btnEl: HTMLButtonElement) => void
  close: () => void
}

const AiDropdownCtx = createContext<AiDropdownState>({
  open: false,
  pos: null,
  toggle: () => {},
  close: () => {},
})

// ─── Dropdown content (rendered in portal, outside toolbar tree) ─────────────

type AiView = "menu" | "translate" | "prompt" | "result"

function AiDropdownContent({ onClose }: { onClose: () => void }) {
  const editor = useBlockNoteEditor()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [view, setView] = useState<AiView>("menu")
  const [promptValue, setPromptValue] = useState("")
  const [isRichText, setIsRichText] = useState(false)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  const capturedTextRef = useRef("")
  useEffect(() => {
    const selection = editor.getSelection()
    if (selection) {
      capturedTextRef.current = selection.blocks
        .map((block: any) => {
          if (!block.content || !Array.isArray(block.content)) return ""
          return block.content.map((c: any) => (c.type === "text" ? c.text : "")).join("")
        })
        .join("\n")
    } else {
      const cursor = editor.getTextCursorPosition()
      const block = cursor.block as any
      if (block.content && Array.isArray(block.content)) {
        capturedTextRef.current = block.content.map((c: any) => (c.type === "text" ? c.text : "")).join("")
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (view === "prompt") {
      requestAnimationFrame(() => promptInputRef.current?.focus())
    }
  }, [view])

  const getSelectedText = useCallback((): string => {
    if (capturedTextRef.current) return capturedTextRef.current
    const selection = editor.getSelection()
    if (!selection) {
      const cursor = editor.getTextCursorPosition()
      const block = cursor.block as any
      if (!block.content || !Array.isArray(block.content)) return ""
      return block.content.map((c: any) => (c.type === "text" ? c.text : "")).join("")
    }
    return selection.blocks
      .map((block: any) => {
        if (!block.content || !Array.isArray(block.content)) return ""
        return block.content.map((c: any) => (c.type === "text" ? c.text : "")).join("")
      })
      .join("\n")
  }, [editor])

  const runAiAction = useCallback(
    async (action: string, language?: string) => {
      const text = capturedTextRef.current || getSelectedText()
      if (action !== "generate" && !text.trim()) return

      setLoading(true)
      setActiveAction(action)
      setResult(null)
      setIsRichText(action === "generate")
      setView("result")

      try {
        const res = await fetch("/api/ai/edit-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text || "",
            action,
            language,
            ...(action === "generate" ? { prompt: promptValue } : {}),
          }),
        })

        if (!res.ok || !res.body) {
          setLoading(false)
          setActiveAction(null)
          setView("menu")
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setResult(accumulated)
        }

        setLoading(false)
      } catch {
        setLoading(false)
        setActiveAction(null)
        setView("menu")
      }
    },
    [getSelectedText, promptValue]
  )

  const applyResult = useCallback(async () => {
    if (!result) return

    if (isRichText) {
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(result)
        const cursor = editor.getTextCursorPosition()
        editor.insertBlocks(blocks as any, cursor.block, "after")
      } catch {
        const cursor = editor.getTextCursorPosition()
        editor.insertBlocks(
          [{ type: "paragraph" as const, content: result }],
          cursor.block,
          "after"
        )
      }
    } else {
      const selection = editor.getSelection()
      if (selection && selection.blocks.length > 0) {
        const blocks = selection.blocks
        const firstBlock = blocks[0] as any

        if (activeAction === "continue") {
          const lastBlock = blocks[blocks.length - 1] as any
          editor.insertBlocks(
            [{ type: "paragraph" as const, content: result }],
            lastBlock,
            "after"
          )
        } else {
          editor.updateBlock(firstBlock, { content: result } as any)
          for (let i = 1; i < blocks.length; i++) {
            editor.removeBlocks([blocks[i]])
          }
        }
      } else {
        const cursor = editor.getTextCursorPosition()
        editor.insertBlocks(
          [{ type: "paragraph" as const, content: result }],
          cursor.block,
          "after"
        )
      }
    }

    setResult(null)
    setActiveAction(null)
    setPromptValue("")
    onClose()
  }, [result, editor, activeAction, isRichText, onClose])

  const discardResult = useCallback(() => {
    setResult(null)
    setActiveAction(null)
    setView("menu")
  }, [])

  const prevent = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation() }

  // ── Result view ──

  if (view === "result" && result !== null) {
    return (
      <div className="w-96 overflow-hidden rounded-lg border border-border bg-popover shadow-lg" onMouseDown={prevent}>
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            <Sparkles className="size-3" />
            {isRichText ? "Generated Content" : "AI Result"}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto px-3 py-2 text-sm text-foreground">
          {isRichText ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
              <MarkdownPreview content={result} />
            </div>
          ) : (
            result
          )}
          {loading && <span className="ml-1 inline-block animate-pulse text-violet-500">|</span>}
        </div>
        <div className="flex items-center justify-end gap-1.5 border-t border-border px-3 py-2">
          <button type="button" onMouseDown={(e) => { prevent(e); discardResult() }} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            <X className="size-3" /> Discard
          </button>
          <button type="button" onMouseDown={(e) => { prevent(e); applyResult() }} disabled={loading} className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50">
            {loading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            {isRichText ? "Insert" : "Replace"}
          </button>
        </div>
      </div>
    )
  }

  // ── Prompt view ──

  if (view === "prompt") {
    return (
      <div className="w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-lg" onMouseDown={prevent}>
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            <PenLine className="size-3" />
            Generate formatted content
          </div>
        </div>
        <div className="p-3" onMouseDown={(e) => e.stopPropagation()}>
          <textarea
            ref={promptInputRef}
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && promptValue.trim()) {
                runAiAction("generate")
              }
              if (e.key === "Escape") setView("menu")
            }}
            placeholder="Describe what you want to generate…"
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-muted/40 px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <button type="button" onMouseDown={(e) => { prevent(e); setView("menu") }} className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <CornerDownLeft className="size-3" /> Back
          </button>
          <button
            type="button"
            onMouseDown={(e) => { prevent(e); if (promptValue.trim()) runAiAction("generate") }}
            disabled={!promptValue.trim() || loading}
            className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
            Generate
          </button>
        </div>
      </div>
    )
  }

  // ── Translate view ──

  if (view === "translate") {
    return (
      <div className="w-56 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg" onMouseDown={prevent}>
        <button type="button" onMouseDown={(e) => { prevent(e); setView("menu") }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent">
          <CornerDownLeft className="size-3" /> Back
        </button>
        <div className="mx-2 my-1 h-px bg-border" />
        {TRANSLATE_LANGUAGES.map((lang) => (
          <button key={lang} type="button" onMouseDown={(e) => { prevent(e); runAiAction("translate", lang) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-accent">
            {lang}
          </button>
        ))}
      </div>
    )
  }

  // ── Main menu ──

  return (
    <div className="w-56 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg" onMouseDown={prevent}>
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Edit selection
      </div>
      {AI_EDIT_ACTIONS.map((item) => (
        <button key={item.id} type="button" onMouseDown={(e) => { prevent(e); runAiAction(item.action) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-accent">
          <span className="text-muted-foreground">{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div className="mx-2 my-1 h-px bg-border" />

      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Generate
      </div>
      {AI_GENERATE_ACTIONS.map((item) => (
        <button key={item.id} type="button" onMouseDown={(e) => { prevent(e); runAiAction(item.action) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-accent">
          <span className="text-muted-foreground">{item.icon}</span>
          {item.label}
        </button>
      ))}
      <button type="button" onMouseDown={(e) => { prevent(e); setView("prompt") }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-accent">
        <span className="text-muted-foreground"><PenLine className="size-3.5" /></span>
        Generate from prompt
      </button>

      <div className="mx-2 my-1 h-px bg-border" />

      <button type="button" onMouseDown={(e) => { prevent(e); setView("translate") }} className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-accent">
        <span className="flex items-center gap-2">
          <Languages className="size-3.5 text-muted-foreground" />
          Translate
        </span>
        <ChevronDown className="size-3 -rotate-90 text-muted-foreground/50" />
      </button>
    </div>
  )
}

// ─── Markdown preview helpers ────────────────────────────────────────────────

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i}>{fmtInline(line.slice(4))}</h3>)
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i}>{fmtInline(line.slice(3))}</h2>)
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i}>{fmtInline(line.slice(2))}</h1>)
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [line.slice(2)]
      while (i + 1 < lines.length && (lines[i + 1].startsWith("- ") || lines[i + 1].startsWith("* "))) { i++; items.push(lines[i].slice(2)) }
      elements.push(<ul key={i}>{items.map((it, j) => <li key={j}>{fmtInline(it)}</li>)}</ul>)
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [line.replace(/^\d+\.\s/, "")]
      while (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1])) { i++; items.push(lines[i].replace(/^\d+\.\s/, "")) }
      elements.push(<ol key={i}>{items.map((it, j) => <li key={j}>{fmtInline(it)}</li>)}</ol>)
    } else if (line.trim() !== "") {
      elements.push(<p key={i}>{fmtInline(line)}</p>)
    }
  }
  return <>{elements}</>
}

function fmtInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>)
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>)
    else if (m[4]) parts.push(<code key={m.index}>{m[4]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : parts
}

// ─── Toolbar button (lives inside FormattingToolbar, may unmount) ────────────

function AiToolbarButton() {
  const ctx = useContext(AiDropdownCtx)
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={btnRef}
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (btnRef.current) ctx.toggle(btnRef.current)
      }}
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
        ctx.open
          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
          : "text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/30"
      )}
    >
      <Sparkles className="size-3" />
      Ask AI
      <ChevronDown className="size-3 text-violet-400 dark:text-violet-500" />
    </button>
  )
}

function ToolbarSeparator() {
  return <div className="mx-0.5 h-4 w-px bg-border" />
}

function NotionFormattingToolbarContent() {
  return (
    <FormattingToolbar>
      <AiToolbarButton key="ai" />
      <ToolbarSeparator key="sep-ai" />
      <BasicTextStyleButton basicTextStyle="bold" key="bold" />
      <BasicTextStyleButton basicTextStyle="italic" key="italic" />
      <BasicTextStyleButton basicTextStyle="underline" key="underline" />
      <BasicTextStyleButton basicTextStyle="strike" key="strike" />
      <BasicTextStyleButton basicTextStyle="code" key="code" />
      <ToolbarSeparator key="sep-styles" />
      <ColorStyleButton key="color" />
      <CreateLinkButton key="link" />
      <ToolbarSeparator key="sep-align" />
      <TextAlignButton textAlignment="left" key="align-left" />
      <TextAlignButton textAlignment="center" key="align-center" />
      <TextAlignButton textAlignment="right" key="align-right" />
    </FormattingToolbar>
  )
}

// ─── Root component: owns dropdown state, survives toolbar unmounts ──────────

export function NotionFormattingToolbar() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const lastBtnRef = useRef<HTMLButtonElement | null>(null)

  const toggle = useCallback((btnEl: HTMLButtonElement) => {
    lastBtnRef.current = btnEl
    setOpen((prev) => {
      if (!prev) {
        const rect = btnEl.getBoundingClientRect()
        setPos({ top: rect.bottom + 4, left: rect.left })
      }
      return !prev
    })
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (lastBtnRef.current?.contains(target)) return
      if (portalRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const ctx: AiDropdownState = { open, pos, toggle, close }

  return (
    <AiDropdownCtx.Provider value={ctx}>
      <FormattingToolbarController formattingToolbar={NotionFormattingToolbarContent} />
      {open && pos && createPortal(
        <div
          ref={portalRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <AiDropdownContent onClose={close} />
        </div>,
        document.body
      )}
    </AiDropdownCtx.Provider>
  )
}
