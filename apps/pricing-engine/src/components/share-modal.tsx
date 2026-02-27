"use client";

import { useState } from "react";
import {
  Share2,
  Check,
  Copy,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  FileDown,
} from "lucide-react";
import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "react-share";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import { Button } from "@repo/ui/shadcn/button";

interface ShareModalProps {
  url?: string;
  title?: string;
  description?: string;
  disabled?: boolean;
  trigger?: React.ReactNode;
  onPdfShare?: () => void | Promise<void>;
}

export function ShareModal({
  url,
  title = "Share this page",
  description,
  disabled = false,
  trigger,
  onPdfShare,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title;
  const shareDescription = description ?? "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
        setOpen(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const handlePdfShare = async () => {
    if (!onPdfShare) return;
    setPdfLoading(true);
    try {
      await onPdfShare();
    } finally {
      setPdfLoading(false);
      setOpen(false);
    }
  };

  const handleShareClick = () => {
    setTimeout(() => setOpen(false), 100);
  };

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
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-center">{shareTitle}</h4>

          {onPdfShare && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              disabled={pdfLoading}
              onClick={handlePdfShare}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {pdfLoading ? "Preparing…" : "Share / Download PDF"}
            </Button>
          )}

          {typeof window !== "undefined" && "share" in navigator && (
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={shareNative}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}

          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={copyToClipboard}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </>
            )}
          </Button>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Share via:</p>

            <div className="grid grid-cols-2 gap-2">
              <EmailShareButton
                url={shareUrl}
                subject={shareTitle}
                body={shareDescription}
                className="!flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                onClick={handleShareClick}
              >
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">Email</span>
              </EmailShareButton>

              <WhatsappShareButton
                url={shareUrl}
                title={shareTitle}
                className="!flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                onClick={handleShareClick}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">WhatsApp</span>
              </WhatsappShareButton>

              <FacebookShareButton
                url={shareUrl}
                className="!flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                onClick={handleShareClick}
              >
                <Facebook className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">Facebook</span>
              </FacebookShareButton>

              <TwitterShareButton
                url={shareUrl}
                title={shareTitle}
                className="!flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                onClick={handleShareClick}
              >
                <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">Twitter</span>
              </TwitterShareButton>

              <LinkedinShareButton
                url={shareUrl}
                title={shareTitle}
                summary={shareDescription}
                className="!flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                onClick={handleShareClick}
              >
                <Linkedin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">LinkedIn</span>
              </LinkedinShareButton>

              <a
                href={`sms:?body=${encodeURIComponent(shareUrl)}`}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                onClick={handleShareClick}
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">SMS</span>
              </a>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
