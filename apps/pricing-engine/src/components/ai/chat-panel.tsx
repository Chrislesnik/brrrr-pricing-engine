"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { cn } from "@repo/lib/cn"
import { isUuid } from "@/lib/uuid"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai/conversation"
import { Suggestions, Suggestion } from "@/components/ai/suggestion"

type ChatMessage = {
  id: string
  user_type: "user" | "agent"
  content: string
  created_at: string
  user_id: string
}

type ParsedContent = {
  text: string
  status: "pass" | "fail" | "warning" | "neutral"
}

function parseChatContent(message: ChatMessage): ParsedContent {
  if (message.user_type === "user") {
    return { text: message.content, status: "neutral" }
  }

  try {
    const parsed = JSON.parse(message.content)
    if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
      const statusRaw = typeof parsed.status === "string" ? parsed.status.toLowerCase() : "neutral"
      const status: ParsedContent["status"] =
        statusRaw === "pass" || statusRaw === "fail" || statusRaw === "warning" ? statusRaw : "neutral"
      return { text: parsed.message, status }
    }
  } catch {
    // Fallback to plain text
  }

  return { text: message.content, status: "neutral" }
}

export function ChatPanel({
  className,
  reportId,
  onNeedAuth,
}: {
  className?: string
  reportId?: string
  onNeedAuth?: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const animatedText = useRef<Record<string, string>>({})
  const [visibleText, setVisibleText] = useState<Record<string, string>>({})
  const animatedDoneRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Record<string, number>>({})
  const initialLoadRef = useRef(true)

  // Keep the view pinned to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  // Also scroll as the typewriter reveals text
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleText])

  // Load chat + latest messages when reportId changes
  useEffect(() => {
    let active = true
    async function load() {
      const normalized = reportId?.trim()
      if (!normalized || !isUuid(normalized)) {
        setMessages([])
        setReady(false)
        setError(null)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/credit-reports/${normalized}/chat`, { cache: "no-store" })
        if (res.status === 401 && onNeedAuth) onNeedAuth()
        const j = await res.json()
        if (!active) return
        if (res.ok && Array.isArray(j?.messages)) {
          const msgs = j.messages as ChatMessage[]
          setMessages(msgs)
          // Initial load: populate visible text without animation
          const next: Record<string, string> = {}
          msgs.forEach((m) => {
            const parsed = parseChatContent(m)
            next[m.id] = parsed.text
            animatedDoneRef.current.add(m.id)
          })
          animatedText.current = next
          setVisibleText(next)
          initialLoadRef.current = false
          setReady(true)
        } else {
          setError(j?.error || "Failed to load chat")
        }
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : "Failed to load chat")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [reportId, onNeedAuth])

  async function send() {
    const normalized = reportId?.trim()
    if (!normalized || !isUuid(normalized)) return
    const content = input.trim()
    if (!content) return
    setInput("")
    setSending(true)
    
    // Optimistic append user message
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_type: "user",
      content,
      created_at: new Date().toISOString(),
      user_id: "me",
    }
    setMessages((prev) => [...prev, optimistic])
    
    try {
      const res = await fetch(`/api/credit-reports/${normalized}/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(j?.error || `Send failed (${res.status})`)
      }
      
      // Replace optimistic with persisted user message
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== optimistic.id)
        const newMessages = [...withoutTemp]
        if (j?.message) {
          newMessages.push(j.message as ChatMessage)
        }
        // Add AI response(s) if present
        if (Array.isArray(j?.agentMessages)) {
          j.agentMessages.forEach((am: ChatMessage) => newMessages.push(am))
        } else if (j?.agentMessage) {
          newMessages.push(j.agentMessage as ChatMessage)
        }
        return newMessages
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  // Animate new agent messages with a typewriter effect
  useEffect(() => {
    messages.forEach((m) => {
      if (animatedDoneRef.current.has(m.id)) return
      const parsed = parseChatContent(m)

      // User messages (or empty text) appear instantly
      if (m.user_type === "user" || !parsed.text) {
        animatedDoneRef.current.add(m.id)
        animatedText.current = { ...animatedText.current, [m.id]: parsed.text }
        setVisibleText((prev) => ({ ...prev, [m.id]: parsed.text }))
        return
      }

      // Skip animation on first load
      if (initialLoadRef.current) {
        animatedDoneRef.current.add(m.id)
        animatedText.current = { ...animatedText.current, [m.id]: parsed.text }
        setVisibleText((prev) => ({ ...prev, [m.id]: parsed.text }))
        return
      }

      const full = parsed.text
      animatedText.current = { ...animatedText.current, [m.id]: "" }
      setVisibleText((prev) => ({ ...prev, [m.id]: "" }))
      let i = 0
      const timer = window.setInterval(() => {
        i += 1
        const slice = full.slice(0, i)
        animatedText.current = { ...animatedText.current, [m.id]: slice }
        setVisibleText((prev) => ({ ...prev, [m.id]: slice }))
        if (i >= full.length) {
          clearInterval(timer)
          delete timersRef.current[m.id]
          animatedDoneRef.current.add(m.id)
        }
      }, 12) // ~80 chars/sec
      timersRef.current[m.id] = timer
    })

    return () => {
      Object.values(timersRef.current).forEach((t) => clearInterval(t))
      timersRef.current = {}
    }
  }, [messages])

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <Conversation className="flex-1 min-h-0">
        {messages.length === 0 && !sending ? (
          <ConversationEmptyState
            icon={<MessageSquare className="size-8" />}
            title="No messages yet"
            description="Start chatting with the AI assistant"
          />
        ) : (
          <ConversationContent className="gap-3 p-2">
            {messages.map((m) => (
              (() => {
                const parsed = parseChatContent(m)
                const isUser = m.user_type === "user"
                const statusClass = isUser
                  ? "bg-primary text-primary-foreground ml-auto"
                  : parsed.status === "pass"
                    ? "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-50 mr-auto"
                    : parsed.status === "fail"
                      ? "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-50 mr-auto"
                      : parsed.status === "warning"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-50 mr-auto"
                        : "bg-muted text-foreground mr-auto"

                return (
                  <div key={m.id} className={cn("rounded-lg p-3 text-sm max-w-[85%]", statusClass)}>
                    <div className="whitespace-pre-wrap">{visibleText[m.id] ?? parsed.text}</div>
                  </div>
                )
              })()
            ))}
            {sending && (
              <div className="rounded-lg bg-muted p-3 text-sm mr-auto max-w-[85%] animate-pulse">
                <div className="text-muted-foreground">Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} aria-hidden="true" />
            {error ? <div className="text-xs text-destructive">{error}</div> : null}
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>

      <Suggestions className="pb-2">
        <Suggestion 
          suggestion="Does the borrower qualify?"
          onClick={(s) => setInput(s)}
        />
        <Suggestion 
          suggestion="What is the borrower's Mid-FICO score?"
          onClick={(s) => setInput(s)}
        />
        <Suggestion 
          suggestion="Does the borrower have any mortgage lates?"
          onClick={(s) => setInput(s)}
        />
      </Suggestions>

      <div className="flex items-center gap-2 mt-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !sending && ready && input.trim()) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Ask the assistant..."
          autoComplete="off"
          className="flex-1"
          disabled={!ready || sending}
        />
        <Button onClick={send} disabled={loading || sending || !ready || !input.trim()}>
          {sending ? "Thinking..." : loading ? "Loading..." : "Send"}
        </Button>
      </div>
    </div>
  )
}

export default ChatPanel
