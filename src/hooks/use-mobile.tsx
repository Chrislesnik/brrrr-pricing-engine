import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(breakpointPx: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`)
    const update = (matches: boolean, phase: "init" | "change") => {      setIsMobile(matches)
    }

    const handleMedia = (e: MediaQueryListEvent | MediaQueryList) => update(e.matches, "change")

    // initial
    update(mql.matches, "init")
    mql.addEventListener("change", handleMedia)

    return () => {
      mql.removeEventListener("change", handleMedia)    }
  }, [breakpointPx])

  return !!isMobile
}
