"use client"

export const title = "Loading Button"

import * as React from "react"
import { cn } from "@repo/lib/cn"
import { Button, type ButtonProps } from "./button"

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  spinnerPosition?: "left" | "right"
}

const Spinner = () => (
  <svg
    aria-label="Loading"
    className="size-4 animate-spin"
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
    return (
      <Button
        className={cn("transition-all", className)}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            {spinnerPosition === "left" && <Spinner />}
            <span>{loadingText || children}</span>
            {spinnerPosition === "right" && <Spinner />}
          </>
        ) : (
          children
        )}
      </Button>
    )
  },
)

LoadingButton.displayName = "LoadingButton"

export default LoadingButton
