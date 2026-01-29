"use client"

import { useEffect, useState } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import SearchProvider from "@/components/search-provider"
import { ThemeProvider } from "@/components/theme-provider"

interface Props {
  children: React.ReactNode
}

export function Providers({ children }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

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
