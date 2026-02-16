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
  RefreshCw,
  AlertTriangle,
  FileSearch,
} from "lucide-react"
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons"
import { cn } from "@repo/lib/cn"
import { Badge } from "@repo/ui/shadcn/badge"
import { Button } from "@repo/ui/shadcn/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/shadcn/command"
import { Input } from "@repo/ui/shadcn/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import { ScrollArea } from "@repo/ui/shadcn/scroll-area"
import { Separator } from "@repo/ui/shadcn/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/shadcn/tabs"
import { Textarea } from "@repo/ui/shadcn/textarea"
import { DatePickerField } from "@/components/date-picker-field"
import { CalcInput } from "@/components/calc-input"
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
  id?: number
  type: "input" | "condition"
  label: string
  output: {
    answer: string | boolean
    notFound?: boolean
    confidence?: number
    citations?: Citation[]
    highlights?: { page: number; bbox: BBox }[]
  }
  ai_value?: string | boolean
  approved_value?: string | boolean | null
  rejected?: boolean | null
  input_id?: string
  input_type?: string
  dropdown_options?: string[] | null
  current_deal_value?: string | null
  this_priority?: number | null
  this_document_name?: string | null
  current_value_source_document_name?: string | null
  current_value_source_priority?: number | null
}

export type ParseStatus =
  | "COMPLETE"
  | "PENDING"
  | "RUNNING"
  | "FAILED"
  | null
  | "LOADING"

interface TestChatPanelProps {
  className?: string
  title?: string
  dealId?: string
  dealDocumentId?: string
  onCitationClick?: (page: number, bbox: BBox) => void
  parseStatus?: ParseStatus
  onRetry?: () => void
  isRetrying?: boolean
}

const DETAILS_WEBHOOK_URL =
  "https://n8n.axora.info/webhook/33ca257e-24a2-483a-88c5-5d2fa7d8865f"

