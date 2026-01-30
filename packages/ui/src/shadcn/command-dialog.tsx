"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { CommandDialog as CommandDialogPrimitive } from "./command"

export interface CommandDialogProps extends DialogProps {}

export function CommandDialog({ children, ...props }: CommandDialogProps) {
  return (
    <CommandDialogPrimitive {...props}>
      {children}
    </CommandDialogPrimitive>
  )
}
