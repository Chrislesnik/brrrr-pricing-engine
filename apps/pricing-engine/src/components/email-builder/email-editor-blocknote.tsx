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
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  type DefaultReactSuggestionItem,
} from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import { useThreads } from "@liveblocks/react/suspense"
import { useTheme } from "next-themes"
import {
  useCreateBlockNoteWithLiveblocks,
  useIsEditorReady,
  FloatingComposer,
  FloatingThreads,
  AnchoredThreads,
} from "@liveblocks/react-blocknote"
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
  Paperclip,
  Languages,
  PenLine,
  Braces,
  ChevronDown,
  Pencil,
  Search,
  Minimize2,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible"
import type { EmailTemplateStyles } from "./types"
import { HTMLEmbedDialog } from "./html-embed-dialogue"
import { ButtonInsertDialog } from "./button-insert-dialog"
import { MERGE_TAGS } from "./merge-tag-extension"
import { NotionFormattingToolbar } from "./notion-formatting-toolbar"

const MERGE_TAG_CATEGORIES = Array.from(new Set(MERGE_TAGS.map((t) => t.category)))

// ─── Custom HTML Embed Block ──────────────────────────────────────────────────

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

const DIM_INPUT: React.CSSProperties = {
  width: 48,
  height: 24,
  borderRadius: 4,
  border: "1px solid hsl(var(--border) / 0.5)",
  background: "hsl(var(--muted) / 0.5)",
  color: "hsl(var(--foreground))",
  fontSize: 11,
  fontWeight: 500,
  textAlign: "center",
  padding: "0 4px",
  outline: "none",
  fontVariantNumeric: "tabular-nums",
  transition: "border-color 0.15s, background 0.15s",
}

