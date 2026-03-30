# Feature Specification: Offline-First Messaging

**Status**: Draft
**Created**: 2026-03-26
**Last Updated**: 2026-03-26
**Author**: Yazan

---

## Overview

Make the app fully usable without an active internet connection. Users can compose and send messages while offline; those messages are queued locally and automatically delivered once connectivity is restored. All previously loaded conversations and messages are readable offline. The app communicates network state clearly so users always know when they are operating in offline mode.

## Problem Statement

Currently, the app requires an active connection for every action. If a user loses connectivity mid-session, messages fail silently or with raw error toasts, conversations become unreadable, and the app feels broken. For users in areas with unreliable mobile data (a core design constraint for this project), this is a critical reliability gap.

## Goals & Objectives

- Allow users to read any previously loaded conversation without a connection
- Allow users to compose and queue messages while offline, with automatic retry on reconnect
- Give clear visual feedback about connectivity state and pending message delivery
- Ensure no messages are lost due to network interruptions
- Sync server state with local state when connectivity is restored

## User Scenarios & Testing

### US1 — Offline Read

1. User opens the app with no internet connection
2. The conversations list shows all previously loaded conversations
3. User opens any conversation; all previously received messages are visible
4. A subtle banner or indicator informs the user they are offline
5. No error dialogs or empty states appear for cached content

### US2 — Compose While Offline

1. User is offline and opens a conversation
2. User types a message and taps Send
3. The message appears immediately in the conversation with a "pending" indicator (e.g., clock icon)
4. The message is stored locally in the outbox queue
5. User can continue composing additional messages; each queues individually

### US3 — Auto-Sync on Reconnect

1. User regains internet connectivity
2. The offline banner disappears automatically
3. All queued messages are sent to the server in order, one by one
4. Each message transitions from "pending" → "sent" as delivery is confirmed
5. New messages from other users arrive and are appended to the conversation

### US4 — Partial Sync Failure

1. User reconnects but one queued message fails to deliver (e.g., server error)
2. The failed message shows a "failed" indicator (e.g., red warning icon)
3. User can tap the failed message to retry or discard it
4. Subsequent messages in the queue are still attempted

### US5 — Background Sync

1. User has the app open in the background when connectivity is restored
2. Queued messages sync automatically without requiring the user to foreground the app
3. Push notification arrives for new messages received while offline

### US6 — First Open with No Cache

1. User opens the app for the first time with no internet connection
2. A full-screen offline state is shown with a clear message asking to connect
3. No partial/broken content is shown

## Functional Requirements

### Local Message Storage

- FR-01: Every message received is persisted to local SQLite storage before being displayed
- FR-02: Every message sent by the user is written to local SQLite storage before being transmitted to the server
- FR-03: The local store is the single source of truth for the conversation view; the UI reads from local storage, not directly from the network response
- FR-04: Message records in local storage include a `syncStatus` field: `pending`, `sent`, `delivered`, `read`, `failed`
- FR-05: The local SQLite schema matches the server message schema plus the `syncStatus` field

### Outbox Queue

- FR-06: All messages composed while offline (or before server acknowledgment) are placed in an outbox queue stored in local SQLite
- FR-07: The outbox queue is processed in FIFO order per conversation when connectivity is available
- FR-08: On successful delivery, the local record is updated from `pending` to `sent` and the server-assigned message ID replaces the local temporary ID
- FR-09: On delivery failure (non-network error), the message status is set to `failed`; the queue continues processing remaining items
- FR-10: On network failure during sync, the queue pauses and retries automatically when connectivity is restored

### Connectivity Detection

- FR-11: The app monitors network reachability continuously and reacts within 2 seconds of state change
- FR-12: When the app goes offline, a persistent banner or indicator appears in the active screen
- FR-13: When the app comes back online, the offline indicator is dismissed and sync begins automatically
- FR-14: The connectivity state is accessible globally so any screen can react to it

### Conversation & Message Cache

- FR-15: On first load of any conversation, the server response is persisted to local SQLite
- FR-16: Subsequent opens of the same conversation load from local storage first (cache-first), then refresh from server in the background when online
- FR-17: The conversations list is persisted locally so it is available on offline open
- FR-18: Pagination (loading older messages) only triggers a network request; it does not affect offline readability of already-loaded messages

### Conflict Resolution

