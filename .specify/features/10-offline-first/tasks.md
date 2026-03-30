# Tasks: Offline-First Messaging

**Feature**: 10 — Offline-First Messaging
**Plan**: [plan.md](plan.md)
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-26
**Status**: Ready

---

## Phase 1: Setup

> Install packages and create all new persistence/storage infrastructure before any user story work.

- [⚠] T001 Run `cd apps/mobile && npx expo install expo-sqlite expo-network` to add local database and network detection packages — ⚠️ BLOCKED: npm install failed with ECONNRESET network error twice. Manual retry required when network connectivity is restored.
- [x] T002 Create `apps/mobile/src/shared/db/sqlite.ts` — export `initDatabase()` (opens `lozo.db` via `SQLite.openDatabaseAsync`, runs the full migration `execAsync` for `conversations`, `messages`, and `outbox` tables with all indexes) and `getDb()` singleton getter (throws if called before init)
- [x] T003 [P] Create `apps/mobile/src/shared/db/messages.db.ts` — export `LocalMessageRow` interface and five functions: `insertMessage(row)`, `getMessages(conversationId, limit?, before?)` ordered by `created_at DESC`, `updateMessageStatus(localId, updates: Partial<{server_id, sync_status, server_created_at}>)`, `deleteMessage(localId)`, and `pruneOldMessages(daysOld=90, maxPerConversation=500)`; also export `localRowToMessage(row): Message` mapper (maps `local_id` as `id` when `server_id` is null, maps `sync_status` to `syncStatus`)
- [x] T004 [P] Create `apps/mobile/src/shared/db/outbox.db.ts` — export `OutboxRow` interface and six functions: `enqueueOutbox(localId, conversationId, payload)`, `getQueuedItems()` (status='queued' ordered by `created_at ASC`), `incrementAttempt(localId)`, `markOutboxFailed(localId)`, `removeFromOutbox(localId)`, `requeueItem(localId)` (reset attempts=0, status='queued')
- [x] T005 [P] Create `apps/mobile/src/shared/db/conversations.db.ts` — export `upsertConversations(convs: Conversation[])` using `INSERT OR REPLACE`, `getCachedConversations()` ordered by `updated_at DESC`, and `hideCachedConversation(id)` (deletes the row)
- [x] T006 [P] Create `apps/mobile/src/shared/stores/network.ts` — Zustand store with `{ isOnline: boolean; setOnline: (v: boolean) => void }`, default `isOnline: true`
- [x] T007 Update `apps/mobile/src/shared/types/index.ts` — add `localId?: string` and `syncStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'` to the `Message` interface; export `SyncStatus` as a named type alias
- [x] T008 Update `apps/mobile/App.tsx` — import and `await initDatabase()` during startup hydration (before the splash completes); import `expo-network` and call `Network.getNetworkStateAsync()` to seed `useNetworkStore.getState().setOnline(!!state.isInternetReachable)`; also call `pruneOldMessages()` in a non-blocking `setTimeout` after init

---

## Phase 2: Foundational

> Services and utilities that all user story phases depend on. Complete before any US phase.

- [x] T009 Create `apps/mobile/src/shared/services/outbox.ts` — export `flush()` (iterates `getQueuedItems()`, for each item emits `message:send` via socket with `payload`, on ack success calls `updateMessageStatus(localId, {server_id, sync_status: 'sent', server_created_at})` then `removeFromOutbox`; on error calls `incrementAttempt` then `markOutboxFailed`+`updateMessageStatus({sync_status:'failed'})` if attempts >= 3; guard with `flushing` boolean to prevent concurrent runs); export `retry(localId)` (calls `requeueItem` + `updateMessageStatus({sync_status:'pending'})` + `flush()`); export `discard(localId)` (calls `removeFromOutbox`)
- [x] T010 Create `apps/mobile/src/shared/hooks/useNetworkState.ts` — `useNetworkState()` hook: on mount reads initial state from `expo-network` and calls `setOnline`; attaches `socket.on('connect', () => setOnline(true))` and `socket.on('disconnect', () => setOnline(false))`; cleans up listeners on unmount
- [x] T011 [P] Create `apps/mobile/src/shared/components/OfflineBanner.tsx` — renders a `View` with `backgroundColor: '#888888'`, height 28, centered white "You're offline" text at 13pt; returns `null` when `useNetworkStore(s => s.isOnline)` is true
- [x] T012 [P] Update `apps/mobile/src/shared/services/socket.ts` — inside `connectSocket()`, add `socket.on('connect', () => { useNetworkStore.getState().setOnline(true); import('../services/outbox').then(m => m.flush()); })` and `socket.on('disconnect', () => useNetworkStore.getState().setOnline(false))`
- [x] T013 Update `apps/server/src/features/chat/chat.socket.ts` — in the `message:send` socket handler, accept `localId?: string` from the incoming data payload; include `localId: data.localId` in the acknowledgment callback response object so the mobile client can reconcile its optimistic record
- [x] T014 Mount `useNetworkState()` hook in `apps/mobile/App.tsx` root component (call it once inside the root component body so Socket.IO events update the network store for the entire app lifetime)

