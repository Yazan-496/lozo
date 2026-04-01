# Data Model: Offline-First Messaging

**Feature**: 10 — Offline-First Messaging
**Date**: 2026-03-26

---

## SQLite Tables (Mobile Local Storage)

### `messages` (local)

Mirrors the server `messages` table plus offline-tracking fields.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `local_id` | TEXT | PRIMARY KEY | Client-generated ID (`local_${ts}_${rand}`) |
| `server_id` | TEXT | UNIQUE, nullable | Assigned by server after delivery |
| `conversation_id` | TEXT | NOT NULL, INDEX | FK concept → local `conversations.id` |
| `sender_id` | TEXT | NOT NULL | UUID of sender |
| `type` | TEXT | NOT NULL DEFAULT 'text' | 'text' \| 'image' \| 'voice' \| 'file' |
| `content` | TEXT | nullable | Text body |
| `media_url` | TEXT | nullable | Remote media URL |
| `media_name` | TEXT | nullable | File display name |
| `media_size` | INTEGER | nullable | Bytes |
| `media_duration` | REAL | nullable | Seconds (voice) |
| `reply_to_id` | TEXT | nullable | server_id of replied message |
| `is_forwarded` | INTEGER | NOT NULL DEFAULT 0 | Boolean 0/1 |
| `forwarded_from_id` | TEXT | nullable | |
| `edited_at` | TEXT | nullable | ISO timestamp |
| `deleted_for_everyone` | INTEGER | NOT NULL DEFAULT 0 | Boolean 0/1 |
| `sync_status` | TEXT | NOT NULL DEFAULT 'pending' | 'pending' \| 'sent' \| 'delivered' \| 'read' \| 'failed' |
| `created_at` | TEXT | NOT NULL | Client ISO timestamp |
| `server_created_at` | TEXT | nullable | Server ISO timestamp (from ack) |

**Indexes**: `idx_messages_conversation` on `(conversation_id, created_at DESC)`

**State machine**:
```
pending → sent → delivered → read
pending → failed (on 3 send errors)
failed → pending (on user retry)
```

---

### `outbox`

Persisted queue of messages waiting to be delivered.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `local_id` | TEXT | PRIMARY KEY | FK → `messages.local_id` |
| `conversation_id` | TEXT | NOT NULL, INDEX | For per-conversation ordering |
| `payload` | TEXT | NOT NULL | JSON-encoded send payload |
| `attempts` | INTEGER | NOT NULL DEFAULT 0 | Send attempt count |
| `last_attempt_at` | TEXT | nullable | ISO timestamp |
| `status` | TEXT | NOT NULL DEFAULT 'queued' | 'queued' \| 'failed' |
| `created_at` | TEXT | NOT NULL | For FIFO ordering |

**Constraint**: `status = 'failed'` when `attempts >= 3` and last attempt was a non-network error.

---

### `conversations` (local cache)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PRIMARY KEY | Server conversation UUID |
| `other_user` | TEXT | NOT NULL | JSON blob of `User` object |
| `last_message` | TEXT | nullable | JSON blob of last `Message` |
| `unread_count` | INTEGER | NOT NULL DEFAULT 0 | |
| `updated_at` | TEXT | NOT NULL | ISO timestamp for sort order |

---

## SQLite Migration

Single migration file applied at app startup via `db.execAsync`:

```sql
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
```

---

## Type Extensions (Mobile TypeScript)

### Updated `Message` type

```typescript
export interface Message {
  // existing fields ...
  id: string;           // server ID (null until delivered)
  localId?: string;     // client-generated, present for pending/failed messages
  syncStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  // ... rest unchanged
}
```

### New `LocalConversation` type

```typescript
export interface LocalConversation {
  id: string;
  otherUser: User;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}
```

---

## Server Changes

### `message:send` socket event

The server must echo `localId` back in its acknowledgment:

**Request payload** (unchanged structure, add `localId`):
```typescript
{
  conversationId: string;
  content: string;
  type: 'text';
  localId: string;   // NEW — client-generated, echoed back in response
}
```

**Response payload**:
```typescript
{
  id: string;         // server UUID
  localId: string;    // echoed back — client matches on this
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  // ... full message object
}
```

No schema migration needed server-side — `localId` is transient, not persisted.
