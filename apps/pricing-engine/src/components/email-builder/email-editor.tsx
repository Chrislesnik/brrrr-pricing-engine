"use client"

import { Suspense, useEffect, useState } from "react"
import { useEditor, EditorContent, ReactRenderer, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import tippy, { Instance as TippyInstance } from "tippy.js"
import {
  useLiveblocksExtension,
  AiToolbar,
  Toolbar,
  FloatingToolbar,
  FloatingComposer,
  FloatingThreads,
  AnchoredThreads,
} from "@liveblocks/react-tiptap"
import { useThreads } from "@liveblocks/react/suspense"
import {
  SlashCommandList,
  SlashCommandListHandle,
  slashCommandItems,
  InsertHtmlDialog,
  InsertLinkDialog,
  InsertButtonDialog,
} from "./slash-commands"
import { MergeTagExtension } from "./merge-tag-extension"
import { RawHtmlBlock } from "./raw-html-block"
import type { EmailTemplateStyles } from "./types"
import { Sparkles, Languages, PenLine, Search, Minimize2 } from "lucide-react"
import "tippy.js/dist/tippy.css"

type Props = {
  styles: EmailTemplateStyles
  onEditorReady?: (editor: Editor) => void
}

// ─── Slash command extension ──────────────────────────────────────────────────

function createSlashExtension(): Extension {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestion: Partial<any> = {
    char: "/",
    startOfLine: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    command: ({ editor, range, props }: any) => {
      props.command({ editor, range })
    },
    items: ({ query }: { query: string }) => {
      return slashCommandItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    },
    render: () => {
      let reactRenderer: ReactRenderer<SlashCommandListHandle>
      let popup: TippyInstance[]

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart(props: any) {
          reactRenderer = new ReactRenderer(SlashCommandList, {
            props,
            editor: props.editor,
          })
          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: reactRenderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            animation: false,
            onMount(instance) {
              const box = instance.popper.querySelector<HTMLElement>(".tippy-box")
              const content = instance.popper.querySelector<HTMLElement>(".tippy-content")
              if (box) {
                box.style.cssText =
                  "background:transparent;border:none;box-shadow:none;padding:0;max-width:none"
              }
              if (content) content.style.padding = "0"
            },
          })
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate(props: any) {
          reactRenderer.updateProps(props)
          popup[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          })
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown(props: any) {
          if (props.event.key === "Escape") {
            popup[0]?.hide()
            return true
          }
          return reactRenderer.ref?.onKeyDown(props.event) ?? false
        },
        onExit() {
          popup[0]?.destroy()
          reactRenderer.destroy()
        },
      }
    },
  }

  return Extension.create({
    name: "slashCommand",
    addOptions() {
      return { suggestion }
    },
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ]
    },
  })
}

// ─── Thread overlay ───────────────────────────────────────────────────────────
// Wrapped in its own Suspense so thread-loading suspension / fetch errors
// don't propagate up and affect the editor itself.

function ThreadsContent({ editor }: { editor: Editor | null }) {
  const { threads } = useThreads({ query: { resolved: false } })
  return (
    <>
      <FloatingThreads
        editor={editor}
        threads={threads}
        className="w-[350px] xl:hidden"
      />
      <AnchoredThreads
        editor={editor}
        threads={threads}
        className="absolute -right-[380px] top-0 hidden w-[350px] xl:block"
      />
    </>
  )
}

