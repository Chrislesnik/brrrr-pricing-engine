"use client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyChain = any

import { Editor, Range } from "@tiptap/core"
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Type,
  Link,
  Square,
  Video,
  Code,
  Code2,
  FileCode,
} from "lucide-react"
import { ReactNode, forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { cn } from "@repo/lib/cn"

export type SlashCommandItem = {
  title: string
  description: string
  icon: ReactNode
  command: (editor: Editor, range: Range) => void
}

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain paragraph text",
    icon: <Type className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setParagraph().run()
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setHeading({ level: 1 }).run()
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setHeading({ level: 2 }).run()
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setHeading({ level: 3 }).run()
    },
  },
  {
    title: "Heading 4",
    description: "Sub-section heading",
    icon: <Heading4 className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setHeading({ level: 4 }).run()
    },
  },
  {
    title: "Heading 5",
    description: "Small sub-heading",
    icon: <Heading5 className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setHeading({ level: 5 }).run()
    },
  },
  {
    title: "Heading 6",
    description: "Tiny heading",
    icon: <Heading6 className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setHeading({ level: 6 }).run()
    },
  },
  {
    title: "Link",
    description: "Insert a hyperlink",
    icon: <Link className="size-4" />,
    command: (editor, range) => {
      const url = window.prompt("Enter link URL:", "https://")
      if (!url) {
        editor.chain().focus().deleteRange(range).run()
        return
      }
      const text = window.prompt("Link text:", "Click here") ?? "Click here"
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(`<a href="${url}">${text}</a>`)
        .run()
    },
  },
  {
    title: "Button",
    description: "Call-to-action button",
    icon: <Square className="size-4" />,
    command: (editor, range) => {
      const label = window.prompt("Button label:", "Click here") ?? "Click here"
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(`<p><a class="email-button" href="#">${label}</a></p>`)
        .run()
    },
  },
  {
    title: "Video Embed",
    description: "Embed a video via thumbnail",
    icon: <Video className="size-4" />,
    command: (editor, range) => {
      const url = window.prompt("Enter video URL (YouTube, Vimeo, etc.):", "https://")
      if (!url) {
        editor.chain().focus().deleteRange(range).run()
        return
      }
      // Email clients don't support video — render a linked image placeholder
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(
          `<p><a href="${url}" title="Watch video">▶ Watch video: ${url}</a></p>`
        )
        .run()
    },
  },
  {
    title: "Code Block",
    description: "Multi-line code with formatting",
    icon: <Code className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain).setCodeBlock().run()
    },
  },
  {
    title: "Inline Code",
    description: "Inline code snippet",
    icon: <Code2 className="size-4" />,
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).insertContent("`code`").run()
      ;(editor.chain().focus() as AnyChain).toggleCode().run()
    },
  },
  {
    title: "HTML",
    description: "Write or paste raw HTML",
    icon: <FileCode className="size-4" />,
    command: (editor, range) => {
      ;(editor.chain().focus().deleteRange(range) as AnyChain)
        .setCodeBlock()
        .insertContent("<!-- paste your HTML here -->")
        .run()
    },
  },
]

const SECTION_MAP: Record<string, string> = {
  Text: "TEXT",
  "Heading 1": "TEXT",
  "Heading 2": "TEXT",
  "Heading 3": "TEXT",
  "Heading 4": "TEXT",
  "Heading 5": "TEXT",
  "Heading 6": "TEXT",
  Link: "MEDIA",
  Button: "MEDIA",
  "Video Embed": "MEDIA",
  "Code Block": "CODE",
  "Inline Code": "CODE",
  HTML: "CODE",
}

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
      <div className="z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
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
                  onClick={() => command(item)}
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
