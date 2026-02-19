"use client"

import { useEditor, EditorContent, ReactRenderer, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import tippy, { Instance as TippyInstance } from "tippy.js"
import { SlashCommandList, SlashCommandListHandle, slashCommandItems } from "./slash-commands"
import type { EmailTemplateStyles } from "./types"
import { useLiveblocksExtension } from "@liveblocks/react-tiptap"
import "tippy.js/dist/tippy.css"

type Props = {
  styles: EmailTemplateStyles
  onEditorReady?: (editor: Editor) => void
}

function createSlashExtension(): Extension {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestion: Partial<any> = {
    char: "/",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    command: ({ editor, range, props }: any) => {
      props.command(editor, range)
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

export function EmailEditor({ styles, onEditorReady }: Props) {
  const liveblocks = useLiveblocksExtension()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      liveblocks,
      StarterKit,
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
        class: "outline-none focus:outline-none min-h-[200px]",
      },
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor as Editor)
    },
  })

  const containerStyle = {
    maxWidth: `${styles.container.width}px`,
    paddingLeft: `${styles.container.paddingLeft}px`,
    paddingRight: `${styles.container.paddingRight}px`,
    fontSize: `${styles.typography.fontSize}px`,
    lineHeight: `${styles.typography.lineHeight}%`,
  } as React.CSSProperties

  return (
    <div className="email-editor-container mx-auto bg-white" style={containerStyle}>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-8 py-6 [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-[#aaa] [&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
      />
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
