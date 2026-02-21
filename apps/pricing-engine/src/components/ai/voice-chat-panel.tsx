"use client"

import { useEffect, useRef } from "react"
import type { VapiTranscript } from "@/hooks/use-vapi"
import { VoiceOrb } from "./voice-orb"

interface VoiceChatPanelProps {
  isSessionActive: boolean
  isConnecting: boolean
  isSpeaking: boolean
  volumeLevel: number
  transcripts: VapiTranscript[]
  toggleCall: () => void
  onSessionEnd?: (transcripts: VapiTranscript[]) => void
}

export function VoiceChatPanel({
  isSessionActive,
  isConnecting,
  isSpeaking,
  volumeLevel,
  transcripts,
  toggleCall,
  onSessionEnd,
}: VoiceChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevActiveRef = useRef(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcripts])

  useEffect(() => {
    if (prevActiveRef.current && !isSessionActive && transcripts.length > 0) {
      onSessionEnd?.(transcripts)
    }
    prevActiveRef.current = isSessionActive
  }, [isSessionActive, transcripts, onSessionEnd])

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      {/* Top fade over transcript area */}
      {transcripts.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background to-transparent" />
      )}

      <div
        ref={scrollRef}
        className="flex-1 flex flex-col items-center overflow-y-auto min-h-0"
      >
        {/* Orb -- centered with spacing */}
        <div className="flex flex-col items-center justify-center shrink-0 py-8">
          <VoiceOrb
            volumeLevel={volumeLevel}
            isSessionActive={isSessionActive}
            isSpeaking={isSpeaking}
            onClick={toggleCall}
            size={500}
          />
        </div>

        {/* Transcripts -- fill remaining space to bottom */}
        {transcripts.length > 0 && (
          <div className="w-full max-w-lg mx-auto flex flex-col gap-2 px-4 pb-4">
            {transcripts.map((t, i) => (
              <div
                key={i}
                className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-xl px-3 py-1.5 text-sm max-w-[85%] ${
                    t.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
