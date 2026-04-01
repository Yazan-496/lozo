# Feature Specification: Message Pagination UI (Infinite Scroll)

**Feature Branch**: `13-message-pagination`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "Message Pagination UI (Infinite Scroll)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Messages Instantly on Chat Open (Priority: P1)

When a user opens a conversation, they immediately see the most recent messages without waiting for a network response. Messages are loaded from local storage first, then newer messages sync from the server in the background.

**Why this priority**: This is the core experience — any delay on chat open significantly degrades perceived app quality. Offline-first loading is the foundation of the feature.

**Independent Test**: Can be fully tested by opening a conversation with existing messages and verifying messages appear before any network activity completes.

**Acceptance Scenarios**:

1. **Given** a user has previously loaded messages in a conversation, **When** they open that conversation, **Then** locally cached messages appear immediately without a loading delay.
2. **Given** a user opens a conversation while offline, **When** the chat loads, **Then** all previously cached messages are displayed and no network error is shown.
3. **Given** a user opens a conversation while online, **When** the local messages appear, **Then** newer messages from the server are silently fetched and appended in the background.

---

### User Story 2 - Load Older Messages by Scrolling Up (Priority: P2)

When a user scrolls to the top of the chat, older messages load automatically, allowing them to browse the full conversation history page by page.

**Why this priority**: Without this, users are limited to the initial 50 messages. This is the core pagination behavior.

**Independent Test**: Can be fully tested by scrolling to the top of a conversation with more than 50 messages and verifying older messages appear above the existing ones.

**Acceptance Scenarios**:

1. **Given** a conversation has more than 50 messages, **When** the user scrolls to the top of the message list, **Then** a loading spinner appears at the very top and 50 older messages are fetched and inserted above.
2. **Given** older messages are loading, **When** they are inserted, **Then** the user's current scroll position is maintained with no visible jump.
3. **Given** all messages have been loaded, **When** the user scrolls to the top, **Then** no spinner appears and no further loading is triggered.

---

### User Story 3 - Graceful Offline Handling While Scrolling (Priority: P3)

When a user is offline and tries to scroll up to load older messages that are not cached, the app behaves gracefully without showing errors or getting stuck in a loading state.

**Why this priority**: Offline resilience is required by the app's offline-first architecture, but is secondary to the core pagination working.

**Independent Test**: Can be fully tested by disabling the network, opening a chat, and scrolling to the top.

**Acceptance Scenarios**:

1. **Given** the user is offline and all cached messages are visible, **When** they scroll to the top, **Then** no spinner appears and no error message is shown.
2. **Given** the user is offline mid-pagination, **When** a load-more is triggered, **Then** any in-flight request is cancelled silently and loading stops.

---

### Edge Cases

- What happens when the conversation has fewer than 50 messages total? — No pagination trigger; all messages load on open, no spinner shown.
- What happens when a new message arrives while the user is scrolling through old messages? — New message appends at the bottom without disrupting the current scroll position.
- What happens if the server returns an error during background sync on open? — Cached messages remain visible; error is swallowed silently (no toast shown).
- What happens when two rapid scroll-to-top events occur before the first page loads? — Only one request fires at a time; duplicate triggers are ignored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The chat view MUST display locally cached messages immediately when opened, before any network request completes.
- **FR-002**: On chat open while online, the system MUST silently sync messages newer than the latest cached message from the server in the background.
- **FR-003**: When the user scrolls to the top of the message list, the system MUST fetch the next page of 50 older messages using cursor-based pagination.
- **FR-004**: A loading spinner MUST appear pinned at the very top of the message list while older messages are being fetched.
- **FR-005**: After inserting older messages, the system MUST preserve the user's current scroll position with no visible jump.
- **FR-006**: All fetched messages MUST be saved to local storage so they are available on subsequent opens without re-fetching.
- **FR-007**: When all available messages have been loaded, the system MUST stop triggering further load requests.
- **FR-008**: While offline, the system MUST NOT show an error when the user scrolls to the top — it MUST silently disable the load-more trigger.
- **FR-009**: Only one load-more request MUST be in flight at a time; duplicate fetches from rapid scrolling MUST be suppressed.

### Key Entities

- **Message**: A single chat message with content, sender, timestamp, and delivery status. Stored locally and synced from server.
- **Conversation**: A chat thread between two users. Owns a local message cache keyed by conversation ID.
- **Pagination Cursor**: A pointer (oldest message ID or timestamp) marking where the next page of older messages begins.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cached messages appear within 100ms of opening a conversation (no network dependency for initial render).
- **SC-002**: Older messages load and appear within 2 seconds of the user reaching the top on a standard mobile connection.
- **SC-003**: Scroll position offset after inserting older messages is 0px — no jump detectable by the user.
- **SC-004**: No error messages or loading spinners are shown when the user scrolls to the top while offline.
- **SC-005**: After the full conversation history is loaded, zero additional network requests are triggered by further upward scrolling.

## Assumptions

- The backend pagination endpoint (`GET /messages?cursor=&limit=50`) is already implemented and stable.
- Messages are already stored in local SQLite with a schema supporting queries by conversation ID, limit, and a "before" cursor.
- Background sync on chat open fetches only messages newer than the latest cached message (not a full re-fetch).
- The app already has a mechanism to detect online/offline network state.
- Page size of 50 messages per load is acceptable for all conversation sizes.
- This feature covers 1:1 conversations only; group chat pagination is out of scope.
