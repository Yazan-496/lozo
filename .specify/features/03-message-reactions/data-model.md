# Data Model: Message Reactions

**Feature**: 03 — Message Reactions
**Date**: 2026-03-25

---

## Existing Entity: Reaction (on Message)

Already present in `ChatScreen.tsx` message type. No schema changes required.

```typescript
interface Reaction {
  userId: string;
  emoji: string;
}
```

Stored as `reactions: Reaction[]` on the `Message` object. The server owns the authoritative state; the client maintains an optimistic local copy.

---

## Derived Type: GroupedReaction (client-only)

Computed by `groupReactions()` helper. Not persisted.

```typescript
interface GroupedReaction {
  emoji: string;     // Unicode emoji character
  count: number;     // Total users with this emoji
  mine: boolean;     // true if currentUser.id has this emoji
}
```

**Derivation rules:**
- Group `Reaction[]` by `emoji`
- `count` = number of entries per emoji
- `mine` = any entry with `userId === currentUser.id` has this emoji
- Sort by `count` descending (ties broken by insertion order)
- Slice to max 6 groups

---

## State Additions to ChatScreen

New state variables required in `ChatScreen.tsx`:

| Variable | Type | Purpose |
|----------|------|---------|
| `showQuickReactionBar` | `boolean` | Controls QuickReactionBar Modal visibility |
| `selectedMessage` | `Message \| null` | Message currently targeted by long-press or action menu |
| `selectedMessageY` | `number` | Y coordinate of selected message (for Quick Bar positioning) |
| `showEmojiPicker` | `boolean` | Controls EmojiPickerModal visibility |

> Note: `selectedMessage` and `selectedMessageY` are shared with the existing Spec 02 MessageActionMenu state. The Spec 02 state (`showActionMenu`) already owns `selectedMessage` — Spec 03 reuses the same variables, adding only `showQuickReactionBar` and `showEmojiPicker`.

---

## Server API State

The server toggles reactions based on current state. No client-side "current state" lookup needed before calling — the server is authoritative.

**Toggle logic (server-enforced):**
- No current reaction → adds `{ userId, emoji }`
- Same emoji → removes the entry
- Different emoji → replaces the entry (atomic, single write)

---

## Socket Event Payload (existing)

`message:reaction` event already emitted by server and already handled in `ChatScreen.tsx`.

```typescript
{
  messageId: string;
  userId: string;
  emoji: string;
  action: 'added' | 'removed';
  conversationId: string;
}
```

When received: overwrite local reactions for the target message using the authoritative server data, not optimistic state.
