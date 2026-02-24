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

    // Temporarily suppress console.error from the Vapi SDK during
    // init and event handling so transient SDK-level errors don't
    // trigger the Next.js error overlay.
    const patchConsoleError = () => {
      const orig = console.error
      console.error = (...args: unknown[]) => {
        const first = typeof args[0] === "string" ? args[0] : ""
        if (
          first.includes("Vapi") ||
          first.includes("[useVapi]") ||
          (args.length === 1 &&
            args[0] != null &&
            typeof args[0] === "object" &&
            !(args[0] instanceof Error) &&
            JSON.stringify(args[0]) === "{}")
        ) {
          return
        }
        orig.apply(console, args)
      }
      return () => {
        console.error = orig
      }
    }
    const restoreConsole = patchConsoleError()

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
      if (
        error != null &&
        typeof error === "object" &&
        !(error instanceof Error) &&
        JSON.stringify(error) === "{}"
      ) {
        // Vapi SDK fires empty error events on transient connection issues — safe to ignore
      } else {
        const msg =
          error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error)
        console.warn("[useVapi] Error event:", msg || "(unknown)")
      }
      setIsConnecting(false)
    })

    return () => {
      vapi.stop()
      vapiRef.current = null
      restoreConsole()
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
      console.warn("[useVapi] start() failed:", err)
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
