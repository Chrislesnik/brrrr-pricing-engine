"use client"

import { useState, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { ClientSideSuspense } from "@liveblocks/react"
import { RoomProvider, useStorage, useMutation } from "@liveblocks/react/suspense"
import { StylesPanel } from "./styles-panel"
import { EmailEditor } from "./email-editor"
import { defaultEmailStyles, type EmailTemplateStyles } from "./types"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@repo/ui/shadcn/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import { MERGE_TAGS } from "./merge-tag-extension"
import {
  MoreHorizontal,
  PanelLeft,
  ChevronRight,
  Loader2,
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
  Mail,
  Eye,
  FileCode,
  Save,
  FolderOpen,
  FilePlus,
  Copy,
  Trash2,
} from "lucide-react"
import { cn } from "@repo/lib/cn"
import type { Editor } from "@tiptap/react"

type Props = {
  templateId: string
  templateName?: string
  onBack?: () => void
}

function UserAvatar() {
  const { user } = useUser()
  const initials = user
    ? (user.firstName?.[0] ?? user.emailAddresses[0]?.emailAddress?.[0] ?? "U").toUpperCase()
    : "U"
  const imageUrl = user?.imageUrl

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={user?.fullName ?? "User"}
        className="size-6 rounded-full object-cover"
      />
    )
  }

  return (
    <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white">
      {initials}
    </div>
  )
}

function EmailTemplateBuilderInner({ initialName, onBack }: { initialName: string; onBack?: () => void }) {
  const [stylesPanelOpen, setStylesPanelOpen] = useState(true)
  const [editor, setEditor] = useState<Editor | null>(null)

  const templateName = useStorage((root) => root.templateName as string | undefined) ?? initialName
  const status = useStorage((root) => root.status as "draft" | "published" | undefined) ?? "draft"
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
    <div className="flex h-full flex-col overflow-hidden bg-background">

      {/* ── Styles Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={stylesPanelOpen} onOpenChange={setStylesPanelOpen}>
        <SheetContent
          side="left"
          className="w-[240px] p-0 sm:max-w-[240px] [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Styles</SheetTitle>
          <StylesPanel
            styles={styles}
            onChange={handleStylesChange}
            onReset={() => handleStylesChange(defaultEmailStyles)}
            onClose={() => setStylesPanelOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="flex h-11 flex-shrink-0 items-center justify-between border-b border-border bg-background px-3">

        {/* Left: Styles sheet toggle */}
        <button
          type="button"
          onClick={() => setStylesPanelOpen(true)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <PanelLeft className="size-3.5" />
          Styles
        </button>

        {/* Right: breadcrumb · name · status · mail · avatar · more · publish */}
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Templates
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Templates</span>
          )}
          <ChevronRight className="size-3 text-muted-foreground/40" />
          <input
            value={templateName}
            onChange={(e) => updateTemplateName(e.target.value)}
            className="min-w-0 max-w-[180px] bg-transparent text-xs font-medium text-foreground outline-none hover:underline focus:underline"
            aria-label="Template name"
          />
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              status === "published"
                ? "bg-[#dcfce7] text-[#16a34a]"
                : "bg-muted text-muted-foreground"
            )}
          >
            {status === "published" ? "Published" : "Draft"}
          </span>

          {/* Send test email */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Send test email"
          >
            <Mail className="size-3.5" />
            Mail
          </button>

          <UserAvatar />

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="More options"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <Eye className="size-3.5 text-muted-foreground" />
                Preview Email
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <FileCode className="size-3.5 text-muted-foreground" />
                Export HTML
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Save className="size-3.5 text-muted-foreground" />
                Save Template
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <FolderOpen className="size-3.5 text-muted-foreground" />
                Open Template
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <FilePlus className="size-3.5 text-muted-foreground" />
                New Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Copy className="size-3.5 text-muted-foreground" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => publish()}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              status === "published"
                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            Publish
          </button>
        </div>
      </header>

      {/* ── Canvas (scrollable) ───────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted px-4 py-6">
        <div className="mx-auto w-full" style={{ maxWidth: `${styles.container.width + 64}px` }}>

          {/* Email card — From/Subject/Toolbar/Editor all nested inside */}
          <div className="overflow-hidden rounded-sm bg-card shadow-sm">

            {/* From row */}
            <div className="flex items-center justify-between border-b border-border px-6 py-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">From</span>
                <span className="text-sm text-card-foreground">Acme &lt;acme@example.com&gt;</span>
              </div>
              <button type="button" className="text-xs text-muted-foreground/60 transition-colors hover:text-card-foreground">
                Reply-To
              </button>
            </div>

            {/* Subject row */}
            <div className="flex items-center justify-between border-b border-border px-6 py-2">
              <input
                placeholder="Subject"
                className="flex-1 bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground/40 outline-none"
                aria-label="Email subject"
              />
              <button type="button" className="text-xs text-muted-foreground/60 transition-colors hover:text-card-foreground">
                Preview text
              </button>
            </div>

            {/* Formatting toolbar + Merge Tags — unified section */}
            <div className="border-b border-border">
              <div className="flex items-center gap-0.5 px-3 py-1">
                <FormattingToolbar editor={editor} />
              </div>
              <div className="flex items-center px-3 py-1">
                <MergeTagsButton editor={editor} />
              </div>
            </div>

            {/* Editor body */}
            <EmailEditor styles={styles} onEditorReady={setEditor} />
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground/40">
            Press &quot;/&quot; for block commands
          </p>
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
        "flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        active && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="mx-0.5 h-4 w-px bg-border" />
}

