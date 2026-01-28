"use client"

import * as React from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@clerk/nextjs"
import { Copy, Menu, Pencil, Trash2, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import ReactMarkdown from "react-markdown"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai/conversation"
import { Message, MessageContent, MessageActions } from "@/components/ai/message"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai/prompt-input"

// SWR fetcher
const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

type Chat = { id: string; name?: string; created_at: string; last_used_at: string }
type Program = { id: string; internal_name: string; external_name: string; loan_type: string }
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; created_at?: string }

export default function AIAgentPage() {
  // SWR hooks for data fetching with caching
  const { data: chatsData, isLoading: loadingChats } = useSWR<{ items: Chat[] }>("/api/ai/chats", fetcher)
  const { data: programsData } = useSWR<{ items: Program[] }>("/api/org/programs", fetcher)

  const chats = chatsData?.items ?? []
  const programs = programsData?.items ?? []

  // Local state
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = React.useState<boolean>(false)
  const { orgRole } = useAuth()
  const [selectedProgramId, setSelectedProgramId] = React.useState<string | undefined>(undefined)
  const [loanType, setLoanType] = React.useState<"dscr" | "bridge">("dscr")
  const [selectedChatId, setSelectedChatId] = React.useState<string | undefined>(undefined)
  const [editingChatId, setEditingChatId] = React.useState<string | undefined>(undefined)
  const [editingName, setEditingName] = React.useState<string>("")
  const [isSheetOpen, setIsSheetOpen] = React.useState<boolean>(false)
  const [keyboardOffset, setKeyboardOffset] = React.useState<number>(0)

  // Auto-select first chat when chats load
  React.useEffect(() => {
    if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0].id)
    }
  }, [chats, selectedChatId])

  // Load messages for selected chat using SWR
  const { data: messagesData, isLoading: messagesLoading } = useSWR<{ items: ChatMessage[] }>(
    selectedChatId ? `/api/ai/chats/${selectedChatId}/messages` : null,
    fetcher
  )

  // Sync SWR messages data to local state for optimistic updates
  React.useEffect(() => {
    if (messagesData?.items) {
      setMessages(messagesData.items)
    } else if (!selectedChatId) {
      setMessages([])
    }
  }, [messagesData, selectedChatId])

  // Track mobile keyboard height
  React.useEffect(() => {
    if (typeof window === "undefined" || !("visualViewport" in window)) return
    const vv = (window as any).visualViewport as VisualViewport
    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardOffset(Math.round(overlap))
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])

  // Keep selected program in sync with chosen loan type
  React.useEffect(() => {
    const filtered = programs.filter((p) => p.loan_type === loanType)
    if (!filtered.find((p) => p.id === selectedProgramId)) {
      setSelectedProgramId(filtered[0]?.id)
    }
  }, [loanType, programs, selectedProgramId])

  async function createNewConversation() {
    try {
      const res = await fetch("/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New chat" }),
      })
      const json = (await res.json()) as { ok: boolean; chat?: Chat }
      if (json.ok && json.chat) {
        mutate("/api/ai/chats", (data: { items: Chat[] } | undefined) => ({
          items: [json.chat!, ...(data?.items ?? [])],
        }), false)
        setSelectedChatId(json.chat.id)
        setEditingChatId(json.chat.id)
        setEditingName(json.chat.name ?? "New chat")
      }
    } catch {
      // no-op
    }
  }

  async function handleSend(message: PromptInputMessage) {
    if (!message.text.trim() || !selectedChatId) return
    const prompt = message.text
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: prompt }
    setMessages((prev) => [...prev, userMessage])

    mutate("/api/ai/chats", (data: { items: Chat[] } | undefined) => {
      if (!data) return data
      const nowIso = new Date().toISOString()
      const updated = data.items.map((c) =>
        c.id === selectedChatId ? { ...c, last_used_at: nowIso } : c
      )
      updated.sort((a, b) => new Date(b.last_used_at ?? b.created_at).getTime() - new Date(a.last_used_at ?? a.created_at).getTime())
      return { items: updated }
    }, false)

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
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId ? { id: crypto.randomUUID(), role: "assistant", content: aiText } : m
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { id: crypto.randomUUID(), role: "assistant", content: "There was a problem generating a response." }
            : m
        )
      )
    } finally {
      setIsThinking(false)
    }
  }

  async function handleRenameChat(chatId: string, newName: string) {
    const toSave = newName.trim() || "New chat"
    try {
      const res = await fetch(`/api/ai/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: toSave }),
      })
      const json = (await res.json()) as { ok: boolean; chat?: Chat; error?: string }
      if (json.ok && json.chat) {
        mutate("/api/ai/chats", (data: { items: Chat[] } | undefined) => ({
          items: (data?.items ?? []).map((x) => (x.id === chatId ? { ...x, name: json.chat!.name } : x)),
        }), false)
        toast({ title: "Chat renamed" })
      } else {
        toast({ title: "Rename failed", description: json.error ?? "", variant: "destructive" })
      }
    } finally {
      setEditingChatId(undefined)
    }
  }

  async function handleDeleteChat(chatId: string) {
    try {
      const res = await fetch(`/api/ai/chats/${chatId}`, { method: "DELETE" })
      const json = (await res.json()) as { ok: boolean; error?: string }
      if (json.ok) {
        mutate("/api/ai/chats", (data: { items: Chat[] } | undefined) => ({
          items: (data?.items ?? []).filter((x) => x.id !== chatId),
        }), false)
        if (selectedChatId === chatId) {
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
  }

  const ChatListItem = ({ c, isMobile = false }: { c: Chat; isMobile?: boolean }) => {
    const commonClass =
      "w-full rounded-md px-2 py-2 text-left text-sm " +
      (selectedChatId === c.id ? "bg-muted font-medium" : "hover:bg-muted")

    if (editingChatId === c.id) {
      return (
        <div key={c.id} className={commonClass}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRenameChat(c.id, editingName)
            }}
            onBlur={() => handleRenameChat(c.id, editingName)}
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
        onClick={() => {
          setSelectedChatId(c.id)
          if (isMobile) setIsSheetOpen(false)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setSelectedChatId(c.id)
            if (isMobile) setIsSheetOpen(false)
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
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteChat(c.id)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const ChatListSkeleton = () => (
    <div className="flex flex-col gap-2 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-md px-2 py-2">
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )

  return (
    <div data-layout="fixed" className="fixed inset-0 md:static flex h-[100dvh] md:h-full min-h-0 flex-1 overflow-hidden overscroll-y-contain">
      <aside className="hidden md:block w-[260px] shrink-0 border-r bg-muted/40">
        <div className="p-4">
          <div className="mb-2">
            <div className="text-lg font-semibold">AI Agent</div>
            <div className="text-xs text-muted-foreground">Your conversations</div>
          </div>
          <Button type="button" size="sm" className="w-full" onClick={createNewConversation}>
            New Conversation
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-72px)] px-2">
          {loadingChats ? (
            <ChatListSkeleton />
          ) : chats.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No chats yet. Create your first conversation.
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {chats.map((c) => (
                <ChatListItem key={c.id} c={c} />
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="md:hidden shrink-0"
                onClick={() => setIsSheetOpen(true)}
                aria-label="Open conversations"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="hidden md:block text-base font-semibold truncate">
                {chats.find((c) => c.id === selectedChatId)?.name?.trim() || "Chat"}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2 min-w-0 overflow-hidden flex-1 justify-end">
              <div className="min-w-0 flex-1 md:flex-none md:w-[160px]">
                <Select value={loanType} onValueChange={(v) => setLoanType(v as "dscr" | "bridge")}>
                  <SelectTrigger className="h-8 w-full truncate">
                    <SelectValue placeholder="Loan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dscr">DSCR</SelectItem>
                    <SelectItem value="bridge">Bridge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 flex-1 md:flex-none md:w-[220px]">
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger className="h-8 w-full truncate">
                    <SelectValue placeholder="Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs
                      .filter((p) => p.loan_type === loanType)
                      .map((p) => {
                        const isBroker = orgRole === "org:broker" || orgRole === "broker"
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

          <div className="relative flex min-h-0 flex-1 flex-col">
            {selectedChatId ? (
              <Conversation className="flex-1 min-h-0 px-3">
                <ConversationContent className="mx-auto max-w-2xl pt-4 pb-6">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <ConversationEmptyState
                      title="Start a conversation"
                      description="Send a message to begin chatting with your AI Agent"
                      icon={<MessageSquare className="size-6" />}
                    />
                  ) : (
                    <>
                      {messages.map((m) => (
                        <Message key={m.id} from={m.role}>
                          <MessageContent>
                            {m.id.startsWith("thinking-") ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-muted-foreground">Thinking...</span>
                              </div>
                            ) : (
                              <div
                                className={
                                  m.role === "user"
                                    ? "prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 [&_*]:text-primary-foreground"
                                    : "prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
                                }
                              >
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                              </div>
                            )}
                          </MessageContent>
                          {!m.id.startsWith("thinking-") && m.content && (
                            <MessageActions className={m.role === "user" ? "justify-end" : ""}>
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
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </MessageActions>
                          )}
                        </Message>
                      ))}
                    </>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            ) : (
              <div className="flex-1 grid place-items-center p-6">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <div className="mb-2 text-lg font-semibold">No conversation selected</div>
                  <div className="mb-3 text-sm text-muted-foreground">
                    Create a new conversation to start chatting with your AI Agent.
                  </div>
                  <Button onClick={createNewConversation} size="sm">
                    New Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>

          <PromptInput
            onSubmit={handleSend}
            className="sticky bottom-0 z-10 w-full border-t bg-background px-3 py-2 pb-[env(safe-area-inset-bottom)]"
            style={keyboardOffset ? ({ bottom: keyboardOffset } as React.CSSProperties) : undefined}
          >
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 pb-2">
              <PromptInputTextarea placeholder="Ask your AI Agent…" />
              <PromptInputFooter>
                <div />
                <PromptInputSubmit
                  disabled={!selectedChatId}
                  status={isThinking ? "streaming" : undefined}
                />
              </PromptInputFooter>
            </div>
          </PromptInput>
        </div>
      </section>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="left" className="w-[85vw] sm:max-w-sm p-0">
          <div className="border-b px-4 py-3">
            <div className="text-base font-semibold">AI Agent</div>
            <div className="text-xs text-muted-foreground">Your conversations</div>
          </div>
          <div className="p-4 pt-3">
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={async () => {
                await createNewConversation()
                setIsSheetOpen(false)
              }}
            >
              New Conversation
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-116px)] px-2">
            {loadingChats ? (
              <ChatListSkeleton />
            ) : chats.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                No chats yet. Create your first conversation.
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                {chats.map((c) => (
                  <ChatListItem key={c.id} c={c} isMobile />
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
