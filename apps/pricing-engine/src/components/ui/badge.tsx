import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@repo/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "text-foreground border-border",
        success:
          "border-success/30 bg-success/10 text-success",
        warning:
          "border-warning/30 bg-warning/10 text-warning-foreground",
        info:
          "border-info/30 bg-info/10 text-info-foreground",
        danger:
          "border-danger/30 bg-danger/10 text-danger",
      },
      size: {
        sm: "rounded-xs px-1.5 py-0.5 text-[11px] leading-none",
        default: "rounded-sm px-2 py-1 text-xs",
        lg: "rounded-md px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
