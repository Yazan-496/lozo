# Feature Specification: Presence & Status

**Status**: Ready
**Created**: 2026-03-26
**Spec**: 07 of 12

---

## Overview

Add real-time presence indicators across the app so users can see who is active, when someone was last seen, and when someone is typing — matching Facebook Messenger's presence experience exactly.

## Problem Statement

LoZo conversations feel static. Users have no way to know if the other person is currently online, when they were last active, or whether they are currently typing a reply. These presence signals are fundamental to the messaging experience and drive engagement.

---

## Goals & Objectives

1. Users MUST see a live typing indicator when the other person is composing a message
2. Users MUST see "Active now" in the chat header when the other person is online
3. Users MUST see "Active Xm ago" / "Active Xh ago" in the chat header based on last seen time
4. Online users MUST show a green dot on their avatar in the conversations list
5. Online users MUST show a green dot on their avatar in the contacts list
6. In the conversations list, a read receipt MUST be shown when the last message has been read by the other person

---

## User Scenarios & Testing

### Scenario 1: Typing Indicator

**As a** user in a chat,
**I want to** see when the other person is composing a message,
**So that** I know a reply is coming and don't send a follow-up too soon.

**Acceptance criteria:**
- When the other user starts typing, an animated "..." bubble appears at the bottom of the chat list
- The bubble shows 3 dots with a bouncing animation (one dot at a time, looping)
- The bubble disappears when the other user stops typing or sends the message
- The bubble appears within 500ms of the other user starting to type
- The typing indicator does not appear for my own messages

### Scenario 2: Online Status in Chat Header

**As a** user opening a chat,
**I want to** see whether the other person is currently online,
**So that** I know whether to expect a quick reply.

**Acceptance criteria:**
- If the other user is online: the header subtitle shows "Active now"
- If the other user is offline: the header shows "Active Xm ago" (minutes) or "Active Xh ago" (hours)
- If last seen was less than 1 minute ago: show "Active now"
- If last seen was less than 60 minutes ago: show "Active Xm ago" (e.g. "Active 5m ago")
- If last seen was 1–24 hours ago: show "Active Xh ago" (e.g. "Active 2h ago")
- If last seen was more than 24 hours ago: show "Active Xd ago" (e.g. "Active 1d ago")
- The status updates in real-time when the other user connects or disconnects — no app restart required

### Scenario 3: Online Dot in Conversations List

**As a** user scanning my conversation list,
**I want to** see at a glance which contacts are currently online,
**So that** I can choose who to message first.

**Acceptance criteria:**
- A small green dot appears on the bottom-right of the contact's avatar when they are online
- The dot disappears when they go offline
- The dot updates in real-time without requiring a refresh

### Scenario 4: Online Dot in Contacts List

**As a** user browsing my contacts,
**I want to** see who is currently online,
**So that** I can start a conversation at the right time.

**Acceptance criteria:**
- Same green dot behaviour as the conversations list (bottom-right of avatar, real-time)

### Scenario 5: Read Receipt in Conversations List

**As a** user viewing my conversation list,
**I want to** see when my last message has been read,
**So that** I know the other person has seen it.

**Acceptance criteria:**
- When the last message in a conversation was sent by me and has status "read": the other user's small avatar (14px) replaces or accompanies the unread count area
- When unread: show unread count as before
- When read: show the reader's avatar icon instead

---

## Functional Requirements

### FR-1: Typing Indicator

- FR-1.1: The chat screen MUST display a typing indicator bubble at the bottom of the message list when the other user is typing
- FR-1.2: The indicator MUST show 3 animated dots (sequential bounce animation, looping)
- FR-1.3: The indicator MUST appear within 500ms of receiving the typing event
- FR-1.4: The indicator MUST disappear when a typing:stop event is received or when a new message arrives from that user
- FR-1.5: The indicator MUST NOT appear for the current user's own typing activity

### FR-2: Online Status — Chat Header

- FR-2.1: The chat header subtitle MUST show a presence string derived from the other user's `isOnline` and `lastSeenAt` fields
- FR-2.2: Presence string rules (in priority order):
  - `isOnline === true` → "Active now"
  - `lastSeenAt` < 1 min ago → "Active now"
  - `lastSeenAt` < 60 min ago → "Active Xm ago"
  - `lastSeenAt` < 24 hours ago → "Active Xh ago"
  - `lastSeenAt` ≥ 24 hours ago → "Active Xd ago"
- FR-2.3: The status MUST update in real-time when `user:online` or `user:offline` socket events are received
- FR-2.4: "Offline" MUST never be displayed — match Messenger's pattern

### FR-3: Online Dot — Conversations List

- FR-3.1: Each conversation row's avatar MUST show a green online dot when `otherUser.isOnline === true`
- FR-3.2: The dot MUST be removed when the user goes offline
- FR-3.3: The dot MUST update in real-time via socket events without a list refresh

### FR-4: Online Dot — Contacts List

- FR-4.1: Each contact row's avatar MUST show a green online dot when the contact is online
- FR-4.2: Real-time updates MUST apply (same socket events as FR-3)

### FR-5: Read Receipt in Conversations List

- FR-5.1: When the last message in a conversation was sent by the current user AND has status "read", MUST show the other user's avatar (14px circular) in place of the unread count
- FR-5.2: When there are unread messages, MUST show the unread count badge as currently implemented
- FR-5.3: The read receipt avatar MUST update in real-time when a `messages:status` event is received

---

## Non-Functional Requirements

- **Latency**: Typing indicator MUST appear within 500ms of the other user beginning to type
- **Accuracy**: Online status MUST reflect actual connection state within 2 seconds of connect/disconnect
- **Performance**: Presence updates MUST NOT cause visible list re-renders or jank

---

## Success Criteria

1. Typing indicator appears within 500ms and disappears immediately when typing stops or a message is sent
2. Chat header shows correct presence string and updates in real-time on connect/disconnect
3. Green dots appear and disappear on avatars in both lists within 2 seconds of status change
4. Read receipt avatar shows in the conversations list when the last sent message is read
5. "Offline" is never shown anywhere in the app

---

## Key Entities

### PresenceState (client-side)
- `onlineUserIds`: `Set<string>` — user IDs currently online
- Updated by: `user:online` → add, `user:offline` → remove

### TypingState (client-side, per conversation)
- `isTyping`: boolean — whether the other user is currently typing

---

## Assumptions

1. The server already emits `user:online { userId }` on connect and `user:offline { userId, lastSeenAt }` on disconnect — no server changes needed
2. `typing:start` and `typing:stop` socket events already exist on both server and client
3. The `Avatar` component already supports an `isOnline` prop that renders the green dot
4. The `isOnline` and `lastSeenAt` fields are already on the `User` type and returned from the conversations/contacts APIs
5. The mobile app already receives `messages:status` updates via socket for read receipt tracking

---

## Out of Scope

- Push notifications for presence
- "Last seen" privacy settings (hide last seen from certain users)
- Typing indicators in group chats
- "Online" presence in the app header/tab bar
- Delivery receipts separate from read receipts (already partially implemented)

---

## Dependencies

- Spec 01 (UX Foundation) — Avatar component with `isOnline` prop already built
- Server socket events: `user:online`, `user:offline`, `typing:start`, `typing:stop`, `messages:status` (all already exist)
- No new server endpoints or socket events required
