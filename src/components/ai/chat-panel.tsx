"use client"

import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { isUuid } from "@/lib/uuid"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai/conversation"

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
  const [ready, setReady] = useState(false)
  const [sending, setSending] = useState(false)

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
    <div className={cn("flex flex-col", className)}>
      <Conversation className="flex-1 min-h-0 overflow-hidden">
        {messages.length === 0 && !sending ? (
          <ConversationEmptyState
            icon={<MessageSquare className="size-8" />}
            title="No messages yet"
            description="Start chatting with the AI assistant"
          />
        ) : (
          <ConversationContent className="gap-3 p-2">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={cn(
                  "rounded-lg p-3 text-sm max-w-[85%]",
                  m.user_type === "user" 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : "bg-muted mr-auto"
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
            ))}
            {sending && (
              <div className="rounded-lg bg-muted p-3 text-sm mr-auto max-w-[85%] animate-pulse">
                <div className="mb-1 text-xs font-medium text-muted-foreground">AI</div>
                <div className="text-muted-foreground">Thinking...</div>
              </div>
            )}
            {error ? <div className="text-xs text-destructive">{error}</div> : null}
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>

      <div className="flex items-center gap-2 pt-3 mt-auto">
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
