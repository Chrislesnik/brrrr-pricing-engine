"use client"

export const title = "Bounce Button"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BounceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intensity?: "subtle" | "medium" | "playful"
}

const bounceKeyframes = `
@keyframes bounce-click {
  0% {
    transform: scale(1);
  }
  20% {
    transform: scale(0.9);
  }
  40% {
    transform: scale(1.15);
  }
  60% {
    transform: scale(0.95);
  }
  80% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
`

export const BounceButton = React.forwardRef<HTMLButtonElement, BounceButtonProps>(
  ({ children, intensity = "medium", className, onClick, ...props }, ref) => {
    const [bounceKey, setBounceKey] = React.useState(0)

    const duration = {
      subtle: 0.3,
      medium: 0.5,
      playful: 0.6,
    }[intensity]

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setBounceKey(prev => prev + 1)
      onClick?.(e)
    }

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: bounceKeyframes }} />
        <button
          className={cn(
            "relative inline-flex items-center justify-center",
            "rounded-lg px-6 py-3 text-sm font-medium",
            "bg-primary text-primary-foreground",
            "cursor-pointer",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "motion-reduce:animate-none",
            className,
          )}
          key={bounceKey}
          onClick={handleClick}
          ref={ref}
          style={{
            animation:
              bounceKey > 0
                ? `bounce-click ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1)`
                : "none",
          }}
          {...props}
        >
          {children}
        </button>
      </>
    )
  },
)

BounceButton.displayName = "BounceButton"

export default BounceButton
