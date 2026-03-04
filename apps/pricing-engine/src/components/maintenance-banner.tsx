"use client"

import { useState } from "react"

export function MaintenanceBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true" || dismissed) {
    return null
  }

  return (
    <div className="sticky top-0 z-[9999] flex w-full items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      <span>
        We&apos;re performing scheduled maintenance to improve the platform.
        Some features may be temporarily unavailable.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-2 shrink-0 rounded p-0.5 text-amber-950/70 transition-colors hover:bg-amber-600 hover:text-amber-950"
        aria-label="Dismiss maintenance banner"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
