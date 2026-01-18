"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { isUuid } from "@/lib/uuid"

type ChatMessage = {
  id: string
  user_type: "user" | "agent"
  content: string
  created_at: string
  user_id: string
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
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

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
          setMessages(j.messages as ChatMessage[])
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const [sending, setSending] = useState(false)

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
        // Add AI response if present
        if (j?.agentMessage) {
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

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 pr-2">
          {messages.length === 0 && !sending ? (
            <div className="text-sm text-muted-foreground">Start chatting with the AI assistant.</div>
          ) : (
            messages.map((m) => (
              <div 
                key={m.id} 
                className={cn(
                  "rounded-md p-3 text-sm",
                  m.user_type === "user" 
                    ? "bg-primary text-primary-foreground ml-8" 
                    : "bg-muted mr-8"
                )}
              >
                <div className={cn(
                  "mb-1 text-xs font-medium",
                  m.user_type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {m.user_type === "user" ? "You" : "AI"}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))
          )}
          {sending && (
            <div className="rounded-md bg-muted p-3 text-sm mr-8 animate-pulse">
              <div className="mb-1 text-xs font-medium text-muted-foreground">AI</div>
              <div className="text-muted-foreground">Thinking...</div>
            </div>
          )}
          {error ? <div className="text-xs text-destructive">{error}</div> : null}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2">
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
