# Feature Specification: Message Actions

**Status**: Draft
**Created**: 2026-03-25
**Last Updated**: 2026-03-25
**Spec**: 02 of 12

---

## Overview

Add a long-press context menu to every message bubble in the chat screen, giving users the same action set as Facebook Messenger: reply, copy, forward, edit, and delete. Each action is contextual — available options vary based on message ownership and age. This spec covers the complete interaction flow from triggering the menu through completing each action.

## Problem Statement

Currently, users can only read messages — there is no way to reply to a specific message, edit a sent message, delete a message, copy text, or forward a message to another conversation. This creates a major gap from standard messenger UX. Every modern chat app provides these actions via long-press; their absence makes the app feel fundamentally incomplete.

---

## Goals & Objectives

1. Long-pressing any message MUST open a contextual action menu
2. Reply MUST work via both long-press menu and swipe gesture
3. Edit MUST be restricted to own text messages within 15 minutes of sending
4. Delete for everyone MUST be restricted to own messages within 1 hour of sending
5. Copy MUST place the message text on the system clipboard
6. Forward MUST allow selecting one conversation to send the message to
7. All actions MUST feel instant and require no page navigation

---

## User Scenarios & Testing

### Scenario 1: Long-press Menu Appears

**As a** user in a chat conversation,
**I want to** long-press a message bubble to see available actions,
**So that** I can choose what to do with that message.

**Acceptance criteria:**
- Long pressing any message bubble for ~500ms opens the action menu
- A semi-transparent backdrop dims the rest of the screen
- The menu auto-positions above the message if the message is in the bottom half of the screen, or below if in the top half
- Menu shows only actions applicable to that message (see FR-1 for rules)
- Tapping the backdrop or pressing back dismisses the menu without any action

### Scenario 2: Reply to a Message

**As a** user in a chat,
**I want to** reply to a specific message,
**So that** the other person can see which message I'm responding to.

**Acceptance criteria:**
- Tapping "Reply" in the menu OR swiping the message bubble to the right triggers reply mode
- A reply preview bar appears above the message input showing: sender name + first 50 characters of original message
- An × button in the preview bar cancels reply mode
- When the reply is sent, it appears as a bubble with a smaller quoted version of the original message above the text
- Tapping the quoted part of a sent reply scrolls the message list to the original message
- Reply works for both my messages and the other person's messages

### Scenario 3: Edit a Message

**As a** user who sent a text message,
**I want to** edit it within 15 minutes of sending,
**So that** I can fix typos or rephrase without deleting.

**Acceptance criteria:**
- "Edit" appears in the menu only for: my messages + text type + sent within 15 minutes
- Tapping "Edit" pre-fills the message input with the current message text
- An "Editing" label is displayed above the input bar (with a cancel option)
- Tapping cancel restores normal input state without changes
- Tapping save replaces the message text in the conversation
- The edited message displays an "(edited)" label below the text
- Other users see the updated text immediately (real-time)

### Scenario 4: Delete a Message

**As a** user who sent a message,
**I want to** delete it,
**So that** I can remove content I no longer want visible.

**Acceptance criteria:**
- "Delete for me" removes the message from my local view only; the other user still sees it
- "Delete for everyone" shows a confirmation dialog before proceeding
- After confirmed delete for everyone: message shows "Message deleted" placeholder on both sides
- "Delete for everyone" is only available within 1 hour of sending
- Both delete options are only available for my own messages

### Scenario 5: Copy Message Text

**As a** user reading a message,
**I want to** copy the text content,
**So that** I can paste it elsewhere.

**Acceptance criteria:**
- Tapping "Copy" places the message text on the device clipboard
- A brief success toast confirms "Copied to clipboard"
- Works for both my messages and the other person's messages
- Only available for text-type messages (not media)

### Scenario 6: Forward a Message

**As a** user,
**I want to** forward a message to another conversation,
**So that** I can share it with someone else without retyping.

**Acceptance criteria:**
- Tapping "Forward" opens a conversation/contact picker modal
- The picker lists all existing conversations (same list as Chats tab)
- User selects one conversation and confirms
- The message content is sent to that conversation as a new message
- A success toast confirms "Message forwarded"
- Forward works for both my messages and the other person's messages

---

## Functional Requirements

### FR-1: Long-press Menu

- FR-1.1: Any message bubble MUST respond to a long-press gesture (~500ms threshold)
- FR-1.2: On long-press, a backdrop overlay MUST dim the background (semi-transparent dark)
- FR-1.3: The action menu MUST auto-position: above the message if message is in the bottom 50% of the screen, below if in the top 50%
- FR-1.4: Menu MUST close on backdrop tap or hardware back press without performing any action
- FR-1.5: Action visibility rules:
  - **Reply**: always shown (my messages and theirs)
  - **Copy**: shown only for text-type messages (my and theirs)
  - **Forward**: always shown (my messages and theirs)
  - **Edit**: shown only when all 3 conditions are true: my message + text type + sent within 15 minutes
  - **Delete for me**: shown only for my messages
  - **Delete for everyone**: shown only when: my message + sent within 1 hour
  - **React**: shown as an option but deferred to Spec 03 (tapping it closes menu only)
- FR-1.6: Menu items MUST be displayed in this order: React, Reply, Copy, Forward, Edit, Delete for me, Delete for everyone
- FR-1.7: Destructive actions (Delete) MUST be visually distinguished (red text/icon)

### FR-2: Reply

