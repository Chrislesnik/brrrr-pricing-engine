"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

export function ApiReferencePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="scalar-embedded flex-1">
      <ApiReferenceReact
        configuration={{
          url: "/openapi.json",
          darkMode: isDark,
          forceDarkModeState: isDark ? "dark" : "light",
          hideDarkModeToggle: true,
          showSidebar: false,
          withDefaultFonts: false,
          theme: "none",
          defaultOpenAllTags: true,
          hideSearch: true,
          layout: "modern",
          defaultHttpClient: {
            targetKey: "shell",
            clientKey: "curl",
          },
        }}
      />
    </div>
  );
}
