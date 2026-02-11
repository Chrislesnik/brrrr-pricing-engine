"use client"

import { useState } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import SearchProvider from "@/components/search-provider"
import { ThemeProvider } from "@repo/ui/providers/theme-provider"

interface Props {
  children: React.ReactNode
}

export function Providers({ children }: Props) {
  // Cmd+K shortcut is handled by the header's SearchForm component.
  // This state is kept for SearchProvider context compatibility.
  const [open, setOpen] = useState(false)

  return (
    <ClerkProvider
      appearance={{
        // Global appearance overrides for Clerk components
        elements: {
          // Hide "Secured by Clerk" in UserButton popover (allowed on Pro plan)
          userButtonPopoverFooter: {
            display: "none",
          },
          // Hide component footers that can contain Clerk branding on auth pages
          footer: {
            display: "none",
          },
        },
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SearchProvider value={{ open, setOpen }}>{children}</SearchProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}
