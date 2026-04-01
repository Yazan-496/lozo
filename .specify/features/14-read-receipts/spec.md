# Feature Specification: Read Receipts UI

**Feature Branch**: `14-read-receipts`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "Read Receipts UI"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Status on Sent Messages in Real-Time (Priority: P1)

When a user sends a message, they can see its current delivery status directly in the chat. The status updates automatically without refreshing — progressing from "sending" to "sent" to "delivered" to "seen" as the recipient's device receives and reads it.

**Why this priority**: This is the core value of read receipts — the sender knows the state of their message at all times. It is the most visible and impactful part of the feature.

**Independent Test**: Can be fully tested by sending a message while the recipient is online and verifying the status label updates through each state in real-time.

**Acceptance Scenarios**:

1. **Given** a message is being submitted, **When** it is queued for sending, **Then** the status "sending" appears below the message bubble.
2. **Given** a message has reached the server, **When** confirmed by the server, **Then** the status updates to "sent".
3. **Given** the recipient's device has received the message, **When** the delivery confirmation arrives, **Then** the status updates to "delivered".
4. **Given** the recipient has opened the conversation and viewed the message, **When** the read confirmation arrives, **Then** the status updates to "seen".
5. **Given** the status is "seen", **When** the user looks at the message, **Then** no further status changes occur.
6. **Given** a status update arrives via real-time connection, **When** the chat is open, **Then** the status label updates without any manual refresh.

---

### User Story 2 - See Last Message Status in Conversation List (Priority: P2)

In the conversations list, the last message of each conversation shows its delivery status, so the user knows at a glance whether their most recent message was seen without opening the chat.

**Why this priority**: Enhances the conversation list UX significantly — users can monitor message status from the main screen. Depends on US1 status tracking working correctly.

**Independent Test**: Can be fully tested by sending a message, returning to the conversation list, and verifying the status label appears next to the last message preview.

**Acceptance Scenarios**:

1. **Given** the user's last message in a conversation has a known status, **When** the conversation list is displayed, **Then** the status label appears next to or below the last message preview text.
2. **Given** the message status changes (e.g., from "sent" to "seen"), **When** the conversation list is visible, **Then** the status label updates in real-time.
3. **Given** the last message was sent by the other person (not the current user), **When** the conversation list is displayed, **Then** no status label is shown for that conversation (status is only shown for the sender's own messages).

---

### User Story 3 - Pending Status for Offline Messages (Priority: P3)

When a message is queued in the outbox (device is offline or message hasn't reached the server yet), the status clearly indicates it is pending — and updates automatically once it is successfully delivered.

**Why this priority**: Important for the offline-first UX, but less critical than real-time status for online messages.

**Independent Test**: Can be fully tested by disabling the network, sending a message (it goes to outbox), verifying "sending" status, re-enabling network, and verifying the status progresses to "sent" → "delivered".

**Acceptance Scenarios**:

1. **Given** the device is offline when a message is submitted, **When** the message is saved to the outbox, **Then** the status shows "sending" (pending state).
2. **Given** the device comes back online and the outbox message is synced, **When** the server confirms receipt, **Then** the status automatically updates to "sent" without user action.
3. **Given** the status is "sending" for an extended time, **When** the user looks at the message, **Then** the status does not change to an error state — it remains "sending" until delivered or explicitly failed.

---

### Edge Cases

- What happens when the same message receives multiple rapid status updates (e.g., "delivered" and "seen" arrive out of order)? — Status should only advance forward, never regress (sent → delivered → seen, never backward).
- What happens when the chat is closed and a status update arrives? — Status is persisted so it appears correctly when the chat reopens.
- What happens in a group conversation? — Out of scope for this feature (group read receipts require per-participant tracking, deferred).
- What happens if the real-time connection drops while a status update is in-flight? — Status remains at last known state; corrected on next connection or chat open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Status labels MUST be shown only on messages sent by the current user (not on received messages).
- **FR-002**: Status MUST progress through exactly four states in order: sending → sent → delivered → seen.
- **FR-003**: Status MUST never regress to a lower state (e.g., "seen" cannot go back to "delivered").
- **FR-004**: Status MUST update in real-time when the chat is open, with no manual refresh required.
- **FR-005**: The conversation list MUST show the status of the current user's last message for each conversation.
- **FR-006**: Status MUST NOT be shown in the conversation list when the last message was sent by the other person.
- **FR-007**: Messages in the outbox (not yet delivered to server) MUST show "sending" status.
- **FR-008**: Status MUST persist across app restarts — reopening a chat shows the last known status for each message.
- **FR-009**: Status updates received while the chat is closed MUST be applied and visible when the chat is next opened.

### Key Entities

- **Message**: A chat message with a status field that holds one of: sending, sent, delivered, seen.
- **Status Update Event**: A real-time notification carrying a message ID and its new status, delivered to the sender's device.
- **Conversation Preview**: The last message summary shown in the conversation list, includes the message status for the current user's sent messages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Status label appears on a sent message within 500ms of the message being submitted.
- **SC-002**: Status updates from "sent" → "delivered" → "seen" reflect within 1 second of the server event arriving.
- **SC-003**: 100% of the current user's sent messages display a status label — no message is ever shown without a status.
- **SC-004**: Conversation list status label is accurate for the last message in all conversations at all times.
- **SC-005**: Status never regresses in 0% of cases — once "seen", a message cannot show "delivered" or "sent".

## Assumptions

- The backend already tracks message status (sent/delivered/seen) in a `messageStatuses` table and emits real-time status change events via Socket.IO.
- The mobile app already has a real-time connection (Socket.IO) that can receive status update events.
- Messages already have a `syncStatus` or `status` field locally that can be updated on the device.
- This feature covers 1:1 conversations only — group chat read receipts are out of scope.
- No checkmark icons are used — status is communicated via text labels only (sending, sent, delivered, seen), consistent with the existing UI style.
- The "sending" state maps to messages in the local outbox that have not yet been confirmed by the server.