- FR-2.1: Reply can be triggered from the long-press menu OR by swiping the message bubble right
- FR-2.2: Swipe-to-reply threshold: message translates right up to 60px; releasing past 40px triggers reply
- FR-2.3: A reply preview bar MUST appear above the message input bar showing: colored left border + sender name + truncated message (max 50 characters, ellipsis if longer)
- FR-2.4: The preview bar MUST have an × button on the right to cancel reply mode
- FR-2.5: Sent messages with a reply reference MUST display a compact quoted bubble above the message content (different background shade)
- FR-2.6: Tapping the quoted section of a reply MUST scroll the list to reveal the original message
- FR-2.7: If the original message is no longer in the loaded message list, scrolling is a best-effort (no error if not found)

### FR-3: Edit

- FR-3.1: The edit time window is 15 minutes from `createdAt` timestamp of the message
- FR-3.2: Tapping Edit MUST populate the text input with the current message content and focus it
- FR-3.3: An "Editing" indicator MUST be shown above the input bar with a cancel button
- FR-3.4: Saving an edit MUST update the message in the conversation list in real-time (socket broadcast)
- FR-3.5: Edited messages MUST display an "(edited)" label below the message text
- FR-3.6: The "(edited)" label MUST also be visible to the recipient

### FR-4: Delete

- FR-4.1: "Delete for me" removes the message from the local messages array without a server call
- FR-4.2: "Delete for everyone" MUST show a confirmation dialog: "Delete for everyone? This cannot be undone." with Cancel and Delete buttons
- FR-4.3: On confirmed delete for everyone: the message content is replaced with a "Message deleted" placeholder visible to all parties
- FR-4.4: Delete for everyone time window is 1 hour from `createdAt` timestamp
- FR-4.5: Both delete options MUST only appear for messages where `senderId === currentUserId`

### FR-5: Copy

- FR-5.1: Tapping Copy writes `message.content` to the system clipboard
- FR-5.2: A toast notification MUST confirm "Copied to clipboard"
- FR-5.3: Copy is only available when `message.type === 'text'` and `message.content` is not null

### FR-6: Forward

- FR-6.1: Tapping Forward opens a modal over the current screen listing all conversations
- FR-6.2: Each conversation row shows the other user's avatar, name, and last message preview
- FR-6.3: Selecting a conversation and confirming sends the message content to that conversation via the existing message send mechanism
- FR-6.4: A success toast MUST confirm "Message forwarded"
- FR-6.5: The forward modal MUST have a close button (× top-right) to cancel without forwarding

---

## Non-Functional Requirements

- **Responsiveness**: Menu MUST open within 100ms of long-press completing
- **Gesture accuracy**: Swipe-to-reply MUST not conflict with the list's scroll gesture (horizontal vs vertical clearly distinguished)
- **Real-time**: Edit and delete for everyone MUST propagate to the other side without a page refresh

---

## Success Criteria

1. Long-pressing any message opens a menu within 100ms and shows only valid actions for that message
2. A reply message is sent and displays the quoted original; tapping it scrolls to the source
3. An edited message shows "(edited)" on both sides within 2 seconds of saving
4. "Delete for everyone" removes message content on both sides within 2 seconds of confirmation
5. Copying a message places the text on clipboard (verifiable by pasting)
6. Forwarding a message delivers it to the selected conversation

---

## Key Entities

### Message (extended)
- `id`: unique identifier
- `conversationId`: parent conversation
- `senderId`: author user ID
- `content`: text content (nullable if deleted or media)
- `type`: text | image | voice | file
- `replyToId`: ID of the message being replied to (nullable)
- `replyTo`: nested snapshot of the original message for display (sender name + content)
- `deletedForEveryone`: boolean — true shows "Message deleted" placeholder
- `editedAt`: timestamp of last edit (nullable) — presence drives "(edited)" label
- `createdAt`: timestamp used to calculate edit/delete windows
- `status`: sent | delivered | read

---

## Assumptions

1. The existing `message.replyTo` field already exists on the message type (server sends it)
2. The 15-minute edit window and 1-hour delete window are enforced on both client and server
3. Swipe-to-reply uses the existing `react-native-gesture-handler` — no new package needed
4. Clipboard access uses `@react-native-clipboard/clipboard` or the built-in `Clipboard` from `react-native` (to be confirmed during planning)
5. Forward uses the existing conversations list API — no new endpoint needed
6. The "React" action in the menu is a placeholder that will be wired up in Spec 03

---

## Out of Scope

- Message search
- Bulk message selection
- Pin messages
- Star/bookmark messages
- Message reactions (Spec 03)
- Deleting other people's messages

---

## Dependencies

- Spec 01 (UX Foundation) — toast system required for copy confirmation and forward confirmation
- Server endpoints: `PUT /chat/messages/:id/edit`, `DELETE /chat/messages/:id?forEveryone=true`
- `react-native-gesture-handler` (already installed) — for swipe-to-reply
- Clipboard API — built-in or `@react-native-clipboard/clipboard`

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Swipe-to-reply conflicts with ScrollView scroll gesture | Gesture battles, poor UX | Use horizontal-only PanResponder with velocity threshold; abort on vertical scroll |
| Menu positioning overlaps status bar on small screens | Menu clipped | Clamp menu position with SafeAreaInsets |
| Clipboard API deprecated in newer RN versions | Copy fails silently | Test on target SDK; use `@react-native-clipboard/clipboard` if built-in removed |
| Edit window clock skew (device vs server time) | Edit button shows when server rejects | Enforce window on server too; show toast error if server rejects |
