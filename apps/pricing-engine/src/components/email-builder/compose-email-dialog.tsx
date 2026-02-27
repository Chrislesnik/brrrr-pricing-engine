"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems,
  insertOrUpdateBlock,
} from "@blocknote/core"
import { en } from "@blocknote/core/locales"
import {
  createReactBlockSpec,
  createReactInlineContentSpec,
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  type DefaultReactSuggestionItem,
} from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import { useTheme } from "next-themes"
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
  Paperclip,
  FileCode,
  Braces,
  ChevronDown,
  Pencil,
  Trash2,
  Search,
  Send,
  X,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import { cn } from "@repo/lib/cn"
import { MERGE_TAGS } from "./merge-tag-extension"
import { ButtonInsertDialog } from "./button-insert-dialog"
import { HTMLEmbedDialog } from "./html-embed-dialogue"
import { NotionFormattingToolbar } from "./notion-formatting-toolbar"

// ─── Schema: htmlEmbed block ────────────────────────────────────────────────

const ICON_BTN: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid hsl(var(--border) / 0.6)",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
  transition: "background 0.15s, border-color 0.15s",
}

function HtmlEmbedRender({ block, editor }: { block: any; editor: any }) {
  const html = block.props.html as string
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editValue, setEditValue] = useState(html)

  return (
    <div className="html-embed-block" contentEditable={false} style={{ userSelect: "none", width: "100%" }}>
      <div className="html-embed-container" style={{ position: "relative", width: "100%", maxWidth: "100%" }}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          sandbox="allow-same-origin"
          style={{
            width: "100%",
            minHeight: 120,
            border: "1px solid hsl(var(--border) / 0.5)",
            borderRadius: 8,
            background: "white",
            pointerEvents: "none",
            display: "block",
          }}
          onLoad={(ev) => {
            const iframe = ev.currentTarget
            const body = iframe.contentDocument?.body
            if (body) {
              iframe.style.height = `${body.scrollHeight + 16}px`
            }
          }}
        />
        <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
          <button
            type="button"
            title="Edit HTML"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => { setEditValue(html); setEditOpen(true) }}
            style={{ ...ICON_BTN, color: "hsl(var(--muted-foreground))" }}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            title="Remove embed"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => editor.removeBlocks([block])}
            style={{ ...ICON_BTN, color: "hsl(var(--destructive, red))" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
          onClick={() => setEditOpen(false)}
        >
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-0 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border px-5 py-3">
              <span className="text-sm font-semibold">Edit HTML</span>
            </div>
            <div className="p-4">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                spellCheck={false}
                className="h-72 w-full rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (editValue.trim()) editor.updateBlock(block, { props: { html: editValue.trim() } } as any)
                  setEditOpen(false)
                }}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const createHtmlEmbed = createReactBlockSpec(
  {
    type: "htmlEmbed" as const,
    propSchema: { html: { default: "" }, embedWidth: { default: "" }, embedHeight: { default: "" } },
    content: "none" as const,
  },
  {
    render: (props) => <HtmlEmbedRender block={props.block} editor={props.editor} />,
    toExternalHTML: ({ block }) => {
      const html = block.props.html as string
      return <div dangerouslySetInnerHTML={{ __html: html }} />
    },
  }
)

// ─── Schema: mergeTag inline content ────────────────────────────────────────

const mergeTagInlineContent = createReactInlineContentSpec(
  {
    type: "mergeTag" as const,
    propSchema: {
      name: { default: "" },
      label: { default: "" },
    },
    content: "none" as const,
  },
  {
    render: (props) => {
      const name = props.inlineContent.props.name
      return (
        <span
          className="bn-merge-tag-chip mx-0.5 inline-flex cursor-default select-none items-center whitespace-nowrap rounded border border-border bg-muted/50 px-1.5 py-0.5 align-baseline text-[10px] font-medium"
          data-merge-tag={name}
          contentEditable={false}
        >
          {`{{${name}}}`}
        </span>
      )
    },
  }
)

const composeSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    htmlEmbed: createHtmlEmbed(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mergeTag: mergeTagInlineContent,
  },
})

// ─── Slash menu items ───────────────────────────────────────────────────────

type EditorInstance = BlockNoteEditor<any, any, any>

