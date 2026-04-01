# Implementation Plan: Message Pagination UI (Infinite Scroll)

**Branch**: `13-message-pagination` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `.specify/features/13-message-pagination/spec.md`

## Summary

Add infinite scroll to ChatScreen so messages load from SQLite instantly on open, background-sync newer messages from the server, and let users scroll up to paginate through older messages 50 at a time — with a top-pinned spinner, no scroll jumps, and silent offline handling.

## Technical Context

**Language/Version**: TypeScript (strict mode), React Native Expo SDK 54
**Primary Dependencies**: expo-sqlite (local message store), Socket.IO client (real-time sync), React Native FlatList
**Storage**: SQLite (messages, already implemented) — cursor-based queries by conversationId + before timestamp
**Testing**: Manual on-device (no automated tests per project convention)
**Target Platform**: iOS + Android via Expo Go
**Project Type**: Mobile app (monorepo: `apps/mobile` + `apps/server`)
**Performance Goals**: Cached messages render within 100ms; older page loads within 2s on mobile connection
**Constraints**: Offline-capable; no scroll jump on page insert; Expo Go compatible (no MMKV, no native-only libs)
**Scale/Scope**: ~10 concurrent users; conversations may have hundreds of messages

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Syria Accessibility | ✅ Pass | No new external services; pagination hits existing Koyeb backend |
| Offline-First Messaging | ✅ Pass | SQLite-first load is the core of this feature |
| TypeScript Everywhere | ✅ Pass | All new code must be strict TypeScript, functional components |
| Feature-Based Architecture | ✅ Pass | Changes stay inside `apps/mobile/src/features/chat/` |
| Messenger-Identical UX | ✅ Pass | Top-pinned spinner matches Messenger/WhatsApp scroll pattern |
| Incremental Module Delivery | ✅ Pass | Feature is self-contained; no half-implemented dependencies |

No violations. Proceed.

## Project Structure

### Documentation (this feature)

```text
.specify/features/13-message-pagination/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/mobile/src/features/chat/
├── ChatScreen.tsx                  ← primary changes (FlatList pagination logic)
└── hooks/
    └── useMessagePagination.ts     ← new: pagination state + load-more logic

apps/mobile/src/shared/db/
└── messages.db.ts                  ← add getMessages(conversationId, limit, before) if missing

apps/server/src/features/chat/
└── chat.router.ts                  ← existing GET /messages?cursor=&limit=50 (no changes expected)
```

**Structure Decision**: Mobile-only change. The backend pagination endpoint already exists. All new logic lives in the `chat` feature folder following the feature-based architecture principle.

## Complexity Tracking

No constitution violations. Table omitted.