---

## Phase 3: US1 — Offline Read

> **Goal**: All previously loaded conversations and messages are readable without a connection.
> **Test**: Put device in airplane mode → open app → conversations list shows cached data → open a conversation → all previously received messages are visible → no error states appear.

- [ ] T015 [US1] Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — on mount, immediately load and display from `getCachedConversations()`; when online, fetch from server API and call `upsertConversations(serverData)` then update display; apply existing `hiddenConversationIds` filter; render `<OfflineBanner />` below the header
- [ ] T016 [P] [US1] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — on mount, immediately load cached messages via `getMessages(conversationId, 50)` and `setMessages(rows.map(localRowToMessage))`; when online, fetch from server, upsert server messages into SQLite via `insertMessage` (skip if `server_id` already exists — use `INSERT OR IGNORE` on `server_id`), then update displayed list; render `<OfflineBanner />` below the header
- [ ] T017 [US1] Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — when `getCachedConversations()` returns an empty array AND `isOnline === false`, render a full-screen centered `View` with text "You're offline. Connect to load your conversations." instead of the empty list placeholder
- [ ] T018 [P] [US1] Update `apps/mobile/src/shared/db/messages.db.ts` — add `upsertServerMessage(msg: Message)` helper that does `INSERT OR IGNORE INTO messages (...) VALUES (...)` mapping `msg.id` → `server_id`, `msg.id` → `local_id` (when no local record exists), `syncStatus: 'delivered'` for messages from other senders, `syncStatus: 'sent'` for own messages; this prevents overwriting pending/failed records

---

## Phase 4: US2 — Compose While Offline

> **Goal**: Messages typed while offline are queued locally and shown immediately with a pending indicator.
> **Test**: Turn off Wi-Fi → type a message → tap Send → message appears instantly with clock icon → turn Wi-Fi back on → clock icon changes to single tick.

- [ ] T019 [US2] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — replace the current send handler with an optimistic send flow: (1) generate `localId = \`local_\${Date.now()}_\${Math.random().toString(36).slice(2,9)}\``; (2) build `optimisticMsg: Message` with `id: localId`, `localId`, `syncStatus: 'pending'`, `senderId: currentUser.id`, `createdAt: new Date().toISOString()`; (3) `await insertMessage(rowFromMessage(optimisticMsg))`; (4) `setMessages(prev => [...prev, optimisticMsg])`; (5) `await enqueueOutbox(localId, conversationId, { conversationId, content, type: 'text', localId })`; (6) if `isOnline`, call `flush()`
- [ ] T020 [P] [US2] Add `SyncStatusIcon` component inline in `apps/mobile/src/features/chat/ChatScreen.tsx` — renders an `@expo/vector-icons` icon based on `syncStatus` prop: `pending` → `Ionicons time-outline` gray; `sent` → `Ionicons checkmark` gray; `delivered` → `Ionicons checkmark-done` gray; `read` → `Ionicons checkmark-done` blue `#0084FF`; `failed` → `Ionicons warning` red `#FF3B30`; render this only for messages where `senderId === currentUser.id`, positioned bottom-right of the bubble
- [ ] T021 [P] [US2] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — in the `message:new` socket listener: if `serverMsg.senderId !== currentUser.id`, call `insertMessage(rowFromMessage({...serverMsg, syncStatus: 'delivered'}))` then append to messages state; if `serverMsg.senderId === currentUser.id` (echo from server), skip — outbox processor handles own message reconciliation
- [ ] T022 [US2] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — handle outbox flush acknowledgment: in `outbox.ts` `flush()`, after `updateMessageStatus` succeeds, emit a module-level event (or use network store) so ChatScreen can update the displayed message's `syncStatus` from `pending` to `sent`; the cleanest approach is to re-query `getMessages` for the conversation after each successful ack and call `setMessages`

