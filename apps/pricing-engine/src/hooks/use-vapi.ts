"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Vapi from "@vapi-ai/web"

export interface VapiTranscript {
  role: "user" | "assistant"
  text: string
  isFinal: boolean
}

interface UseVapiOptions {
  publicKey?: string
  assistantId?: string
  metadata?: Record<string, string>
}

export function useVapi(options: UseVapiOptions = {}) {
  const {
    publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "",
    assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "",
    metadata,
  } = options

  const vapiRef = useRef<Vapi | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [transcripts, setTranscripts] = useState<VapiTranscript[]>([])

  useEffect(() => {
    if (!publicKey) {
      console.warn("[useVapi] No public key provided, skipping init")
      return
    }

    console.log("[useVapi] Initializing Vapi with key:", publicKey.slice(0, 8) + "...")
    const vapi = new Vapi(publicKey)
    vapiRef.current = vapi

    vapi.on("call-start", () => {
      setIsSessionActive(true)
      setIsConnecting(false)
    })

    vapi.on("call-end", () => {
      setIsSessionActive(false)
      setIsConnecting(false)
      setIsSpeaking(false)
      setVolumeLevel(0)
    })

    vapi.on("speech-start", () => {
      setIsSpeaking(true)
    })

    vapi.on("speech-end", () => {
      setIsSpeaking(false)
    })

    vapi.on("volume-level", (level: number) => {
      setVolumeLevel(level)
    })

    vapi.on("message", (msg: Record<string, unknown>) => {
      if (msg.type === "transcript") {
        const role = msg.role === "assistant" ? "assistant" : "user"
        const text = String(msg.transcript ?? "")
        const isFinal = msg.transcriptType === "final"

        if (isFinal && text.trim()) {
          setTranscripts((prev) => [...prev, { role, text, isFinal: true }])
        }
      }
    })

    vapi.on("error", (error: unknown) => {
      console.error("Vapi error:", error)
      setIsConnecting(false)
    })

    return () => {
      vapi.stop()
      vapiRef.current = null
    }
  }, [publicKey])

  const startCall = useCallback(async () => {
    if (!vapiRef.current || !assistantId) {
      console.warn("[useVapi] Cannot start: missing vapi instance or assistantId", {
        hasVapi: !!vapiRef.current,
        assistantId,
      })
      return
    }
    setIsConnecting(true)
    setTranscripts([])
    try {
      await fetch("/api/vapi/set-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: metadata?.program_id || null,
          sessionId: metadata?.sessionId || null,
        }),
      })

      await vapiRef.current.start(assistantId)
    } catch (err) {
      console.error("[useVapi] start() failed:", err)
      setIsConnecting(false)
    }
  }, [assistantId, metadata])

  const stopCall = useCallback(() => {
    vapiRef.current?.stop()
  }, [])

  const toggleCall = useCallback(() => {
    if (isSessionActive) {
      stopCall()
    } else {
      startCall()
    }
  }, [isSessionActive, startCall, stopCall])

  return {
    isSessionActive,
    isConnecting,
    isSpeaking,
    volumeLevel,
    transcripts,
    toggleCall,
    startCall,
    stopCall,
  }
}
