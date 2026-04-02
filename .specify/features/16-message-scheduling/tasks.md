# Tasks: Message Scheduling

**Input**: Design documents from `.specify/features/16-message-scheduling/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No automated tests (manual testing in Expo Go per Technical Context)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile app**: `apps/mobile/src/` (React Native Expo)
- Feature code: `apps/mobile/src/features/chat/`
- Shared code: `apps/mobile/src/shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create project structure

- [x] T001 Install new dependencies: `npx expo install @react-native-community/datetimepicker expo-task-manager` in apps/mobile/
- [x] T002 [P] Create scheduling feature directory structure at apps/mobile/src/features/chat/scheduling/
- [x] T003 [P] Add ScheduledMessage and ScheduledMessageRow interfaces to apps/mobile/src/shared/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core services that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add scheduled_messages table migration to apps/mobile/src/shared/db/sqlite.ts (schema from data-model.md)
- [x] T005 [P] Create apps/mobile/src/shared/db/scheduled.db.ts with CRUD operations:
  - `scheduleMessage(conversationId, content, scheduledAt)` - insert new scheduled message
  - `getScheduledMessages(conversationId)` - list all pending for conversation
  - `getDueMessages()` - find all where scheduled_at <= now AND status = 'pending'
  - `updateScheduledMessage(id, { content?, scheduledAt? })` - edit content or reschedule
  - `cancelScheduledMessage(id)` - delete from table
  - `markAsSending(id)` - update status to 'sending'
  - `deleteScheduledMessage(id)` - remove after successful send
  - `rowToScheduledMessage(row)` - convert DB row to domain object
- [x] T006 [P] Create apps/mobile/src/shared/services/scheduler.ts with:
  - `startScheduler()` - begin 30-second interval timer
  - `stopScheduler()` - clear interval
  - `checkDueMessages()` - process due messages (called by interval and on app open)
  - `processDueMessage(scheduled)` - copy to messages table, enqueue in outbox, delete from scheduled
- [x] T007 Integrate scheduler startup in App.tsx (call `startScheduler()` after database init)

**Checkpoint**: Foundation ready - database and scheduler in place, user story implementation can begin

---

## Phase 3: User Story 1 - Schedule Message for Future Delivery (Priority: P1) 🎯 MVP

**Goal**: Users can schedule text messages by long-pressing send button, selecting date/time, and seeing the scheduled message in chat with clock icon

**Independent Test**: Long-press send → tap "Schedule" → pick time → confirm → see message with clock icon in chat → wait for time → message sends automatically

### Implementation for User Story 1

- [x] T008 [P] [US1] Create apps/mobile/src/features/chat/components/SendButton.tsx:
  - Extract send button from ChatScreen
  - Accept `onPress` (normal send) and `onLongPress` (show schedule option) props
  - Long-press shows ActionSheet/Alert with "Send Now" and "Schedule" options
- [x] T009 [P] [US1] Create apps/mobile/src/features/chat/scheduling/SchedulePickerModal.tsx:
  - Visible prop controlled by parent
  - Date picker (limited to 30 days in future)
  - Time picker (hour + minute)
  - Validation: reject past times, show error
  - Warning banner: "App must be running to send scheduled messages"
  - Confirm/Cancel buttons
  - onConfirm callback with selected Date