---

## Phase 5: US3 — Auto-Sync on Reconnect

> **Goal**: Queued messages deliver automatically when connectivity restores; no user action required.
> **Test**: Compose 3 messages offline → reconnect → all 3 show single tick within 3 seconds, in order.

- [ ] T023 [US3] Verify T012 covers reconnect flush: after T012, socket `connect` event calls `flush()` which processes the outbox in FIFO order per conversation; add an integration check in `ChatScreen.tsx` — on `flush()` completion (or after each ack in outbox.ts), call `getMessages(conversationId)` and `setMessages` to refresh the displayed list with updated `syncStatus` values
- [ ] T024 [P] [US3] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — subscribe to socket `message:new` events for messages arriving while the screen is mounted; on receipt, call `insertMessage` (upsert via `INSERT OR IGNORE`) and prepend/append the message to state; this ensures messages sent by others during reconnect appear without requiring a screen reload
- [ ] T025 [US3] Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — on socket `connect` event (add a listener inside a `useEffect`), re-fetch conversations from server and call `upsertConversations`; this refreshes the last-message preview and unread count after sync

---

## Phase 6: US4 — Partial Sync Failure

> **Goal**: Failed messages are clearly marked; user can retry or discard without losing other messages.
> **Test**: Simulate a 3× send failure → message shows red warning icon → tap message → tap Retry → message sends successfully.

- [ ] T026 [US4] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — for messages with `syncStatus === 'failed'` (sender is current user), add an `onPress` handler on the message bubble that shows `Alert.alert('Message not sent', 'This message could not be delivered.', [{text:'Cancel'}, {text:'Discard', style:'destructive', onPress: handleDiscard}, {text:'Retry', onPress: handleRetry}])`
- [ ] T027 [P] [US4] Add `handleRetry(localId: string)` to `apps/mobile/src/features/chat/ChatScreen.tsx` — calls `outboxService.retry(localId)` (which calls `requeueItem` + `updateMessageStatus({syncStatus:'pending'})` + `flush()`); update the message in local state to `syncStatus: 'pending'` optimistically before flush
- [ ] T028 [P] [US4] Add `handleDiscard(localId: string)` to `apps/mobile/src/features/chat/ChatScreen.tsx` — calls `outboxService.discard(localId)` (removes from outbox table) then `deleteMessage(localId)` (removes from messages table); filters the message out of the displayed `messages` state

---

## Phase 7: US6 — First Open with No Cache

> **Goal**: App shows a clear, non-broken state when opened offline with no previously cached data.
> **Test**: Clear app data → open with airplane mode → see friendly offline state (not a crash or empty broken list).

- [ ] T029 [US6] Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — add a ternary at the FlatList render: if `conversations.length === 0 && !isOnline` render a centered full-screen View with `OfflineBanner` at the top plus body text "No conversations loaded yet. Connect to get started."; if `conversations.length === 0 && isOnline` keep the existing empty state
- [ ] T030 [US6] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — if `messages.length === 0 && !isOnline` (no cache and offline), show a centered View with OfflineBanner and text "No messages loaded yet. Connect to load this conversation." instead of an empty chat (prevents the user seeing a blank screen with a text input and no context)

---

## Phase 8: Polish & Cross-Cutting Concerns

> Final wiring: deduplication guard, conversation:deleted cache sync, startup pruning confirmation.

