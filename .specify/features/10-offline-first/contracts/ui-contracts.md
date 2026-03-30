# UI Contracts: Offline-First Messaging

**Feature**: 10 — Offline-First Messaging
**Date**: 2026-03-26

---

## OfflineBanner Component

**Location**: `apps/mobile/src/shared/components/OfflineBanner.tsx`

**Props**:
```typescript
interface OfflineBannerProps {
  // no props — reads from network store directly
}
```

**Behavior**:
- Renders when `useNetworkStore().isOnline === false`
- Renders nothing (null) when online
- Appears at the top of the active screen (below the header)
- Does not block interaction — absolute-positioned overlay row

**Visual spec**:
- Background: `#FF3B30` (Messenger destructive red) or `#888` (neutral gray) — use gray to avoid alarm fatigue
- Text: "You're offline" white, 13pt
- Height: 28 dp
- Animates in/out with a slide-down / slide-up (50 ms)

---

## Message Sync Status Indicators

Rendered inline in the message bubble row (sender side only).

| `syncStatus` | Icon | Color | Placement |
|---|---|---|---|
| `pending` | Clock outline (⏱) | Gray `#8e8e8e` | Bottom-right of bubble |
| `sent` | Single tick (✓) | Gray `#8e8e8e` | Bottom-right of bubble |
| `delivered` | Double tick (✓✓) | Gray `#8e8e8e` | Bottom-right of bubble |
| `read` | Double tick (✓✓) | Blue `#0084FF` | Bottom-right of bubble |
| `failed` | Warning circle (⚠) | Red `#FF3B30` | Bottom-right of bubble |

These replace the current static status display in `ChatScreen`. Icons are from `@expo/vector-icons` (already installed).

---

## Failed Message Action Sheet

**Trigger**: Tap on a message with `syncStatus === 'failed'`

**Sheet** (Alert.alert):
```
Title: "Message not sent"
Message: "This message could not be delivered."
Actions:
  - "Retry"    → re-enqueues in outbox
  - "Discard"  → removes from outbox + local messages
  - "Cancel"   → dismisses
```

---

## Outbox Module Interface

**Location**: `apps/mobile/src/shared/services/outbox.ts`

```typescript
export interface OutboxService {
  /** Add a message to the outbox queue. Called immediately after SQLite write. */
  enqueue(localId: string, conversationId: string, payload: SendPayload): Promise<void>;

  /** Process all queued items. Called on socket connect. */
  flush(): Promise<void>;

  /** Retry a single failed message by localId. */
  retry(localId: string): Promise<void>;

  /** Remove a failed message permanently. */
  discard(localId: string): Promise<void>;
}
```

---

## SQLite Module Interface

**Location**: `apps/mobile/src/shared/db/sqlite.ts`

```typescript
/** Initialize the database and run migrations. Must be awaited before any DB access. */
export async function initDatabase(): Promise<void>;

/** Get the singleton SQLiteDatabase instance. Throws if initDatabase not called first. */
export function getDb(): SQLiteDatabase;
```

**Location**: `apps/mobile/src/shared/db/messages.db.ts`

```typescript
export async function insertMessage(msg: LocalMessageRow): Promise<void>;
export async function getMessages(conversationId: string, limit?: number, before?: string): Promise<LocalMessageRow[]>;
export async function updateMessageStatus(localId: string, updates: Partial<Pick<LocalMessageRow, 'server_id' | 'sync_status' | 'server_created_at'>>): Promise<void>;
export async function deleteMessage(localId: string): Promise<void>;
export async function pruneOldMessages(daysOld?: number, maxPerConversation?: number): Promise<void>;
```

**Location**: `apps/mobile/src/shared/db/conversations.db.ts`

```typescript
export async function upsertConversation(conv: LocalConversationRow): Promise<void>;
export async function getConversations(): Promise<LocalConversationRow[]>;
export async function hideConversation(id: string): Promise<void>;
```

---

## Network Store Interface

**Location**: `apps/mobile/src/shared/stores/network.ts` (new Zustand store)

```typescript
interface NetworkState {
  isOnline: boolean;
  setOnline: (v: boolean) => void;
}
```

Initialized from `expo-network` on startup; updated by Socket.IO `connect`/`disconnect` events.
