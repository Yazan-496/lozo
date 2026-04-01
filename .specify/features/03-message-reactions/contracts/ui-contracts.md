# UI Contracts: Message Reactions

**Feature**: 03 — Message Reactions
**Date**: 2026-03-25

---

## Component: QuickReactionBar

**File**: `apps/mobile/src/features/chat/components/QuickReactionBar.tsx`

```typescript
interface QuickReactionBarProps {
  visible: boolean;
  messageId: string;
  messageY: number;          // Absolute Y position of the pressed message
  currentUserEmoji: string | null; // User's existing reaction on this message (null if none)
  onReact: (emoji: string) => void;
  onClose: () => void;       // Called on backdrop tap → opens MessageActionMenu
}
```

**Behavior contracts:**
- Renders as a transparent `Modal` (covers full screen)
- Emoji bar card auto-positions: if `messageY > screenHeight / 2` → above the message (`bottom: screenHeight - messageY + 8`), else below (`top: messageY + 8`)
- Bar contains exactly 6 emojis: `['👍', '❤️', '😂', '😮', '😢', '😡']`
- Currently-selected emoji (`currentUserEmoji`) is highlighted with `colors.primary` tint background
- Animates in with scale+fade (~120ms) on mount
- Tapping an emoji → calls `onReact(emoji)` then closes
- Tapping backdrop (outside bar) → calls `onClose()` (ChatScreen then opens MessageActionMenu)

---

## Component: EmojiPickerModal

**File**: `apps/mobile/src/features/chat/components/EmojiPickerModal.tsx`

```typescript
interface EmojiPickerModalProps {
  visible: boolean;
  currentUserEmoji: string | null; // Highlighted in the grid
  onReact: (emoji: string) => void;
  onClose: () => void;
}
```

**Behavior contracts:**
- Renders as a `Modal` with `animationType="slide"` (slides up from bottom)
- Covers bottom ~60% of screen; top 40% is semi-transparent backdrop
- Contains minimum 48 emojis across categories: smileys, gestures, symbols, objects
- Currently-selected emoji is highlighted with `colors.primary` tint in the grid
- Includes a drag handle bar (visual only) at the top of the sheet
- Tapping any emoji → calls `onReact(emoji)` then closes
- Tapping backdrop (top 40%) → calls `onClose()` without reacting

---

## Component: ReactionPills (inline, not a separate component)

Rendered inline inside `renderMessage` in `ChatScreen.tsx`.

```typescript
// Input
reactions: Reaction[];         // raw from message
currentUserId: string;

// Output (via groupReactions helper)
GroupedReaction[]              // max 6, sorted by count desc
```

**Behavior contracts:**
- Horizontal `ScrollView` (or `View` with `flexWrap: 'wrap'`) below message bubble
- Each pill: `TouchableOpacity` containing `emoji + ' ' + count`
- Mine (`mine: true`) → `backgroundColor: colors.primary + '30'` (tinted), `borderColor: colors.primary`
- Not mine → `backgroundColor: colors.surface`, `borderColor: colors.border`
- Tapping any pill → calls `handleReact(pill.emoji, message.id)`
- Hidden when `message.deletedForEveryone === true`

---

## Server API Contract

| Method | Endpoint | Body | Response | Notes |
|--------|----------|------|----------|-------|
| POST | `/chat/messages/:id/reactions` | `{ emoji: string }` | `200 OK` | Toggles: add / replace / remove |

**Toggle semantics:**
- User has no reaction → adds `emoji`
- User has same `emoji` → removes it
- User has different emoji → replaces with new `emoji`

No DELETE endpoint used — single POST handles all three cases per spec assumption.

---

## Helper Function: groupReactions

**Location**: inline in `ChatScreen.tsx` (not a separate file — one-time use)

```typescript
function groupReactions(
  reactions: Reaction[],
  currentUserId: string
): GroupedReaction[] {
  const map: Record<string, number> = {};
  let myEmoji: string | null = null;
  for (const r of reactions) {
    map[r.emoji] = (map[r.emoji] ?? 0) + 1;
    if (r.userId === currentUserId) myEmoji = r.emoji;
  }
  return Object.entries(map)
    .map(([emoji, count]) => ({ emoji, count, mine: emoji === myEmoji }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}
```
