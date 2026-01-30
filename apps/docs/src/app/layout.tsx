import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "@repo/ui/shadcn/sidebar";
import "@repo/ui/globals.css";

export const metadata: Metadata = {
  title: "Developer Docs | BRRRR Pricing Engine",
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
        <body>
          <SidebarProvider defaultOpen={true}>
            {children}
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
