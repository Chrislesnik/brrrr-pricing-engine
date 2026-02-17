import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Toaster } from "@repo/ui/shadcn/toaster"
import "./globals.css"
import { Providers } from "./providers"
import { LinkInAppFix } from "./LinkInAppFix"

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  display: "swap",
  variable: "--font-inter",
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
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} group/body antialiased h-full overflow-hidden`}>
        <Providers>
          <LinkInAppFix />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
