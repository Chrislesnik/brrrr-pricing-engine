# Messages Feature — Integration Notes

> These notes document changes required to **existing files** to fully wire up
> the `/messages` feature. All new files have been created in isolation; these
> edits connect them to the rest of the app.

---

## 1. Navigation — Add Messages to Sidebar

**File:** `src/app/(pricing-engine)/config/navigation.ts`

### a) Add route
```ts
// In the ROUTES object, add:
messages: "/messages",
```

### b) Add nav item to "Pipeline" section
```ts
// In the NAVIGATION_CONFIG array, inside the "Pipeline" section's items array:
{
  title: "Messages",
  url: ROUTES.messages,
  icon: MessageSquare,  // from "lucide-react"
  shortcut: ["M"],
}
```

---

## 2. Liveblocks — Add `deal_document` Room Type

**File:** `src/lib/liveblocks.ts`

### a) Extend RoomType
```ts
// Change:
type RoomType = "deal" | "deal_task" | "email_template";
// To:
type RoomType = "deal" | "deal_task" | "email_template" | "deal_document";
```

### b) Add permission sync function
```ts
// Add a new function following the pattern of syncDealTaskRoomPermissions:
export async function syncDealDocumentRoomPermissions(
  documentId: string,
  dealId: string,
  organizationId: string
) {
  const roomId = `deal_document:${documentId}`;
  // Follow the same permission resolution pattern as syncDealTaskRoomPermissions
  // - Fetch org members with deal access
  // - Build usersAccesses map
  // - Call liveblocks.updateRoom()
}
```

---

## 3. Liveblocks Auth — Allow `deal_document:*` Room Pattern

**File:** `src/app/api/liveblocks-auth/route.ts`

```ts
// In the ROOM_POLICY_MAP, add:
"deal_document:*": {
  policyCheck: "deal_document",
  extractId: (roomId: string) => roomId.replace("deal_document:", ""),
},
```

---

## 4. Liveblocks Users — Add System User Resolution

**File:** `src/app/api/liveblocks-users/route.ts`

```ts
// In the user resolution logic, add entries for:
"ai-assistant": {
  name: "AI Assistant",
  avatar: "/icons/ai-assistant.svg", // or a sparkles icon
},
"system-bridge-bot": {
  name: "System",
  avatar: "/icons/system-bot.svg",
},
```

---

## 5. Pricing Page — Add Embed Mode

**File:** `src/app/(pricing-engine)/pricing/page.tsx`

Add `?embed=true` query param detection for iframe mode with PostMessage bridge:

```tsx
// At the top of the component:
const searchParams = useSearchParams();
const isEmbed = searchParams.get("embed") === "true";
const dealId = searchParams.get("dealId");

// If embed mode, set up PostMessage listeners:
useEffect(() => {
  if (!isEmbed) return;

  // Notify parent that iframe is ready
  window.parent.postMessage({ type: "READY" }, window.location.origin);

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    switch (event.data.type) {
      case "SET_FIELD":
        // Set the field value in the pricing form
        // event.data.inputCode, event.data.value
        break;
      case "GENERATE":
        // Trigger pricing generation
        // On success: window.parent.postMessage({ type: "RESULTS", data: { scenarios } }, origin)
        // On error: window.parent.postMessage({ type: "ERROR", message }, origin)
        break;
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [isEmbed]);

// If embed mode, hide the app chrome (header, sidebar, etc.)
// and render only the pricing form
```

---

## 6. Deal Documents Tab — Add Comments Panel

**File:** `src/app/(pricing-engine)/deals/components/deal-documents-tab.tsx`

Add a comment panel toggle to the document detail/preview view:

```tsx
import { DocumentCommentsSection } from "./document-comments-section";

// In the document detail area, add a toggle button and render:
{showDocumentComments && (
  <DocumentCommentsSection
    documentId={selectedDocument.id}
    documentName={selectedDocument.name}
    dealId={dealId}
    organizationId={orgId}
    onClose={() => setShowDocumentComments(false)}
  />
)}
```

---

## 7. Liveblocks Notifications — Replace Stubs

**File:** `src/app/api/liveblocks-notifications/route.ts`