function HtmlEmbedRender({
  block,
  editor,
}: {
  block: any
  editor: any
}) {
  const html = block.props.html as string
  const embedWidth = (block.props.embedWidth as string) || ""
  const embedHeight = (block.props.embedHeight as string) || ""

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [localW, setLocalW] = useState(embedWidth)
  const [localH, setLocalH] = useState(embedHeight)
  const [editOpen, setEditOpen] = useState(false)
  const [editValue, setEditValue] = useState(html)

  useEffect(() => { setLocalW(embedWidth) }, [embedWidth])
  useEffect(() => { setLocalH(embedHeight) }, [embedHeight])

  const commitDimensions = useCallback(
    (w: string, h: string) => {
      let clamped = w
      if (w && containerRef.current) {
        const parent = containerRef.current.closest(".bn-block-content")
        if (parent) {
          const max = parent.clientWidth
          const num = parseInt(w, 10)
          if (!isNaN(num) && num > max) clamped = String(max)
        }
      }
      if (clamped !== w) setLocalW(clamped)
      editor.updateBlock(block, { props: { embedWidth: clamped, embedHeight: h } } as any)
    },
    [editor, block]
  )

  const getMaxWidth = useCallback(() => {
    const block = containerRef.current?.closest(".bn-block-content")
    return block ? block.clientWidth : Infinity
  }, [])

  const handleResize = useCallback(
    (e: React.PointerEvent, corner: string) => {
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current
      if (!container) return

      const startX = e.clientX
      const startY = e.clientY
      const startW = container.offsetWidth
      const startH = container.offsetHeight
      const maxW = getMaxWidth()

      const onMove = (ev: PointerEvent) => {
        const dx = corner.includes("right") ? ev.clientX - startX : startX - ev.clientX
        const dy = corner.includes("bottom") ? ev.clientY - startY : startY - ev.clientY
        const nextW = Math.min(maxW, Math.max(200, startW + dx))
        const nextH = Math.max(80, startH + dy)
        container.style.width = `${nextW}px`
        container.style.height = `${nextH}px`
        if (iframeRef.current) {
          iframeRef.current.style.height = `${nextH}px`
        }
        setLocalW(String(nextW))
        setLocalH(String(nextH))
      }

      const onUp = () => {
        document.removeEventListener("pointermove", onMove)
        document.removeEventListener("pointerup", onUp)
        const w = String(container.offsetWidth)
        const h = String(container.offsetHeight)
        setLocalW(w)
        setLocalH(h)
        commitDimensions(w, h)
      }

      document.addEventListener("pointermove", onMove)
      document.addEventListener("pointerup", onUp)
    },
    [commitDimensions, getMaxWidth]
  )

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: embedWidth ? `${embedWidth}px` : "100%",
    maxWidth: "100%",
    height: embedHeight ? `${embedHeight}px` : undefined,
  }

  const handleCorner: React.CSSProperties = {
    position: "absolute",
    width: 8,
    height: 8,
    background: "hsl(var(--primary))",
    borderRadius: "50%",
    zIndex: 2,
    boxShadow: "0 0 0 2px hsl(var(--card))",
  }

  return (
    <div className="html-embed-block" contentEditable={false} style={{ userSelect: "none", width: "100%" }}>
      <div ref={containerRef} className="html-embed-container" style={containerStyle}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          sandbox="allow-same-origin"
          style={{
            width: "100%",
            height: embedHeight ? `${embedHeight}px` : undefined,
            minHeight: 120,
            border: "1px solid hsl(var(--border) / 0.5)",
            borderRadius: 8,
            background: "white",
            pointerEvents: "none",
            display: "block",
          }}
          onLoad={(ev) => {
            if (embedHeight) return
            const iframe = ev.currentTarget
            const body = iframe.contentDocument?.body
            if (body) {
              const h = body.scrollHeight + 16
              iframe.style.height = `${h}px`
              if (containerRef.current) containerRef.current.style.height = `${h}px`
              setLocalH(String(h))
            }
          }}
        />

        {/* Resize handles */}
        <div
          style={{ ...handleCorner, bottom: -4, right: -4, cursor: "nwse-resize" }}
          onPointerDown={(e) => handleResize(e, "bottom-right")}
        />
        <div
          style={{ ...handleCorner, bottom: -4, left: -4, cursor: "nesw-resize" }}
          onPointerDown={(e) => handleResize(e, "bottom-left")}
        />
        <div
          style={{ ...handleCorner, top: -4, right: -4, cursor: "nesw-resize" }}
          onPointerDown={(e) => handleResize(e, "top-right")}
        />

        {/* Toolbar */}
        <div className="html-embed-toolbar">
          <input
            type="text"
            inputMode="numeric"
            value={localW}
            placeholder="W"
            onChange={(ev) => setLocalW(ev.target.value.replace(/\D/g, ""))}
            onBlur={() => commitDimensions(localW, localH)}
            onKeyDown={(ev) => { if (ev.key === "Enter") commitDimensions(localW, localH) }}
            className="html-embed-dim-input"
            style={DIM_INPUT}
            title="Width (px)"
          />
          <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground) / 0.6)", fontWeight: 600, lineHeight: 1 }}>×</span>
          <input
            type="text"
            inputMode="numeric"
            value={localH}
            placeholder="H"
            onChange={(ev) => setLocalH(ev.target.value.replace(/\D/g, ""))}
            onBlur={() => commitDimensions(localW, localH)}
            onKeyDown={(ev) => { if (ev.key === "Enter") commitDimensions(localW, localH) }}
            className="html-embed-dim-input"
            style={DIM_INPUT}
            title="Height (px)"
          />

          <div style={{ width: 1, alignSelf: "stretch", background: "hsl(var(--border) / 0.4)", margin: "0 2px", flexShrink: 0 }} />

          <button
            type="button"
            title="Edit HTML"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              setEditValue(html)
              setEditOpen(true)
            }}
            className="html-embed-icon-btn"
            style={{ ...ICON_BTN, color: "hsl(var(--muted-foreground))" }}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            title="Remove embed"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => editor.removeBlocks([block])}
            className="html-embed-icon-btn html-embed-icon-btn--destructive"
            style={{ ...ICON_BTN, color: "hsl(var(--destructive, red))" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl gap-0 p-0">
          <DialogHeader className="border-b border-border px-5 py-3">
            <DialogTitle className="text-sm font-semibold">Edit HTML</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              spellCheck={false}
              className="h-72 w-full rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (editValue.trim()) {
                  editor.updateBlock(block, { props: { html: editValue.trim() } } as any)
                }
                setEditOpen(false)
              }}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const createHtmlEmbed = createReactBlockSpec(
  {
    type: "htmlEmbed" as const,
    propSchema: {
      html: { default: "" },
      embedWidth: { default: "" },
      embedHeight: { default: "" },
    },
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

const editorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    htmlEmbed: createHtmlEmbed(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mergeTag: mergeTagInlineContent,
  },
})

