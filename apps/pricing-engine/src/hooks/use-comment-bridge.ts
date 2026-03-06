"use client";

import { useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────
interface UseCommentBridgeOptions {
  sourceRoomId: string;
  dealId: string;
  sourceType: "document" | "task";
  sourceId: string;
  sourceName: string;
}

/**
 * Hook that bridges comments from document/task rooms to the parent deal channel.
 *
 * Call `bridgeComment()` after a new comment is created in the source room.
 * The bridge API handles idempotent thread creation and deduplication.
 */
export function useCommentBridge({
  sourceRoomId,
  dealId,
  sourceType,
  sourceId,
  sourceName,
}: UseCommentBridgeOptions) {
  const pendingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bridgeComment = useCallback(
    async (commentBody: string, commentUserId: string) => {
      // Debounce to avoid duplicate bridging
      if (pendingRef.current) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        pendingRef.current = true;

        try {
          const res = await fetch("/api/chat/bridge-comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceRoomId,
              dealId,
              sourceType,
              sourceId,
              sourceName,
              commentBody,
              commentUserId,
            }),
          });

          if (!res.ok) {
            console.error("[useCommentBridge] Bridge failed:", res.statusText);
          }
        } catch (err) {
          console.error("[useCommentBridge] Bridge error:", err);
        } finally {
          pendingRef.current = false;
        }
      }, 300); // 300ms debounce
    },
    [sourceRoomId, dealId, sourceType, sourceId, sourceName]
  );

  return { bridgeComment };
}