function editorReplaceBlocks(
  editor: EditorInstance,
  blocks: { type: string; props?: Record<string, unknown>; content?: unknown }[]
) {
  const current = editor.getTextCursorPosition().block
  const currentContent = current.content
  const isSlashOrEmpty =
    Array.isArray(currentContent) &&
    (currentContent.length === 0 ||
      (currentContent.length === 1 &&
        currentContent[0].type === "text" &&
        "text" in currentContent[0] &&
        currentContent[0].text === "/"))

  if (isSlashOrEmpty) {
    const { insertedBlocks } = editor.replaceBlocks([current], blocks as never[])
    const last = insertedBlocks[insertedBlocks.length - 1]
    if (last) editor.setTextCursorPosition(last, "end")
    return
  }

  const insertedBlocks = editor.insertBlocks(blocks as never[], current, "after")
  const last = insertedBlocks[insertedBlocks.length - 1]
  if (last) editor.setTextCursorPosition(last, "end")
}

function getComposeSlashItems(
  editor: EditorInstance,
  options?: {
    onHtmlRequest?: () => void
    onButtonRequest?: () => void
    onMergeTagRequest?: () => void
  }
): DefaultReactSuggestionItem[] {
  const defaults = getDefaultReactSlashMenuItems(editor)
  const byTitle = new Map(defaults.map((item) => [item.title, item]))
  const getDefault = (title: string, group?: string) => {
    const item = byTitle.get(title)
    if (!item) return null
    return group ? { ...item, group } : item
  }

  const textItems: DefaultReactSuggestionItem[] = [
    {
      title: "Text",
      subtext: "Plain paragraph text",
      aliases: ["paragraph", "text", "plain"],
      group: "BASIC BLOCKS",
      icon: <Type size={18} />,
      onItemClick: () => insertOrUpdateBlock(editor, { type: "paragraph" }),
    },
    {
      title: "Heading 1",
      subtext: "Large section heading",
      aliases: ["h1", "heading", "title"],
      group: "BASIC BLOCKS",
      icon: <Heading1 size={18} />,
      onItemClick: () => insertOrUpdateBlock(editor, { type: "heading", props: { level: 1 } }),
    },
    {
      title: "Heading 2",
      subtext: "Medium section heading",
      aliases: ["h2", "heading"],
      group: "BASIC BLOCKS",
      icon: <Heading2 size={18} />,
      onItemClick: () => insertOrUpdateBlock(editor, { type: "heading", props: { level: 2 } }),
    },
    {
      title: "Heading 3",
      subtext: "Small section heading",
      aliases: ["h3", "heading"],
      group: "BASIC BLOCKS",
      icon: <Heading3 size={18} />,
      onItemClick: () => insertOrUpdateBlock(editor, { type: "heading", props: { level: 3 } }),
    },
  ]

  const basicDefaults = [
    getDefault("Quote", "BASIC BLOCKS"),
    getDefault("Bullet List", "BASIC BLOCKS"),
    getDefault("Numbered List", "BASIC BLOCKS"),
    getDefault("Emoji", "BASIC BLOCKS"),
  ].filter((item): item is DefaultReactSuggestionItem => Boolean(item))

  const contentItems: DefaultReactSuggestionItem[] = [
    {
      title: "Link",
      subtext: "Insert a hyperlink",
      aliases: ["url", "href", "anchor"],
      group: "MEDIA",
      icon: <Link size={18} />,
      onItemClick: () => {
        const href = window.prompt("Link URL", "https://")
        if (!href) return
        const text = window.prompt("Link text", "Link text") ?? "Link text"
        editor.createLink(href.trim(), text.trim() || "Link text")
      },
    },
    {
      title: "Button",
      subtext: "Call-to-action button",
      aliases: ["cta", "call to action"],
      group: "MEDIA",
      icon: <Square size={18} />,
      onItemClick: () => {
        if (options?.onButtonRequest) {
          try { editor.updateBlock(editor.getTextCursorPosition().block, { content: [] } as any) } catch {}
          options.onButtonRequest()
          return
        }
        insertOrUpdateBlock(editor, {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: "https://",
              content: [{ type: "text", text: "Button text", styles: {} }],
            },
          ],
        } as any)
      },
    },
    {
      title: "File",
      subtext: "Embed a file from URL",
      aliases: ["attachment", "pdf", "doc", "upload", "embed"],
      group: "MEDIA",
      icon: <Paperclip size={18} />,
      onItemClick: () => {
        const url = window.prompt("File URL", "https://")
        if (!url?.trim()) return
        const normalized = url.trim()
        const lower = normalized.toLowerCase()
        const filename = normalized.split("?")[0]?.split("/").pop() || "Attached file"

        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(lower)) {
          editorReplaceBlocks(editor, [{ type: "image", props: { url: normalized, name: filename } }])
          return
        }
        editorReplaceBlocks(editor, [{ type: "file", props: { url: normalized, name: filename } }])
      },
    },
  ]

  const layoutItems: DefaultReactSuggestionItem[] = [
    getDefault("Table", "LAYOUT"),
    {
      title: "Divider",
      subtext: "Horizontal divider",
      aliases: ["horizontal rule", "hr", "separator"],
      group: "LAYOUT",
      icon: <Minus size={18} />,
      onItemClick: () =>
        editorReplaceBlocks(editor, [
          { type: "paragraph", content: "────────────────────────────────" },
        ]),
    },
  ].filter((item): item is DefaultReactSuggestionItem => Boolean(item))

  const mediaDefaults = [
    getDefault("Image", "MEDIA"),
  ].filter((item): item is DefaultReactSuggestionItem => Boolean(item))

  const codeItems: DefaultReactSuggestionItem[] = [
    {
      title: "Code Block",
      subtext: "Multi-line code with formatting",
      aliases: ["codeblock", "pre", "snippet"],
      group: "CODE",
      icon: <Code size={18} />,
      onItemClick: () => insertOrUpdateBlock(editor, { type: "codeBlock" }),
    },
    {
      title: "Inline Code",
      subtext: "Inline code snippet",
      aliases: ["code", "inline"],
      group: "CODE",
      icon: <Code2 size={18} />,
      onItemClick: () => {
        if (editor.getSelectedText().trim()) {
          editor.toggleStyles({ code: true })
          return
        }
        editor.insertInlineContent([{ type: "text", text: "code", styles: { code: true } }])
      },
    },
    {
      title: "HTML",
      subtext: "Write or paste raw HTML",
      aliases: ["markup", "paste html", "embed"],
      group: "CODE",
      icon: <FileCode size={18} />,
      onItemClick: () => {
        if (options?.onHtmlRequest) {
          try { editor.updateBlock(editor.getTextCursorPosition().block, { content: [] } as any) } catch {}
          options.onHtmlRequest()
          return
        }
        const html = window.prompt("Paste raw HTML")
        if (!html?.trim()) return
        editorReplaceBlocks(editor, [
          { type: "htmlEmbed" as any, props: { html: html.trim() } },
        ])
      },
    },
  ]

  const mergeTagGateway: DefaultReactSuggestionItem = {
    title: "Merge Tag",
    subtext: "Insert a dynamic variable",
    aliases: ["merge", "tag", "variable", "field", "dynamic", "template"],
    group: "CONTENT",
    icon: <Braces size={18} className="text-sky-700 dark:text-sky-300" />,
    onItemClick: () => {
      try { editor.updateBlock(editor.getTextCursorPosition().block, { content: [] } as any) } catch {}
      options?.onMergeTagRequest?.()
    },
  }

  return [
    ...textItems,
    ...basicDefaults,
    ...layoutItems,
    ...contentItems,
    ...mediaDefaults,
    ...codeItems,
    mergeTagGateway,
  ]
}

