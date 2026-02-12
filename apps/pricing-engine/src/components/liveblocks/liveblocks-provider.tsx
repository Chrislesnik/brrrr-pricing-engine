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
      resolveMentionSuggestions={async ({ text }) => {
        const response = await fetch(
          `/api/liveblocks-users?search=${encodeURIComponent(text)}`
        );
        const data = await response.json();
        return data.users.map((user: { id: string }) => user.id);
      }}
    >
      {children}
    </LBProvider>
  );
}
