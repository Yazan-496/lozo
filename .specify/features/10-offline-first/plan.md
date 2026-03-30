# Implementation Plan: Offline-First Messaging

**Feature**: 10 — Offline-First Messaging
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-26
**Status**: Ready to implement

---

## Summary

Mobile app gets a local SQLite database with three tables (`messages`, `outbox`, `conversations`). All sends go through an outbox queue. ChatScreen and ConversationsScreen become cache-first. An `OfflineBanner` shows connectivity state. Server echoes `localId` in message acknowledgments.

**New mobile files**: `db/sqlite.ts`, `db/messages.db.ts`, `db/outbox.db.ts`, `db/conversations.db.ts`, `services/outbox.ts`, `stores/network.ts`, `hooks/useNetworkState.ts`, `components/OfflineBanner.tsx`
**Modified mobile files**: `types/index.ts`, `App.tsx`, `socket.ts`, `ChatScreen.tsx`, `ConversationsScreen.tsx`
**New server change**: echo `localId` in `message:send` socket handler
**New packages**: `expo-sqlite ~15.2.0`, `expo-network ~7.1.0`

---

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| Syria Accessibility | ✅ Pass | `expo-sqlite` and `expo-network` are bundled Expo modules, no external service |
| Offline-First Messaging | ✅ Pass | This feature IS the offline-first implementation per Principle 2 |
| TypeScript Everywhere | ✅ Pass | All new files in strict TypeScript |
| Feature-Based Architecture | ✅ Pass | New files go in `shared/db/`, `shared/services/`, `shared/stores/`, `shared/hooks/` per constitution |
| Messenger-Identical UX | ✅ Pass | Pending/sent/delivered/read/failed indicators match Messenger UX |
| Incremental Module Delivery | ✅ Pass | Each step is independently testable |

---

## Technical Context

| Concern | Decision |
|---|---|
| SQLite package | `expo-sqlite` ~15.x (Expo Go compatible, already in Expo SDK) |
| Network detection | `expo-network` for startup state + Socket.IO events for transitions |
| Local ID format | `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` |
| Outbox trigger | Socket.IO `connect` event → `outboxService.flush()` |
| Outbox ordering | FIFO per conversation via `created_at ASC` in outbox table |
| Max retries | 3 attempts; beyond that → `status = 'failed'` |
| Server change | `message:send` handler echoes `localId` in ack payload |
| Cache strategy | Load from SQLite first; background-refresh from server when online |
| Pruning | 90 days / 500 messages per conversation; run on startup |

---

## File Structure

```
apps/mobile/src/
├── shared/
│   ├── db/
│   │   ├── sqlite.ts              NEW — init + singleton
│   │   ├── messages.db.ts         NEW — messages CRUD
│   │   ├── outbox.db.ts           NEW — outbox CRUD
│   │   └── conversations.db.ts    NEW — conversations cache CRUD
│   ├── services/
│   │   ├── outbox.ts              NEW — outbox processor
│   │   └── socket.ts              MODIFY — flush outbox on connect
│   ├── stores/
│   │   └── network.ts             NEW — isOnline state
│   ├── hooks/
│   │   └── useNetworkState.ts     NEW — connectivity hook
│   ├── components/
│   │   └── OfflineBanner.tsx      NEW — offline UI indicator
│   └── types/index.ts             MODIFY — add localId, syncStatus to Message
├── features/
│   ├── chat/
│   │   ├── ChatScreen.tsx         MODIFY — SQLite read/write, optimistic send
│   │   └── ConversationsScreen.tsx MODIFY — cache-first load
└── App.tsx                        MODIFY — init SQLite, init network store
apps/server/src/
└── features/chat/
    └── chat.socket.ts             MODIFY — echo localId in message:send ack
```

---

## Step-by-Step Implementation

### Step 1: Install packages

```bash
cd apps/mobile
npx expo install expo-sqlite expo-network
```

---

### Step 2: SQLite setup — `db/sqlite.ts`

**File**: `apps/mobile/src/shared/db/sqlite.ts`

