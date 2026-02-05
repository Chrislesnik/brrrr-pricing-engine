"use client"

import * as React from "react"
import {
  Send,
  Loader2,
  Sparkles,
  FileText,
  MessageSquare,
  ClipboardList,
  Check,
  X,
} from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { ScrollArea } from "@repo/ui/shadcn/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/shadcn/tabs"
import { Textarea } from "@repo/ui/shadcn/textarea"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai/conversation"
import {
  Message,
  MessageContent,
  MessageActions,
} from "@/components/ai/message"
import type { BBox } from "./pdf-viewer"

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

interface DetailItemData {
  label: string
  output: {
    answer: string
    notFound?: boolean
    confidence?: number
    citations?: Citation[]
    highlights?: { page: number; bbox: BBox }[]
  }
}

interface TestChatPanelProps {
  className?: string
  title?: string
  onCitationClick?: (page: number, bbox: BBox) => void
}

const WEBHOOK_URL =
  "https://n8n.axora.info/webhook/0d715985-5cc6-40b4-9ddc-864a6c336770"
const DETAILS_WEBHOOK_URL =
  "https://n8n.axora.info/webhook/33ca257e-24a2-483a-88c5-5d2fa7d8865f"

// DetailItem component for the Details tab
function DetailItem({
  item,
  onCitationClick,
}: {
  item: DetailItemData
  onCitationClick?: (page: number, bbox: BBox) => void
}) {
  const [value, setValue] = React.useState(item.output.answer)
  const [status, setStatus] = React.useState<
    "neutral" | "approved" | "rejected"
  >("neutral")

  const handleCitationClick = (citation: Citation) => {
    console.log("[DetailItem] Citation clicked:", { page: citation.page, bbox: citation.bbox, label: item.label })
    if (onCitationClick) {
      onCitationClick(citation.page, citation.bbox)
    } else {
      console.warn("[DetailItem] onCitationClick is NOT defined!")
    }
  }

  const handleApprove = () => {
    setStatus(status === "approved" ? "neutral" : "approved")
  }

  const handleReject = () => {
    setStatus(status === "rejected" ? "neutral" : "rejected")
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-4 transition-colors",
        status === "approved" &&
          "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
        status === "rejected" &&
          "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
        status === "neutral" && "bg-card"
      )}
    >
      {/* Label */}
      <label className="text-sm leading-none font-semibold">{item.label}</label>

      {/* Input with check/x buttons */}
      <div className="border-input bg-background flex h-9 w-full items-center overflow-hidden rounded-md border shadow-xs">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setStatus("neutral")
          }}
          className="h-full flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={handleApprove}
          className={cn(
            "border-input flex aspect-square h-full items-center justify-center border-l transition-colors",
            status === "approved"
              ? "bg-green-500 text-white"
              : "bg-background text-muted-foreground hover:bg-accent hover:text-green-600"
          )}
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Approve</span>
        </button>
        <button
          type="button"
          onClick={handleReject}
          className={cn(
            "border-input flex aspect-square h-full items-center justify-center rounded-r-md border-l transition-colors",
            status === "rejected"
              ? "bg-red-500 text-white"
              : "bg-background text-muted-foreground hover:bg-accent hover:text-red-600"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Reject</span>
        </button>
      </div>

      {/* Citations */}
      {item.output.citations && item.output.citations.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {item.output.citations.map((citation, idx) => (
            <button
              key={idx}
              onClick={() => handleCitationClick(citation)}
              className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-left text-xs transition-colors hover:underline"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span>
                Source: Page {citation.page}
                {citation.snippet && (
                  <span className="text-muted-foreground ml-1">
                    — "{citation.snippet.substring(0, 30)}
                    {citation.snippet.length > 30 ? "..." : ""}"
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TestChatPanel({
  className,
  title: _title = "AI Assistant",
  onCitationClick,
}: TestChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Details tab state
  const [detailsData, setDetailsData] = React.useState<DetailItemData[]>([])
  const [detailsLoading, setDetailsLoading] = React.useState(true)

  // Fetch details on mount
  React.useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(DETAILS_WEBHOOK_URL, {
          method: "GET",
        })
        const data = await response.json()
        if (Array.isArray(data)) {
          setDetailsData(data)
        }
      } catch (error) {
        console.error("Failed to fetch details:", error)
      } finally {
        setDetailsLoading(false)
      }
    }
    fetchDetails()
  }, [])

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
    console.log("[TestChatPanel] Citation clicked:", { page: citation.page, bbox: citation.bbox })
    if (onCitationClick) {
      onCitationClick(citation.page, citation.bbox)
    } else {
      console.warn("[TestChatPanel] onCitationClick is NOT defined!")
    }
  }

  return (
    <div
      className={cn("bg-background flex h-full flex-col border-l", className)}
    >
      <Tabs defaultValue="ai-agent" className="flex h-full flex-col">
        {/* Tabs Header */}
        <div className="border-b px-2 pt-2 pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-agent" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Agent
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Details
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Agent Tab */}
        <TabsContent
          value="ai-agent"
          className="m-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {/* Messages Area with Conversation Component */}
          <Conversation className="min-h-0 flex-1">
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
                      {message.role === "assistant" &&
                        message.citations &&
                        message.citations.length > 0 && (
                          <MessageActions>
                            <div className="flex flex-col gap-1">
                              {message.citations.map((citation, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleCitationClick(citation)}
                                  className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-left text-xs transition-colors hover:underline"
                                >
                                  <FileText className="h-3 w-3 shrink-0" />
                                  <span>
                                    Source: Page {citation.page}
                                    {citation.snippet && (
                                      <span className="text-muted-foreground ml-1">
                                        — "{citation.snippet.substring(0, 40)}
                                        {citation.snippet.length > 40
                                          ? "..."
                                          : ""}
                                        "
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
                          <span className="text-muted-foreground">
                            Thinking...
                          </span>
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
                className="h-[36px] max-h-[120px] min-h-[36px] flex-1 resize-none overflow-y-auto py-2 text-sm"
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
        </TabsContent>

        {/* Details Tab */}
        <TabsContent
          value="details"
          className="m-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          {detailsLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading details...</span>
              </div>
            </div>
          ) : detailsData.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <div className="text-center">
                <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No details available</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {detailsData.map((item, idx) => (
                  <DetailItem
                    key={idx}
                    item={item}
                    onCitationClick={onCitationClick}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
