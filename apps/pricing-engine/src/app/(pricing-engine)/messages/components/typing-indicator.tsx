"use client";

import React from "react";
import { useOthers } from "@liveblocks/react/suspense";

function TypingIndicatorInner() {
  const others = useOthers();

  const typingUsers = others.filter(
    (other) => (other.presence as { isTyping?: boolean })?.isTyping
  );

  if (typingUsers.length === 0) return null;

  const users = typingUsers.slice(0, 3).map((u) => ({
    name:
      (u.info as { name?: string } | undefined)?.name ?? "Someone",
    avatar:
      (u.info as { avatar?: string } | undefined)?.avatar ?? null,
    color:
      (u.info as { color?: string } | undefined)?.color ?? "#888",
  }));

  let text: string;
  if (users.length === 1) {
    text = `${users[0].name} is typing`;
  } else if (users.length === 2) {
    text = `${users[0].name} and ${users[1].name} are typing`;
  } else {
    text = `${users[0].name}, ${users[1].name}, and others are typing`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Avatars */}
      <div className="flex -space-x-1.5">
        {users.map((user, idx) => (
          <div
            key={idx}
            className="flex h-5 w-5 items-center justify-center rounded-md border border-background text-[9px] font-medium"
            style={{ backgroundColor: `${user.color}20`, color: user.color }}
            title={user.name}
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="h-5 w-5 rounded-md object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
        ))}
      </div>

      {/* Text + dots */}
      <span className="text-[11px] text-muted-foreground">
        {text}
        <span className="inline-flex ml-0.5 gap-[1px]">
          <span className="inline-block h-[3px] w-[3px] rounded-full bg-muted-foreground animate-[typing-dot_1.4s_ease-in-out_infinite]" />
          <span className="inline-block h-[3px] w-[3px] rounded-full bg-muted-foreground animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite]" />
          <span className="inline-block h-[3px] w-[3px] rounded-full bg-muted-foreground animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite]" />
        </span>
      </span>
    </div>
  );
}

export const TypingIndicator = React.memo(TypingIndicatorInner);
