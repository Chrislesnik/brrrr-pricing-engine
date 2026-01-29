import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(breakpointPx: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`)
    const update = (matches: boolean, phase: "init" | "change") => {
      // #region agent log
      fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "H-mobile",
          location: "src/hooks/use-mobile.tsx:update",
          message: "useIsMobile state update",
          data: { matches, phase, breakpointPx },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      setIsMobile(matches)
    }

    const handleMedia = (e: MediaQueryListEvent | MediaQueryList) => update(e.matches, "change")

    // initial
    update(mql.matches, "init")
    mql.addEventListener("change", handleMedia)

    return () => {
      mql.removeEventListener("change", handleMedia)
      // #region agent log
      fetch("http://127.0.0.1:7246/ingest/129b7388-6ef0-4f6c-b8cd-48b22b6394cf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "H-mobile",
          location: "src/hooks/use-mobile.tsx:cleanup",
          message: "useIsMobile cleanup",
          data: { breakpointPx },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    }
  }, [breakpointPx])

  return !!isMobile
}
