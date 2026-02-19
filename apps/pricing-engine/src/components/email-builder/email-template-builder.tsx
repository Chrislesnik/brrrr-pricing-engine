"use client"

import { useState, useCallback } from "react"
import { ClientSideSuspense } from "@liveblocks/react"
import { RoomProvider, useStorage, useMutation } from "@liveblocks/react/suspense"
import { StylesPanel } from "./styles-panel"
import { EmailEditor } from "./email-editor"
import { defaultEmailStyles, type EmailTemplateStyles } from "./types"
import {
  MoreHorizontal,
  Globe,
  PanelLeft,
  Reply,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Image,
  Minus,
  Quote,
} from "lucide-react"
import { cn } from "@repo/lib/cn"
import type { Editor } from "@tiptap/react"

type Props = {
  templateId: string
  templateName?: string
  onBack?: () => void
}

function EmailTemplateBuilderInner({ initialName, onBack }: { initialName: string; onBack?: () => void }) {
  const [stylesPanelOpen, setStylesPanelOpen] = useState(true)
  const [editor, setEditor] = useState<Editor | null>(null)

  const templateName =
    (useStorage((root) => root.templateName as string | undefined) ?? initialName)
  const status =
    (useStorage((root) => root.status as "draft" | "published" | undefined) ?? "draft")
  const storedStyles = useStorage((root) => root.styles as EmailTemplateStyles | undefined)
  const styles: EmailTemplateStyles = storedStyles
    ? {
        body: { ...defaultEmailStyles.body, ...storedStyles.body },
        container: { ...defaultEmailStyles.container, ...storedStyles.container },
        typography: { ...defaultEmailStyles.typography, ...storedStyles.typography },
        link: { ...defaultEmailStyles.link, ...storedStyles.link },
        image: { ...defaultEmailStyles.image, ...storedStyles.image },
        button: { ...defaultEmailStyles.button, ...storedStyles.button },
        codeBlock: { ...defaultEmailStyles.codeBlock, ...storedStyles.codeBlock },
        inlineCode: { ...defaultEmailStyles.inlineCode, ...storedStyles.inlineCode },
        globalCss: storedStyles.globalCss ?? defaultEmailStyles.globalCss,
      }
    : defaultEmailStyles

  const updateStyles = useMutation(({ storage }, newStyles: EmailTemplateStyles) => {
    storage.set("styles", newStyles as unknown as never)
  }, [])

  const updateTemplateName = useMutation(({ storage }, name: string) => {
    storage.set("templateName", name as unknown as never)
  }, [])

  const publish = useMutation(({ storage }) => {
    storage.set("status", "published" as unknown as never)
  }, [])

  const handleStylesChange = useCallback(
    (newStyles: EmailTemplateStyles) => updateStyles(newStyles),
    [updateStyles]
  )

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      <header className="flex h-11 flex-shrink-0 items-center justify-between border-b border-[#e5e5e5] bg-white px-3">
        {/* Left: Back + Styles toggle */}
        <div className="flex items-center gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[#666] transition-colors hover:bg-[#f5f5f5] hover:text-[#111]"
              aria-label="Back to templates"
            >
              <ArrowLeft className="size-3.5" />
              Templates
            </button>
          )}
          <div className="mx-1 h-4 w-px bg-[#e5e5e5]" />
          <button
            type="button"
            onClick={() => setStylesPanelOpen((o) => !o)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              stylesPanelOpen
                ? "bg-[#f0f0f0] text-[#111]"
                : "text-[#666] hover:bg-[#f5f5f5] hover:text-[#111]"
            )}
          >
            <PanelLeft className="size-3.5" />
            Styles
          </button>
        </div>

        {/* Center: Breadcrumb + status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#999]">Templates</span>
          <ChevronRight className="size-3.5 text-[#ccc]" />
          <input
            value={templateName}
            onChange={(e) => updateTemplateName(e.target.value)}
            className="bg-transparent text-sm font-medium text-[#111] outline-none focus:underline"
            aria-label="Template name"
          />
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              status === "published"
                ? "bg-[#dcfce7] text-[#16a34a]"
                : "bg-[#f3f4f6] text-[#6b7280]"
            )}
          >
            {status === "published" ? "Published" : "Draft"}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#666] transition-colors hover:bg-[#f5f5f5] hover:text-[#111]"
            aria-label="Reply-To"
          >
            <Reply className="size-3.5" />
            Reply-To
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-[#666] transition-colors hover:bg-[#f5f5f5] hover:text-[#111]"
            aria-label="More options"
          >
            <MoreHorizontal className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => publish()}
            className="flex items-center gap-1.5 rounded-md bg-[#111] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#333]"
          >
            <Globe className="size-3.5" />
            Publish
          </button>
        </div>
      </header>

      {/* From / Subject / Preview text rows */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[#e5e5e5] px-4 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#bbb]">From</span>
          <span className="text-sm text-[#555]">Acme &lt;acme@example.com&gt;</span>
        </div>
        <span className="cursor-pointer text-xs text-[#aaa] hover:text-[#777]">Reply-To</span>
      </div>
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[#e5e5e5] px-4 py-1.5">
        <input
          placeholder="Subject"
          className="flex-1 bg-transparent text-sm text-[#111] placeholder-[#bbb] outline-none"
          aria-label="Email subject"
        />
        <span className="cursor-pointer text-xs text-[#aaa] hover:text-[#777]">Preview text</span>
      </div>

      {/* Formatting toolbar */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-0.5 border-b border-[#e5e5e5] bg-white px-3 py-1">
        <FormattingToolbar editor={editor} />
      </div>

      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {/* Styles panel */}
        {stylesPanelOpen && (
          <StylesPanel
            styles={styles}
            onChange={handleStylesChange}
            onReset={() => handleStylesChange(defaultEmailStyles)}
            onClose={() => setStylesPanelOpen(false)}
          />
        )}

        {/* Email canvas */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f3f3f3] px-4 py-6">
          <div className="mx-auto w-full" style={{ maxWidth: `${styles.container.width + 64}px` }}>
            <div className="rounded-sm bg-white shadow-sm">
              <EmailEditor styles={styles} onEditorReady={setEditor} />
            </div>
            <div className="mt-3 rounded-sm bg-white/50 px-8 py-3 text-center text-xs text-[#ccc]">
              Press &quot;/&quot; in the editor above for block commands
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({
  onClick,
  active,
  label,
  children,
}: {
  onClick?: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded text-[#555] transition-colors hover:bg-[#f0f0f0] active:bg-[#e8e8e8]",
        active && "bg-[#f0f0f0] text-[#111]"
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="mx-0.5 h-4 w-px bg-[#e5e5e5]" />
}

function FormattingToolbar({ editor }: { editor: Editor | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = editor as any

  return (
    <>
      <span className="mr-1 text-[11px] text-[#bbb]">{"{ }"}</span>
      <span className="mr-2 text-[11px] font-medium text-[#888]">Merge Tags</span>

      <ToolbarBtn label="Undo" onClick={() => e?.chain().focus().undo().run()}>
        <Undo2 className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Redo" onClick={() => e?.chain().focus().redo().run()}>
        <Redo2 className="size-3.5" />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Bold" active={e?.isActive("bold")} onClick={() => e?.chain().focus().toggleBold().run()}>
        <Bold className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Italic" active={e?.isActive("italic")} onClick={() => e?.chain().focus().toggleItalic().run()}>
        <Italic className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Underline">
        <Underline className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Strikethrough" active={e?.isActive("strike")} onClick={() => e?.chain().focus().toggleStrike().run()}>
        <Strikethrough className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Code" active={e?.isActive("code")} onClick={() => e?.chain().focus().toggleCode().run()}>
        <Code className="size-3.5" />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Heading 1" active={e?.isActive("heading", { level: 1 })} onClick={() => e?.chain().focus().toggleHeading({ level: 1 }).run()}>
        <span className="text-[10px] font-bold">H1</span>
      </ToolbarBtn>
      <ToolbarBtn label="Heading 2" active={e?.isActive("heading", { level: 2 })} onClick={() => e?.chain().focus().toggleHeading({ level: 2 }).run()}>
        <span className="text-[10px] font-bold">H2</span>
      </ToolbarBtn>
      <ToolbarBtn label="Heading 3" active={e?.isActive("heading", { level: 3 })} onClick={() => e?.chain().focus().toggleHeading({ level: 3 }).run()}>
        <span className="text-[10px] font-bold">H3</span>
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Align left">
        <AlignLeft className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Align center">
        <AlignCenter className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Align right">
        <AlignRight className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Justify">
        <AlignJustify className="size-3.5" />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Bullet list" active={e?.isActive("bulletList")} onClick={() => e?.chain().focus().toggleBulletList().run()}>
        <List className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Ordered list" active={e?.isActive("orderedList")} onClick={() => e?.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Quote" active={e?.isActive("blockquote")} onClick={() => e?.chain().focus().toggleBlockquote().run()}>
        <Quote className="size-3.5" />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Link">
        <Link className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Image">
        <Image className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Divider" onClick={() => e?.chain().focus().setHorizontalRule().run()}>
        <Minus className="size-3.5" />
      </ToolbarBtn>
    </>
  )
}

function EmailTemplateBuilderLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <Loader2 className="size-5 animate-spin text-[#aaa]" />
    </div>
  )
}

export function EmailTemplateBuilder({ templateId, templateName = "Untitled Template", onBack }: Props) {
  const roomId = `email-template:${templateId}`

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ cursor: null }}
      initialStorage={{
        templateName,
        status: "draft",
        styles: defaultEmailStyles as unknown as never,
      }}
    >
      <ClientSideSuspense fallback={<EmailTemplateBuilderLoading />}>
        <EmailTemplateBuilderInner initialName={templateName} onBack={onBack} />
      </ClientSideSuspense>
    </RoomProvider>
  )
}
