import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@repo/ui/shadcn/toaster"
import "./globals.css"
import { Providers } from "./providers"
import { LinkInAppFix } from "./LinkInAppFix"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Loan Pricing Engine",
    template: "%s | Loan Pricing Engine",
  },
  description: "Loan Pricing Engine built with NextJS",
  icons: {
    icon: "/pricing-engine-tab-icon.svg",
    shortcut: "/pricing-engine-tab-icon.svg",
    apple: "/pricing-engine-tab-icon.svg",
  },
}

// Ensure proper mobile scaling inside WKWebView (Capacitor iOS)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H10",
      location: "app/layout.tsx:40",
      message: "root layout rendered",
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} group/body antialiased overflow-x-hidden`}>
        <Providers>
          <LinkInAppFix />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