- FR-19: If the server assigns a different timestamp or ID to a sent message than the local optimistic record, the local record is updated to match the server's canonical version
- FR-20: Server state wins for all fields except `syncStatus`, which is derived locally

### Retry & Error Handling

- FR-21: Failed messages display a visible failure indicator in the conversation
- FR-22: Tapping a failed message presents options: Retry or Discard
- FR-23: Discard removes the message from the local outbox and the conversation view
- FR-24: Retry re-enqueues the message at the back of the outbox queue

## Non-Functional Requirements

- NF-01: Opening a cached conversation while offline must render in under 500 ms
- NF-02: The outbox sync process must not block the UI thread
- NF-03: Local SQLite storage must not grow unbounded — messages older than 90 days or beyond the most recent 500 per conversation are eligible for pruning
- NF-04: The offline queue must survive app restarts (it is persisted, not in-memory)
- NF-05: No sensitive message content is logged to any external service

## Success Criteria

- Users can read any previously loaded conversation without a connection, with no error state or blank screen
- Messages composed offline appear in the conversation instantly and are delivered automatically when connectivity returns, with no user action required
- Users can tell at a glance whether they are online or offline and whether any messages are pending delivery
- No message is silently lost — every failed delivery is surfaced to the user with a retry option
- The app handles transitions between offline and online at least 10 times in a session without state corruption or duplicate messages

## Key Entities

### LocalMessage

| Field        | Type                                              | Notes                                |
| ------------ | ------------------------------------------------- | ------------------------------------ |
| localId      | uuid                                              | Client-generated temporary PK        |
| serverId     | uuid (nullable)                                   | Assigned by server after delivery    |
| conversationId | uuid                                            | FK → local conversations             |
| senderId     | uuid                                              | FK → users                           |
| content      | text                                              |                                      |
| syncStatus   | enum('pending','sent','delivered','read','failed') |                                     |
| createdAt    | timestamp                                         | Client-generated                     |
| serverCreatedAt | timestamp (nullable)                           | Assigned by server                   |

### OutboxEntry

| Field          | Type                        | Notes                                    |
| -------------- | --------------------------- | ---------------------------------------- |
| localId        | uuid                        | FK → LocalMessage.localId                |
| conversationId | uuid                        |                                          |
| payload        | json                        | Full message payload ready to send       |
| attempts       | integer                     | Retry count                              |
| lastAttemptAt  | timestamp (nullable)        |                                          |
| status         | enum('queued','failed')     |                                          |

## Assumptions

- A1: SQLite is already used for local message storage; this feature formalizes and extends the schema rather than introducing a new persistence layer
- A2: MMKV handles token/preference storage; the outbox queue uses SQLite for persistence across restarts
- A3: Network reachability is determined via the platform's native network event APIs (no third-party connectivity library required beyond what Expo provides)
- A4: Messages are text-only for the initial offline-first implementation; media messages (feature 04) will extend the queue with attachment upload handling separately
- A5: The 90-day / 500-message pruning limits are defaults that can be adjusted; no UI to configure them is required in this feature
- A6: Socket.IO reconnect events are the primary trigger for outbox flush; no separate polling mechanism is needed

## Out of Scope

- Offline support for media upload (handled in feature 04)
- Background sync without any app process running (push-triggered background fetch)
- Conflict resolution for messages edited or deleted by the sender while the recipient is offline
- Encryption of locally stored messages
- Configurable retention / pruning settings UI
- Offline support for contact management or profile updates

## Dependencies

- SQLite schema must include `syncStatus` and `localId` fields on the messages table
- Socket.IO client's reconnect lifecycle events must be exposed to the outbox processor
- Conversations list store (Zustand) must be seeded from SQLite on startup
- Feature 04 (media messages) will need to hook into the outbox queue design

## Risks

- R1: Temporary local IDs may cause duplicate entries if the server acknowledges delivery but the client misses the ack — mitigated by idempotency check on `localId` before inserting server response
- R2: Outbox processing out of order across conversations could cause causal confusion — mitigated by per-conversation FIFO ordering
- R3: SQLite write contention if many messages queue simultaneously — mitigated by serialized write operations in the queue processor
- R4: Users may not realize a message failed if the failure indicator is not prominent enough — mitigated by a toast notification in addition to the in-line indicator
