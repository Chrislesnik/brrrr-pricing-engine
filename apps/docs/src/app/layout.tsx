import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@repo/ui/providers/theme-provider";
import { Toaster } from "@repo/ui/shadcn/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Developer Documentation",
    template: "%s | Developer Docs",
  },
  description: "API documentation, webhooks, and technical integration guides",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} group/body antialiased overflow-x-hidden`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
