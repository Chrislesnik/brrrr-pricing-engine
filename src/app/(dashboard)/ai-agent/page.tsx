"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@clerk/nextjs"
import { ArrowDown, Copy, Pencil, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function AIAgentPage() {
  // Local chat state managed by our n8n-backed API
  const [messages, setMessages] = React.useState<{ id: string; role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = React.useState<string>("")
  const [isThinking, setIsThinking] = React.useState<boolean>(false)
  const formRef = React.useRef<HTMLFormElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const MAX_COMPOSER_HEIGHT = 160 // px
  const { orgRole } = useAuth()
  const [programs, setPrograms] = React.useState<
    { id: string; internal_name: string; external_name: string; loan_type: string }[]
  >([])
  const [selectedProgramId, setSelectedProgramId] = React.useState<string | undefined>(undefined)
  const [loanType, setLoanType] = React.useState<"dscr" | "bridge">("dscr")
  const [chats, setChats] = React.useState<{ id: string; name?: string; created_at: string; last_used_at: string }[]>([])
  const [selectedChatId, setSelectedChatId] = React.useState<string | undefined>(undefined)
  const [loadingChats, setLoadingChats] = React.useState<boolean>(false)
  const [editingChatId, setEditingChatId] = React.useState<string | undefined>(undefined)
  const [editingName, setEditingName] = React.useState<string>("")

  // Chat scroll management
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const isUserAtBottomRef = React.useRef<boolean>(true)
  const [showScrollDown, setShowScrollDown] = React.useState<boolean>(false)
  const bottomSentinelRef = React.useRef<HTMLDivElement | null>(null)

  const autoResize = React.useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    const next = Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_COMPOSER_HEIGHT ? "auto" : "hidden"
  }, [])

  React.useEffect(() => {
    autoResize()
  }, [input, autoResize])

  // Optimistically bump the selected chat's last_used_at and re-sort list
  const bumpSelectedChat = React.useCallback(() => {
    setChats((prev) => {
      if (!selectedChatId) return prev
      const nowIso = new Date().toISOString()
      const next = prev.map((c) => (c.id === selectedChatId ? { ...c, last_used_at: nowIso } : c))
      next.sort((a, b) => {
        const av = new Date(a.last_used_at ?? a.created_at).getTime()
        const bv = new Date(b.last_used_at ?? b.created_at).getTime()
        return bv - av
      })
      return next
    })
  }, [selectedChatId])

  // Resolve the Radix ScrollArea viewport and bind observer/listeners
  React.useEffect(() => {
    const root = scrollAreaRef.current
    if (!root) return
    const vp = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null
    if (!vp) return
    viewportRef.current = vp
    // Observe visibility of the bottom sentinel within the viewport
    const sentinel = bottomSentinelRef.current
    if (!sentinel) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const atBottom = !!entry?.isIntersecting
        isUserAtBottomRef.current = atBottom
        setShowScrollDown(!atBottom)
      },
      { root: vp, threshold: 0.9 }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [selectedChatId])

  async function loadChats() {
    setLoadingChats(true)
    try {
      const res = await fetch("/api/ai/chats", { cache: "no-store" })
      const json = (await res.json()) as {
        items: { id: string; name?: string; created_at: string; last_used_at: string }[]
      }
      const items = json.items ?? []
      setChats(items)
      // On first visit or when no chat selected, auto-select the most recent chat
      if (!selectedChatId && items.length > 0) {
        setSelectedChatId(items[0].id)
      }
    } catch {
      setChats([])
    } finally {
      setLoadingChats(false)
    }
  }

  React.useEffect(() => {
    loadChats()
  }, [])

  // Load messages for the selected conversation
  React.useEffect(() => {
    let active = true
    const load = async () => {
      if (!selectedChatId) {
        setMessages([])
        return
      }
      try {
        const res = await fetch(`/api/ai/chats/${selectedChatId}/messages`, { cache: "no-store" })
        const json = (await res.json()) as {
          items: { id: string; role: "user" | "assistant"; content: string; created_at: string }[]
        }
        if (!active) return
        setMessages(json.items ?? [])
      } catch {
        if (!active) return
        setMessages([])
      }
    }
    load()
    return () => {
      active = false
    }
  }, [selectedChatId])

  // Auto-scroll on new messages only if user is at bottom
  React.useEffect(() => {
    if (isUserAtBottomRef.current) {
      bottomSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [messages])

  const scrollToBottom = React.useCallback(() => {
    bottomSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [])

  async function createNewConversation() {
    try {
      const res = await fetch("/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New chat" }),
      })
      const json = (await res.json()) as {
        ok: boolean
        chat?: { id: string; name?: string; created_at: string; last_used_at: string }
      }
      if (json.ok && json.chat) {
        setChats((prev) => [json.chat!, ...prev])
        setSelectedChatId(json.chat.id)
        // Enter inline rename mode
        setEditingChatId(json.chat.id)
        setEditingName(json.chat.name ?? "New chat")
      }
    } catch {
      // no-op
    }
  }

  React.useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/org/programs", { cache: "no-store" })
        const json = (await res.json()) as {
          items: { id: string; loan_type: string; internal_name: string; external_name: string }[]
        }
        if (!active) return
        setPrograms(json.items ?? [])
      } catch {
        if (!active) return
        setPrograms([])
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Keep selected program in sync with chosen loan type
  React.useEffect(() => {
    const filtered = programs.filter((p) => p.loan_type === loanType)
    if (!filtered.find((p) => p.id === selectedProgramId)) {
      setSelectedProgramId(filtered[0]?.id)
    }
  }, [loanType, programs, selectedProgramId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selectedChatId) return
    const prompt = input
    // Add the user message immediately
    const userMessage = { id: crypto.randomUUID(), role: "user" as const, content: prompt }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    // bump timestamp locally for seamless refresh
    bumpSelectedChat()

    // Show thinking indicator
    setIsThinking(true)
    const thinkingId = `thinking-${Date.now()}`
    setMessages((prev) => [...prev, { id: thinkingId, role: "assistant", content: "…" }])

    try {
      const res = await fetch("/api/ai/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedChatId,
          program_id: selectedProgramId ?? null,
          prompt,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; response?: string }
      const aiText = (json?.response ?? "").toString().trim() || "Sorry, I couldn't generate a response."
      // Replace thinking bubble with actual response
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { id: crypto.randomUUID(), role: "assistant", content: aiText }
            : m
        )
      )
      // bump again for assistant response
      bumpSelectedChat()
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { id: crypto.randomUUID(), role: "assistant", content: "There was a problem generating a response." }
            : m
        )
      )
      bumpSelectedChat()
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div data-layout="fixed" className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Left column: chat threads (placeholder for Supabase integration) */}
      <aside className="w-[260px] shrink-0 border-r bg-muted/40">
        <div className="p-4">
          <div className="mb-2">
            <div className="text-lg font-semibold">AI Agent</div>
            <div className="text-xs text-muted-foreground">Your conversations</div>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={createNewConversation}
          >
            New Conversation
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-72px)] px-2">
          {loadingChats ? (
            <div className="p-2 text-sm text-muted-foreground">Loading chats…</div>
          ) : chats.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No chats yet. Create your first conversation.
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {chats.map((c) => {
                const commonClass =
                  "w-full rounded-md px-2 py-2 text-left text-sm " +
                  (selectedChatId === c.id ? "bg-muted font-medium" : "hover:bg-muted")
                if (editingChatId === c.id) {
                  return (
                    <div key={c.id} className={commonClass}>
                      <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const toSave = editingName.trim() || "New chat"
                        try {
                          const res = await fetch(`/api/ai/chats/${c.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: toSave }),
                          })
                          const json = (await res.json()) as { ok: boolean; chat?: typeof c }
                          if (json.ok && json.chat) {
                            setChats((prev) =>
                              prev.map((x) => (x.id === c.id ? { ...x, name: json.chat!.name } : x))
                            )
                            if (selectedChatId === c.id) {
                              // update header immediately
                              // setState already updated chats; nothing else required
                            }
                            toast({ title: "Chat renamed" })
                          } else {
                            toast({ title: "Rename failed", description: json?.["error"] ?? "", variant: "destructive" })
                          }
                        } finally {
                          setEditingChatId(undefined)
                        }
                      }}
                      onBlur={async () => {
                        // Save on blur
                        const toSave = editingName.trim() || "New chat"
                        try {
                          const res = await fetch(`/api/ai/chats/${c.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: toSave }),
                          })
                          const json = (await res.json()) as { ok: boolean; chat?: typeof c }
                          if (json.ok && json.chat) {
                            setChats((prev) =>
                              prev.map((x) => (x.id === c.id ? { ...x, name: json.chat!.name } : x))
                            )
                            toast({ title: "Chat renamed" })
                          } else {
                            toast({ title: "Rename failed", description: json?.["error"] ?? "", variant: "destructive" })
                          }
                        } finally {
                          setEditingChatId(undefined)
                        }
                      }}
                      >
                        <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault()
                            setEditingChatId(undefined)
                          } else if (e.key === "Enter") {
                            // ensure form submit on Enter
                            e.preventDefault()
                            ;(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit()
                          }
                        }}
                        className="h-8"
                        />
                      </form>
                    </div>
                  )
                }
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className={"relative group " + commonClass}
                    onClick={() => setSelectedChatId(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedChatId(c.id)
                      }
                    }}
                  >
                    <div
                      className="truncate pr-12"
                      onDoubleClick={() => {
                        setEditingChatId(c.id)
                        setEditingName(c.name ?? "")
                      }}
                    >
                      {c.name?.trim() ? c.name : `Conversation ${c.id.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-muted-foreground pr-12">
                      {new Date(c.last_used_at ?? c.created_at).toLocaleString()}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-2 hidden items-center gap-1 group-hover:flex">
                      <button
                        type="button"
                        className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-sm text-foreground/70 hover:text-purple-500 focus:outline-hidden"
                        aria-label="Rename chat"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingChatId(c.id)
                          setEditingName(c.name ?? "")
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-sm text-foreground/70 hover:text-red-500 focus:outline-hidden"
                        aria-label="Delete chat"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const res = await fetch(`/api/ai/chats/${c.id}`, { method: "DELETE" })
                            const json = (await res.json()) as { ok: boolean; error?: string }
                            if (json.ok) {
                              setChats((prev) => prev.filter((x) => x.id !== c.id))
                              if (selectedChatId === c.id) {
                                setSelectedChatId(undefined)
                                setMessages([])
                              }
                              toast({ title: "Chat deleted" })
                            } else {
                              toast({ title: "Delete failed", description: json.error ?? "", variant: "destructive" })
                            }
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : "Failed to delete chat"
                            toast({ title: "Delete failed", description: msg, variant: "destructive" })
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Right column: active chat */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Messages area - flush to top and left */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Chat header with Programs dropdown */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h2 className="text-base font-semibold truncate" title={chats.find((c) => c.id === selectedChatId)?.name || "Chat"}>
              {chats.find((c) => c.id === selectedChatId)?.name?.trim() || "Chat"}
            </h2>
            <div className="flex items-center gap-2">
              {/* Loan Type selector */}
              <div className="min-w-[160px]">
                <Select value={loanType} onValueChange={(v) => setLoanType(v as "dscr" | "bridge")}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Loan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dscr">DSCR</SelectItem>
                    <SelectItem value="bridge">Bridge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Programs selector (filtered by loan type) */}
              <div className="min-w-[220px]">
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Programs" />
                </SelectTrigger>
                <SelectContent>
                  {programs
                    .filter((p) => p.loan_type === loanType)
                    .map((p) => {
                    const isBroker =
                      orgRole === "org:broker" || orgRole === "broker"
                    const label = isBroker ? p.external_name || p.internal_name : p.internal_name || p.external_name
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>
          <div className="relative flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full px-0 py-0">
            {selectedChatId && (
              <div className="mx-auto max-w-2xl space-y-3 pt-4 pb-6">
              {messages.map((m) => (
                <div key={m.id} className="flex group">
                  <div
                    className={
                      (m.role === "user"
                          ? "ml-auto"
                          : "mr-auto") +
                      " relative whitespace-pre-wrap rounded-2xl px-3 py-2 " +
                      (m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted")
                    }
                  >
                    {m.id.startsWith("thinking-") ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground [animation-delay:-0.2s]" />
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground [animation-delay:-0.1s]" />
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground" />
                      </span>
                    ) : (
                      m.content
                    )}
                    {!m.id.startsWith("thinking-") && m.content ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(m.content)
                            toast({ title: "Copied to clipboard" })
                          } catch {
                            toast({ title: "Copy failed", variant: "destructive" })
                          }
                        }}
                        aria-label="Copy message"
                        className={
                          "absolute -bottom-3 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/50 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 " +
                          (m.role === "user"
                            ? "bg-foreground text-background hover:bg-foreground/90"
                            : "bg-background text-foreground hover:bg-muted")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={bottomSentinelRef} aria-hidden="true" />
            </div>
            )}
          </ScrollArea>
          {!selectedChatId ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
              <div className="pointer-events-auto text-center">
                <div className="mb-2 text-lg font-semibold">No conversation selected</div>
                <div className="mb-3 text-sm text-muted-foreground">
                  Create a new conversation to start chatting with your AI Agent.
                </div>
                <Button onClick={createNewConversation} size="sm">
                  New Conversation
                </Button>
              </div>
            </div>
          ) : null}
          {showScrollDown ? (
            <Button
              type="button"
              size="icon"
              onClick={scrollToBottom}
              className="absolute bottom-3 left-1/2 z-20 h-10 w-10 -translate-x-1/2 rounded-full border bg-foreground/80 text-background shadow-md transition-colors transition-opacity duration-200 ease-out opacity-70 hover:opacity-100 hover:bg-foreground"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          ) : null}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSend}
            ref={formRef}
            className="sticky bottom-0 z-10 w-full border-t bg-background px-3 py-2"
          >
            <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI Agent…"
                autoComplete="off"
                rows={2}
                className="min-h-12 max-h-[160px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    formRef.current?.requestSubmit()
                  }
                }}
                onInput={autoResize}
              />
              <Button type="submit" disabled={!input.trim() || !selectedChatId}>
                Send
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}


