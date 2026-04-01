# Tasks: Message Pagination UI (Infinite Scroll)

**Branch**: `13-message-pagination`
**Input**: Design documents from `.specify/features/13-message-pagination/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅

**Tests**: Not requested — no test tasks included.

**Key finding**: Most of this feature is already implemented. Only `loadOlderMessages()` needs fixing (2 gaps from research.md). Phases 1 and 2 are minimal as a result.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new files or dependencies needed — all infrastructure already exists.

- [X] T001 Verify `getMessages(conversationId, limit, before)` in `apps/mobile/src/shared/db/messages.db.ts` supports cursor queries (read-only check, no changes expected)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm the server pagination endpoint is reachable and returns the correct shape before modifying the client.

- [X] T002 Verify `GET /chat/conversations/:id/messages?cursor=<ISO>&limit=50` exists and returns messages older than cursor in `apps/server/src/features/chat/chat.router.ts`

**Checkpoint**: Both SQLite cursor query and server endpoint confirmed — client fix can proceed.

---

## Phase 3: User Story 1 — Instant Load from SQLite on Chat Open (Priority: P1) 🎯 MVP

**Goal**: Messages appear immediately from local cache when chat opens; no change needed here since this already works.

**Independent Test**: Open a conversation with existing messages while offline → messages appear instantly with no error.

### Implementation for User Story 1

- [X] T003 [US1] Read `loadMessages()` in `apps/mobile/src/features/chat/ChatScreen.tsx` (lines 259–295) and confirm SQLite-first + background server sync is working as expected — no code changes unless broken

**Checkpoint**: US1 is already functional. Confirm before moving on.

---

## Phase 4: User Story 2 — Load Older Messages by Scrolling Up (Priority: P2)

**Goal**: Fix `loadOlderMessages()` to fall back to the server after SQLite miss, with offline guard.

**Independent Test**: Open a conversation with more than 50 messages → scroll to top → older messages load above existing ones with spinner → reaching the very beginning stops loading.

### Implementation for User Story 2

- [X] T004 [US2] In `apps/mobile/src/features/chat/ChatScreen.tsx`, update `loadOlderMessages()` (line 439) to:
  - After SQLite returns 0 rows, check `isOnline`
  - If online: call `GET /chat/conversations/${conversationId}/messages?cursor=${oldest}&limit=50`
  - Persist each server message via `upsertServerMessage()`
  - If server returns rows: append to state, set `loadingOlder = false`
  - If server returns 0 rows: set `hasMoreOlder = false`, set `loadingOlder = false`
  - If offline: set `loadingOlder = false` only — do NOT set `hasMoreOlder = false`

- [X] T005 [US2] In `apps/mobile/src/features/chat/ChatScreen.tsx`, add deduplication when merging server results into existing messages state (filter by `message.id` before appending)

**Checkpoint**: US2 fully functional — scroll up paginates through full history from server.

---

## Phase 5: User Story 3 — Graceful Offline Handling While Scrolling (Priority: P3)

**Goal**: When offline and SQLite is exhausted, no error or permanent block occurs.

**Independent Test**: Disable network → open chat → scroll to top → no spinner, no error, no freeze. Re-enable network → scroll to top → older messages load.

### Implementation for User Story 3

- [X] T006 [US3] Verify T004 correctly handles the offline case: `hasMoreOlder` must remain `true` when offline + SQLite empty, so load-more retries automatically when user comes back online (this may already be covered by T004 — confirm with a manual test)

**Checkpoint**: All 3 user stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T007 [P] In `apps/mobile/src/features/chat/ChatScreen.tsx`, ensure the `loadOlderMessages` error handler (`catch` block, line 460) does not set `hasMoreOlder = false` on network error — it should only log and reset `loadingOlder`
- [X] T008 [P] Confirm `ListFooterComponent` spinner (line 1519) renders at the visual top of the inverted FlatList — manual check on device

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS Phase 4+
- **Phase 3 (US1)**: Can run in parallel with Phase 2 (read-only confirmation)
- **Phase 4 (US2)**: Depends on Phase 2 completion
- **Phase 5 (US3)**: Depends on Phase 4 (offline case is part of the same fix)
- **Phase 6 (Polish)**: Depends on Phase 4 + 5

### User Story Dependencies

- **US1 (P1)**: Already implemented — confirm only
- **US2 (P2)**: Core fix — depends on server endpoint confirmation (Phase 2)
- **US3 (P3)**: Covered by US2 fix + error handler polish

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T003 can run in parallel with T002
- T007 and T008 can run in parallel (different concerns)

---

## Parallel Example: Phase 1 + 2

```
T001: Check SQLite query in messages.db.ts
T002: Check server endpoint in chat.router.ts   ← run these two in parallel
T003: Confirm loadMessages() in ChatScreen.tsx  ← can overlap with T002
```

---

## Implementation Strategy

### MVP First (US2 is the only real work)

1. Complete T001–T003 (confirmation tasks, ~5 min)
2. Complete T004–T005 (the actual fix in `loadOlderMessages`, ~30 min)
3. **STOP and VALIDATE**: Test scroll-up pagination on device
4. Complete T006–T008 (polish + edge cases)

### Incremental Delivery

This feature is a **single-function fix** in one file. The entire implementation is:
- 1 file changed: `apps/mobile/src/features/chat/ChatScreen.tsx`
- 1 function modified: `loadOlderMessages()` (~20 lines)

---

## Notes

- [P] tasks = different files or concerns, no blocking dependencies between them
- [USn] label maps each task to its user story for traceability
- The bulk of the work is T004 — everything else is verification
- No new packages, no schema changes, no server changes required
- Commit after T005 with message: `fix: load older messages from server when SQLite cache is exhausted`
