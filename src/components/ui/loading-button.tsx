"use client"

export const title = "Loading Button"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  spinnerPosition?: "left" | "right"
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      spinnerPosition = "left",
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const spinner = (
      <svg
        aria-label="Loading"
        className="h-4 w-4 animate-spin"
        fill="none"
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        />
      </svg>
    )

    return (
      <button
        className={cn(
          "relative inline-flex items-center justify-center gap-2",
          "rounded-lg px-6 py-3 text-sm font-medium",
          "bg-primary text-primary-foreground",
          "cursor-pointer",
          "hover:bg-primary/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-all",
          className,
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            {spinnerPosition === "left" && spinner}
            <span>{loadingText || children}</span>
            {spinnerPosition === "right" && spinner}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

LoadingButton.displayName = "LoadingButton"

export default LoadingButton