- [x] T010 [P] [US1] Create apps/mobile/src/features/chat/scheduling/ScheduledMessageBubble.tsx:
  - Render scheduled message content
  - Clock icon (Ionicons 'time-outline') in distinct color
  - "Scheduled for [formatted date/time]" timestamp
  - Right-aligned like sent messages (sender's own message)
  - "Sending soon" indicator when locked (< 30 seconds to scheduled time)
- [x] T011 [US1] Create apps/mobile/src/features/chat/scheduling/useScheduledMessages.ts hook:
  - Load scheduled messages for conversation on mount
  - `scheduleNewMessage(content, scheduledAt)` - validate and save to DB
  - `scheduledMessages` state array
  - `refreshScheduledMessages()` for manual refresh
  - Subscribe to scheduler events for auto-refresh after send
- [x] T012 [US1] Integrate into apps/mobile/src/features/chat/ChatScreen.tsx:
  - Replace inline send button with SendButton component
  - Add SchedulePickerModal (controlled by state)
  - Handle long-press → show modal → on confirm → call scheduleNewMessage
  - Merge scheduled messages into chat FlatList data (sorted by scheduled_at)
  - Render ScheduledMessageBubble for scheduled items
- [x] T013 [US1] Update apps/mobile/src/features/chat/hooks/useChatMessages.ts:
  - Add optional `scheduledMessages` parameter to data merge
  - Ensure scheduled messages appear in correct position (by scheduled_at time)

**Checkpoint**: User Story 1 complete - users can schedule messages and see them in chat with clock icon, messages auto-send at scheduled time

---

## Phase 4: User Story 2 - Manage Scheduled Messages (Priority: P2)

**Goal**: Users can tap scheduled messages to edit content, reschedule time, or cancel before sending

**Independent Test**: Schedule a message → tap on it → see Edit/Reschedule/Cancel options → modify or cancel → verify changes

### Implementation for User Story 2

- [ ] T014 [P] [US2] Create apps/mobile/src/features/chat/scheduling/ScheduledMessageMenu.tsx:
  - Action menu/sheet with Edit, Reschedule, Cancel options
  - Disabled state for locked messages (< 30s before send)
  - "Sending soon" message when locked
  - onEdit, onReschedule, onCancel callbacks
- [ ] T015 [P] [US2] Create apps/mobile/src/features/chat/scheduling/EditScheduledModal.tsx:
  - TextInput pre-filled with current content
  - Save/Cancel buttons
  - onSave callback with new content
- [ ] T016 [US2] Extend useScheduledMessages hook in apps/mobile/src/features/chat/scheduling/useScheduledMessages.ts:
  - Add `updateContent(id, newContent)` function
  - Add `reschedule(id, newScheduledAt)` function  
  - Add `cancelScheduled(id)` function
  - Add `isLocked(scheduledAt)` helper (returns true if < 30 seconds to send)
- [ ] T017 [US2] Integrate menu into ChatScreen.tsx:
  - onPress handler for ScheduledMessageBubble → show ScheduledMessageMenu
  - Wire up Edit → show EditScheduledModal → updateContent
  - Wire up Reschedule → show SchedulePickerModal in edit mode → reschedule
  - Wire up Cancel → confirm alert → cancelScheduled
  - Refresh list after any action

**Checkpoint**: User Story 2 complete - users can edit, reschedule, or cancel scheduled messages

---

## Phase 5: User Story 3 - Offline and Background Handling (Priority: P3)

**Goal**: Scheduled messages queue in outbox when offline/closed, send automatically when app reopens or connectivity returns

**Independent Test**: Schedule message → go offline → wait past scheduled time → go online → message sends from outbox

### Implementation for User Story 3

- [ ] T018 [US3] Enhance scheduler.ts processDueMessage function:
  - On network failure: keep in scheduled_messages with status='sending' instead of deleting
  - Integrate with existing outbox flush mechanism
  - Handle outbox success callback to delete from scheduled_messages
- [ ] T019 [US3] Add app resume handler in App.tsx:
  - On AppState change to 'active': call `checkDueMessages()` immediately
  - Process any messages that became due while app was backgrounded/closed
- [ ] T020 [US3] Add network reconnect handler:
  - Subscribe to network store in scheduler.ts
  - On reconnect (offline → online): trigger `checkDueMessages()` + outbox flush
- [ ] T021 [US3] Handle missed scheduled messages on app open:
  - In scheduler.ts startup: query all due messages (scheduled_at <= now)
  - Process them immediately in creation order
  - Show toast: "Sending X scheduled messages..."
- [ ] T022 [US3] Update ScheduledMessageBubble for queued state:
  - If status='sending' but not yet sent: show "Queued - will send when online"
  - Visual indicator distinct from pending state

**Checkpoint**: User Story 3 complete - scheduled messages reliably send even when app was offline or closed

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T023 [P] Add conversation delete handling in apps/mobile/src/shared/db/scheduled.db.ts:
  - Scheduled messages NOT deleted when conversation deleted (per FR-018)
  - Query by conversation_id still works if conversation recreated
- [ ] T024 [P] Add max scheduled messages validation (100 per conversation) in useScheduledMessages hook
- [ ] T025 [P] Add timezone handling documentation in quickstart.md
- [ ] T026 Run quickstart.md validation - test all 7 scenarios manually
- [ ] T027 Code cleanup: ensure all new files follow existing patterns (StyleSheet, no NativeWind)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories proceed sequentially in priority order (P1 → P2 → P3)
  - Each builds on the previous but remains independently testable
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (T004-T007)
    ↓
    ├── Phase 3: US1 - Schedule Message (T008-T013) ← MVP
    │       ↓
    │   Phase 4: US2 - Manage Scheduled (T014-T017)
    │       ↓
    │   Phase 5: US3 - Offline Handling (T018-T022)
    │       ↓
    └── Phase 6: Polish (T023-T027)
```

### Within Each User Story

- Components marked [P] can be created in parallel
- Hook implementation integrates components
- ChatScreen integration comes last
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1** (all parallel):
- T002, T003 can run in parallel after T001

**Phase 2** (partial parallel):
- T005, T006 can run in parallel after T004
- T007 depends on T006

**Phase 3 - US1** (partial parallel):
- T008, T009, T010 can run in parallel
- T011 depends on T005 (DB operations)
- T012, T013 depend on T008-T011

**Phase 4 - US2** (partial parallel):
- T014, T015 can run in parallel
- T016 depends on T011
- T017 depends on T014-T016

**Phase 5 - US3** (sequential):
- T018-T022 are mostly sequential (scheduler enhancements)

**Phase 6** (all parallel):
- T023, T024, T025 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all UI components together:
Task T008: "Create SendButton.tsx"
Task T009: "Create SchedulePickerModal.tsx"
Task T010: "Create ScheduledMessageBubble.tsx"

# Then sequentially:
Task T011: "Create useScheduledMessages.ts hook"
Task T012: "Integrate into ChatScreen.tsx"
Task T013: "Update useChatMessages.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 (T008-T013)
4. **STOP and VALIDATE**: Test scheduling flow end-to-end
5. Deploy/demo if ready - users can schedule messages!

### Incremental Delivery

1. **MVP (US1)**: Schedule messages → visible value immediately
2. **+US2**: Edit/cancel control → user confidence
3. **+US3**: Offline reliability → production-ready

### Estimated Task Counts

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 3 | 2 |
| Foundational | 4 | 2 |
| US1 (MVP) | 6 | 3 |
| US2 | 4 | 2 |
| US3 | 5 | 0 |
| Polish | 5 | 3 |
| **Total** | **27** | **12** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Manual testing via Expo Go (no automated tests per technical context)
- All styling must use React Native StyleSheet (no NativeWind)