// DetailItem component for the Details tab
function DetailItem({
  item,
  aiResultsApiPath,
  onCitationClick,
  onRefreshItem,
}: {
  item: DetailItemData
  aiResultsApiPath?: string | null
  onCitationClick?: (page: number, bbox: BBox) => void
  onRefreshItem?: (item: DetailItemData) => Promise<DetailItemData | null>
}) {
  const isCondition = item.type === "condition"
  const inputType = item.input_type ?? "text"
  const [value, setValue] = React.useState(String(item.output.answer ?? ""))
  const [currentDealValue, setCurrentDealValue] = React.useState(
    item.current_deal_value ?? null
  )
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [status, setStatus] = React.useState<
    "neutral" | "approved" | "rejected"
  >(() => {
    if (item.rejected === true) return "rejected"
    if (item.approved_value !== null && item.approved_value !== undefined)
      return "approved"
    return "neutral"
  })

  // Sync local state when the parent re-renders with fresh item data
  React.useEffect(() => {
    setValue(String(item.output.answer ?? ""))
    setCurrentDealValue(item.current_deal_value ?? null)
    if (item.rejected === true) {
      setStatus("rejected")
    } else if (item.approved_value !== null && item.approved_value !== undefined) {
      setStatus("approved")
    } else {
      setStatus("neutral")
    }
  }, [item.output.answer, item.current_deal_value, item.approved_value, item.rejected])

  const handleRefresh = async () => {
    if (!onRefreshItem || isRefreshing) return
    setIsRefreshing(true)
    try {
      // The callback upserts the existing row and reloads parent state.
      // The useEffect above will sync local state when the new item prop arrives.
      await onRefreshItem(item)
    } catch (err) {
      console.error("Failed to refresh item:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCitationClick = (citation: Citation) => {
    if (onCitationClick) {
      onCitationClick(citation.page, citation.bbox)
    }
  }

  const persistStatus = async (
    newApproved: string | boolean | null,
    newRejected: boolean | null
  ) => {
    if (!item.id || !aiResultsApiPath) return
    try {
      const res = await fetch(aiResultsApiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          approved_value: newApproved,
          rejected: newRejected,
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        console.error("Failed to persist approval status:", res.status, errBody)
      }
    } catch (err) {
      console.error("Failed to persist approval status:", err)
    }
  }

  const handleApprove = () => {
    if (status === "approved") {
      setStatus("neutral")
      persistStatus(null, null)
    } else {
      setStatus("approved")
      const approvedVal = isCondition ? Boolean(item.output.answer) : value
      persistStatus(approvedVal, false)
      // Optimistically update the displayed current deal value for inputs
      if (!isCondition) {
        setCurrentDealValue(value)
      }
    }
  }

  const handleReject = () => {
    if (status === "rejected") {
      setStatus("neutral")
      persistStatus(null, null)
    } else {
      setStatus("rejected")
      persistStatus(null, true)
    }
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-4 transition-colors",
        status === "approved" &&
          "border-primary/30 bg-primary/5",
        status === "rejected" &&
          "border-destructive/30 bg-destructive/5",
        status === "neutral" && "bg-card"
      )}
    >
      {/* Label + type badge + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm leading-none font-semibold">
            {item.label}
          </label>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
              isCondition
                ? "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
                : "bg-[hsl(var(--info)/0.15)] text-[hsl(var(--info-foreground))]"
            )}
          >
            {item.type}
          </span>
        </div>
        {onRefreshItem && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            title="Refresh this item"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                isRefreshing && "animate-spin"
              )}
            />
          </button>
        )}
      </div>

      {/* Value display + approve/reject */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0">
          {isCondition || inputType === "boolean" ? (
            <Select
              value={
                isCondition
                  ? item.output.answer === true
                    ? "true"
                    : "false"
                  : value === "true"
                    ? "true"
                    : "false"
              }
              onValueChange={(val) => {
                setValue(val)
                setStatus("neutral")
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : inputType === "dropdown" ? (
            <Select
              value={value || undefined}
              onValueChange={(val) => {
                setValue(val)
                setStatus("neutral")
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {(item.dropdown_options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : inputType === "date" ? (
            <DatePickerField
              value={value}
              onChange={(val) => {
                setValue(val)
                setStatus("neutral")
              }}
            />
          ) : inputType === "currency" ? (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <CalcInput
                value={value}
                onValueChange={(val) => {
                  setValue(val)
                  setStatus("neutral")
                }}
                className="h-9 pl-7 text-sm"
                placeholder="0.00"
              />
            </div>
          ) : inputType === "percentage" ? (
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                min={0}
                max={100}
                step={0.01}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setStatus("neutral")
                }}
                className="h-9 pr-8 text-sm"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          ) : inputType === "number" ? (
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setStatus("neutral")
              }}
              className="h-9 text-sm"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setStatus("neutral")
              }}
              className="h-9 text-sm"
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleApprove}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
            status === "approved"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Approve</span>
        </button>
        <button
          type="button"
          onClick={handleReject}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
            status === "rejected"
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Reject</span>
        </button>
      </div>

      {/* Current deal value with source tags (inputs only) */}
      {!isCondition && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Current value:{" "}
            <span className="font-medium text-foreground">
              {currentDealValue || "--"}
            </span>
          </p>
          {currentDealValue && (
            <div className="flex flex-wrap items-center gap-1">
              {item.current_value_source_document_name ? (
                <>
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                    {item.current_value_source_document_name}
                  </span>
                  {item.this_priority != null &&
                    item.current_value_source_priority != null && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium",
                          item.current_value_source_priority <
                            item.this_priority
                            ? "bg-success-muted text-success border-success/30"
                            : item.current_value_source_priority >
                                item.this_priority
                              ? "bg-danger-muted text-danger border-danger/30"
                              : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {item.current_value_source_priority < item.this_priority
                          ? "Higher Priority"
                          : item.current_value_source_priority >
                              item.this_priority
                            ? "Lower Priority"
                            : "Same Priority"}
                      </span>
                    )}
                </>
              ) : (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                  Manual Entry
                </span>
              )}
            </div>
          )}
        </div>
      )}

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

/* -------------------------------------------------------------------------- */
/*  ParseStatusGate — shown in both tabs when document is not yet COMPLETE     */
/* -------------------------------------------------------------------------- */

function ParseStatusGate({
  status,
  onRetry,
  isRetrying,
}: {
  status: ParseStatus
  onRetry?: () => void
  isRetrying: boolean
}) {
  // LOADING — initial fetch in progress
  if (status === "LOADING") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Checking document status...
          </p>
        </div>
      </div>
    )
  }

  // PENDING or RUNNING — document is being processed
  if (status === "PENDING" || status === "RUNNING") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Document is being processed</p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a minute. The page will update automatically when
              processing completes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // FAILED or null (not found) — show retry button
  const isFailed = status === "FAILED"
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {isFailed ? (
          <AlertTriangle className="h-8 w-8 text-destructive" />
        ) : (
          <FileSearch className="h-8 w-8 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">
            {isFailed
              ? "Document processing failed"
              : "Document has not been processed"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFailed
              ? "Something went wrong while processing this document."
              : "This document needs to be processed before the AI assistant can analyze it."}
          </p>
        </div>
        <Button
          variant={isFailed ? "destructive" : "default"}
          size="sm"
          className="gap-2"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRetrying ? "Processing..." : isFailed ? "Retry Processing" : "Process Document"}
        </Button>
      </div>
    </div>
  )
}

export function TestChatPanel({
  className,
  title: _title = "AI Assistant",
  dealId,
  dealDocumentId,
  onCitationClick,
  parseStatus = "COMPLETE",
  onRetry,
  isRetrying = false,
}: TestChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Details tab state
  const [detailsData, setDetailsData] = React.useState<DetailItemData[]>([])
  const [detailsLoading, setDetailsLoading] = React.useState(false)
  const [detailsFilter, setDetailsFilter] = React.useState<Set<string>>(
    new Set()
  )
  const [statusFilter, setStatusFilter] = React.useState<Set<string>>(
    new Set()
  )

  // Build API paths
  const chatApiPath =
    dealId && dealDocumentId
      ? `/api/deals/${dealId}/deal-documents/${dealDocumentId}/chat`
      : null

  const aiResultsApiPath =
    dealId && dealDocumentId
      ? `/api/deals/${dealId}/deal-documents/${dealDocumentId}/ai-results`
      : null

  // Load persisted chat history on mount
  React.useEffect(() => {
    if (!chatApiPath) return
    const loadHistory = async () => {
      setHistoryLoading(true)
      try {
        const res = await fetch(chatApiPath)
        if (res.ok) {
          const data = await res.json()
          const history: ChatMessage[] = (data.messages ?? []).map(
            (m: any) => ({
              id: String(m.id),
              role: m.user_type === "agent" ? "assistant" : "user",
              content: m.message,
              citations: m.citations?.length ? m.citations : undefined,
            })
          )
          setMessages(history)
        }
      } catch (err) {
        console.error("Failed to load chat history:", err)
      } finally {
        setHistoryLoading(false)
      }
    }
    loadHistory()
  }, [chatApiPath])

  // Load persisted AI results from DB — returns the fresh array
  const loadSavedResults = React.useCallback(async (): Promise<DetailItemData[]> => {
    if (!aiResultsApiPath) return []
    try {
      const res = await fetch(aiResultsApiPath)
      if (res.ok) {
        const data = await res.json()
        const results: DetailItemData[] = (data.results ?? []).map(
          (r: any) => ({
            id: r.id,
            type: r.type,
            label: r.label,
            output: r.output ?? {},
            ai_value: r.ai_value,
            approved_value: r.approved_value,
            rejected: r.rejected,
            input_id: r.input_id,
            input_type: r.input_type,
            dropdown_options: r.dropdown_options,
            current_deal_value: r.current_deal_value,
            this_priority: r.this_priority,
            this_document_name: r.this_document_name,
            current_value_source_document_name:
              r.current_value_source_document_name,
            current_value_source_priority: r.current_value_source_priority,
          })
        )
        setDetailsData(results)
        return results
      }
    } catch (err) {
      console.error("Failed to load saved AI results:", err)
    }
    return []
  }, [aiResultsApiPath])

  // Load saved results on mount
  React.useEffect(() => {
    if (!aiResultsApiPath) return
    setDetailsLoading(true)
    loadSavedResults().finally(() => setDetailsLoading(false))
  }, [aiResultsApiPath, loadSavedResults])

  // Fetch details: POST deal_document row to webhook, persist, then reload
  const fetchDetails = React.useCallback(async () => {
    if (!dealId || !dealDocumentId || !aiResultsApiPath) return
    setDetailsLoading(true)
    try {
      // 1. Fetch the deal_document row
      const docsRes = await fetch(`/api/deals/${dealId}/deal-documents`)
      if (!docsRes.ok) throw new Error("Failed to fetch deal documents")
      const docsData = await docsRes.json()
      const docs = docsData.documents ?? docsData ?? []
      const dealDocument = docs.find(
        (d: any) => String(d.id) === String(dealDocumentId)
      )
      if (!dealDocument) throw new Error("Deal document not found")

      // 2. POST the deal_document row to the webhook
      const webhookRes = await fetch(DETAILS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealDocument),
      })
      const webhookText = await webhookRes.text()
      const webhookData = webhookText ? JSON.parse(webhookText) : []

      // 3. Persist results via our API
      if (Array.isArray(webhookData) && webhookData.length > 0) {
        await fetch(aiResultsApiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookData),
        })
      }

      // 4. Reload saved results (with labels from DB)
      await loadSavedResults()
    } catch (error) {
      console.error("Failed to fetch details:", error)
    } finally {
      setDetailsLoading(false)
    }
  }, [dealId, dealDocumentId, aiResultsApiPath, loadSavedResults])

  // Auto-trigger fetchDetails when parseStatus transitions to COMPLETE
  const prevParseStatusRef = React.useRef<ParseStatus | undefined>(undefined)
  React.useEffect(() => {
    const prev = prevParseStatusRef.current
    prevParseStatusRef.current = parseStatus

    // Only fire when transitioning FROM a non-COMPLETE state TO COMPLETE
    if (
      parseStatus === "COMPLETE" &&
      prev !== undefined &&
      prev !== "COMPLETE"
    ) {
      fetchDetails()
    }
  }, [parseStatus, fetchDetails])

  // Refresh a single detail item via webhook — upserts the existing row, reloads
  const handleRefreshItem = React.useCallback(
    async (item: DetailItemData): Promise<DetailItemData | null> => {
      if (!dealId || !dealDocumentId || !aiResultsApiPath) return null

      // 1. Fetch the deal_document row
      const docsRes = await fetch(`/api/deals/${dealId}/deal-documents`)
      if (!docsRes.ok) throw new Error("Failed to fetch deal documents")
      const docsData = await docsRes.json()
      const docs = docsData.documents ?? docsData ?? []
      const dealDocument = docs.find(
        (d: any) => String(d.id) === String(dealDocumentId)
      )
      if (!dealDocument) throw new Error("Deal document not found")

      // 2. POST item + dealDocument to the single-item refresh webhook
      const webhookRes = await fetch(
        "https://n8n.axora.info/webhook/ee4a312e-d700-462b-a222-163df28563f5",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item, dealDocument }),
        }
      )
      const webhookData = await webhookRes.json()

      // 3. Persist via our API — the POST endpoint upserts on
      //    (deal_document_id, document_type_ai_input_id) so the existing row
      //    is updated in place, not duplicated.
      const resultArray = Array.isArray(webhookData)
        ? webhookData
        : [webhookData]
      if (resultArray.length > 0) {
        await fetch(aiResultsApiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resultArray),
        })
      }

      // 4. Reload from DB — returns the fresh canonical list with labels
      const freshResults = await loadSavedResults()

      // 5. Find the updated item and return it so DetailItem syncs local state
      const updated = freshResults.find(
        (r) => r.id === item.id || (r.input_id === item.input_id && r.type === item.type)
      )
      return updated ?? null
    },
    [dealId, dealDocumentId, aiResultsApiPath, loadSavedResults]
  )

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
      if (!chatApiPath) {
        throw new Error("Chat API path not available")
      }

      const response = await fetch(chatApiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      const answerText =
        data.answer || "Sorry, I couldn't process that request."
      const citations: Citation[] = data.citations || []

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answerText,
        citations: citations.length > 0 ? citations : undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat API error:", error)
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
          {parseStatus !== "COMPLETE" ? (
            <ParseStatusGate
              status={parseStatus}
              onRetry={onRetry}
              isRetrying={isRetrying}
            />
          ) : (
          <>
          {/* Messages Area with Conversation Component */}
          <Conversation className="min-h-0 flex-1">
            <ConversationContent>
              {historyLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading messages...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
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
          </>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent
          value="details"
          className="m-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {parseStatus !== "COMPLETE" ? (
            <ParseStatusGate
              status={parseStatus}
              onRetry={onRetry}
              isRetrying={isRetrying}
            />
          ) : (
          <>
          {/* Toolbar: filters + refresh */}
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              {/* Type filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 border-dashed text-xs"
                  >
                    <PlusCircledIcon className="h-3.5 w-3.5" />
                    Type
                    {detailsFilter.size > 0 && (
                      <>
                        <Separator
                          orientation="vertical"
                          className="mx-1.5 h-3.5"
                        />
                        <div className="flex space-x-1">
                          {["input", "condition"]
                            .filter((v) => detailsFilter.has(v))
                            .map((v) => (
                              <Badge
                                key={v}
                                variant="secondary"
                                className="rounded-sm px-1 text-[10px] font-normal capitalize"
                              >
                                {v === "input" ? "Inputs" : "Conditions"}
                              </Badge>
                            ))}
                        </div>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {[
                          { label: "Inputs", value: "input" },
                          { label: "Conditions", value: "condition" },
                        ].map((option) => {
                          const isSelected = detailsFilter.has(option.value)
                          return (
                            <CommandItem
                              key={option.value}
                              onSelect={() => {
                                setDetailsFilter((prev) => {
                                  const next = new Set(prev)
                                  if (isSelected) {
                                    next.delete(option.value)
                                  } else {
                                    next.add(option.value)
                                  }
                                  return next
                                })
                              }}
                            >
                              <div
                                className={cn(
                                  "border-primary flex h-4 w-4 items-center justify-center rounded-sm border",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </div>
                              <span>{option.label}</span>
                              <span className="ml-auto font-mono text-xs text-muted-foreground">
                                {
                                  detailsData.filter(
                                    (d) => d.type === option.value
                                  ).length
                                }
                              </span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                      {detailsFilter.size > 0 && (
                        <>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => setDetailsFilter(new Set())}
                              className="justify-center text-center"
                            >
                              Clear filters
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Status filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 border-dashed text-xs"
                  >
                    <PlusCircledIcon className="h-3.5 w-3.5" />
                    Status
                    {statusFilter.size > 0 && (
                      <>
                        <Separator
                          orientation="vertical"
                          className="mx-1.5 h-3.5"
                        />
                        <div className="flex space-x-1">
                          {["approved", "rejected", "pending"]
                            .filter((v) => statusFilter.has(v))
                            .map((v) => (
                              <Badge
                                key={v}
                                variant="secondary"
                                className="rounded-sm px-1 text-[10px] font-normal capitalize"
                              >
                                {v}
                              </Badge>
                            ))}
                        </div>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {[
                          { label: "Approved", value: "approved" },
                          { label: "Rejected", value: "rejected" },
                          { label: "Pending", value: "pending" },
                        ].map((option) => {
                          const isSelected = statusFilter.has(option.value)
                          const getItemStatus = (item: DetailItemData) =>
                            item.rejected === true
                              ? "rejected"
                              : item.approved_value != null
                                ? "approved"
                                : "pending"
                          return (
                            <CommandItem
                              key={option.value}
                              onSelect={() => {
                                setStatusFilter((prev) => {
                                  const next = new Set(prev)
                                  if (isSelected) {
                                    next.delete(option.value)
                                  } else {
                                    next.add(option.value)
                                  }
                                  return next
                                })
                              }}
                            >
                              <div
                                className={cn(
                                  "border-primary flex h-4 w-4 items-center justify-center rounded-sm border",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </div>
                              <span>{option.label}</span>
                              <span className="ml-auto font-mono text-xs text-muted-foreground">
                                {
                                  detailsData.filter(
                                    (d) => getItemStatus(d) === option.value
                                  ).length
                                }
                              </span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                      {statusFilter.size > 0 && (
                        <>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => setStatusFilter(new Set())}
                              className="justify-center text-center"
                            >
                              Clear filters
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchDetails}
              disabled={detailsLoading}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  detailsLoading && "animate-spin"
                )}
              />
              <span className="sr-only">Refresh details</span>
            </Button>
          </div>

          {/* Content */}
          {detailsLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading details...</span>
              </div>
            </div>
          ) : detailsData.length === 0 ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center">
              <div className="text-center">
                <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No details available</p>
                <p className="text-xs mt-1">
                  Click the refresh button to extract details
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {detailsData
                  .filter(
                    (item) =>
                      detailsFilter.size === 0 ||
                      detailsFilter.has(item.type)
                  )
                  .filter((item) => {
                    if (statusFilter.size === 0) return true
                    const itemStatus =
                      item.rejected === true
                        ? "rejected"
                        : item.approved_value != null
                          ? "approved"
                          : "pending"
                    return statusFilter.has(itemStatus)
                  })
                  .map((item, idx) => (
                    <DetailItem
                      key={item.id ?? idx}
                      item={item}
                      aiResultsApiPath={aiResultsApiPath}
                      onCitationClick={onCitationClick}
                      onRefreshItem={handleRefreshItem}
                    />
                  ))}
              </div>
            </ScrollArea>
          )}
          </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