// ─── Types ───────────────────────────────────────────────────────────────────

type BlockNoteEditorWithAi = {
  _tiptapEditor?: {
    chain?: () => {
      focus?: () => {
        askAi?: (prompt?: string) => { run: () => boolean }
        run?: () => boolean
      }
    }
  }
}

type EditorInstance = BlockNoteEditor<any, any, any>

function replaceSlashBlockWith(editor: EditorInstance, blocks: Parameters<typeof editorReplaceBlocks>[1]) {
  editorReplaceBlocks(editor, blocks)
}

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

function runAi(editor: EditorInstance, prompt?: string) {
  const tiptapEditor = (editor as unknown as BlockNoteEditorWithAi)?._tiptapEditor
  const chain = tiptapEditor?.chain?.()?.focus?.()
  if (!chain || typeof chain.askAi !== "function") return
  if (prompt) chain.askAi(prompt).run()
  else chain.askAi().run()
}

function getBlockNoteSlashItems(
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
          replaceSlashBlockWith(editor, [{ type: "image", props: { url: normalized, name: filename } }])
          return
        }
        if (/\.(mp4|webm|mov|m4v|avi)$/i.test(lower)) {
          replaceSlashBlockWith(editor, [{ type: "video", props: { url: normalized, name: filename } }])
          return
        }
        if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(lower)) {
          replaceSlashBlockWith(editor, [{ type: "audio", props: { url: normalized, name: filename } }])
          return
        }

        replaceSlashBlockWith(editor, [{ type: "file", props: { url: normalized, name: filename } }])
      },
    },
  ]

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
      aliases: ["markup", "paste html"],
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
        replaceSlashBlockWith(editor, [
          { type: "htmlEmbed" as any, props: { html: html.trim() } },
        ])
      },
    },
  ]

  const aiItems: DefaultReactSuggestionItem[] = [
    {
      title: "Translate to",
      subtext: "AI translation prompt",
      aliases: ["translate", "localize"],
      group: "AI",
      icon: <Languages size={18} />,
      onItemClick: () => runAi(editor, "Translate this to"),
    },
    {
      title: "Continue writing",
      subtext: "AI continues the draft",
      aliases: ["continue", "expand"],
      group: "AI",
      icon: <PenLine size={18} />,
      onItemClick: () => runAi(editor, "Continue writing"),
    },
    {
      title: "Ask a question",
      subtext: "AI answers about selection",
      aliases: ["question", "ask"],
      group: "AI",
      icon: <Search size={18} />,
      onItemClick: () => runAi(editor, "Ask a question about this selection"),
    },
    {
      title: "Ask about this page",
      subtext: "AI answers using full document",
      aliases: ["page", "document"],
      group: "AI",
      icon: <Search size={18} />,
      onItemClick: () => runAi(editor, "Ask about this page"),
    },
    {
      title: "Make shorter",
      subtext: "AI condenses selected text",
      aliases: ["shorten", "summarize"],
      group: "AI",
      icon: <Minimize2 size={18} />,
      onItemClick: () => runAi(editor, "Make this shorter"),
    },
  ]

  const basicDefaults = [
    getDefault("Quote", "BASIC BLOCKS"),
    getDefault("Bullet List", "BASIC BLOCKS"),
    getDefault("Numbered List", "BASIC BLOCKS"),
    getDefault("Checklist", "BASIC BLOCKS"),
    getDefault("Emoji", "BASIC BLOCKS"),
  ].filter((item): item is DefaultReactSuggestionItem => Boolean(item))

  const layoutItems: DefaultReactSuggestionItem[] = [
    getDefault("Table", "LAYOUT"),
    {
      title: "Divider",
      subtext: "Horizontal divider",
      aliases: ["horizontal rule", "hr", "separator"],
      group: "LAYOUT",
      icon: <Minus size={18} />,
      onItemClick: () =>
        replaceSlashBlockWith(editor, [
          {
            type: "paragraph",
            content: "────────────────────────────────",
          },
        ]),
    },
  ].filter(
    (item): item is DefaultReactSuggestionItem => Boolean(item)
  )

  const mediaDefaults = [
    getDefault("Image", "MEDIA"),
    getDefault("Video", "MEDIA"),
    getDefault("Audio", "MEDIA"),
  ].filter((item): item is DefaultReactSuggestionItem => Boolean(item))

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
    ...aiItems,
    mergeTagGateway,
  ]
}

