"use client"

export const title = "Shake Button"

import * as React from "react"
import { cn } from "@repo/lib/cn"
import { Button, type ButtonProps } from "./button"

export interface ShakeButtonProps extends ButtonProps {
  shake?: boolean
  intensity?: "subtle" | "normal" | "strong"
  onShakeEnd?: () => void
}

export const ShakeButton = React.forwardRef<HTMLButtonElement, ShakeButtonProps>(
  ({ children, shake = false, intensity = "normal", onShakeEnd, className, style, ...props }, ref) => {
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

    const amplitude = { subtle: 2, normal: 4, strong: 6 }[intensity]

    return (
      <Button
        className={cn(isShaking && "animate-shake", className)}
        ref={ref}
        style={{
          ...style,
          ...(isShaking ? { "--shake-x": `${amplitude}px` } as React.CSSProperties : {}),
        }}
        {...props}
      >
        {children}
      </Button>
    )
  },
)

ShakeButton.displayName = "ShakeButton"

export default ShakeButton
