# Tasks: Read Receipts UI

**Branch**: `14-read-receipts`
**Input**: Design documents from `.specify/features/14-read-receipts/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅

**Tests**: Not requested — no test tasks included.

**Key finding**: Most of this feature is already implemented. Only 2 gaps from research.md:
1. ConversationsScreen missing "Sent"/"Delivered" text labels on last message
2. Status regression not prevented in either screen's `onMessageStatus` handler

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new dependencies or files needed — confirm existing status infrastructure is in place.

- [X] T001 Read `onMessageStatus` handler in `apps/mobile/src/features/chat/ChatScreen.tsx` (line ~404) and confirm it receives `{ conversationId, status, userId }` and updates message status in state
- [X] T002 [P] Read `onMessageStatus` handler in `apps/mobile/src/features/chat/ConversationsScreen.tsx` (line ~128) and confirm it updates `lastMessage.status` in conversation state

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the shared regression guard utility used by both screens.

- [X] T003 In `apps/mobile/src/features/chat/ChatScreen.tsx`, add a `STATUS_ORDER` constant above `loadOlderMessages` (or near the top of the component): `const STATUS_ORDER = ['sent', 'delivered', 'seen'] as const` — this will be used as the regression guard in T004 and T005

**Checkpoint**: Shared constant in place — user story implementations can proceed.

---

## Phase 3: User Story 1 — Real-Time Status on Sent Messages (Priority: P1) 🎯 MVP

**Goal**: Status labels on sent messages in ChatScreen update in real-time and never regress.

**Independent Test**: Send a message while recipient is online → watch status label change from "Sent" → "Delivered" → "Seen" without refresh. Then simulate a late "delivered" event — verify "Seen" does not revert.

### Implementation for User Story 1

- [X] T004 [US1] In `apps/mobile/src/features/chat/ChatScreen.tsx`, update the `onMessageStatus` handler (line ~404) to apply regression guard before updating: only update a message's status if `STATUS_ORDER.indexOf(data.status) > STATUS_ORDER.indexOf(m.status ?? '')` — leave status unchanged otherwise

**Checkpoint**: US1 complete — status in ChatScreen never regresses.

---

## Phase 4: User Story 2 — Last Message Status in Conversation List (Priority: P2)

**Goal**: ConversationsScreen shows "Sent" / "Delivered" text for the current user's last message, in addition to the existing avatar for "Seen".

**Independent Test**: Send a message → go to ConversationsScreen → verify a "Sent" label appears next to the last message preview. Wait for delivery confirmation → verify it changes to "Delivered". Open chat (recipient reads) → verify it shows the avatar (existing behavior unchanged).

### Implementation for User Story 2

- [X] T005 [US2] In `apps/mobile/src/features/chat/ConversationsScreen.tsx`, update the `onMessageStatus` handler (line ~128) to apply the same regression guard: only update `lastMessage.status` if the new status is higher in `['sent', 'delivered', 'seen']` than the current one

- [X] T006 [US2] In `apps/mobile/src/features/chat/ConversationsScreen.tsx`, update the last message status display block (line ~211) to show a text label for "sent" and "delivered" statuses. Current logic: shows avatar for `'read'`, nothing for others. New logic:
  - `status === 'read'` → existing Avatar (no change)
  - `status === 'delivered'` → small gray `<Text>` with "Delivered"
  - `status === 'sent'` → small gray `<Text>` with "Sent"
  - Other user's last message → nothing (no change)

**Checkpoint**: US2 complete — conversation list shows full status progression.

---

## Phase 5: User Story 3 — Pending Status for Offline Messages (Priority: P3)

**Goal**: Outbox messages show "sending" and automatically update once delivered — already mostly working, verify edge case.

**Independent Test**: Disable network → send message → verify "Sending..." appears → re-enable network → verify status progresses to "Sent" → "Delivered".

### Implementation for User Story 3

- [X] T007 [US3] In `apps/mobile/src/features/chat/ChatScreen.tsx`, verify the outbox sync callback (line ~298) sets `syncStatus: 'sent'` but also clears `localStatus` so the "Sending..." text disappears and the status row takes over — no code change expected, confirm only

**Checkpoint**: All 3 user stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T008 [P] In `apps/mobile/src/features/chat/ConversationsScreen.tsx`, ensure the new "Sent"/"Delivered" text labels use an existing style (e.g. `styles.conversationTime` or a similar small gray text style) — no new StyleSheet entries needed if a matching style exists
- [X] T009 [P] In `apps/mobile/src/features/chat/ChatScreen.tsx`, verify the `localStatusMap` (used for "Sending..." display) is cleared correctly after a message is synced, so "Sending..." never co-exists with a "Sent" label on the same message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — adds shared `STATUS_ORDER` constant
- **Phase 3 (US1)**: Depends on Phase 2 (`STATUS_ORDER` constant)
- **Phase 4 (US2)**: Can run in parallel with Phase 3 (different file for T006; T005 uses same constant)
- **Phase 5 (US3)**: Can run after Phase 3 (depends on outbox sync behaviour confirmed)
- **Phase 6 (Polish)**: Depends on Phase 3 + 4

### User Story Dependencies

- **US1 (P1)**: Depends on `STATUS_ORDER` constant (Phase 2)
- **US2 (P2)**: T005 depends on `STATUS_ORDER`; T006 is independent (different concern)
- **US3 (P3)**: Confirmation only — no dependencies

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T004 and T006 can run in parallel (different files, different concerns)
- T008 and T009 can run in parallel

---

## Parallel Example: US1 + US2

```
T003: Add STATUS_ORDER constant in ChatScreen.tsx
    ↓ (unblocks both)
T004: Regression guard in ChatScreen.tsx   [US1]
T005: Regression guard in ConversationsScreen.tsx   [US2]  ← parallel with T004
T006: Add Sent/Delivered labels in ConversationsScreen.tsx  ← parallel with T004
```

---

## Implementation Strategy

### MVP First (US1 is the only real-time fix)

1. Complete T001–T003 (read + constant setup)
2. Complete T004 (regression guard in ChatScreen)
3. **STOP and VALIDATE**: Watch status update in real-time without regression
4. Complete T005–T006 (ConversationsScreen labels)
5. Complete T007–T009 (verification + polish)

### Incremental Delivery

- **3 files changed total**: `ChatScreen.tsx` (T003, T004, T009), `ConversationsScreen.tsx` (T005, T006, T008)
- **Smallest meaningful commit**: T003 + T004 — fixes regression in chat view
- **Full feature commit**: T003–T009 — all gaps closed

---

## Notes

- [P] tasks = different files or concerns, no blocking dependencies
- [USn] label maps each task to its user story
- T003 (`STATUS_ORDER`) is the only true prerequisite — everything else is parallel after that
- No new packages, no schema changes, no server changes required
- Suggested commit message: `fix: prevent status regression and show sent/delivered in conversation list`
