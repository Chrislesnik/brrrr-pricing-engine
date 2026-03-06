"use client"

export const title = "Bounce Button"

import * as React from "react"
import { cn } from "@repo/lib/cn"
import { Button, type ButtonProps } from "./button"

export interface BounceButtonProps extends ButtonProps {
  intensity?: "subtle" | "medium" | "playful"
}

const animationClass = {
  subtle: "animate-bounce-click-subtle",
  medium: "animate-bounce-click",
  playful: "animate-bounce-click-playful",
} as const

export const BounceButton = React.forwardRef<HTMLButtonElement, BounceButtonProps>(
  ({ children, intensity = "medium", className, onClick, ...props }, ref) => {
    const [bouncing, setBouncing] = React.useState(false)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setBouncing(true)
      onClick?.(e)
    }

    return (
      <Button
        className={cn(
          "motion-reduce:animate-none",
          bouncing && animationClass[intensity],
          className,
        )}
        onClick={handleClick}
        onAnimationEnd={() => setBouncing(false)}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    )
  },
)

BounceButton.displayName = "BounceButton"

export default BounceButton
