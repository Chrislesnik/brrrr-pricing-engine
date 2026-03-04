"use client"

import { useEffect, useState } from "react"

/**
 * Returns true for a brief period when dependencies change, useful for triggering
 * a subtle animation (e.g., table bounce on page/sort/filter change).
 */
export function useBounceOnChange(deps: unknown[], durationMs: number = 220) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(true)
    const t = setTimeout(() => setActive(false), durationMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return active
}
