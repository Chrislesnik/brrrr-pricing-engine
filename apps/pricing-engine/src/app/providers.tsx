"use client"

import { useState } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import SearchProvider from "@/components/search-provider"
import { ThemeProvider } from "@repo/ui/providers/theme-provider"
import { LiveblocksProviderWrapper } from "@/components/liveblocks/liveblocks-provider"

interface Props {
  children: React.ReactNode
}

function ClerkWithTheme({ children }: Props) {
  const { resolvedTheme } = useTheme()

  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorBackground: "hsl(var(--background))",
          colorForeground: "hsl(var(--foreground))",
          colorMuted: "hsl(var(--muted))",
          colorMutedForeground: "hsl(var(--muted-foreground))",
          colorBorder: "hsl(var(--border))",
          colorInput: "hsl(var(--input))",
          colorInputForeground: "hsl(var(--foreground))",
          colorDanger: "hsl(var(--destructive))",
          colorRing: "hsl(var(--ring))",
          borderRadius: "var(--radius)",
        },
        elements: {
          userButtonPopoverFooter: { display: "none" },
          footer: { display: "none" },
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export function Providers({ children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkWithTheme>
        <LiveblocksProviderWrapper>
          <SearchProvider value={{ open, setOpen }}>{children}</SearchProvider>
        </LiveblocksProviderWrapper>
      </ClerkWithTheme>
    </ThemeProvider>
  )
}
