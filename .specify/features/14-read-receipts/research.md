# Research: Read Receipts UI

**Branch**: `14-read-receipts` | **Date**: 2026-04-01

## What Is Already Implemented

| Behavior | Status | Location |
|----------|--------|----------|
| "Sent", "Delivered", "Seen" text labels in chat | ✅ Done | `ChatScreen.tsx` line 1443–1447 |
| Circle icons next to status labels | ✅ Done | `MsgStatusIcon` component line 1088 |
| Status row on last sent message | ✅ Done | `showStatusRow` logic line 1194 |
| "Sending..." text for outbox messages | ✅ Done | `ChatScreen.tsx` line 1415 |
| Real-time `messages:status` Socket.IO handler in ChatScreen | ✅ Done | line 404 |
| Real-time `messages:status` Socket.IO handler in ConversationsScreen | ✅ Done | line 128 |
| `messages:read` emitted on chat open | ✅ Done | line 324 |
| Avatar shown for 'read' status in conversation list | ✅ Done | `ConversationsScreen.tsx` line 212 |

## What Is Missing / Broken

### Gap 1: ConversationsScreen shows no label for "sent" and "delivered"

**Current behavior**: In the conversation list, only `status === 'read'` shows anything (an avatar). For "sent" and "delivered" statuses, nothing is shown.

**Required behavior (FR-005)**: The conversation list must show the current user's last message status for all states — sent, delivered, and seen.

**Fix**: In `ConversationsScreen.tsx` (line 211), extend the status display logic to show a text label ("Sent" / "Delivered") when `lastMessage.status` is `'sent'` or `'delivered'`. Keep the existing avatar for `'read'`.

### Gap 2: Status regression not prevented

**Current behavior**: `onMessageStatus` in both screens replaces status unconditionally with whatever the server sends. A late-arriving "delivered" event could overwrite an already-seen "seen" status.

**Fix**: Add a guard in both `onMessageStatus` handlers: only update if the new status is higher in the progression (`sending < sent < delivered < seen`).

### Gap 3: "sending" not part of the unified status progression in ChatScreen

**Current behavior**: "Sending..." is rendered as a separate `<Text>` element outside the status row, controlled by `localStatus`. The status row ("Sent"/"Delivered"/"Seen") is controlled by `item.status`. These are two separate systems.

**Impact**: Minor — functionally correct but inconsistent styling. The user explicitly said "keep it like current status" so this is **not a gap to fix** — preserve as-is.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Status labels for sent/delivered in conversation list | Add text "Sent" / "Delivered" in small gray text | Consistent with chat bubble labels; no new icons |
| Status regression guard | Compare using ordered array `['sent', 'delivered', 'seen']` | Simple, no external dependency |
| "sending" state in chat | Keep existing "Sending..." text — no change | User requested no changes to existing style |
| Icon style in chat bubbles | Keep existing circle icons — no change | User confirmed: keep current style |

## Files to Change

| File | Change |
|------|--------|
| `apps/mobile/src/features/chat/ConversationsScreen.tsx` | Add "Sent" / "Delivered" text labels to last message status display (line ~211) |
| `apps/mobile/src/features/chat/ConversationsScreen.tsx` | Add regression guard to `onMessageStatus` handler (line ~128) |
| `apps/mobile/src/features/chat/ChatScreen.tsx` | Add regression guard to `onMessageStatus` handler (line ~404) |