function ThreadsOverlay({ editor }: { editor: Editor | null }) {
  return (
    <Suspense fallback={null}>
      <ThreadsContent editor={editor} />
    </Suspense>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function EmailEditor({ styles, onEditorReady }: Props) {
  const liveblocks = useLiveblocksExtension({
    ai: {
      name: "AI",
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      liveblocks,
      StarterKit.configure({
        // Liveblocks provides its own collaborative undo/redo via Yjs
        undoRedo: false,
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      MergeTagExtension,
      RawHtmlBlock,
      Placeholder.configure({
        placeholder: ({ node }: { node: { type: { name: string } } }) => {
          if (node.type.name === "heading") return "Heading..."
          return 'Press "/" for commands'
        },
      }),
      createSlashExtension(),
    ] as any[],
    editorProps: {
      attributes: {
        class: "outline-none focus:outline-none min-h-[640px] caret-current",
      },
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor as Editor)
    },
  })

  // Defer rendering of Liveblocks floating components until the editor view
  // is mounted by EditorContent. Without this, accessing view.dom during the
  // first render triggers tiptap v3's "[tiptap error] view not available" warning.
  const [viewReady, setViewReady] = useState(false)
  useEffect(() => {
    if (!editor) {
      setViewReady(false)
      return
    }
    const frame = requestAnimationFrame(() => setViewReady(true))
    return () => cancelAnimationFrame(frame)
  }, [editor])

  const containerStyle = {
    maxWidth: "100%",
    paddingLeft: `${styles.container.paddingLeft}px`,
    paddingRight: `${styles.container.paddingRight}px`,
    fontSize: `${styles.typography.fontSize}px`,
    lineHeight: `${styles.typography.lineHeight}%`,
  } as React.CSSProperties

  return (
    <div className="relative email-editor-container mx-auto bg-card" style={containerStyle}>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none py-6 text-card-foreground [&_.ProseMirror]:caret-current [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-muted-foreground/40 [&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
        style={{
          paddingLeft: "var(--email-content-x-padding, 1.5rem)",
          paddingRight: "var(--email-content-x-padding, 1.5rem)",
        }}
      />

      {viewReady && (
        <>
          <FloatingToolbar
            editor={editor}
            after={
              <Toolbar.Button
                name="Ask AI"
                icon={<Sparkles className="size-3.5" />}
                shortcut="CMD+J"
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ;(editor as any)?.chain().focus().askAi().run()
                }}
              />
            }
          />

          <AiToolbar
            editor={editor}
            suggestions={
              <>
                <AiToolbar.SuggestionsLabel>AI</AiToolbar.SuggestionsLabel>
                <AiToolbar.Suggestion icon={<Languages className="size-3.5" />}>
                  Translate to
                </AiToolbar.Suggestion>
                <AiToolbar.Suggestion icon={<PenLine className="size-3.5" />} prompt="Continue writing">
                  Continue writing
                </AiToolbar.Suggestion>
                <AiToolbar.Suggestion icon={<Search className="size-3.5" />} prompt="Ask a question about this selection">
                  Ask a question
                </AiToolbar.Suggestion>
                <AiToolbar.Suggestion icon={<Search className="size-3.5" />} prompt="Ask about this page">
                  Ask about this page
                </AiToolbar.Suggestion>
                <AiToolbar.Suggestion icon={<Minimize2 className="size-3.5" />} prompt="Make this shorter">
                  Make shorter
                </AiToolbar.Suggestion>
              </>
            }
          />

          <FloatingComposer editor={editor} style={{ width: "350px" }} />

          <ThreadsOverlay editor={editor} />
        </>
      )}

      {/* HTML slash command dialog */}
      <InsertHtmlDialog />
      <InsertLinkDialog />
      <InsertButtonDialog />

      <style>{`
        .email-editor-container a {
          color: ${styles.link.color};
          text-decoration: ${styles.link.decoration};
        }
        .email-editor-container img {
          border-radius: ${styles.image.borderRadius}px;
        }
        .email-editor-container .email-button,
        .email-editor-container button[data-type="email-button"] {
          display: inline-block;
          background: ${styles.button.background};
          color: ${styles.button.textColor};
          border-radius: ${styles.button.radius}px;
          padding: ${styles.button.paddingTop}px ${styles.button.paddingRight}px ${styles.button.paddingBottom}px ${styles.button.paddingLeft}px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
