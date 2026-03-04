"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@repo/lib/cn";

function ContrastIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M12 9l4.65 -4.65" />
      <path d="M12 14.3l7.37 -7.37" />
      <path d="M12 19.6l8.85 -8.85" />
    </svg>
  );
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-8 items-center gap-0.5 rounded-full border border-border bg-muted/50 p-1",
          className
        )}
      >
        <div className="h-6 w-6 rounded-full" />
        <div className="h-6 w-6 rounded-full" />
        <div className="h-6 w-6 rounded-full" />
      </div>
    );
  }

  const options = [
    { value: "light", icon: Sun, label: "Light theme" },
    { value: "system", icon: ContrastIcon, label: "System theme" },
    { value: "dark", icon: Moon, label: "Dark theme" },
  ] as const;

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-0.5 rounded-full border border-border bg-muted/50 p-1",
        className
      )}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full transition-all",
            theme === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={label}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
