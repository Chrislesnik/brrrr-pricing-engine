"use client"

import { useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export function ChatPanel({ className }: { className?: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput } = useChat({
    api: "/api/ai/chat",
  })

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <ScrollArea className="flex-1 rounded-md border bg-muted/30 p-3">
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">Start chatting with the AI assistant.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-md border bg-background/60 p-2 text-sm shadow-sm">
                <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  {m.role === "user" ? "You" : "AI"}
                </div>
                <div className="whitespace-pre-wrap text-foreground">{m.content}</div>
              </div>
            ))
          )}
          {error ? <div className="text-xs text-destructive">Error: {error.message}</div> : null}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          handleSubmit(e)
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask the assistant..."
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input?.trim()}>
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  )
}

export default ChatPanel