```typescript
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

const MIGRATION = `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    other_user TEXT NOT NULL,
    last_message TEXT,
    unread_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    local_id TEXT PRIMARY KEY,
    server_id TEXT UNIQUE,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    media_name TEXT,
    media_size INTEGER,
    media_duration REAL,
    reply_to_id TEXT,
    is_forwarded INTEGER NOT NULL DEFAULT 0,
    forwarded_from_id TEXT,
    edited_at TEXT,
    deleted_for_everyone INTEGER NOT NULL DEFAULT 0,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    server_created_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS outbox (
    local_id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_outbox_conversation
    ON outbox (conversation_id, created_at ASC);
`;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('lozo.db');
  await db.execAsync(MIGRATION);
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('SQLite not initialized — call initDatabase() first');
  return db;
}
```

---

### Step 3: Messages CRUD — `db/messages.db.ts`

**File**: `apps/mobile/src/shared/db/messages.db.ts`

Key operations:
- `insertMessage(row)` — inserts a new local message
- `getMessages(conversationId, limit?, before?)` — returns messages for a conversation, ordered by `created_at DESC`; `before` is an ISO timestamp for pagination
- `updateMessageStatus(localId, updates)` — patches `server_id`, `sync_status`, `server_created_at` on delivery ack
- `deleteMessage(localId)` — hard-delete (used for discard)
- `pruneOldMessages()` — delete messages older than 90 days AND messages beyond the last 500 per conversation

All functions use `getDb()`.

```typescript
export type SyncStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface LocalMessageRow {
  local_id: string;
  server_id: string | null;
  conversation_id: string;
  sender_id: string;
  type: string;
  content: string | null;
  media_url: string | null;
  media_name: string | null;
  media_size: number | null;
  media_duration: number | null;
  reply_to_id: string | null;
  is_forwarded: number;
  forwarded_from_id: string | null;
  edited_at: string | null;
  deleted_for_everyone: number;
  sync_status: SyncStatus;
  created_at: string;
  server_created_at: string | null;
}

export function localRowToMessage(row: LocalMessageRow): Message {
  // Maps SQLite row → Message type used by ChatScreen
  // Uses local_id as `id` if server_id is null
}
```

---

### Step 4: Outbox CRUD — `db/outbox.db.ts`

**File**: `apps/mobile/src/shared/db/outbox.db.ts`

```typescript
export interface OutboxRow {
  local_id: string;
  conversation_id: string;
  payload: string;   // JSON
  attempts: number;
  last_attempt_at: string | null;
  status: 'queued' | 'failed';
  created_at: string;
}

export async function enqueueOutbox(localId: string, conversationId: string, payload: object): Promise<void>
export async function getQueuedItems(): Promise<OutboxRow[]>  // status = 'queued', ordered by created_at ASC
export async function incrementAttempt(localId: string): Promise<void>
export async function markOutboxFailed(localId: string): Promise<void>
export async function removeFromOutbox(localId: string): Promise<void>
export async function requeueItem(localId: string): Promise<void>  // reset attempts + status = 'queued'
```

---

### Step 5: Conversations cache — `db/conversations.db.ts`

**File**: `apps/mobile/src/shared/db/conversations.db.ts`

```typescript
export async function upsertConversations(convs: Conversation[]): Promise<void>
export async function getCachedConversations(): Promise<Conversation[]>
export async function hideCachedConversation(id: string): Promise<void>
```

`upsertConversations` uses `INSERT OR REPLACE` to keep the cache fresh.

---

### Step 6: Network store — `stores/network.ts`

**File**: `apps/mobile/src/shared/stores/network.ts`

```typescript
import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  setOnline: (v: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,  // optimistic default; corrected in App.tsx on mount
  setOnline: (v) => set({ isOnline: v }),
}));
```

---

### Step 7: Outbox service — `services/outbox.ts`

**File**: `apps/mobile/src/shared/services/outbox.ts`

```typescript
import { getQueuedItems, incrementAttempt, markOutboxFailed, removeFromOutbox, requeueItem } from '../db/outbox.db';
import { updateMessageStatus } from '../db/messages.db';
import { getSocket } from './socket';

const MAX_ATTEMPTS = 3;
let flushing = false;

export async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const items = await getQueuedItems();
    for (const item of items) {
      await sendItem(item);
    }
  } finally {
    flushing = false;
  }
}

async function sendItem(item: OutboxRow): Promise<void> {
  const socket = getSocket();
  if (!socket?.connected) return;  // abort if socket dropped mid-flush

  const payload = JSON.parse(item.payload);
  try {
    await new Promise<void>((resolve, reject) => {
      socket.emit('message:send', payload, (ack: { error?: string; message?: ServerMessage }) => {
        if (ack.error) { reject(new Error(ack.error)); return; }
        resolve();
        // Update local record with server ID
        updateMessageStatus(item.local_id, {
          server_id: ack.message!.id,
          sync_status: 'sent',
          server_created_at: ack.message!.createdAt,
        });
        removeFromOutbox(item.local_id);
      });
    });
  } catch (err) {
    await incrementAttempt(item.local_id);
    const updated = await getDb().getFirstAsync<{ attempts: number }>(
      'SELECT attempts FROM outbox WHERE local_id = ?', [item.local_id]
    );
    if ((updated?.attempts ?? 0) >= MAX_ATTEMPTS) {
      await markOutboxFailed(item.local_id);
      await updateMessageStatus(item.local_id, { sync_status: 'failed' });
    }
  }
}

export async function retry(localId: string): Promise<void> {
  await requeueItem(localId);
  await updateMessageStatus(localId, { sync_status: 'pending' });
  await flush();
}

export async function discard(localId: string): Promise<void> {
  await removeFromOutbox(localId);
  // Caller removes from local messages store
}
```

---

### Step 8: Connectivity hook — `hooks/useNetworkState.ts`

**File**: `apps/mobile/src/shared/hooks/useNetworkState.ts`

```typescript
import { useEffect } from 'react';
import * as Network from 'expo-network';
import { useNetworkStore } from '../stores/network';
import { getSocket } from '../services/socket';

export function useNetworkState() {
  const setOnline = useNetworkStore((s) => s.setOnline);

  useEffect(() => {
    // Initial check
    Network.getNetworkStateAsync().then((state) => {
      setOnline(!!state.isInternetReachable);
    });

    // Socket.IO is the real-time signal
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setOnline(true);
    const onDisconnect = () => setOnline(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [setOnline]);
}
```

---

### Step 9: OfflineBanner component — `components/OfflineBanner.tsx`

**File**: `apps/mobile/src/shared/components/OfflineBanner.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStore } from '../stores/network';

export function OfflineBanner() {
  const isOnline = useNetworkStore((s) => s.isOnline);
  if (isOnline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#888888',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#fff', fontSize: 13 },
});
```

---

### Step 10: App.tsx — Initialize SQLite + network

**File**: `apps/mobile/App.tsx`

Add to startup sequence (before rendering):
```typescript
import { initDatabase } from './src/shared/db/sqlite';
import * as Network from 'expo-network';
import { useNetworkStore } from './src/shared/stores/network';

// In useEffect / hydration:
await initDatabase();
const netState = await Network.getNetworkStateAsync();
useNetworkStore.getState().setOnline(!!netState.isInternetReachable);
```

Mount `useNetworkState()` hook from the root component so Socket.IO events update network store globally.

---

### Step 11: Types — `types/index.ts`

Add `localId` and `syncStatus` to `Message`:

```typescript
export interface Message {
  id: string;
  localId?: string;  // present for pending/failed messages; matches local_id in SQLite
  syncStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  // ... all existing fields unchanged
}
```

---

### Step 12: socket.ts — Flush outbox on connect

**File**: `apps/mobile/src/shared/services/socket.ts`

In `connectSocket()`, after socket setup, add:
```typescript
socket.on('connect', () => {
  import('../services/outbox').then(({ flush }) => flush());
});
```

Also update disconnect handler to update network store:
```typescript
socket.on('disconnect', () => {
  useNetworkStore.getState().setOnline(false);
});
socket.on('connect', () => {
  useNetworkStore.getState().setOnline(true);
});
```

---

### Step 13: Server — chat.socket.ts

**File**: `apps/server/src/features/chat/chat.socket.ts`

In the `message:send` handler, accept `localId` from payload and echo it back in the acknowledgment:

```typescript
socket.on('message:send', async (data: { conversationId, content, type, localId? }, callback) => {
  try {
    const message = await chatService.sendMessage(...);
    callback({ message: { ...message, localId: data.localId } });
    // ... existing emit to other participant
  } catch (err) {
    callback({ error: err.message });
  }
});
```

---

### Step 14: ChatScreen.tsx — SQLite integration

**File**: `apps/mobile/src/features/chat/ChatScreen.tsx`

**Changes**:

1. **Load messages from SQLite first** (cache-first):
```typescript
// On mount, load cached messages immediately
const cached = await getMessages(conversationId, 50);
setMessages(cached.map(localRowToMessage));

// Then fetch from server (background refresh when online)
if (isOnline) {
  const serverMessages = await chatApi.getMessages(conversationId);
  // Upsert server messages into SQLite (preserve syncStatus for pending)
  await upsertServerMessages(serverMessages);
  setMessages(serverMessages);
}
```

2. **Optimistic send**:
```typescript
async function handleSend(content: string) {
  const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const optimisticMsg: Message = {
    id: localId,
    localId,
    syncStatus: 'pending',
    senderId: currentUser.id,
    conversationId,
    content,
    type: 'text',
    createdAt: new Date().toISOString(),
    // ... other fields
  };

  // 1. Write to SQLite
  await insertMessage(rowFromMessage(optimisticMsg));

  // 2. Show immediately in UI
  setMessages((prev) => [...prev, optimisticMsg]);

  // 3. Enqueue for sending (outbox handles online/offline automatically)
  const payload = { conversationId, content, type: 'text', localId };
  await enqueueOutbox(localId, conversationId, payload);

  // 4. If online, flush immediately
  if (isOnline) {
    await flush();
  }
}
```

3. **Message status indicators**:
In the message bubble renderer, show `syncStatus` icon for messages sent by `currentUser`:
```typescript
{msg.senderId === currentUser.id && (
  <SyncStatusIcon status={msg.syncStatus ?? 'sent'} />
)}
```

4. **Tap on failed message**:
```typescript
onLongPress for failed message → Alert.alert('Message not sent', ..., [
  { text: 'Retry', onPress: () => retry(msg.localId!) },
  { text: 'Discard', onPress: () => handleDiscard(msg.localId!) },
  { text: 'Cancel' },
])
```

5. **Handle message:new from socket** — reconcile server message with local optimistic:
```typescript
socket.on('message:new', (serverMsg) => {
  if (serverMsg.localId) {
    // This is an ack for our own sent message — already handled by outbox
    return;
  }
  // New message from other party
  insertMessage(rowFromMessage({ ...serverMsg, syncStatus: 'delivered' }));
  setMessages((prev) => [...prev, { ...serverMsg, syncStatus: 'delivered' }]);
});
```

6. **Mount `OfflineBanner`** at top of screen, below header.

---

### Step 15: ConversationsScreen.tsx — Cache-first

**File**: `apps/mobile/src/features/chat/ConversationsScreen.tsx`

1. On mount: load from `getCachedConversations()` immediately → display
2. When online: fetch from server → `upsertConversations(serverData)` → update display
3. On `conversation:deleted` socket event: `hideCachedConversation(id)`
4. Mount `OfflineBanner` at top

---

## Pruning Strategy

Run `pruneOldMessages()` once on startup (after `initDatabase()`):
- Delete messages older than 90 days
- For each conversation, keep only the 500 most recent (delete older ones)

This is a background operation — does not block app startup.

---

## Socket.IO `message:new` Deduplication

When the outbox processor receives a server ack for a sent message, it updates the local record's `server_id` and `sync_status`. When the socket also receives `message:new` for the same message (sent to other participants), the server includes `senderId`. ChatScreen should **skip inserting** messages where `senderId === currentUser.id` AND a local record with `server_id === msg.id` already exists.

---

## Drizzle Migration

No server-side schema migration needed. `localId` is accepted as a transient field in the socket handler but never persisted to PostgreSQL.
