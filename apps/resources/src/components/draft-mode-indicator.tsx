"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export function DraftModeIndicator({ isDraftMode }: { isDraftMode: boolean }) {
  const pathname = usePathname();

  if (!isDraftMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-yellow-950 shadow-lg">
        <Eye className="h-4 w-4" />
        <span>Draft Mode Active</span>
        <Link
          href={`/api/disable-draft?slug=${encodeURIComponent(pathname)}`}
          className="ml-2 rounded bg-yellow-950 px-2 py-1 text-xs text-yellow-500 hover:bg-yellow-900 transition-colors"
        >
          <EyeOff className="inline h-3 w-3 mr-1" />
          Disable
        </Link>
      </div>
    </div>
  );
}
