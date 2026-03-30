# Feature Specification: Message Reactions

**Status**: Draft
**Created**: 2026-03-25
**Last Updated**: 2026-03-25
**Spec**: 03 of 12

---

## Overview

Add emoji reactions to chat messages, matching Facebook Messenger's interaction model. Users can react to any message with a single emoji using either a quick floating emoji bar (6 common emojis) or a full emoji picker. Each user has one active reaction per message. Reactions are shown as grouped pills below the bubble and update in real-time for both participants.

## Problem Statement

Messages currently support no emotional response shorter than a full reply. In every modern messaging app, reactions let users acknowledge or respond instantly without sending a text message. Their absence makes the app feel incomplete and reduces conversational engagement.

---

## Goals & Objectives

1. Users MUST be able to react to any message with one of 6 common emojis via a quick bar
2. Users MUST be able to choose from a broader emoji set via a full picker
3. Each user MUST have at most one active reaction per message at any time
4. Tapping your own active reaction MUST remove it (toggle off)
5. Tapping a different reaction MUST replace your current one in a single action
6. Reactions MUST be visible to both participants and update without a page refresh

---

## User Scenarios & Testing

### Scenario 1: Quick React via Floating Bar

**As a** user reading a message,
**I want to** quickly tap one of the 6 common emojis that appear on long-press,
**So that** I can react without going through a full menu.

**Acceptance criteria:**
- Long-pressing a message bubble shows a floating emoji bar with 6 emojis: 👍 ❤️ 😂 😮 😢 😡
- The bar appears above the message if the message is in the lower half of the screen, below if in the upper half
- Tapping any emoji adds that reaction and dismisses the bar
- The message bubble shows the reaction pill immediately (before server confirms)
- The other participant sees the reaction appear within 2 seconds

### Scenario 2: React via Full Picker

**As a** user,
**I want to** choose from a broader emoji set,
**So that** I can express a more specific reaction.

**Acceptance criteria:**
- Tapping "React" in the long-press action menu opens a full emoji picker bottom sheet
- The picker shows common emojis organized in rows
- Tapping any emoji applies it as a reaction and closes the picker
- Same toggle/replace behavior as the quick bar applies

### Scenario 3: Toggle Off a Reaction

**As a** user who already reacted to a message,
**I want to** remove my reaction,
**So that** I can undo an accidental tap.

**Acceptance criteria:**
- If I have an active reaction on a message, tapping the same emoji (via quick bar, full picker, or pill tap) removes it
- The pill disappears from the message if no other users have the same reaction
- The count decreases by 1 if other users share that emoji

### Scenario 4: Replace a Reaction

**As a** user who already reacted,
**I want to** switch to a different emoji,
**So that** I can correct my reaction without first removing it.

**Acceptance criteria:**
- Tapping a different emoji than my current one replaces my reaction in one action (no explicit "remove first" step)
- The previous emoji pill count decreases; the new emoji pill count increases (or appears)

### Scenario 5: View Reactions on a Message

**As a** user reading a conversation,
**I want to** see which emojis have been used on each message and how many,
**So that** I can understand the group sentiment.

**Acceptance criteria:**
- Reactions appear as pill(s) below the message bubble
- Each pill shows the emoji + total count (e.g., 👍 2)
- Up to 6 distinct emoji types shown per message
- My own active reaction pill is visually highlighted (distinct background)
- Tapping a pill that is my reaction removes it; tapping another's reaction replaces mine with that emoji

---

## Functional Requirements

### FR-1: Floating Quick Emoji Bar

- FR-1.1: Long-pressing a message MUST show a quick emoji bar containing exactly: 👍 ❤️ 😂 😮 😢 😡
- FR-1.2: The quick bar MUST appear before (or in place of) the full action menu's backdrop — i.e. it is the first thing the user sees on long-press; tapping outside it opens or dismisses the full menu
- FR-1.3: Auto-position: bar appears above the message if messageY > screenHeight/2, below otherwise
- FR-1.4: The bar MUST animate in (scale + fade, ~120ms)
- FR-1.5: Tapping an emoji in the bar MUST apply the reaction and close the bar immediately (full menu does not open)
- FR-1.6: Tapping the backdrop (outside the bar) MUST open the full action menu (MessageActionMenu) instead of dismissing both

### FR-2: Full Emoji Picker

