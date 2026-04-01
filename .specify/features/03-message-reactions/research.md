# Research: Message Reactions

**Feature**: 03 — Message Reactions
**Date**: 2026-03-25

---

## Decision 1: Quick Emoji Bar Presentation

**Decision**: Separate `Modal` component (`QuickReactionBar`) rendered instead of `MessageActionMenu` on initial long-press. If user taps the backdrop, the quick bar closes and `MessageActionMenu` opens. If user taps an emoji, the reaction is applied and everything closes.

**Rationale**: The spec requires two distinct states: (1) emoji bar only, (2) full action menu. Using a separate Modal for the quick bar keeps the components decoupled — `QuickReactionBar` is purely about reactions, `MessageActionMenu` is about actions. The backdrop-tap-to-reveal-menu pattern matches Messenger exactly.

**State flow in ChatScreen**:
```
onLongPress → showQuickReactionBar = true (selectedMessage set, selectedMessageY set)

QuickReactionBar backdrop tap:
  → showQuickReactionBar = false
  → showActionMenu = true (selectedMessage already set)

QuickReactionBar emoji tap:
  → handleReact(emoji, selectedMessage.id)
  → showQuickReactionBar = false
  → selectedMessage = null
```

**Alternatives considered**:
- Combine emoji bar + action menu in a single Modal — simpler but doesn't match the spec's "before the full menu" requirement and looks cramped
- Show emoji bar embedded inline above the message (not a Modal) — complex layout with z-index issues inside FlatList
- Two-phase long-press (short = emoji bar, longer = full menu) — poor UX, hard to control timing

---

## Decision 2: Full Emoji Picker Implementation

**Decision**: `Modal` with `animationType="slide"` (slides up from bottom), containing a `FlatList` of emoji in a grid layout. No bottom sheet library.

**Rationale**: `@gorhom/bottom-sheet` requires native linking — incompatible with Expo Go (SDK 54 constraint). `react-native-bottom-sheet` same issue. A plain Modal with `animationType="slide"` achieves the bottom sheet look with zero new packages. The modal covers the bottom 60% of the screen, leaving the top 40% as a semi-transparent backdrop the user can tap to close.

**Emoji data**: Hardcoded array of ~48 common emojis grouped into categories (smileys, gestures, symbols, objects). No emoji package needed — all Unicode characters.

**Alternatives considered**:
- `@gorhom/bottom-sheet` — requires native build, incompatible with Expo Go ❌
- `react-native-modal` — no native linking needed, but adds a package for something achievable natively ❌
- Plain Modal slide-up ✅ — zero new packages, Expo Go compatible

---

## Decision 3: Reaction API — Add / Replace / Remove

**Decision**: Single endpoint `POST /chat/messages/:id/reactions` with `{ emoji }`. Server-side toggle: same emoji = remove, different emoji = replace (atomic), no current = add.

**Client-side optimistic update pattern**:
```typescript
function handleReact(emoji: string, messageId: string) {
  const message = messages.find(m => m.id === messageId);
  if (!message) return;
  const myCurrentReaction = message.reactions.find(r => r.userId === currentUser.id);

  // Optimistic: update local state immediately
  setMessages(prev => prev.map(m => {
    if (m.id !== messageId) return m;
    let reactions = m.reactions.filter(r => r.userId !== currentUser.id);
    if (myCurrentReaction?.emoji !== emoji) {
      reactions = [...reactions, { emoji, userId: currentUser.id }];
    }
    return { ...m, reactions };
  }));

  // Fire API (no await — background)
  api.post(`/chat/messages/${messageId}/reactions`, { emoji }).catch(() => {
    // Revert on error: reload from server or restore original
    showToast('error', 'Failed to update reaction');
  });
}
```

**Alternatives considered**:
- Two separate endpoints (POST to add, DELETE to remove) — more explicit but requires client to know current state before deciding which to call; spec says server handles toggle

---

## Decision 4: Reaction Pills — Display and Interaction

**Decision**: Render reaction pills in `renderMessage` inside ChatScreen. Each pill is a `TouchableOpacity` containing emoji text + count. My own reaction has `colors.primary` tint background. Tap = call `handleReact(emoji, message.id)`.

**Grouping logic**:
```typescript
function groupReactions(reactions: Reaction[]): { emoji: string; count: number; mine: boolean }[] {
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

This replaces the existing simple `reactions.map` in ChatScreen's `renderMessage`.

---

## Decision 5: No New Packages

**Decision**: Zero new packages for this spec.

**Full inventory**:
- Emoji characters — plain Unicode strings, no package
- Bottom sheet — native Modal with slide animation
- Quick bar — native Modal with Animated scale-in
- Reaction API — existing `api` axios instance

**Constitution compliance**: ✅ All decisions use Expo Go-compatible primitives, no external services.

---

## Constitution Compliance Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Syria Accessibility | ✅ PASS | No external services; emoji are Unicode |
| Offline-First | ⚠ DEFERRED | Reactions are network-only; offline queue is Spec 10 |
| TypeScript Everywhere | ✅ PASS | All new code strict TypeScript |
| Feature-Based Architecture | ✅ PASS | New components in `features/chat/components/` |
| Messenger-Identical UX | ✅ PASS | Quick bar + full picker matches Messenger exactly |
| Incremental Module Delivery | ✅ PASS | All reaction flows complete in this spec |
