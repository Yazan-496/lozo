# Data Model: Message Actions

**Feature**: 02 — Message Actions
**Date**: 2026-03-25

---

## Existing Entities (no schema changes needed)

All required fields already exist in the `Message` type and server schema.

### Message (existing — relevant fields)

```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'voice' | 'file';
  content: string | null;            // null when deletedForEveryone
  replyToId: string | null;          // ID of parent message
  replyTo: ReplyTo | null;           // Snapshot for display (already populated by server)
  forwardedFromId: string | null;    // ID of original message when forwarded
  isForwarded: boolean;              // true for forwarded messages
  editedAt: string | null;           // ISO timestamp — presence drives "(edited)" label
  deletedForEveryone: boolean;       // true = show "Message deleted" placeholder
  createdAt: string;                 // ISO timestamp — used for edit/delete time windows
  reactions: Reaction[];
  status: 'sent' | 'delivered' | 'read' | null;
}
```

### ReplyTo (existing — relevant fields)

```typescript
interface ReplyTo {
  id: string;
  senderId: string;
  type: string;
  content: string | null;
  deletedForEveryone: boolean;       // If true, quoted content shows "Message deleted"
}
```

---

## New Client-Side State (in ChatScreen)

These are ephemeral UI states — not persisted, not sent to server.

### selectedMessage

```typescript
selectedMessage: Message | null   // The message that was long-pressed; null = menu closed
```

**Lifecycle**: Set on long-press → cleared on menu dismiss or action complete

### replyingTo

```typescript
replyingTo: Message | null        // Message being replied to; null = not in reply mode
```

**Lifecycle**: Set on Reply action or swipe → cleared on send or × tap

### editingMessage

```typescript
editingMessage: Message | null    // Message being edited; null = not in edit mode
```

**Lifecycle**: Set on Edit action → cleared on save or cancel

---

## Time Window Rules (client-side gate)

```typescript
// 15-minute edit window
canEdit(message: Message, currentUserId: string): boolean {
  if (message.senderId !== currentUserId) return false;
  if (message.type !== 'text') return false;
  const age = Date.now() - new Date(message.createdAt).getTime();
  return age < 15 * 60 * 1000;
}

// 1-hour delete-for-everyone window
canDeleteForEveryone(message: Message, currentUserId: string): boolean {
  if (message.senderId !== currentUserId) return false;
  const age = Date.now() - new Date(message.createdAt).getTime();
  return age < 60 * 60 * 1000;
}
```

Server enforces these constraints independently — client gates are UX-only.

---

## Forward Message Payload

When forwarding, the existing `sendMessage` endpoint accepts:

```typescript
{
  type: 'text',
  content: originalMessage.content,
  forwardedFromId: originalMessage.id
}
```

Server sets `isForwarded: true` automatically.