// ─── Merge Tag Helpers ──────────────────────────────────────────────────────

const MERGE_TAG_CATEGORIES = Array.from(new Set(MERGE_TAGS.map((t) => t.category)))
const MERGE_TAG_RE = /(\{\{[^}]+\}\})/

// ─── Types ──────────────────────────────────────────────────────────────────

export type ComposeEmailData = {
  to: string
  from: string
  cc: string
  bcc: string
  subject: string
  bodyHtml: string
  bodyDocument: unknown[]
}

type ComposeEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend?: (data: ComposeEmailData) => Promise<void>
  defaultTo?: string
  defaultFrom?: string
  defaultSubject?: string
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ComposeEmailDialog(props: ComposeEmailDialogProps) {
  if (!props.open) return null
  return <ComposeEmailDialogInner {...props} />
}

function ComposeEmailDialogInner({
  open,
  onOpenChange,
  onSend,
  defaultTo = "",
  defaultFrom = "",
  defaultSubject = "",
}: ComposeEmailDialogProps) {
  const [to, setTo] = useState(defaultTo)
  const [from, setFrom] = useState(defaultFrom)
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState(defaultSubject)
  const [ccBccOpen, setCcBccOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeField, setActiveField] = useState<"to" | "from" | "cc" | "bcc" | "subject" | null>(null)
  const [isButtonDialogOpen, setIsButtonDialogOpen] = useState(false)
  const [isHtmlDialogOpen, setIsHtmlDialogOpen] = useState(false)
  const [isMergeTagPickerOpen, setIsMergeTagPickerOpen] = useState(false)
  const [mergeTagQuery, setMergeTagQuery] = useState("")

  const toRef = useRef<HTMLInputElement>(null)
  const fromRef = useRef<HTMLInputElement>(null)
  const ccRef = useRef<HTMLInputElement>(null)
  const bccRef = useRef<HTMLInputElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const buttonInsertBlockRef = useRef<any>(null)

  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (open) {
      setTo(defaultTo)
      setFrom(defaultFrom)
      setSubject(defaultSubject)
      setCc("")
      setBcc("")
      setCcBccOpen(false)
      setSending(false)
      setActiveField(null)
    }
  }, [open, defaultTo, defaultFrom, defaultSubject])

  const blockNoteDictionary = useMemo(
    () => ({
      ...en,
      file_panel: {
        ...en.file_panel,
        embed: {
          ...en.file_panel.embed,
          title: "Link",
          url_placeholder: "Paste file URL",
        },
        upload: {
          ...en.file_panel.upload,
          title: "Upload",
          file_placeholder: {
            ...en.file_panel.upload.file_placeholder,
            file: "Choose a file",
          },
        },
      },
    }),
    []
  )

  const editor = useCreateBlockNote({
    schema: composeSchema as any,
    dictionary: blockNoteDictionary as any,
  })

  const openHtmlDialog = useCallback(() => {
    setIsHtmlDialogOpen(true)
  }, [])

  const insertHtmlIntoEditor = useCallback(
    (html: string) => {
      if (!editor || !html.trim()) return
      const embedBlock = { type: "htmlEmbed" as const, props: { html: html.trim() } }
      try {
        const cursor = editor.getTextCursorPosition()
        const current = cursor.block
        const content = current.content
        const isEmpty =
          Array.isArray(content) &&
          (content.length === 0 ||
            (content.length === 1 &&
              content[0].type === "text" &&
              "text" in content[0] &&
              (content[0].text === "" || content[0].text === "/")))
        if (isEmpty) {
          editor.replaceBlocks([current], [embedBlock] as any)
        } else {
          editor.insertBlocks([embedBlock] as any, current, "after")
        }
      } catch {
        const topLevelBlocks = editor.document
        const lastBlock = topLevelBlocks[topLevelBlocks.length - 1]
        if (!lastBlock) return
        editor.insertBlocks([embedBlock] as any, lastBlock, "after")
      }
    },
    [editor]
  )

  const openButtonDialog = useCallback(() => {
    try {
      buttonInsertBlockRef.current = editor.getTextCursorPosition().block
    } catch {
      buttonInsertBlockRef.current = null
    }
    setIsButtonDialogOpen(true)
  }, [editor])

  const openMergeTagPicker = useCallback(() => {
    setIsMergeTagPickerOpen(true)
  }, [])

  const insertMergeTag = useCallback(
    (name: string) => {
      const tagNode = { type: "mergeTag" as const, props: { name } }

      if (activeField) {
        const token = `{{${name}}}`
        const insertIntoInput = (
          input: HTMLInputElement | null,
          value: string,
          setValue: (v: string) => void
        ) => {
          const start = input?.selectionStart ?? value.length
          const end = input?.selectionEnd ?? value.length
          const next = `${value.slice(0, start)}${token}${value.slice(end)}`
          setValue(next)
          requestAnimationFrame(() => {
            if (!input) return
            const cursor = start + token.length
            input.focus()
            input.setSelectionRange(cursor, cursor)
          })
        }

        if (activeField === "to") insertIntoInput(toRef.current, to, setTo)
        else if (activeField === "from") insertIntoInput(fromRef.current, from, setFrom)
        else if (activeField === "cc") insertIntoInput(ccRef.current, cc, setCc)
        else if (activeField === "bcc") insertIntoInput(bccRef.current, bcc, setBcc)
        else if (activeField === "subject") insertIntoInput(subjectRef.current, subject, setSubject)
        setIsMergeTagPickerOpen(false)
        setMergeTagQuery("")
        return
      }

      try {
        const cursor = editor.getTextCursorPosition()
        const current = cursor.block
        const content = current.content
        const isSlash =
          Array.isArray(content) &&
          content.length === 1 &&
          content[0].type === "text" &&
          "text" in content[0] &&
          content[0].text === "/"
        if (isSlash) {
          editor.updateBlock(current, { content: [tagNode] } as any)
        } else {
          editor.insertInlineContent([tagNode as any])
        }
      } catch {
        editor.insertInlineContent([tagNode as any])
      }
      setIsMergeTagPickerOpen(false)
      setMergeTagQuery("")
    },
    [editor, activeField, to, from, cc, bcc, subject]
  )

  const handleButtonInsert = useCallback(
    (label: string, href: string) => {
      if (!editor) return
      const buttonBlock = {
        type: "paragraph" as const,
        content: [
          {
            type: "link" as const,
            href,
            content: [{ type: "text" as const, text: label, styles: {} }],
          },
        ],
      }

      const refBlock = buttonInsertBlockRef.current
      buttonInsertBlockRef.current = null

      if (refBlock) {
        try {
          const content = refBlock.content
          const isEmpty =
            Array.isArray(content) &&
            (content.length === 0 ||
              (content.length === 1 &&
                content[0].type === "text" &&
                "text" in content[0] &&
                (content[0].text === "" || content[0].text === "/")))
          if (isEmpty) {
            editor.replaceBlocks([refBlock], [buttonBlock] as any)
          } else {
            editor.insertBlocks([buttonBlock] as any, refBlock, "after")
          }
          return
        } catch {
          /* fall through */
        }
      }

      try {
        const cursor = editor.getTextCursorPosition()
        editor.insertBlocks([buttonBlock] as any, cursor.block, "after")
      } catch {
        const blocks = editor.document
        const last = blocks[blocks.length - 1]
        if (!last) return
        editor.insertBlocks([buttonBlock] as any, last, "after")
      }
    },
    [editor]
  )

  const handleSend = useCallback(async () => {
    if (!onSend || !to.trim()) return
    setSending(true)
    try {
      const bodyHtml = await editor.blocksToHTMLLossy(editor.document)
      const bodyDocument = JSON.parse(JSON.stringify(editor.document))
      await onSend({ to, from, cc, bcc, subject, bodyHtml, bodyDocument })
      onOpenChange(false)
    } catch (err) {
      console.error("[ComposeEmail] send failed:", err)
    } finally {
      setSending(false)
    }
  }, [editor, onSend, onOpenChange, to, from, cc, bcc, subject])

  const editorClassName = useMemo(
    () =>
      "compose-email-blocknote prose prose-sm max-w-none rounded-sm bg-transparent text-card-foreground [&_.bn-container]:border-0 [&_.bn-editor]:min-h-[320px]",
    []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-xl border border-border/60 p-0 shadow-2xl"
      >
        <DialogTitle className="sr-only">Compose Email</DialogTitle>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-2.5">
          <span className="text-[13px] font-semibold text-foreground">New Message</span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body (header fields + editor) ─────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ── Header fields ──────────────────────────────────────────── */}
          <div className="flex-shrink-0">
            {/* To */}
            <div className="flex items-center border-b border-border/40 px-5 py-1.5">
              <span className="w-16 flex-shrink-0 text-[13px] text-muted-foreground/60">To</span>
              <HeaderFieldInput
                inputRef={toRef}
                value={to}
                onChange={setTo}
                onFocus={() => setActiveField("to")}
                placeholder="recipient@example.com"
                ariaLabel="To"
              />
              <button
                type="button"
                onClick={() => setCcBccOpen((v) => !v)}
                className="ml-2 flex-shrink-0 text-[12px] text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                Cc/Bcc
              </button>
            </div>

            {/* CC / BCC */}
            {ccBccOpen && (
              <>
                <div className="flex items-center border-b border-border/40 px-5 py-1.5">
                  <span className="w-16 flex-shrink-0 text-[13px] text-muted-foreground/60">Cc</span>
                  <HeaderFieldInput
                    inputRef={ccRef}
                    value={cc}
                    onChange={setCc}
                    onFocus={() => setActiveField("cc")}
                    placeholder="cc@example.com"
                    ariaLabel="CC"
                  />
                </div>
                <div className="flex items-center border-b border-border/40 px-5 py-1.5">
                  <span className="w-16 flex-shrink-0 text-[13px] text-muted-foreground/60">Bcc</span>
                  <HeaderFieldInput
                    inputRef={bccRef}
                    value={bcc}
                    onChange={setBcc}
                    onFocus={() => setActiveField("bcc")}
                    placeholder="bcc@example.com"
                    ariaLabel="BCC"
                  />
                </div>
              </>
            )}

            {/* From */}
            <div className="flex items-center border-b border-border/40 px-5 py-1.5">
              <span className="w-16 flex-shrink-0 text-[13px] text-muted-foreground/60">From</span>
              <HeaderFieldInput
                inputRef={fromRef}
                value={from}
                onChange={setFrom}
                onFocus={() => setActiveField("from")}
                placeholder="Sender Name <sender@example.com>"
                ariaLabel="From"
              />
            </div>

            {/* Subject */}
            <div className="flex items-center border-b border-border/40 px-5 py-1.5">
              <span className="w-16 flex-shrink-0 text-[13px] text-muted-foreground/60">Subject</span>
              <HeaderFieldInput
                inputRef={subjectRef}
                value={subject}
                onChange={setSubject}
                onFocus={() => setActiveField("subject")}
                placeholder="Subject"
                ariaLabel="Subject"
              />
            </div>
          </div>

          {/* ── Editor body ────────────────────────────────────────────── */}
          <div
            className="min-h-[200px] px-1"
            onFocusCapture={() => setActiveField(null)}
            onClick={() => {
              setActiveField(null)
              editor.focus("end")
            }}
          >
          <BlockNoteView
            editor={editor}
            className={editorClassName}
            slashMenu={false}
            sideMenu={false}
            formattingToolbar={false}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            onClick={(e) => {
              e.stopPropagation()
              setActiveField(null)
            }}
          >
            <NotionFormattingToolbar />
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={async (query) =>
                filterSuggestionItems(
                  getComposeSlashItems(editor, {
                    onHtmlRequest: openHtmlDialog,
                    onButtonRequest: openButtonDialog,
                    onMergeTagRequest: openMergeTagPicker,
                  }),
                  query
                )
              }
            />
          </BlockNoteView>
          </div>
        </div>

        {/* ── Footer toolbar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
          <div className="flex items-center gap-1">
            <ComposeMergeTagsButton onInsert={(name) => insertMergeTag(name)} />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!to.trim() || sending}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-all",
              "bg-foreground text-background hover:bg-foreground/90",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {sending ? "Sending…" : "Send"}
          </button>
        </div>

        {/* ── Sub-dialogs ────────────────────────────────────────────── */}
        <HTMLEmbedDialog
          open={isHtmlDialogOpen}
          onClose={() => setIsHtmlDialogOpen(false)}
          onSave={insertHtmlIntoEditor}
        />
        <ButtonInsertDialog
          open={isButtonDialogOpen}
          onClose={() => setIsButtonDialogOpen(false)}
          onSave={handleButtonInsert}
        />
        <ComposeMergeTagPickerDialog
          open={isMergeTagPickerOpen}
          onOpenChange={(v) => {
            setIsMergeTagPickerOpen(v)
            if (!v) setMergeTagQuery("")
          }}
          query={mergeTagQuery}
          onQueryChange={setMergeTagQuery}
          onInsert={(name) => {
            insertMergeTag(name)
          }}
        />

        <style>{`
          .compose-email-blocknote .bn-editor {
            padding: 0.75rem 1.25rem;
            font-size: 14px;
            line-height: 1.6;
          }
          .compose-email-blocknote .bn-editor a {
            color: #0670DB;
            text-decoration: underline;
          }
          .compose-email-blocknote .bn-editor .bn-inline-content > a:only-child,
          .compose-email-blocknote .bn-editor .bn-inline-content > a:first-child:last-child {
            display: inline-block;
            background: #000;
            color: #fff !important;
            border-radius: 4px;
            padding: 7px 12px;
            text-decoration: none !important;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}

// ─── Header Field Input ─────────────────────────────────────────────────────

function HeaderFieldInput({
  value,
  onChange,
  onFocus,
  placeholder,
  ariaLabel,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onFocus?: () => void
  placeholder?: string
  ariaLabel?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
}) {
  const [focused, setFocused] = useState(false)
  const hasTags = MERGE_TAG_RE.test(value)

  const segments = useMemo(() => {
    if (!value || !hasTags) return null
    return value.split(MERGE_TAG_RE)
  }, [value, hasTags])

  return (
    <div className="relative min-w-0 flex-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true)
          onFocus?.()
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none",
          !focused && hasTags && "text-transparent caret-transparent selection:bg-transparent"
        )}
        aria-label={ariaLabel}
      />
      {!focused && segments && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center gap-0.5 overflow-hidden text-[13px] text-foreground"
          aria-hidden
        >
          {segments.map((seg, i) =>
            MERGE_TAG_RE.test(seg) ? (
              <span
                key={i}
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none"
              >
                {seg}
              </span>
            ) : seg ? (
              <span key={i} className="truncate">{seg}</span>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}

// ─── Merge Tags Button (footer) ─────────────────────────────────────────────

function ComposeMergeTagsButton({
  onInsert,
}: {
  onInsert: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const lowerQ = query.toLowerCase()
  const filtered = lowerQ
    ? MERGE_TAGS.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQ) ||
          t.label.toLowerCase().includes(lowerQ) ||
          t.category.toLowerCase().includes(lowerQ)
      )
    : MERGE_TAGS

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        >
          <Braces size={13} />
          <span className="font-medium">Merge Tags</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="z-[200] w-72 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields…"
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        <div
          className="max-h-72 overflow-y-auto py-1"
          style={{ overscrollBehavior: "contain" }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {MERGE_TAG_CATEGORIES.map((category) => {
            const tags = filtered
              .filter((t) => t.category === category)
              .sort((a, b) => a.label.localeCompare(b.label))
            if (tags.length === 0) return null
            return (
              <Collapsible key={category} defaultOpen>
                <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground/80">
                  <span>{category}</span>
                  <ChevronDown className="size-3 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-0.5 px-3 pb-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => {
                          onInsert(tag.name)
                          setOpen(false)
                          setQuery("")
                        }}
                        title={tag.label}
                        className="inline-flex w-fit items-center gap-1 rounded-md border border-sky-200/80 bg-sky-50 px-2 py-1 font-mono text-[11px] leading-none text-sky-700 transition-colors hover:border-sky-400 hover:bg-sky-100 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-600 dark:hover:bg-sky-900/50"
                      >
                        {`{{${tag.name}}}`}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}

          {filtered.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground/60">
              No fields match &quot;{query}&quot;
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Merge Tag Picker Dialog (from slash menu) ──────────────────────────────

function ComposeMergeTagPickerDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onInsert,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  query: string
  onQueryChange: (v: string) => void
  onInsert: (name: string) => void
}) {
  const lowerQ = query.toLowerCase()
  const filtered = lowerQ
    ? MERGE_TAGS.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQ) ||
          t.label.toLowerCase().includes(lowerQ) ||
          t.category.toLowerCase().includes(lowerQ)
      )
    : MERGE_TAGS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs gap-0 p-0">
        <DialogTitle className="px-4 pt-4 pb-0 text-sm">Insert Merge Tag</DialogTitle>
        <div className="mt-2">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground/50" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search fields…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {MERGE_TAG_CATEGORIES.map((category) => {
              const tags = filtered
                .filter((t) => t.category === category)
                .sort((a, b) => a.label.localeCompare(b.label))
              if (tags.length === 0) return null
              return (
                <Collapsible key={category} defaultOpen>
                  <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground/80">
                    <span>{category}</span>
                    <ChevronDown className="size-3 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-0.5 px-3 pb-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.name}
                          type="button"
                          onClick={() => onInsert(tag.name)}
                          title={tag.label}
                          className="inline-flex w-fit items-center gap-1 rounded-md border border-sky-200/80 bg-sky-50 px-2 py-1 font-mono text-[11px] leading-none text-sky-700 transition-colors hover:border-sky-400 hover:bg-sky-100 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-600 dark:hover:bg-sky-900/50"
                        >
                          {`{{${tag.name}}}`}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground/60">
                No fields match &quot;{query}&quot;
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