- [ ] T031 Update `apps/mobile/src/shared/services/outbox.ts` — add a guard in `sendItem`: before emitting `message:send`, check if the message's `server_id` is already set in SQLite (i.e., the message was already delivered but the outbox entry wasn't cleaned up); if `server_id` is non-null, call `removeFromOutbox(localId)` and skip the send to prevent duplicates
- [ ] T032 [P] Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — in the existing `conversation:deleted` socket listener, also call `hideCachedConversation(conversationId)` so the SQLite cache stays in sync with the hidden state (currently only the Zustand store is updated)
- [ ] T033 [P] Update `apps/mobile/src/shared/db/messages.db.ts` — confirm `pruneOldMessages` is called in `App.tsx` after `initDatabase()`; the prune runs in a `setTimeout(() => pruneOldMessages(), 2000)` so it does not delay the initial render; verify the DELETE queries use correct SQLite date comparison (`datetime(created_at) < datetime('now', '-90 days')`)

---

## Dependencies

```
T001 → T002, T003, T004, T005 (packages must be installed before any SQLite code)
T002 → T003, T004, T005, T006, T007, T008 (sqlite.ts must exist before DB modules)
T003 → T009, T015, T016, T018, T019 (messages.db.ts needed by outbox service + chat screens)
T004 → T009 (outbox.db.ts needed by outbox service)
T005 → T015, T025 (conversations.db.ts needed by ConversationsScreen)
T006 → T010, T011, T012, T014 (network store needed by hook, banner, socket, App)
T007 → T019, T020, T021 (SyncStatus type needed by ChatScreen send flow)
T008 → T014 (App.tsx init needed before network hook mounts)
T009 → T022, T023, T027, T028, T031 (outbox service needed by ChatScreen handlers)
T010 → T014 (hook must exist before it's mounted in App)
T011 → T015, T016, T029, T030 (OfflineBanner must exist before screens use it)
T012 → T023 (socket flush-on-connect must be wired before reconnect test)
T013 → T022, T023 (server must echo localId before reconciliation works)
T015 → T017, T025, T029, T032 (ConversationsScreen cache-first must exist first)
T016 → T019, T021, T022, T024, T026, T030 (ChatScreen SQLite load must exist first)
T018 → T016 (upsertServerMessage used inside ChatScreen mount)
T019 → T026, T027, T028 (optimistic send must exist before retry/discard)
T026 → T027, T028 (failed message tap handler before retry/discard functions)
```

---

## Parallel Execution Opportunities

**Phase 1 — after T001+T002** (all parallel):
```
T003 (messages.db.ts)
T004 (outbox.db.ts)
T005 (conversations.db.ts)
T006 (network store)
T007 (types update)
```

**Phase 2 — after Phase 1** (partial parallel):
```
T009 (outbox service) — needs T003 + T004
T010 (network hook) — needs T006
T011 (OfflineBanner) — needs T006
T012 (socket.ts) — needs T006 + T009
T013 (server echo) — independent of all mobile work
T008 → T014 — sequential (App.tsx init → mount hook)
```

**Phase 3 — US1** (parallel after Phase 2):
```
T015 (ConversationsScreen cache-first) || T016 (ChatScreen cache-first)
T017 (empty offline state) — depends on T015
T018 (upsertServerMessage helper) — can be done alongside T003
```

**Phase 4 — US2** (parallel after T016):
```
T019 (optimistic send)
T020 (SyncStatusIcon)
T021 (message:new handler)
T022 (flush ack → re-query)
```

**Phase 6 — US4** (parallel after T019):
```
T027 (handleRetry) || T028 (handleDiscard) — both depend on T026
```

---

## Implementation Strategy

**MVP Scope** (US1 + US2 — offline read + compose while offline):
```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 →
T009 → T010 → T011 → T012 → T013 → T014 →
T015 → T016 → T017 → T018 →
T019 → T020 → T021 → T022
```
This gives: cached reads, optimistic sends, pending/sent indicators, offline banner.

**Full delivery order**:
1. Setup: packages + SQLite modules + types (T001–T008)
2. Foundational services: outbox + hook + banner + socket + server (T009–T014)
3. US1 — offline read (T015–T018)
4. US2 — compose while offline (T019–T022)
5. US3 — auto-sync on reconnect (T023–T025)
6. US4 — partial failure (T026–T028)
7. US6 — first open no cache (T029–T030)
8. Polish (T031–T033)
