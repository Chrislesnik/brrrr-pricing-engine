"use client"

import { Editor, Range } from "@tiptap/core"
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  Link,
  Square,
  Minus,
  Code,
  Code2,
  FileCode,
  Sparkles,
  Languages,
  PenLine,
  Search,
  Minimize2,
} from "lucide-react"
import { ReactNode, forwardRef, useEffect, useImperativeHandle, useState, useCallback, useRef } from "react"
import { cn } from "@repo/lib/cn"

export type SlashCommandItem = {
  title: string
  description: string
  icon: ReactNode
  command: (ctx: { editor: Editor; range: Range }) => void
}

const htmlDialogListeners = new Set<(pending: { editor: Editor }) => void>()
const linkDialogListeners = new Set<(pending: { editor: Editor }) => void>()
const buttonDialogListeners = new Set<(pending: { editor: Editor }) => void>()

export function onHtmlDialogRequest(cb: (pending: { editor: Editor }) => void) {
  htmlDialogListeners.add(cb)
  return () => { htmlDialogListeners.delete(cb) }
}

export function onLinkDialogRequest(cb: (pending: { editor: Editor }) => void) {
  linkDialogListeners.add(cb)
  return () => { linkDialogListeners.delete(cb) }
}

export function onButtonDialogRequest(cb: (pending: { editor: Editor }) => void) {
  buttonDialogListeners.add(cb)
  return () => { buttonDialogListeners.delete(cb) }
}

function clearSlashQuery(editor: Editor, range: Range) {
  const cleared = editor.chain().focus().deleteRange(range).run()
  if (cleared) return

  // Fallback for stale suggestion ranges: remove the "/" directly before caret.
  const cursor = editor.state.selection.from
  const from = Math.max(1, cursor - 1)
  editor.chain().focus().deleteRange({ from, to: cursor }).run()
}

function replaceSlashWith(editor: Editor, range: Range, content: Parameters<Editor["commands"]["insertContent"]>[0]) {
  const replaced = editor.chain().focus().insertContentAt(range, content).run()
  if (replaced) return
  clearSlashQuery(editor, range)
  editor.chain().focus().insertContent(content).run()
}

function runStudioAi(editor: Editor, prompt?: string) {
  // Liveblocks injects askAi command into the editor chain.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = (editor as any)?.chain?.().focus?.()
  if (!chain || typeof chain.askAi !== "function") return
  if (prompt) chain.askAi(prompt).run()
  else chain.askAi().run()
}

function canUseTiptapEditor(editor: Editor | null): editor is Editor {
  if (!editor) return false
  // Guard against stale editor refs after unmount/remount.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((editor as any).isDestroyed) return false
  return true
}

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain paragraph text",
    icon: <Type className="size-4" />,
    command: ({ editor, range }) => {
      replaceSlashWith(editor, range, {
        type: "paragraph",
      })
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="size-4" />,
    command: ({ editor, range }) => {
      replaceSlashWith(editor, range, {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Heading 1" }],
      })
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="size-4" />,
    command: ({ editor, range }) => {
      replaceSlashWith(editor, range, {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Heading 2" }],
      })
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="size-4" />,
    command: ({ editor, range }) => {
      replaceSlashWith(editor, range, {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "Heading 3" }],
      })
    },
  },
  {
    title: "Link",
    description: "Insert a hyperlink",
    icon: <Link className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      linkDialogListeners.forEach((cb) => cb({ editor }))
    },
  },
  {
    title: "Button",
    description: "Call-to-action button",
    icon: <Square className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      buttonDialogListeners.forEach((cb) => cb({ editor }))
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus className="size-4" />,
    command: ({ editor, range }) => {
      replaceSlashWith(editor, range, {
        type: "horizontalRule",
      })
    },
  },
  {
    title: "Code Block",
    description: "Multi-line code with formatting",
    icon: <Code className="size-4" />,
    command: ({ editor, range }) => {
      replaceSlashWith(editor, range, {
        type: "codeBlock",
        content: [{ type: "text", text: "" }],
      })
    },
  },
  {
    title: "Inline Code",
    description: "Inline code snippet",
    icon: <Code2 className="size-4" />,
    command: ({ editor, range }) => {
      replaceSlashWith(editor, range, "<code>code</code>")
    },
  },
  {
    title: "HTML",
    description: "Write or paste raw HTML",
    icon: <FileCode className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      htmlDialogListeners.forEach((cb) => cb({ editor }))
    },
  },
  {
    title: "Translate to",
    description: "AI translation prompt",
    icon: <Languages className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      runStudioAi(editor, "Translate this to")
    },
  },
  {
    title: "Continue writing",
    description: "AI continues the draft",
    icon: <PenLine className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      runStudioAi(editor, "Continue writing")
    },
  },
  {
    title: "Ask a question",
    description: "AI answers about selection",
    icon: <Search className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      runStudioAi(editor, "Ask a question about this selection")
    },
  },
  {
    title: "Ask about this page",
    description: "AI answers using full document",
    icon: <Search className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      runStudioAi(editor, "Ask about this page")
    },
  },
  {
    title: "Make shorter",
    description: "AI condenses selected text",
    icon: <Minimize2 className="size-4" />,
    command: ({ editor, range }) => {
      clearSlashQuery(editor, range)
      runStudioAi(editor, "Make this shorter")
    },
  },
]

