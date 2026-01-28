"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  // #region agent log
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const loggedMountRef = React.useRef(false)
  
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    
    // Helper to log both to console AND to local debug server
    const debugLog = (label: string, data: Record<string, unknown>) => {
      const payload = { location: label, ...data, timestamp: Date.now(), sessionId: 'debug-session' }
      console.log(`[SCROLL-DEBUG] ${label}`, data)
      fetch('http://127.0.0.1:7242/ingest/3a0e0fc4-bf2e-468f-ad62-2c613d6d0bdc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
    }
    
    // Log computed styles on mount with browser info (only once per session)
    if (!loggedMountRef.current) {
      loggedMountRef.current = true
      const computedStyles = window.getComputedStyle(viewport)
      const ua = navigator.userAgent
      const isFirefox = ua.includes('Firefox')
      const isSafari = ua.includes('Safari') && !ua.includes('Chrome')
      const isChrome = ua.includes('Chrome') && !ua.includes('Edg')
      const isEdge = ua.includes('Edg')
      const isMac = ua.includes('Mac')
      const isWindows = ua.includes('Windows')
      const isLinux = ua.includes('Linux')
      
      debugLog('mount', {
        hypothesisId: 'A,D,E',
        browser: isFirefox ? 'Firefox' : isSafari ? 'Safari' : isChrome ? 'Chrome' : isEdge ? 'Edge' : 'Other',
        os: isMac ? 'Mac' : isWindows ? 'Windows' : isLinux ? 'Linux' : 'Other',
        userAgent: ua.substring(0, 150),
        overflowY: computedStyles.overflowY,
        overflowX: computedStyles.overflowX,
        overscrollBehavior: computedStyles.overscrollBehavior,
        touchAction: computedStyles.touchAction,
        scrollHeight: viewport.scrollHeight,
        clientHeight: viewport.clientHeight,
        hasOverflow: viewport.scrollHeight > viewport.clientHeight,
      })
    }
    
    // Track wheel events - limit to first 5 per session to avoid spam
    let wheelCount = 0
    const handleWheel = (e: WheelEvent) => {
      wheelCount++
      if (wheelCount <= 5) {
        debugLog('wheel', {
          hypothesisId: 'A,B,C',
          wheelEventNum: wheelCount,
          deltaY: e.deltaY,
          scrollTopBefore: viewport.scrollTop,
          defaultPrevented: e.defaultPrevented,
          targetTag: (e.target as HTMLElement)?.tagName,
          targetClass: (e.target as HTMLElement)?.className?.toString?.()?.substring?.(0, 80),
        })
      }
    }
    
    // Track actual scroll events - limit to first 3
    let scrollCount = 0
    const handleScroll = () => {
      scrollCount++
      if (scrollCount <= 3) {
        debugLog('scroll', {
          hypothesisId: 'A,B',
          scrollEventNum: scrollCount,
          scrollTop: viewport.scrollTop,
          scrollHeight: viewport.scrollHeight,
          clientHeight: viewport.clientHeight,
        })
      }
    }
    
    viewport.addEventListener('wheel', handleWheel)
    viewport.addEventListener('scroll', handleScroll)
    
    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      viewport.removeEventListener('scroll', handleScroll)
    }
  }, [])
  // #endregion
  
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport 
        ref={viewportRef}
        className="h-full w-full rounded-[inherit] overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ 
          // Ensure touch scrolling works on all devices
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
})
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
