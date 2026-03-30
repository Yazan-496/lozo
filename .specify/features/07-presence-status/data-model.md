# Data Model: Presence & Status

**Feature**: 07 — Presence & Status
**Date**: 2026-03-26

---

## Client-Side Entities

### PresenceStore (Zustand)

```typescript
interface PresenceState {
  onlineUserIds: Set<string>;        // user IDs currently online
  lastSeenMap: Record<string, string>; // userId → ISO 8601 string
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeenAt: string) => void;
  seedOnline: (userIds: string[]) => void; // for future bulk init
}
```

**Populated by**:
- `user:online { userId }` → `setOnline(userId)`
- `user:offline { userId, lastSeenAt }` → `setOffline(userId, lastSeenAt)`

**Fallback**: If a user's `userId` is NOT in `lastSeenMap`, fall back to `user.lastSeenAt` from the API response (the server DB value at load time).

---

### Updated Conversation Type

```typescript
Conversation.lastMessage: {
  id: string;
  senderId: string;
  type: string;
  content: string | null;
  isForwarded: boolean;
  deletedForEveryone: boolean;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read' | null;  // ← NEW
} | null;
```

**Status semantics** in ConversationsScreen context:
- `null` — status unknown or message has no status row
- `'sent'` — delivered to server, not yet received by recipient
- `'delivered'` — recipient's device received it
- `'read'` — recipient has opened the conversation

---

## Server-Side Schema (no changes)

The `messageStatuses` table already tracks per-recipient status:

```sql
message_statuses (
  id          uuid primary key,
  message_id  uuid references messages(id),
  user_id     uuid references users(id),  -- recipient user
  status      text check (status in ('delivered', 'read')),
  updated_at  timestamp
)
```

The `users` table already has:
```sql
users (
  ...
  is_online     boolean default false,
  last_seen_at  timestamp default now()
)
```

---

## Socket Event Contracts

### `user:online`
```typescript
// Server → All connected clients (broadcast)
{ userId: string }
```

### `user:offline`
```typescript
// Server → All connected clients (broadcast)
{ userId: string; lastSeenAt: string } // lastSeenAt is ISO 8601
```

### `typing:start` (existing)
```typescript
{ userId: string; conversationId: string }
```

### `typing:stop` (existing)
```typescript
{ userId: string; conversationId: string }
```

### `messages:status` (existing)
```typescript
{ conversationId: string; status: 'delivered' | 'read'; userId: string }
```
