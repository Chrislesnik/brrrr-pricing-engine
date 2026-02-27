"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ClientSideSuspense } from "@liveblocks/react"
import { RoomProvider, useStorage, useMutation } from "@liveblocks/react/suspense"
import { StylesPanel } from "./styles-panel"
import { EmailEditor } from "./email-editor"
import { EmailEditorBlockNote } from "./email-editor-blocknote"
import { defaultEmailStyles, type EmailTemplateStyles } from "./types"
import { wrapEmailHtml, htmlToPlaintext } from "@/lib/email-template/template-renderer"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@repo/ui/shadcn/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible"
import { MERGE_TAGS } from "./merge-tag-extension"
import {
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Search,
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
  PenLine,
  Monitor,
  FileCode,
  Save,
  SaveAll,
  Copy,
  Trash2,
  PanelRight,
  ArrowRightLeft,
} from "lucide-react"
import { cn } from "@repo/lib/cn"
import type { Editor } from "@tiptap/react"
import { ComposeEmailDialog } from "./compose-email-dialog"

type Props = {
  templateId: string
  templateName?: string
  onBack?: () => void
}

function EmailTemplateBuilderInner({
  templateId,
  initialName,
  initialBlocknoteDocument,
  onBack,
}: {
  templateId: string
  initialName: string
  initialBlocknoteDocument?: unknown[] | null
  onBack?: () => void
}) {
  const router = useRouter()
  const [stylesPanelOpen, setStylesPanelOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editorEngine, setEditorEngine] = useState<"tiptap" | "blocknote">("blocknote")
  const [replyToOpen, setReplyToOpen] = useState(false)
  const [ccBccOpen, setCcBccOpen] = useState(false)
  const [previewTextOpen, setPreviewTextOpen] = useState(false)
  const [toValue, setToValue] = useState("")
  const [ccValue, setCcValue] = useState("")
  const [bccValue, setBccValue] = useState("")
  const [activeHeaderField, setActiveHeaderField] = useState<"to" | "cc" | "bcc" | "from" | "replyTo" | "subject" | "previewText" | null>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [blocknoteEditor, setBlocknoteEditor] = useState<any>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState("")
  const toInputRef = useRef<HTMLInputElement>(null)
  const ccInputRef = useRef<HTMLInputElement>(null)
  const bccInputRef = useRef<HTMLInputElement>(null)
  const fromInputRef = useRef<HTMLInputElement>(null)
  const replyToInputRef = useRef<HTMLInputElement>(null)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const previewTextInputRef = useRef<HTMLInputElement>(null)

  // ── Liveblocks-persisted fields (survive page reload & sync across users) ──
  const templateName = useStorage((root) => root.templateName as string | undefined) ?? initialName
  const status = useStorage((root) => root.status as "draft" | "published" | undefined) ?? "draft"
  const subjectValue = useStorage((root) => root.subject as string | undefined) ?? ""
  const fromValue = useStorage((root) => root.fromAddress as string | undefined) ?? ""
  const replyToValue = useStorage((root) => root.replyTo as string | undefined) ?? ""
  const previewTextValue = useStorage((root) => root.previewText as string | undefined) ?? ""
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

  const setSubjectValue = useMutation(({ storage }, value: string) => {
    storage.set("subject", value as unknown as never)
  }, [])

  const setFromValue = useMutation(({ storage }, value: string) => {
    storage.set("fromAddress", value as unknown as never)
  }, [])

  const setReplyToValue = useMutation(({ storage }, value: string) => {
    storage.set("replyTo", value as unknown as never)
  }, [])

  const setPreviewTextValue = useMutation(({ storage }, value: string) => {
    storage.set("previewText", value as unknown as never)
  }, [])

  const publish = useMutation(({ storage }) => {
    storage.set("status", "published" as unknown as never)
  }, [])

  const handleStylesChange = useCallback(
    (newStyles: EmailTemplateStyles) => updateStyles(newStyles),
    [updateStyles]
  )
  const contentRowPaddingStyle = {
    paddingLeft: "var(--email-content-x-padding, 1.5rem)",
    paddingRight: "var(--email-content-x-padding, 1.5rem)",
  }

  const styleOpts = useMemo(() => ({
    fontFamily: styles.typography.fontFamily,
    fontSize: styles.typography.fontSize,
    lineHeight: styles.typography.lineHeight,
    containerWidth: styles.container.width,
    linkColor: styles.link.color,
    buttonBackground: styles.button.background,
    buttonTextColor: styles.button.textColor,
    buttonRadius: styles.button.radius,
  }), [styles])

  // ── Save: persist Liveblocks state → database ──────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: templateName,
        status,
        subject: subjectValue,
        preview_text: previewTextValue,
        from_address: fromValue || null,
        reply_to: replyToValue || null,
        styles,
      }

      let emailHtml = ""

      if (blocknoteEditor) {
        payload.blocknote_document = JSON.parse(JSON.stringify(blocknoteEditor.document))
        const bodyHtml = await new Promise<string>((resolve) => {
          setTimeout(async () => {
            const html = await blocknoteEditor.blocksToHTMLLossy(blocknoteEditor.document)
            resolve(html)
          }, 0)
        })
        emailHtml = wrapEmailHtml(bodyHtml, styleOpts)
      } else if (editor) {
        payload.editor_json = editor.getJSON()
        const { renderTemplate } = await import("@/lib/email-template/template-renderer")
        emailHtml = renderTemplate(editor.getJSON(), {}, styleOpts)
      }

      if (emailHtml) {
        payload.email_output_html = emailHtml
        payload.email_output_text = htmlToPlaintext(emailHtml)
      }

      const res = await fetch(`/api/email-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())
      toast.success("Template saved")
    } catch (err) {
      console.error("[save] failed:", err)
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }, [blocknoteEditor, editor, templateId, templateName, status, subjectValue, previewTextValue, fromValue, replyToValue, styles, styleOpts])

  // ── Save As: duplicate room + DB record, navigate to new template ──────
  const handleSaveAs = useCallback(async () => {
    const name = saveAsName.trim()
    if (!name) return
    setSaving(true)
    setSaveAsOpen(false)
    try {
      let emailHtml = ""
      if (blocknoteEditor) {
        const bodyHtml = await new Promise<string>((resolve) => {
          setTimeout(async () => {
            const html = await blocknoteEditor.blocksToHTMLLossy(blocknoteEditor.document)
            resolve(html)
          }, 0)
        })
        emailHtml = wrapEmailHtml(bodyHtml, styleOpts)
      }

      const res = await fetch("/api/email-templates/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTemplateId: templateId,
          name,
          styles,
          blocknoteDocument: blocknoteEditor?.document ?? null,
          headerFields: {
            subject: subjectValue,
            fromAddress: fromValue,
            replyTo: replyToValue,
            previewText: previewTextValue,
          },
          email_output_html: emailHtml || undefined,
          email_output_text: emailHtml ? htmlToPlaintext(emailHtml) : undefined,
        }),
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success("Template duplicated — opening new copy")
      router.push(
        `/platform-settings/integrations/template-editor?tab=emails&template=${data.id}&name=${encodeURIComponent(data.name)}`
      )
    } catch (err) {
      console.error("[saveAs] failed:", err)
      toast.error("Failed to duplicate template")
    } finally {
      setSaving(false)
      setSaveAsName("")
    }
  }, [saveAsName, templateId, styles, styleOpts, router, blocknoteEditor, subjectValue, fromValue, replyToValue, previewTextValue])

  // ── Export HTML: render email-safe HTML → save to email_output_html ─────
  const handleExportHtml = useCallback(async () => {
    setSaving(true)
    try {
      let emailHtml = ""

      if (blocknoteEditor) {
        const bodyHtml = await new Promise<string>((resolve) => {
          setTimeout(async () => {
            const html = await blocknoteEditor.blocksToHTMLLossy(blocknoteEditor.document)
            resolve(html)
          }, 0)
        })
        emailHtml = wrapEmailHtml(bodyHtml, styleOpts)
      } else if (editor) {
        const { renderTemplate } = await import("@/lib/email-template/template-renderer")
        emailHtml = renderTemplate(editor.getJSON(), {}, styleOpts)
      }

      if (!emailHtml) return

      const res = await fetch(`/api/email-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_output_html: emailHtml,
          email_output_text: htmlToPlaintext(emailHtml),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("HTML exported and saved")
    } catch (err) {
      console.error("[exportHtml] failed:", err)
      toast.error("Failed to export HTML")
    } finally {
      setSaving(false)
    }
  }, [blocknoteEditor, editor, styleOpts, templateId])

  // ── Duplicate (same as Save As but auto-names) ─────────────────────────
  const handleDuplicate = useCallback(async () => {
    setSaving(true)
    try {
      let emailHtml = ""
      if (blocknoteEditor) {
        const bodyHtml = await new Promise<string>((resolve) => {
          setTimeout(async () => {
            const html = await blocknoteEditor.blocksToHTMLLossy(blocknoteEditor.document)
            resolve(html)
          }, 0)
        })
        emailHtml = wrapEmailHtml(bodyHtml, styleOpts)
      }

      const res = await fetch("/api/email-templates/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTemplateId: templateId,
          name: `${templateName} (copy)`,
          styles,
          email_output_html: emailHtml || undefined,
          email_output_text: emailHtml ? htmlToPlaintext(emailHtml) : undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success("Template duplicated")
      router.push(
        `/platform-settings/integrations/template-editor?tab=emails&template=${data.id}&name=${encodeURIComponent(data.name)}`
      )
    } catch (err) {
      console.error("[duplicate] failed:", err)
      toast.error("Failed to duplicate template")
    } finally {
      setSaving(false)
    }
  }, [templateId, templateName, styles, styleOpts, router, blocknoteEditor])

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this email template? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/email-templates/${templateId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Template deleted")
      onBack?.()
    } catch (err) {
      console.error("[delete] failed:", err)
      toast.error("Failed to delete template")
    }
  }, [templateId, onBack])

  // ── Cmd+S keyboard shortcut ────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleSave])

  const insertMergeTagToken = useCallback(
    (name: string) => {
      const token = `{{${name}}}`

      const insertIntoInput = (
        input: HTMLInputElement | null,
        value: string,
        setValue: (next: string) => void
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

      if (activeHeaderField === "to") {
        insertIntoInput(toInputRef.current, toValue, setToValue)
        return true
      }
      if (activeHeaderField === "cc") {
        insertIntoInput(ccInputRef.current, ccValue, setCcValue)
        return true
      }
      if (activeHeaderField === "bcc") {
        insertIntoInput(bccInputRef.current, bccValue, setBccValue)
        return true
      }
      if (activeHeaderField === "from") {
        insertIntoInput(fromInputRef.current, fromValue, setFromValue)
        return true
      }
      if (activeHeaderField === "replyTo") {
        insertIntoInput(replyToInputRef.current, replyToValue, setReplyToValue)
        return true
      }
      if (activeHeaderField === "subject") {
        insertIntoInput(subjectInputRef.current, subjectValue, setSubjectValue)
        return true
      }
      if (activeHeaderField === "previewText") {
        insertIntoInput(previewTextInputRef.current, previewTextValue, setPreviewTextValue)
        return true
      }

      if (editorEngine === "blocknote" && blocknoteEditor) {
        try {
          blocknoteEditor.focus()
          blocknoteEditor.insertInlineContent([
            { type: "mergeTag", props: { name } } as any,
          ])
          return true
        } catch {
          return false
        }
      }

      return false
    },
    [activeHeaderField, bccValue, blocknoteEditor, ccValue, editorEngine, fromValue, previewTextValue, replyToValue, setFromValue, setPreviewTextValue, setReplyToValue, setSubjectValue, subjectValue, toValue]
  )

  const sidebarRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">

      {/* ── Preview Dialog ────────────────────────────────────────────────── */}
      <PreviewEmailDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        editor={editor}
        blocknoteEditor={blocknoteEditor}
        styles={styles}
        headerFields={{
          to: toValue,
          from: fromValue,
          subject: subjectValue,
          replyTo: replyToValue,
          cc: ccValue,
          bcc: bccValue,
          previewText: previewTextValue,
        }}
      />

      {/* ── Compose Email Dialog ──────────────────────────────────────────── */}
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        defaultTo={toValue}
        defaultFrom={fromValue}
        defaultSubject={subjectValue}
      />

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="relative flex h-11 flex-shrink-0 items-center border-b border-border bg-background px-3">

        {/* Left: compose button */}
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Compose email"
        >
          <PenLine className="size-3.5" />
          <span className="text-xs font-medium">Compose</span>
        </button>

        {/* Center: breadcrumb · name · status */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto flex items-center justify-center gap-2">
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
        </div>
        </div>

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-1">

          {/* Preview */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center justify-center rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Preview email"
          >
            <Monitor className="size-3.5" />
          </button>

          {/* Styles toggle */}
          <button
            type="button"
            onClick={() => setStylesPanelOpen((v) => !v)}
            className={cn(
              "flex items-center justify-center rounded-md px-2 py-1.5 transition-colors",
              stylesPanelOpen
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            title={stylesPanelOpen ? "Hide styles" : "Show styles"}
          >
            <PanelRight className="size-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="More options"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">File</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2 text-[13px]" disabled={saving} onClick={handleSave}>
                  <Save className="size-3.5 text-muted-foreground" />
                  {saving ? "Saving…" : "Save"}
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-[13px]"
                  disabled={saving}
                  onClick={() => {
                    setSaveAsName(`${templateName} (copy)`)
                    setSaveAsOpen(true)
                  }}
                >
                  <SaveAll className="size-3.5 text-muted-foreground" />
                  Save As&hellip;
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">Export</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2 text-[13px]" disabled={saving} onClick={handleExportHtml}>
                  <FileCode className="size-3.5 text-muted-foreground" />
                  Export HTML
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2 text-[13px]" disabled={saving} onClick={handleDuplicate}>
                  <Copy className="size-3.5 text-muted-foreground" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-[13px]"
                  onClick={() => setEditorEngine((prev) => (prev === "tiptap" ? "blocknote" : "tiptap"))}
                >
                  <ArrowRightLeft className="size-3.5 text-muted-foreground" />
                  {editorEngine === "tiptap" ? "Switch to BlockNote" : "Switch to Tiptap"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-[13px] text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="size-3.5" />
                Delete Template
                <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save As dialog */}
          <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">Save As New Template</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Creates a copy of this template in a new Liveblocks room.
                </DialogDescription>
              </DialogHeader>
              <input
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Template name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveAs()
                }}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setSaveAsOpen(false)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!saveAsName.trim() || saving}
                  onClick={handleSaveAs}
                  className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Save As"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mx-1 h-4 w-px bg-border" />

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

      {/* ── Body: Canvas + docked Styles sidebar ──────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Canvas (scrollable) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-6" style={{ background: "hsl(var(--canvas-background))" }}>
          <div className="mx-auto w-full" style={{ maxWidth: `${styles.container.width + 64}px` }}>

          {/* Email card — From/Subject/Toolbar/Editor all nested inside */}
          <div
            className="overflow-hidden rounded-sm bg-card shadow-sm"
            style={{ "--email-content-x-padding": "1.5rem" } as React.CSSProperties}
          >

            {/* To row */}
            <div className="flex items-center justify-between border-b border-border py-2" style={contentRowPaddingStyle}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex-shrink-0 text-xs text-muted-foreground/60">To</span>
                <MergeTagInput
                  inputRef={toInputRef}
                  value={toValue}
                  onChange={setToValue}
                  onFocus={() => setActiveHeaderField("to")}
                  placeholder="Recipient Name <recipient@example.com>"
                  ariaLabel="To address"
                />
              </div>
              <button
                type="button"
                onClick={() => setCcBccOpen((v) => !v)}
                className="ml-3 flex-shrink-0 text-xs text-muted-foreground/60 transition-colors hover:text-card-foreground"
              >
                Cc / Bcc
              </button>
            </div>

            {/* CC/BCC rows (toggle) */}
            {ccBccOpen && (
              <>
                <div className="flex items-center justify-between border-b border-border py-2" style={contentRowPaddingStyle}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex-shrink-0 text-xs text-muted-foreground/60">CC</span>
                    <MergeTagInput
                      inputRef={ccInputRef}
                      value={ccValue}
                      onChange={setCcValue}
                      onFocus={() => setActiveHeaderField("cc")}
                      placeholder="CC recipients"
                      ariaLabel="CC recipients"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2" style={contentRowPaddingStyle}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex-shrink-0 text-xs text-muted-foreground/60">BCC</span>
                    <MergeTagInput
                      inputRef={bccInputRef}
                      value={bccValue}
                      onChange={setBccValue}
                      onFocus={() => setActiveHeaderField("bcc")}
                      placeholder="BCC recipients"
                      ariaLabel="BCC recipients"
                    />
                  </div>
                </div>
              </>
            )}

            {/* From row */}
            <div className="flex items-center justify-between border-b border-border py-2" style={contentRowPaddingStyle}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex-shrink-0 text-xs text-muted-foreground/60">From</span>
                <MergeTagInput
                  inputRef={fromInputRef}
                  value={fromValue}
                  onChange={setFromValue}
                  onFocus={() => setActiveHeaderField("from")}
                  placeholder="Sender Name <sender@example.com>"
                  ariaLabel="From address"
                />
              </div>
              <button
                type="button"
                onClick={() => setReplyToOpen((v) => !v)}
                className="ml-3 flex-shrink-0 text-xs text-muted-foreground/60 transition-colors hover:text-card-foreground"
              >
                Reply-To
              </button>
            </div>

            {/* Reply-To row (toggle) */}
            {replyToOpen && (
              <div className="flex items-center justify-between border-b border-border py-2" style={contentRowPaddingStyle}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex-shrink-0 text-xs text-muted-foreground/60">Reply-To</span>
                  <MergeTagInput
                    inputRef={replyToInputRef}
                    value={replyToValue}
                    onChange={setReplyToValue}
                    onFocus={() => setActiveHeaderField("replyTo")}
                    placeholder="Reply Name <reply@example.com>"
                    ariaLabel="Reply-To address"
                  />
                </div>
              </div>
            )}

            {/* Subject row */}
            <div className="flex items-center justify-between border-b border-border py-2" style={contentRowPaddingStyle}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex-shrink-0 text-xs text-muted-foreground/60">Subject</span>
                <MergeTagInput
                  inputRef={subjectInputRef}
                  value={subjectValue}
                  onChange={setSubjectValue}
                  onFocus={() => setActiveHeaderField("subject")}
                  placeholder="Subject"
                  ariaLabel="Email subject"
                />
              </div>
              <button
                type="button"
                onClick={() => setPreviewTextOpen((v) => !v)}
                className="ml-3 flex-shrink-0 text-xs text-muted-foreground/60 transition-colors hover:text-card-foreground"
              >
                Preview text
              </button>
            </div>

            {/* Preview text row (toggle) */}
            {previewTextOpen && (
              <div className="flex items-center justify-between border-b border-border py-2" style={contentRowPaddingStyle}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex-shrink-0 text-xs text-muted-foreground/60">Preview</span>
                  <MergeTagInput
                    inputRef={previewTextInputRef}
                    value={previewTextValue}
                    onChange={setPreviewTextValue}
                    onFocus={() => setActiveHeaderField("previewText")}
                    placeholder="Preview text shown in inbox"
                    ariaLabel="Email preview text"
                  />
                </div>
              </div>
            )}

            {/* Formatting toolbar + Merge Tags — unified section */}
            <div className="border-b border-border">
              {editorEngine === "tiptap" && (
                <div className="flex items-center gap-0.5 px-3 py-1">
                  <FormattingToolbar editor={editor} />
                </div>
              )}
              <div className="flex items-center justify-start py-2" style={contentRowPaddingStyle}>
                <MergeTagsButton editor={editor} onInsert={(name) => insertMergeTagToken(name)} />
              </div>
            </div>

            {/* Editor body */}
            {editorEngine === "tiptap" ? (
              <EmailEditor styles={styles} onEditorReady={setEditor} />
            ) : (
              <EmailEditorBlockNote styles={styles} onEditorReady={setBlocknoteEditor} initialContent={initialBlocknoteDocument} />
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground/40">
            Press &quot;/&quot; for block commands
          </p>
        </div>
      </div>

        {/* ── Docked Styles Sidebar ───────────────────────────────────────── */}
        {stylesPanelOpen && (
            <div
              ref={sidebarRef}
              className="flex w-[280px] flex-shrink-0 flex-col overflow-hidden border-l border-border bg-background"
            >
              <div className="flex h-9 flex-shrink-0 items-center justify-between border-b border-border px-3">
                <span className="text-xs font-semibold text-foreground">Styles</span>
                <button
                  type="button"
                  onClick={() => setStylesPanelOpen(false)}
                  className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground"
                  title="Close styles panel"
                >
                  <PanelRight className="size-3.5" />
                </button>
              </div>
              <StylesPanel
                styles={styles}
                onChange={handleStylesChange}
                onReset={() => handleStylesChange(defaultEmailStyles)}
              />
            </div>
        )}
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

const MERGE_TAG_CATEGORIES = Array.from(new Set(MERGE_TAGS.map((t) => t.category)))

const MERGE_TAG_RE = /(\{\{[^}]+\}\})/

function MergeTagInput({
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
          "w-full bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground/40 outline-none",
          !focused && hasTags && "text-transparent caret-transparent selection:bg-transparent"
        )}
        aria-label={ariaLabel}
      />
      {!focused && segments && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center gap-0.5 overflow-hidden text-sm text-card-foreground"
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

function MergeTagsButton({
  editor,
  onInsert,
}: {
  editor: import("@tiptap/react").Editor | null
  onInsert?: (name: string, label: string) => boolean
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

  const insert = (name: string, label: string) => {
    if (onInsert?.(name, label)) {
      setOpen(false)
      setQuery("")
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = editor as any
    e?.chain().focus().insertContent({ type: "mergeTag", attrs: { name, label } }).run()
    setOpen(false)
    setQuery("")
  }

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
          onMouseDown={(e) => {
            e.preventDefault()
          }}
          className="flex items-center gap-1.5 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground transition-colors hover:bg-accent/80"
        >
          <span className="font-mono text-[11px] text-muted-foreground/50">{"{ }"}</span>
          <span className="font-medium">Merge Tags</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        className="w-72 p-0"
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

        <div className="max-h-80 overflow-y-auto py-1">
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
                        onClick={() => insert(tag.name, tag.label)}
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

// ─── Preview Email Dialog ────────────────────────────────────────────────────

type LoanOption = { id: string; displayId: string; label: string }

type EmailHeaderFields = {
  to: string
  from: string
  subject: string
  replyTo: string
  cc: string
  bcc: string
  previewText: string
}

type ResolvedPreview = {
  headers: EmailHeaderFields
  bodyHtml: string
}

function PreviewEmailDialog({
  open,
  onOpenChange,
  editor,
  blocknoteEditor,
  styles,
  headerFields,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editor: Editor | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocknoteEditor: any
  styles: EmailTemplateStyles
  headerFields: EmailHeaderFields
}) {
  const [loans, setLoans] = useState<LoanOption[]>([])
  const [selectedLoanId, setSelectedLoanId] = useState<string>("")
  const [preview, setPreview] = useState<ResolvedPreview | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch("/api/loans/list")
      .then(async (r) => {
        if (!r.ok) {
          console.error("[PreviewEmailDialog] /api/loans/list returned", r.status)
          return []
        }
        const data = await r.json()
        return Array.isArray(data) ? data : []
      })
      .then((data: LoanOption[]) => setLoans(data))
      .catch((err) => {
        console.error("[PreviewEmailDialog] fetch failed:", err)
        setLoans([])
      })
  }, [open])

  const fetchPreview = useCallback(
    async (loanId: string) => {
      if (!editor && !blocknoteEditor) return
      setLoading(true)
      try {
        const styleOpts = {
          fontFamily: styles.typography.fontFamily,
          fontSize: styles.typography.fontSize,
          lineHeight: styles.typography.lineHeight,
          containerWidth: styles.container.width,
          linkColor: styles.link.color,
          buttonBackground: styles.button.background,
          buttonTextColor: styles.button.textColor,
          buttonRadius: styles.button.radius,
        }

        let bodyHtml: string | undefined
        let editorJson: Record<string, unknown> | undefined

        if (blocknoteEditor) {
          bodyHtml = await new Promise<string>((resolve) => {
            setTimeout(async () => {
              const html = await blocknoteEditor.blocksToHTMLLossy(blocknoteEditor.document)
              resolve(html)
            }, 0)
          })
        } else if (editor) {
          editorJson = editor.getJSON()
        }

        const res = await fetch("/api/email-templates/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loanId: loanId || undefined,
            ...(editorJson ? { editorJson } : { bodyHtml }),
            styles: styleOpts,
            headers: headerFields,
          }),
        })

        const data = await res.json()
        setPreview({
          headers: data.headers,
          bodyHtml: data.bodyHtml,
        })
      } finally {
        setLoading(false)
      }
    },
    [editor, blocknoteEditor, styles, headerFields]
  )

  useEffect(() => {
    if (!open) return
    if (!editor && !blocknoteEditor) return
    const id = setTimeout(() => fetchPreview(""), 0)
    return () => clearTimeout(id)
  }, [open, editor, blocknoteEditor, fetchPreview])

  const h = preview?.headers
  const previewDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">Preview Email</DialogTitle>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground">Merge data from:</span>
              <select
                value={selectedLoanId}
                onChange={(e) => {
                  setSelectedLoanId(e.target.value)
                  fetchPreview(e.target.value)
                }}
                className="rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— Placeholders only —</option>
                {loans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.displayId} {l.label ? `· ${l.label}` : ""}
                  </option>
                ))}
              </select>
              {loading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </DialogHeader>

        {/* Email envelope — mimics email client header */}
        {h && (
          <div className="flex-shrink-0 border-b border-border bg-background px-6 py-4 space-y-1.5">
            {/* Subject */}
            <div className="text-base font-semibold text-foreground leading-tight">
              {h.subject || "(no subject)"}
            </div>

            {/* Date */}
            <div className="text-[11px] text-muted-foreground">{previewDate}</div>

            {/* From */}
            <div className="flex items-baseline gap-1.5 text-[13px]">
              <span className="text-muted-foreground font-medium w-14 text-right shrink-0">From</span>
              <span className="text-foreground">{h.from || <span className="italic text-muted-foreground">not set</span>}</span>
            </div>

            {/* To */}
            <div className="flex items-baseline gap-1.5 text-[13px]">
              <span className="text-muted-foreground font-medium w-14 text-right shrink-0">To</span>
              <span className="text-foreground">{h.to || <span className="italic text-muted-foreground">not set</span>}</span>
            </div>

            {/* CC (only if present) */}
            {h.cc && (
              <div className="flex items-baseline gap-1.5 text-[13px]">
                <span className="text-muted-foreground font-medium w-14 text-right shrink-0">CC</span>
                <span className="text-foreground">{h.cc}</span>
              </div>
            )}

            {/* BCC (only if present) */}
            {h.bcc && (
              <div className="flex items-baseline gap-1.5 text-[13px]">
                <span className="text-muted-foreground font-medium w-14 text-right shrink-0">BCC</span>
                <span className="text-foreground">{h.bcc}</span>
              </div>
            )}

            {/* Reply-To (only if present and different from From) */}
            {h.replyTo && h.replyTo !== h.from && (
              <div className="flex items-baseline gap-1.5 text-[13px]">
                <span className="text-muted-foreground font-medium w-14 text-right shrink-0">Reply-To</span>
                <span className="text-foreground">{h.replyTo}</span>
              </div>
            )}

            {/* Preview text (inbox snippet) */}
            {h.previewText && (
              <div className="mt-1.5 rounded bg-muted/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium">Inbox preview:</span> {h.previewText}
              </div>
            )}
          </div>
        )}

        {/* Email body */}
        <div className="min-h-0 flex-1 overflow-hidden bg-muted">
          {loading && !preview ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : preview ? (
            <iframe
              title="Email preview"
              srcDoc={preview.bodyHtml}
              className="h-full w-full border-0"
              sandbox="allow-popups"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EmailTemplateBuilderLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <Loader2 className="size-5 animate-spin text-[#aaa]" />
    </div>
  )
}

type TemplateData = {
  name?: string
  subject?: string
  preview_text?: string
  from_address?: string
  reply_to?: string
  styles?: Record<string, unknown>
  blocknote_document?: unknown[] | null
}

export function EmailTemplateBuilder({ templateId, templateName = "Untitled Template", onBack }: Props) {
  const roomId = `email_template:${templateId}`
  const [roomReady, setRoomReady] = useState(false)
  const [dbTemplate, setDbTemplate] = useState<TemplateData | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/email-templates/ensure-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    })
      .then(async (res) => {
        if (cancelled) return
        try {
          const json = await res.json()
          if (json.template) setDbTemplate(json.template)
        } catch { /* ignore parse errors */ }
        setRoomReady(true)
      })
      .catch(() => { if (!cancelled) setRoomReady(true) })
    return () => { cancelled = true }
  }, [templateId])

  if (!roomReady) {
    return <EmailTemplateBuilderLoading />
  }

  const initialName = dbTemplate?.name ?? templateName
  const initialStorage = {
    templateName: initialName,
    status: "draft" as const,
    subject: dbTemplate?.subject ?? "",
    fromAddress: dbTemplate?.from_address ?? "",
    replyTo: dbTemplate?.reply_to ?? "",
    previewText: dbTemplate?.preview_text ?? "",
    styles: (dbTemplate?.styles ?? defaultEmailStyles) as unknown as never,
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ cursor: null }}
      initialStorage={initialStorage}
    >
      <ClientSideSuspense fallback={<EmailTemplateBuilderLoading />}>
        <EmailTemplateBuilderInner
          templateId={templateId}
          initialName={initialName}
          initialBlocknoteDocument={dbTemplate?.blocknote_document ?? null}
          onBack={onBack}
        />
      </ClientSideSuspense>
    </RoomProvider>
  )
}