// ─── Insert HTML Dialog ──────────────────────────────────────────────────────

export function InsertHtmlDialog() {
  const [open, setOpen] = useState(false)
  const [html, setHtml] = useState("")
  const editorRef = useRef<Editor | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return onHtmlDialogRequest(({ editor }) => {
      editorRef.current = editor
      setHtml("")
      setOpen(true)
      setTimeout(() => textareaRef.current?.focus(), 50)
    })
  }, [])

  const handleSave = useCallback(() => {
    const editor = editorRef.current
    if (!canUseTiptapEditor(editor) || !html.trim()) {
      setOpen(false)
      return
    }
    editor.commands.insertContent({ type: "rawHtmlBlock", attrs: { html: html.trim() } })
    setOpen(false)
    setHtml("")
  }, [html])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div
        className="relative mx-4 flex w-full max-w-2xl flex-col rounded-lg border border-border bg-popover shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-popover-foreground">Write or paste your raw HTML</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<div>Your HTML here...</div>"
            spellCheck={false}
            className="h-64 w-full resize-none rounded-md border border-border bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!html.trim()}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function InsertLinkDialog() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("Link text")
  const [url, setUrl] = useState("https://")
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    return onLinkDialogRequest(({ editor }) => {
      editorRef.current = editor
      setLabel("Link text")
      setUrl("https://")
      setOpen(true)
    })
  }, [])

  const handleSave = useCallback(() => {
    const editor = editorRef.current
    if (!canUseTiptapEditor(editor) || !url.trim()) {
      setOpen(false)
      return
    }
    editor.commands.insertContent({
      type: "text",
      text: label.trim() || "Link text",
      marks: [{ type: "link", attrs: { href: url.trim(), target: "_blank", rel: "noopener noreferrer" } }],
    })
    setOpen(false)
  }, [label, url])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="relative mx-4 flex w-full max-w-xl flex-col rounded-lg border border-border bg-popover shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-4 text-sm font-semibold text-popover-foreground">Insert Link</div>
        <div className="space-y-3 p-4">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-3 border-t border-border px-5 py-3">
          <button type="button" onClick={handleSave} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            Save
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function InsertButtonDialog() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("Button text")
  const [url, setUrl] = useState("https://")
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    return onButtonDialogRequest(({ editor }) => {
      editorRef.current = editor
      setLabel("Button text")
      setUrl("https://")
      setOpen(true)
    })
  }, [])

  const handleSave = useCallback(() => {
    const editor = editorRef.current
    if (!canUseTiptapEditor(editor) || !url.trim()) {
      setOpen(false)
      return
    }
    editor.commands.insertContent(
      `<p><a class="email-button" href="${url.trim()}">${label.trim() || "Button text"}</a></p>`
    )
    setOpen(false)
  }, [label, url])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="relative mx-4 flex w-full max-w-xl flex-col rounded-lg border border-border bg-popover shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-4 text-sm font-semibold text-popover-foreground">Insert Button</div>
        <div className="space-y-3 p-4">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Button label"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-3 border-t border-border px-5 py-3">
          <button type="button" onClick={handleSave} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            Save
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section labels ────────────────────────────────────────────────────────────

const SECTION_MAP: Record<string, string> = {
  Text: "TEXT",
  "Heading 1": "TEXT",
  "Heading 2": "TEXT",
  "Heading 3": "TEXT",
  Link: "MEDIA",
  Button: "MEDIA",
  Divider: "MEDIA",
  "Code Block": "CODE",
  "Inline Code": "CODE",
  HTML: "CODE",
  "Translate to": "AI",
  "Continue writing": "AI",
  "Ask a question": "AI",
  "Ask about this page": "AI",
  "Make shorter": "AI",
}

// ─── List component ────────────────────────────────────────────────────────────

export type SlashCommandListHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean
}

type SlashCommandListProps = {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export const SlashCommandList = forwardRef<SlashCommandListHandle, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown({ key }: KeyboardEvent) {
        if (key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
          return true
        }
        if (key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (key === "Enter") {
          if (items[selectedIndex]) command(items[selectedIndex])
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    let lastSection = ""
    return (
      // onMouseDown preventDefault keeps editor focus when clicking popup items
      <div
        className="z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto p-1">
          {items.map((item, index) => {
            const section = SECTION_MAP[item.title] ?? ""
            const showSection = section !== lastSection
            lastSection = section
            return (
              <div key={item.title}>
                {showSection && (
                  <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {section}
                  </div>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    command(item)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground hover:bg-accent/50"
                  )}
                >
                  <span className="flex size-7 flex-shrink-0 items-center justify-center rounded border border-border bg-background text-muted-foreground">
                    {item.icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{item.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

SlashCommandList.displayName = "SlashCommandList"
