# Data Model: Message Scheduling

**Feature**: 16-message-scheduling  
**Date**: 2026-04-01

## Entities

### ScheduledMessage

Represents a message composed by the user and set to be sent at a future time.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID, generated client-side |
| conversation_id | TEXT | NOT NULL | Foreign key to conversations.id |
| content | TEXT | NOT NULL | Message text content |
| scheduled_at | TEXT | NOT NULL | ISO 8601 timestamp (UTC) of when to send |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp of when scheduled |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp of last edit |
| status | TEXT | NOT NULL DEFAULT 'pending' | 'pending' \| 'sending' \| 'sent' \| 'canceled' |

**Indexes**:
- `idx_scheduled_conversation`: ON (conversation_id, scheduled_at ASC) — for listing by conversation
- `idx_scheduled_due`: ON (status, scheduled_at ASC) — for finding due messages

### Existing Entities (Referenced)

#### Conversation
- `id` TEXT PRIMARY KEY
- `other_user` TEXT NOT NULL
- `last_message` TEXT
- `unread_count` INTEGER
- `updated_at` TEXT

#### Message (destination for sent scheduled messages)
- `local_id` TEXT PRIMARY KEY
- `server_id` TEXT UNIQUE
- `conversation_id` TEXT NOT NULL
- `sender_id` TEXT NOT NULL
- `type` TEXT NOT NULL DEFAULT 'text'
- `content` TEXT
- `sync_status` TEXT NOT NULL DEFAULT 'pending'
- `created_at` TEXT NOT NULL

#### Outbox (queue for network sync)
- `local_id` TEXT PRIMARY KEY
- `conversation_id` TEXT NOT NULL
- `payload` TEXT NOT NULL (JSON)
- `status` TEXT NOT NULL DEFAULT 'queued'

## State Transitions

```
┌─────────────────────────────────────────────────────────┐
│                    ScheduledMessage                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐   edit/reschedule   ┌─────────┐            │
│  │ pending │ ←─────────────────→ │ pending │            │
│  └────┬────┘                     └─────────┘            │
│       │                                                  │
│       │ cancel                                           │
│       ├──────────────────────────→ ┌──────────┐         │
│       │                            │ canceled │ (DELETE) │
│       │                            └──────────┘         │
│       │                                                  │
│       │ scheduled_at <= now                              │
│       ↓                                                  │
│  ┌─────────┐    success    ┌──────┐                     │
│  │ sending │ ─────────────→│ sent │ (DELETE)            │
│  └────┬────┘               └──────┘                     │
│       │                         ↑                        │
│       │ network failure         │ retry success          │
│       ↓                         │                        │
│  ┌──────────────────────────────┴──┐                    │
│  │  Outbox (queued)                 │                    │
│  │  Message (sync_status: pending)  │                    │
│  └──────────────────────────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## SQL Schema

```sql
-- New table for scheduled messages
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Index for listing scheduled messages by conversation
CREATE INDEX IF NOT EXISTS idx_scheduled_conversation
  ON scheduled_messages (conversation_id, scheduled_at ASC);

-- Index for finding due messages efficiently
CREATE INDEX IF NOT EXISTS idx_scheduled_due
  ON scheduled_messages (status, scheduled_at ASC);
```

## Relationships

```
┌──────────────────┐       ┌───────────────────────┐
│   Conversation   │←──────│   ScheduledMessage    │
│                  │  1:N  │                       │
│  id              │       │  id                   │
│  other_user      │       │  conversation_id (FK) │
│                  │       │  content              │
└──────────────────┘       │  scheduled_at         │
                           │  status               │
                           └───────────────────────┘
                                     │
                                     │ on send
                                     ↓
                           ┌───────────────────────┐
                           │      Message          │
                           │                       │
                           │  local_id             │
                           │  conversation_id      │
                           │  content              │
                           │  sync_status          │
                           └───────────────────────┘
                                     │
                                     │ if offline
                                     ↓
                           ┌───────────────────────┐
                           │      Outbox           │
                           │                       │
                           │  local_id             │
                           │  payload (JSON)       │
                           │  status               │
                           └───────────────────────┘
```

## Validation Rules

| Rule | Field | Constraint |
|------|-------|------------|
| Future time | scheduled_at | Must be > current time |
| Max horizon | scheduled_at | Must be ≤ 30 days from now |
| Not empty | content | Must have non-whitespace content |
| Edit lock | scheduled_at | No edits when scheduled_at - now < 30 seconds |
| Max per conversation | count | ≤ 100 scheduled messages per conversation |

## TypeScript Interfaces

```typescript
export interface ScheduledMessage {
  id: string;
  conversationId: string;
  content: string;
  scheduledAt: string;  // ISO 8601 UTC
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'sending' | 'sent' | 'canceled';
}

export interface ScheduledMessageRow {
  id: string;
  conversation_id: string;
  content: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  status: string;
}

// Convert DB row to domain object
export function rowToScheduledMessage(row: ScheduledMessageRow): ScheduledMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status as ScheduledMessage['status'],
  };
}
```
