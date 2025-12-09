'use client'

import { useEffect } from 'react'

/**
 * Forces same-domain links that were authored with target="_blank"
 * to open inside the WebView instead of kicking out to Safari.
 * We keep external domains (oauth, maps, tel, mailto) opening externally.
 */
export function LinkInAppFix(): null {
  useEffect(() => {
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
        const apex = host.replace(/^www\./, '')
        const sameAppHosts = new Set([apex, `www.${apex}`, 'pricingengine.pro', 'www.pricingengine.pro'])
        if (sameAppHosts.has(host)) {
          e.preventDefault()
          // Navigate in the same WebView instead of opening Safari
          window.location.href = href
        }
      } catch {
        // ignore malformed URLs
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])
  return null
}