type Props = {
  styles: EmailTemplateStyles
  onEditorReady?: (editor: any) => void
  initialContent?: unknown[] | null
}

export function EmailEditorBlockNote({ styles, onEditorReady, initialContent: initialContentProp }: Props) {
  const objectUrlsRef = useRef<string[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const pendingHtmlQueueRef = useRef<string[]>([])
  const [isHtmlDialogOpen, setIsHtmlDialogOpen] = useState(false)
  const [isButtonDialogOpen, setIsButtonDialogOpen] = useState(false)
  const [isMergeTagPickerOpen, setIsMergeTagPickerOpen] = useState(false)
  const [mergeTagQuery, setMergeTagQuery] = useState("")
  const buttonInsertBlockRef = useRef<any>(null)
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
  const uploadFile = useCallback(async (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    objectUrlsRef.current.push(objectUrl)
    return { url: objectUrl, name: file.name }
  }, [])
  const resolvedInitialContent = initialContentProp && initialContentProp.length > 0
    ? initialContentProp as any
    : "<p></p>"

  const editor = useCreateBlockNoteWithLiveblocks(
    { schema: editorSchema as any, dictionary: blockNoteDictionary as any, uploadFile },
    { initialContent: resolvedInitialContent },
    [blockNoteDictionary, uploadFile]
  )
  const isEditorReady = useIsEditorReady()
  const { threads } = useThreads({ query: { resolved: false } })
  const { resolvedTheme } = useTheme()

  const editorReadyFiredRef = useRef(false)
  useEffect(() => {
    if (isEditorReady && editor && onEditorReady && !editorReadyFiredRef.current) {
      editorReadyFiredRef.current = true
      onEditorReady(editor)
    }
  }, [isEditorReady, editor, onEditorReady])

  const containerStyle = {
    maxWidth: "100%",
    paddingLeft: `${styles.container.paddingLeft}px`,
    paddingRight: `${styles.container.paddingRight}px`,
    fontSize: `${styles.typography.fontSize}px`,
    lineHeight: `${styles.typography.lineHeight}%`,
  } as React.CSSProperties

  const className = useMemo(
    () =>
      "email-blocknote-surface prose prose-sm max-w-none min-h-[640px] rounded-sm bg-transparent py-6 text-card-foreground [&_.bn-container]:border-0 [&_.bn-editor]:min-h-[640px]",
    []
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const fileNameRow = target?.closest<HTMLElement>(".bn-file-name-with-icon")
      if (!fileNameRow) return

      const fileBlock = fileNameRow.closest<HTMLElement>('[data-content-type="file"]')
      if (!fileBlock) return

      const url = fileBlock.getAttribute("data-url")
      if (!url) return

      const name =
        fileBlock.getAttribute("data-name") ||
        fileNameRow.textContent?.trim() ||
        "download"

      event.preventDefault()
      event.stopPropagation()

      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Download failed: ${response.status}`)
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = objectUrl
        anchor.download = name
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(objectUrl)
      } catch {
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = name
        anchor.target = "_blank"
        anchor.rel = "noopener noreferrer"
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      }
    }

    root.addEventListener("click", onClick, true)
    return () => {
      root.removeEventListener("click", onClick, true)
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const objectUrl of objectUrlsRef.current) {
        URL.revokeObjectURL(objectUrl)
      }
      objectUrlsRef.current = []
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById("bn-suggestion-menu")
      if (!menu || !menu.offsetParent) return
      if (menu.contains(e.target as Node)) return

      try {
        const editorDom = editor.domElement
        if (editorDom) {
          editorDom.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Escape",
              code: "Escape",
              keyCode: 27,
              bubbles: true,
              cancelable: true,
            })
          )
        }
      } catch {
        // editor not mounted yet
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true)
    return () => document.removeEventListener("mousedown", handleClickOutside, true)
  }, [editor])

  const openHtmlDialog = useCallback(() => {
    setIsHtmlDialogOpen(true)
  }, [])

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
    },
    [editor]
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
          // fall through to fallback
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

  const insertHtmlIntoEditor = useCallback((html: string) => {
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
  }, [editor])

  const insertHtmlFromDialog = useCallback(
    (html: string) => {
      const trimmed = html.trim()
      if (!trimmed) return

      if (!isEditorReady) {
        pendingHtmlQueueRef.current.push(trimmed)
        return
      }

      insertHtmlIntoEditor(trimmed)
    },
    [isEditorReady, insertHtmlIntoEditor]
  )

  useEffect(() => {
    if (!isEditorReady || pendingHtmlQueueRef.current.length === 0) return
    const queued = [...pendingHtmlQueueRef.current]
    pendingHtmlQueueRef.current = []
    queued.forEach((queuedHtml) => insertHtmlIntoEditor(queuedHtml))
  }, [isEditorReady, insertHtmlIntoEditor])

  return (
    <div ref={rootRef} className="relative email-editor-container mx-auto bg-card" style={containerStyle}>
      <BlockNoteView
        editor={editor}
        className={className}
        style={{
          paddingLeft: "var(--email-content-x-padding, 1.5rem)",
          paddingRight: "var(--email-content-x-padding, 1.5rem)",
        }}
        slashMenu={false}
        sideMenu={false}
        formattingToolbar={false}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      >
        <NotionFormattingToolbar />
        {isEditorReady && (
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) =>
              filterSuggestionItems(
                getBlockNoteSlashItems(editor, {
                  onHtmlRequest: openHtmlDialog,
                  onButtonRequest: openButtonDialog,
                  onMergeTagRequest: openMergeTagPicker,
                }),
                query
              )
            }
          />
        )}
      </BlockNoteView>
      {isEditorReady && (
        <>
          <FloatingComposer editor={editor} style={{ width: "350px" }} />
          <FloatingThreads editor={editor} threads={threads} style={{ width: "350px" }} className="xl:hidden" />
          <AnchoredThreads
            editor={editor}
            threads={threads}
            style={{ width: "350px" }}
            className="absolute -right-[380px] top-0 hidden xl:block"
          />
        </>
      )}
      <HTMLEmbedDialog
        open={isHtmlDialogOpen}
        onClose={() => setIsHtmlDialogOpen(false)}
        onSave={insertHtmlFromDialog}
      />
      <ButtonInsertDialog
        open={isButtonDialogOpen}
        onClose={() => setIsButtonDialogOpen(false)}
        onSave={handleButtonInsert}
      />
      <Dialog
        open={isMergeTagPickerOpen}
        onOpenChange={(v) => {
          setIsMergeTagPickerOpen(v)
          if (!v) setMergeTagQuery("")
        }}
      >
        <DialogContent className="max-w-xs gap-0 p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-sm">Insert Merge Tag</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="size-3.5 shrink-0 text-muted-foreground/50" />
              <input
                value={mergeTagQuery}
                onChange={(e) => setMergeTagQuery(e.target.value)}
                placeholder="Search fields…"
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {(() => {
                const lowerQ = mergeTagQuery.toLowerCase()
                const filtered = lowerQ
                  ? MERGE_TAGS.filter(
                      (t) =>
                        t.name.toLowerCase().includes(lowerQ) ||
                        t.label.toLowerCase().includes(lowerQ) ||
                        t.category.toLowerCase().includes(lowerQ)
                    )
                  : MERGE_TAGS
                const hasResults = filtered.length > 0

                return (
                  <>
                    {MERGE_TAG_CATEGORIES.map((category) => {
                      const tags = filtered
                        .filter((t) => t.category === category)
                        .sort((a, b) => a.label.localeCompare(b.label))
                      if (tags.length === 0) return null
                      return (
                        <Collapsible key={category} defaultOpen>
                          <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground/80 transition-colors group">
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
                                    insertMergeTag(tag.name)
                                    setMergeTagQuery("")
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
                    {!hasResults && (
                      <p className="py-6 text-center text-xs text-muted-foreground/60">
                        No fields match &quot;{mergeTagQuery}&quot;
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .email-editor-container .bn-editor a {
          color: ${styles.link.color};
          text-decoration: ${styles.link.decoration};
        }
        .email-editor-container .bn-editor .bn-inline-content > a:only-child,
        .email-editor-container .bn-editor .bn-inline-content > a:first-child:last-child {
          display: inline-block;
          background: ${styles.button.background};
          color: ${styles.button.textColor} !important;
          border-radius: ${styles.button.radius}px;
          padding: ${styles.button.paddingTop}px ${styles.button.paddingRight}px ${styles.button.paddingBottom}px ${styles.button.paddingLeft}px;
          text-decoration: none !important;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
