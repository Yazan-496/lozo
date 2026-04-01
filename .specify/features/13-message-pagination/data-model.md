# Data Model: Message Pagination UI (Infinite Scroll)

**Branch**: `13-message-pagination` | **Date**: 2026-04-01

## No Schema Changes Required

This feature requires no new tables, columns, or migrations. All required data structures already exist.

## Existing Entities Used

### LocalMessageRow (SQLite)

Defined in `apps/mobile/src/shared/db/messages.db.ts`.

| Field | Type | Role in pagination |
|-------|------|--------------------|
| `local_id` | string | Deduplication key |
| `server_id` | string \| null | Deduplication key for server messages |
| `conversation_id` | string | Filter for `getMessages()` query |
| `created_at` | string (ISO) | **Cursor field** — `before` param in `getMessages()` and server `cursor` param |

### Pagination Cursor

Not stored — derived at runtime from `messages[messages.length - 1].createdAt` (oldest visible message in the inverted FlatList array).

## Runtime State (ChatScreen)

| State | Type | Purpose |
|-------|------|---------|
| `messages` | `Message[]` | Displayed messages, newest-first (index 0 = newest) |
| `loadingOlder` | `boolean` | Prevents concurrent load-more requests; shows spinner |
| `hasMoreOlder` | `boolean` | Disables trigger when all history is loaded |

## State Transitions

```
hasMoreOlder = true (initial)
    │
    ▼ user scrolls to top → onEndReached fires
    │
    ├─ loadingOlder = true → show spinner
    │
    ├─ query SQLite with cursor
    │   ├─ rows found → append, loadingOlder = false
    │   └─ no rows → try server
    │       ├─ online + server has rows → persist to SQLite, append, loadingOlder = false
    │       ├─ online + server empty → hasMoreOlder = false, loadingOlder = false
    │       └─ offline → loadingOlder = false (hasMoreOlder stays true for retry later)
    │
    └─ hasMoreOlder = false → spinner hidden, no more triggers
```
