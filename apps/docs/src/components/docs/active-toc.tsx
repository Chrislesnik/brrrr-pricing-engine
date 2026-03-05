"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@repo/lib/cn";

interface TocEntry {
  id: string;
  title: string;
  level: number;
}

interface ActiveTocProps {
  toc: TocEntry[];
}

export function ActiveToc({ toc }: ActiveTocProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;

    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter(Boolean) as HTMLElement[];

    if (headings.length === 0) return;

    const visibleIds = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }

        const tocIds = toc.map((t) => t.id);
        for (const id of tocIds) {
          if (visibleIds.has(id)) {
            setActiveId(id);
            return;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    for (const heading of headings) {
      observerRef.current.observe(heading);
    }

    return () => observerRef.current?.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav className="space-y-0.5">
      <p className="text-sm font-semibold text-foreground mb-3">On this page</p>
      {toc.map((entry, idx) => (
        <a
          key={`${entry.id}-${idx}`}
          href={`#${entry.id}`}
          className={cn(
            "block rounded-sm px-2 py-1 text-[13px] leading-snug transition-colors",
            entry.level === 3 && "pl-5",
            entry.level >= 4 && "pl-8",
            activeId === entry.id
              ? "text-primary font-medium bg-primary/5"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {entry.title}
        </a>
      ))}
    </nav>
  );
}
