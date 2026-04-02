# Implementation Plan: Message Scheduling

**Branch**: `16-message-scheduling` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `.specify/features/16-message-scheduling/spec.md`

## Summary

Allow users to schedule text messages for future delivery by long-pressing the send button. Scheduled messages are stored locally in SQLite, displayed with a clock icon in the chat, and can be edited/rescheduled/canceled before sending. A background timer checks due messages every minute when the app is running; missed messages are queued in the existing outbox and sent on app reopen or network reconnect.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)  
**Primary Dependencies**: React Native (Expo SDK 54), expo-sqlite, Socket.IO client, Zustand  
**Storage**: SQLite (local) via expo-sqlite; new `scheduled_messages` table  
**Testing**: Manual testing in Expo Go (no automated test framework currently)  
**Target Platform**: iOS/Android via Expo Go  
**Project Type**: Mobile app (React Native)  
**Performance Goals**: Schedule action < 30s; delivery within 60s of scheduled time (when app running)  
**Constraints**: Offline-first; no Firebase; expo-task-manager for background (limited reliability when app killed)  
**Scale/Scope**: ~10 users, max 100 scheduled messages per conversation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. Syria Accessibility | ✅ Pass | No new external services; all local SQLite |
| 2. Offline-First Messaging | ✅ Pass | Scheduled messages stored locally, queued in outbox when due |
| 3. TypeScript Everywhere | ✅ Pass | All new code in TypeScript strict mode |
| 4. Feature-Based Architecture | ✅ Pass | New scheduling module under `features/chat/scheduling/` |
| 5. Messenger-Identical UX | ✅ Pass | Clock icon + timestamp matches Messenger's scheduled message UI |
| 6. Incremental Module Delivery | ✅ Pass | Single feature, testable in isolation |

**Technology Constraints Check**:
- expo-task-manager: ✅ Compatible with Expo Go (SDK 54)
- expo-sqlite: ✅ Already in use
- No new external services required

## Project Structure

### Documentation (this feature)

```text
.specify/features/16-message-scheduling/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/mobile/src/
├── features/
│   └── chat/
│       ├── ChatScreen.tsx              # Modify: add long-press on send, display scheduled messages
│       ├── scheduling/                 # NEW: scheduling feature module
│       │   ├── SchedulePickerModal.tsx # Date/time picker modal
│       │   ├── ScheduledMessageBubble.tsx # Clock icon + timestamp display
│       │   ├── ScheduledMessageMenu.tsx # Edit/Reschedule/Cancel options
│       │   └── useScheduledMessages.ts # Scheduling logic hook
│       ├── hooks/
│       │   └── useChatMessages.ts      # Modify: integrate scheduled messages
│       └── components/
│           └── SendButton.tsx          # NEW: extracted for long-press handling
├── shared/
│   ├── db/
│   │   ├── sqlite.ts                   # Modify: add scheduled_messages table
│   │   └── scheduled.db.ts             # NEW: scheduled messages CRUD
│   └── services/
│       └── scheduler.ts                # NEW: background timer + due message processing
```

**Structure Decision**: Feature-based architecture with new `scheduling/` subdirectory under `features/chat/`. Shared database operations in `shared/db/scheduled.db.ts`. Background service in `shared/services/scheduler.ts`.

## Complexity Tracking

No constitution violations. Feature follows established patterns:
- SQLite table like existing `messages` and `outbox` tables
- Hook pattern like `useChatMessages`
- Modal pattern like `ForwardModal` and `EmojiPickerModal`
