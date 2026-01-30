"use client";

import { OrganizationProfile } from "@clerk/nextjs";

export default function OrganizationSettingsPage() {
  return (
    <div className="w-full flex justify-center py-8">
      <OrganizationProfile 
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full max-w-5xl",
            card: "shadow-none border-border w-full",
            navbar: "hidden md:flex",
            navbarMobileMenuButton: "md:hidden",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          }
        }}
      />
    </div>
  );
}