function FormattingToolbar({ editor }: { editor: Editor | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = editor as any

  return (
    <>
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
      <ToolbarBtn label="Underline" active={e?.isActive("underline")} onClick={() => e?.chain().focus().toggleUnderline?.().run()}>
        <Underline className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Strikethrough" active={e?.isActive("strike")} onClick={() => e?.chain().focus().toggleStrike().run()}>
        <Strikethrough className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Inline Code" active={e?.isActive("code")} onClick={() => e?.chain().focus().toggleCode().run()}>
        <Code className="size-3.5" />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Heading 1" active={e?.isActive("heading", { level: 1 })} onClick={() => e?.chain().focus().toggleHeading({ level: 1 }).run()}>
        <span className="text-[9px] font-bold leading-none">H1</span>
      </ToolbarBtn>
      <ToolbarBtn label="Heading 2" active={e?.isActive("heading", { level: 2 })} onClick={() => e?.chain().focus().toggleHeading({ level: 2 }).run()}>
        <span className="text-[9px] font-bold leading-none">H2</span>
      </ToolbarBtn>
      <ToolbarBtn label="Heading 3" active={e?.isActive("heading", { level: 3 })} onClick={() => e?.chain().focus().toggleHeading({ level: 3 }).run()}>
        <span className="text-[9px] font-bold leading-none">H3</span>
      </ToolbarBtn>
      <ToolbarBtn label="Heading 4" active={e?.isActive("heading", { level: 4 })} onClick={() => e?.chain().focus().toggleHeading({ level: 4 }).run()}>
        <span className="text-[9px] font-bold leading-none">H4</span>
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Align Left" active={e?.isActive({ textAlign: "left" })} onClick={() => e?.chain().focus().setTextAlign?.("left").run()}>
        <AlignLeft className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Align Center" active={e?.isActive({ textAlign: "center" })} onClick={() => e?.chain().focus().setTextAlign?.("center").run()}>
        <AlignCenter className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Align Right" active={e?.isActive({ textAlign: "right" })} onClick={() => e?.chain().focus().setTextAlign?.("right").run()}>
        <AlignRight className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Justify" active={e?.isActive({ textAlign: "justify" })} onClick={() => e?.chain().focus().setTextAlign?.("justify").run()}>
        <AlignJustify className="size-3.5" />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Bullet List" active={e?.isActive("bulletList")} onClick={() => e?.chain().focus().toggleBulletList().run()}>
        <List className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Numbered List" active={e?.isActive("orderedList")} onClick={() => e?.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-3.5" />
      </ToolbarBtn>
      <Sep />
      <ToolbarBtn label="Add Link">
        <Link className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Insert Image">
        <Image className="size-3.5" />
      </ToolbarBtn>
      <ToolbarBtn label="Horizontal Rule" onClick={() => e?.chain().focus().setHorizontalRule().run()}>
        <Minus className="size-3.5" />
      </ToolbarBtn>
    </>
  )
}

function MergeTagsButton({ editor }: { editor: import("@tiptap/react").Editor | null }) {
  // Group tags by category
  const categories = Array.from(new Set(MERGE_TAGS.map((t) => t.category)))

  const insert = (name: string, label: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = editor as any
    e?.chain().focus().insertContent({ type: "mergeTag", attrs: { name, label } }).run()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground transition-colors hover:bg-accent/80"
        >
          <span className="font-mono text-[11px] text-muted-foreground/50">{"{ }"}</span>
          <span className="font-medium">Merge Tags</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 max-h-80 overflow-y-auto">
        {categories.map((category, i) => {
          const tags = MERGE_TAGS.filter((t) => t.category === category)
          return (
            <div key={category}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {category}
              </DropdownMenuLabel>
              {tags.map((tag) => (
                <DropdownMenuItem
                  key={tag.name}
                  className="gap-2 font-mono text-xs"
                  onClick={() => insert(tag.name, tag.label)}
                >
                  <span className="inline-flex items-center gap-0.5 whitespace-nowrap rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium">
                    {"{{"}
                    {tag.label}
                    {"}}"}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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
