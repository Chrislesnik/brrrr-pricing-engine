"use client";

import { useOthers } from "@liveblocks/react/suspense";

export function TypingIndicator() {
  const others = useOthers();

  const typingUsers = others.filter(
    (other) => (other.presence as { isTyping?: boolean })?.isTyping
  );

  if (typingUsers.length === 0) return null;

  const names = typingUsers
    .slice(0, 3)
    .map(
      (u) =>
        (u.info as { name?: string } | undefined)?.name ?? "Someone"
    );

  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = `${names[0]}, ${names[1]}, and others are typing`;
  }

  return (
    <div className="px-4 py-1.5">
      <span className="text-xs italic text-muted-foreground">
        {text}
        <span className="inline-flex ml-0.5">
          <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
            .
          </span>
          <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
            .
          </span>
          <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
            .
          </span>
        </span>
      </span>
    </div>
  );
}
