"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Send, Bot, Loader2, Sparkles, FileText, MessageSquare } from "lucide-react"
import type { BBox } from "./pdf-viewer"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai/conversation"
import { Message, MessageContent, MessageActions } from "@/components/ai/message"

export interface Citation {
  docId?: string
  chunkId?: string
  page: number
  bbox: BBox
  snippet: string
  whyRelevant?: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
}

interface TestChatPanelProps {
  className?: string
  title?: string
  onCitationClick?: (page: number, bbox: BBox) => void
}

const WEBHOOK_URL = "https://n8n.axora.info/webhook/0d715985-5cc6-40b4-9ddc-864a6c336770"

export function TestChatPanel({ className, title = "AI Assistant", onCitationClick }: TestChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "36px" // Reset to min height
    const scrollHeight = textarea.scrollHeight
    textarea.style.height = `${Math.min(scrollHeight, 120)}px` // Max 120px (~4 lines)
  }, [])

  React.useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      })

      const data = await response.json()
      
      // Parse the response format: [{ output: { answer, citations, highlights } }]
      let answerText = "Sorry, I couldn't process that request."
      let citations: Citation[] = []

      if (Array.isArray(data) && data.length > 0) {
        const output = data[0]?.output
        if (output) {
          answerText = output.answer || answerText
          citations = output.citations || []
        }
      } else if (data?.output) {
        // Handle non-array response
        answerText = data.output.answer || answerText
        citations = data.output.citations || []
      } else if (typeof data === "string") {
        answerText = data
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answerText,
        citations: citations.length > 0 ? citations : undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Webhook error:", error)
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, there was an error connecting to the AI service.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleCitationClick = (citation: Citation) => {
    if (onCitationClick) {
      onCitationClick(citation.page, citation.bbox)
    }
  }

  return (
    <div className={cn("flex h-full flex-col bg-background border-l", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">Ask questions about the document</p>
        </div>
      </div>

      {/* Messages Area with Conversation Component */}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="No messages yet"
              description="Start a conversation by typing a message below"
              icon={<MessageSquare className="size-6" />}
            />
          ) : (
            <>
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </MessageContent>
                  
                  {/* Citation links for assistant messages */}
                  {message.role === "assistant" && message.citations && message.citations.length > 0 && (
                    <MessageActions>
                      <div className="flex flex-col gap-1">
                        {message.citations.map((citation, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCitationClick(citation)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 hover:underline transition-colors text-left"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span>
                              Source: Page {citation.page}
                              {citation.snippet && (
                                <span className="text-muted-foreground ml-1">
                                  — "{citation.snippet.substring(0, 40)}{citation.snippet.length > 40 ? "..." : ""}"
                                </span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </MessageActions>
                  )}
                </Message>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <Message from="assistant">
                  <MessageContent>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground">Thinking...</span>
                    </div>
                  </MessageContent>
                </Message>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[36px] max-h-[120px] h-[36px] resize-none text-sm flex-1 py-2 overflow-y-auto"
            disabled={isLoading}
            rows={1}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
