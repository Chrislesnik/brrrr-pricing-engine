"use client";

import { useState } from "react";
import {
  Share2,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  FileDown,
  LoaderCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import { Button } from "@repo/ui/shadcn/button";
import { toast } from "@/hooks/use-toast";

interface ShareModalProps {
  disabled?: boolean;
  trigger?: React.ReactNode;
  onPdfShare?: () => Promise<File>;
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || `term-sheet-${Date.now()}.pdf`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

async function nativeShareFile(file: File): Promise<boolean> {
  try {
    const nav = navigator as any;
    if (!nav?.share) return false;
    if (nav.canShare && !nav.canShare({ files: [file] })) return false;
    await nav.share({ files: [file], title: "Term Sheet", text: "See attached term sheet PDF." });
    return true;
  } catch (e) {
    const name = (e as any)?.name ?? "";
    if (name === "AbortError" || name === "NotAllowedError") return true;
    return false;
  }
}

export function ShareModal({
  disabled = false,
  trigger,
  onPdfShare,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const sharePdfVia = async (channel: string) => {
    if (!onPdfShare || busy) return;
    setBusy(channel);
    try {
      const file = await onPdfShare();
      if (!file) throw new Error("PDF generation returned empty result");

      const shared = await nativeShareFile(file);
      if (!shared) {
        downloadFile(file);
        toast({ title: "PDF Downloaded", description: "The term sheet PDF has been saved to your device." });
      }
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate PDF";
      toast({ title: "Share failed", description: msg, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const btnClass =
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted w-full disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <Popover open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger || (
          <Button variant="outline" size="icon" className="rounded-full" disabled={disabled}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-center">Share Term Sheet</h4>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            disabled={!!busy}
            onClick={() => sharePdfVia("pdf")}
          >
            {busy === "pdf" ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {busy === "pdf" ? "Preparing PDF…" : "Share / Download PDF"}
          </Button>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Share via:</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={btnClass} disabled={!!busy} onClick={() => sharePdfVia("email")}>
                {busy === "email" ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <Mail className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="font-medium">Email</span>
              </button>

              <button type="button" className={btnClass} disabled={!!busy} onClick={() => sharePdfVia("whatsapp")}>
                {busy === "whatsapp" ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="font-medium">WhatsApp</span>
              </button>

              <button type="button" className={btnClass} disabled={!!busy} onClick={() => sharePdfVia("facebook")}>
                {busy === "facebook" ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <Facebook className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="font-medium">Facebook</span>
              </button>

              <button type="button" className={btnClass} disabled={!!busy} onClick={() => sharePdfVia("twitter")}>
                {busy === "twitter" ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="font-medium">Twitter</span>
              </button>

              <button type="button" className={btnClass} disabled={!!busy} onClick={() => sharePdfVia("linkedin")}>
                {busy === "linkedin" ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <Linkedin className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="font-medium">LinkedIn</span>
              </button>

              <button type="button" className={btnClass} disabled={!!busy} onClick={() => sharePdfVia("sms")}>
                {busy === "sms" ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="font-medium">SMS</span>
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