The existing `dispatchSlack()` and `dispatchTeams()` functions are stubs (TODO comments).
The new `/api/webhooks/liveblocks-sync/route.ts` handles outbound sync. Two options:

**Option A:** Update the stubs to call the sync webhook logic directly:
```ts
async function dispatchSlack(kind, userId, roomId, notificationId) {
  // Forward to the new sync logic
  // Or leave as notification-only (user-facing alerts)
}
```

**Option B (recommended):** Keep the notification webhook for user-level alerts
(email, push) and the sync webhook for message bridging. They serve different purposes:
- `liveblocks-notifications` → user alerts (email, SMS)
- `liveblocks-sync` → platform bridging (Slack, Teams)

---

## 8. Environment Variables

Add to `.env.local` / deployment config:

```env
# Liveblocks sync webhook (separate from notification webhook)
LIVEBLOCKS_SYNC_WEBHOOK_SECRET=whsec_...

# Slack integration
SLACK_SIGNING_SECRET=...

# Microsoft Teams integration
TEAMS_WEBHOOK_CLIENT_STATE=...  # Custom string for webhook validation

# Anthropic AI (if not already set)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 9. Liveblocks Webhook Configuration

In the Liveblocks dashboard, create a **second webhook endpoint** pointing to:
```
https://your-domain.com/api/webhooks/liveblocks-sync
```

Subscribe to events:
- `threadCreated`
- `commentCreated`

(Keep the existing `/api/liveblocks-notifications` webhook for `notification` events.)

---

## 10. Slack App Configuration

In the Slack API dashboard:
1. Create a new Slack App with Bot Token Scopes: `channels:manage`, `channels:read`, `chat:write`, `chat:read`, `users:read`
2. Enable Events API with request URL: `https://your-domain.com/api/webhooks/slack`
3. Subscribe to bot events: `message.channels`
4. Install to workspace and store Bot Token in `integration_setup` table

---

## 11. Microsoft Teams App Configuration

In the Azure Portal:
1. Register an application with permissions: `Team.Create`, `Channel.Create`, `ChannelMessage.Send`, `ChannelMessage.Read.All`, `User.Read.All`
2. Create a Graph API subscription for channel messages pointing to: `https://your-domain.com/api/webhooks/teams`
3. Store access/refresh tokens in `integration_setup` table

---

## 12. New Files Created (Summary)

### Pages & Layouts
- `src/app/(pricing-engine)/messages/layout.tsx`
- `src/app/(pricing-engine)/messages/page.tsx`

### Components (messages/components/)
- `channel-sidebar.tsx` — Channel list with SWR + search
- `chat-area.tsx` — RoomProvider wrapper
- `chat-header.tsx` — Presence + action buttons
- `enhanced-comments-content.tsx` — Chat list + thread detail views
- `composer-with-ai.tsx` — Composer with slash command interception
- `chat-slash-commands.tsx` — Portal-rendered slash command dropdown
- `chat-ai-toolbar.tsx` — Multi-view AI toolbar dropdown
- `private-ai-panel.tsx` — Private streaming AI side panel
- `typing-indicator.tsx` — Real-time typing indicator
- `artifact-frame.tsx` — Generic artifact container
- `pricing-artifact.tsx` — Loan pricing state machine

### Components (deals/components/)
- `document-comments-section.tsx` — Document comments with bridge

### API Routes
- `src/app/api/chat/ai-comment/route.ts` — AI comment generation
- `src/app/api/chat/ai-private/route.ts` — Private AI streaming
- `src/app/api/chat/channels/route.ts` — Channel list
- `src/app/api/chat/deal-pricing/route.ts` — Deal pricing data
- `src/app/api/chat/bridge-comment/route.ts` — Comment bridge

### Webhooks
- `src/app/api/webhooks/liveblocks-sync/route.ts` — Liveblocks outbound sync
- `src/app/api/webhooks/slack/route.ts` — Slack inbound webhook
- `src/app/api/webhooks/teams/route.ts` — Teams inbound webhook

### Libraries
- `src/lib/message-format-converter.ts` — Format conversion

### Hooks
- `src/hooks/use-comment-bridge.ts` — Client-side comment bridge

### Migrations
- `supabase/migrations/20260302000000_add_messaging_integration_tables.sql`