- FR-2.1: Tapping "React" in the long-press action menu (MessageActionMenu) MUST open the full emoji picker
- FR-2.2: The picker MUST present as a bottom sheet (slides up from bottom)
- FR-2.3: The picker MUST show a grid of common emojis (minimum 40 emojis across common categories: smileys, gestures, symbols)
- FR-2.4: Tapping any emoji in the picker MUST apply it as a reaction and close the picker
- FR-2.5: The picker MUST have a drag handle or close button to dismiss without reacting

### FR-3: Reaction Logic

- FR-3.1: Each user can have at most one active reaction per message at any time
- FR-3.2: If the user has no current reaction → tapping an emoji ADDS it
- FR-3.3: If the user taps their current emoji again → REMOVES the reaction
- FR-3.4: If the user taps a different emoji → REPLACES their current reaction (single server call, not remove + add)
- FR-3.5: Optimistic UI: update local state immediately, revert on server error

### FR-4: Reaction Display

- FR-4.1: Reactions are displayed as a horizontal pill row below the message bubble
- FR-4.2: Each pill shows: emoji + total count of users with that reaction
- FR-4.3: Pills are sorted by count descending; ties broken by first-received order
- FR-4.4: Maximum 6 distinct emoji pills shown per message
- FR-4.5: My own active reaction pill MUST be visually differentiated (e.g., highlighted background, `colors.primary` tint)
- FR-4.6: Tapping a pill performs the reaction toggle/replace logic (FR-3)

### FR-5: Real-time Sync

- FR-5.1: Reaction changes MUST propagate to the other participant via the existing `message:reaction` socket event
- FR-5.2: The existing socket handler in ChatScreen already processes `message:reaction` — no new listeners needed
- FR-5.3: Both add and remove reactions use `POST /chat/messages/:id/reactions`; the server determines add vs. replace vs. remove based on current state

---

## Non-Functional Requirements

- **Speed**: Quick bar MUST appear within 100ms of long-press completing
- **Optimistic UI**: Reaction changes MUST feel instant; server round-trip must not block the visual update
- **Real-time**: Reaction changes MUST appear on the other device within 2 seconds

---

## Success Criteria

1. A user can react to a message in under 2 taps from long-press
2. Reactions appear on both devices within 2 seconds of being applied
3. Tapping your own reaction pill removes it without any confirmation
4. Tapping "React" from the action menu opens the full picker in under 150ms
5. Replacing a reaction requires exactly 1 tap (no remove-then-add flow)

---

## Key Entities

### Reaction (existing)
- `emoji`: the Unicode emoji character
- `userId`: the reacting user's ID

Reactions are stored as an array on the `Message` object. Max 6 distinct emoji types enforced by display logic; server may allow more.

### QuickEmojiBar (UI-only)
- `emojis`: fixed list `['👍', '❤️', '😂', '😮', '😢', '😡']`
- `messageId`: the message being reacted to
- `currentUserEmoji`: the user's current reaction on this message (for highlight)

---

## Assumptions

1. The server `POST /chat/messages/:id/reactions` handles add, replace, and remove in one endpoint — the body `{ emoji }` toggles: if user already has this emoji → removes it; if user has a different emoji → replaces it; if user has none → adds it
2. The existing `message:reaction` socket event payload already contains `{ messageId, userId, emoji, action: 'added' | 'removed', conversationId }` — ChatScreen already handles it
3. The full emoji picker does not need categories/tabs in this spec — a flat scrollable grid is sufficient
4. The quick bar and full picker share the same reaction logic function
5. Reactions on deleted messages (`deletedForEveryone: true`) are not shown

---

## Out of Scope

- Who reacted list (tapping to see usernames)
- Animated reaction effects (floating emoji animation)
- Custom emoji or stickers
- Reaction notifications / push alerts
- Reaction analytics or counts in conversation preview

---

## Dependencies

- Spec 01 (UX Foundation) — Toast system for error feedback
- Spec 02 (Message Actions) — `onReact` callback in `MessageActionMenu` is the entry point for the full picker; long-press trigger is shared
- Server endpoints: `POST /chat/messages/:id/reactions` (add/replace/remove toggle)
- No new packages required — emoji characters are plain Unicode text

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Long-press conflict: quick bar vs. action menu both triggered | Duplicate UI | Quick bar intercepts the long-press first; full menu only opens if user taps outside the bar |
| Optimistic update diverges from server state | Wrong reaction shown | On socket event received, overwrite local state with authoritative server payload |
| Emoji rendering inconsistency across Android versions | Emojis look different or missing | Use only widely supported Unicode emojis from the common set; test on Android 10+ |
