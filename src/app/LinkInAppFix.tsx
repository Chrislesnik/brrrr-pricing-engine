'use client'

import { useEffect } from 'react'

/**
 * Forces same-domain links that were authored with target="_blank"
 * to open inside the WebView instead of kicking out to Safari.
 * We keep external domains (oauth, maps, tel, mailto) opening externally.
 */
export function LinkInAppFix(): null {
  useEffect(() => {
    const isSameAppHost = (host: string): boolean => {
      const apex = host.replace(/^www\./, '')
      const candidates = new Set([host, apex, `www.${apex}`, 'pricingengine.pro', 'www.pricingengine.pro'])
      return candidates.has(host) || candidates.has(apex) || candidates.has(`www.${apex}`)
    }

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null
      if (!anchor) return
      // Only intervene for regular http(s) links with target _blank
      const href = anchor.getAttribute('href') || ''
      if (!href || anchor.target !== '_blank') return
      if (!/^https?:\/\//i.test(href)) return
      // Allow obvious external schemes to continue
      if (/^(mailto:|tel:)/i.test(href)) return
      try {
        const url = new URL(href)
        const host = url.hostname
        // Treat both apex and www as same-app domains
        if (isSameAppHost(host)) {
          e.preventDefault()
          // Navigate in the same WebView instead of opening Safari
          window.location.href = href
        }
      } catch {
        // ignore malformed URLs
      }
    }
    document.addEventListener('click', handleClick, true)

    // Intercept programmatic window.open calls (often used by auth buttons)
    const originalOpen = window.open
    window.open = function (url?: string | URL | undefined, target?: string, features?: string): Window | null {
      const href = String(url ?? '')
      if (/^https?:\/\//i.test(href) && !/^(mailto:|tel:)/i.test(href)) {
        try {
          const { hostname } = new URL(href)
          if (isSameAppHost(hostname)) {
            window.location.href = href
            return null
          }
        } catch {
          // fall through to original
        }
      }
      // Fallback to default behavior (may open Safari for true externals)
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      return originalOpen.call(window, url as any, target, features)
    }

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.open = originalOpen
    }
  }, [])
  return null
}


