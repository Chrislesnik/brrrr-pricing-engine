"use client";

import { useState } from "react";
import {
  Share2,
  Copy,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import { Button } from "@repo/ui/shadcn/button";

interface ShareModalProps {
  url?: string;
  title?: string;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function ShareModal({ 
  url, 
  title = "Share this page",
  disabled = false,
  trigger
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    }
  };

  const shareLinks = [
    {
      name: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(document.title || "Check this out")}&body=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageSquare,
      href: `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "SMS",
      icon: MessageCircle,
      href: `sms:?body=${encodeURIComponent(shareUrl)}`,
    },
  ];

  const defaultTrigger = (
    <Button variant="outline" size="icon" className="rounded-full" disabled={disabled}>
      <Share2 className="h-4 w-4" />
      <span className="sr-only">Share</span>
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="mb-2 text-center font-semibold">{title}</div>
        <div className="flex flex-col gap-1">
          {/* Native Share (mobile) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Share</span>
            </button>
          )}

          {/* Copy URL */}
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{copied ? "Copied!" : "Copy URL"}</span>
          </button>

          {/* Divider */}
          <div className="py-1">
            <p className="text-xs text-muted-foreground">Share via:</p>
          </div>

          {/* Share Links Grid */}
          <div className="grid grid-cols-2 gap-1">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <link.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
