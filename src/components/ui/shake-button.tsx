"use client"

export const title = "Shake Button"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ShakeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shake?: boolean
  intensity?: "subtle" | "normal" | "strong"
  onShakeEnd?: () => void
}

const shakeKeyframes = `
@keyframes shake-subtle {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

@keyframes shake-normal {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes shake-strong {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}
`

export const ShakeButton = React.forwardRef<HTMLButtonElement, ShakeButtonProps>(
  ({ children, shake = false, intensity = "normal", onShakeEnd, className, ...props }, ref) => {
    const [isShaking, setIsShaking] = React.useState(false)

    React.useEffect(() => {
      if (shake && !isShaking) {
        setIsShaking(true)
        const timer = setTimeout(() => {
          setIsShaking(false)
          onShakeEnd?.()
        }, 500)
        return () => clearTimeout(timer)
      }
    }, [shake, isShaking, onShakeEnd])

    const animationName = {
      subtle: "shake-subtle",
      normal: "shake-normal",
      strong: "shake-strong",
    }[intensity]

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: shakeKeyframes }} />
        <button
          className={cn(
            "relative inline-flex items-center justify-center",
            "rounded-lg px-6 py-3 text-sm font-medium",
            "bg-primary text-primary-foreground",
            "cursor-pointer",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "transition-colors",
            className,
          )}
          ref={ref}
          style={
            isShaking
              ? {
                  animation: `${animationName} 0.5s ease-in-out`,
                }
              : undefined
          }
          {...props}
        >
          {children}
        </button>
      </>
    )
  },
)

ShakeButton.displayName = "ShakeButton"

export default ShakeButton
