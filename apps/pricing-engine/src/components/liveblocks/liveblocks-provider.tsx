"use client";

import { ReactNode } from "react";
import { LiveblocksProvider as LBProvider } from "@liveblocks/react/suspense";

interface Props {
  children: ReactNode;
}

export function LiveblocksProviderWrapper({ children }: Props) {
  return (
    <LBProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={async ({ userIds }) => {
        const response = await fetch(
          `/api/liveblocks-users?userIds=${userIds.join(",")}`
        );
        const data = await response.json();
        return data.users;
      }}
      resolveMentionSuggestions={async ({ text, roomId }) => {
        const params = new URLSearchParams();
        params.set("search", text);
        params.set("_t", String(Date.now()));
        if (roomId?.startsWith("deal:")) {
          params.set("dealId", roomId.slice(5));
        } else if (roomId?.startsWith("deal_chat:")) {
          params.set("dealId", roomId.slice(10));
        }
        const response = await fetch(`/api/liveblocks-users?${params}`);
        const data = await response.json();
        const userIds: string[] = data.users.map((user: { id: string }) => user.id);

        // Include AI agent as a mentionable user in deal_chat rooms
        if (roomId?.startsWith("deal_chat:")) {
          const searchLower = text.toLowerCase();
          if (!searchLower || "agent".includes(searchLower) || "ai agent".includes(searchLower)) {
            userIds.unshift("agent");
          }
        }

        return userIds;
      }}
    >
      {children}
    </LBProvider>
  );
}
