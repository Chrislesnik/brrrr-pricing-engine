import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Providers } from "./providers"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} group/body antialiased overflow-x-hidden`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
