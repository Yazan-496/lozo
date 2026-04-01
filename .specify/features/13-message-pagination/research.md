# Research: Message Pagination UI (Infinite Scroll)

**Branch**: `13-message-pagination` | **Date**: 2026-04-01

## What Is Already Implemented

Most of this feature exists in `apps/mobile/src/features/chat/ChatScreen.tsx`. The following already works:

| Behavior | Status | Location |
|----------|--------|----------|
| SQLite-first load on chat open | ✅ Done | `loadMessages()` line 259 |
| Background server sync on open | ✅ Done | `loadMessages()` line 271 |
| `onEndReached` → `loadOlderMessages()` | ✅ Done | FlatList line 1515 |
| Spinner at top while loading | ✅ Done | `ListFooterComponent` line 1519 (inverted FlatList = top) |
| `loadingOlder` / `hasMoreOlder` guards | ✅ Done | state lines 159–160 |
| SQLite cursor query with `before` param | ✅ Done | `messages.db.ts` line 55 |
| Offline check on initial load | ✅ Done | `loadMessages()` line 272 |

## What Is Missing / Broken

### Gap 1: `loadOlderMessages` only queries SQLite, never the server

**Current behavior**: When `getDbMessages(conversationId, 50, oldest)` returns 0 rows, `hasMoreOlder` is set to false — even though the server may have older messages not yet cached locally.

**Root cause**: The initial `loadMessages()` server fetch has no cursor — it always fetches the latest ~50 from the server. So anything older than those 50 is never in SQLite.

**Fix needed**: After SQLite returns 0 rows, call `GET /chat/conversations/:id/messages?cursor=<oldest>&limit=50`, persist results to SQLite, and append to state. Only set `hasMoreOlder = false` when the server also returns 0.

### Gap 2: No offline guard in `loadOlderMessages`

**Current behavior**: When offline and SQLite is exhausted, `loadOlderMessages` sets `hasMoreOlder = false` permanently — meaning if the user goes back online, they can never load more.

**Fix needed**: Check `isOnline` before attempting the server call. If offline and SQLite is empty, silently stop without setting `hasMoreOlder = false`.

### Gap 3: Server fetch in `loadMessages` replaces all messages (no cursor)

**Current behavior**: On open, the server fetch calls `/messages` with no cursor and overwrites the whole messages state with the response. This is fine for initial load but means server messages are limited to whatever the endpoint returns by default.

**Fix needed** (minor): Pass `?limit=50` to be explicit. The cursor pagination for load-more is the main gap (Gap 1).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cursor field for server pagination | `cursor` = ISO timestamp of oldest message (`createdAt`) | Backend already uses this; matches SQLite `before` param |
| When to stop loading | Server returns 0 messages | SQLite exhaustion is not reliable since cache may be partial |
| Offline behavior when SQLite exhausted | Silently stop, do NOT set `hasMoreOlder = false` | Allows retry when user comes back online |
| Scroll jump prevention | React Native inverted FlatList handles this natively | Appending to the end of the data array (= top visually) doesn't cause jumps |
| Deduplication | Filter by `message.id` before inserting | Server and SQLite may overlap in cursor boundary |

## Server Endpoint (Existing)

```
GET /chat/conversations/:conversationId/messages?cursor=<ISO timestamp>&limit=50
```
- Returns messages older than `cursor`, newest-first
- Already implemented, no server changes needed

## Files to Change

| File | Change |
|------|--------|
| `apps/mobile/src/features/chat/ChatScreen.tsx` | Update `loadOlderMessages()` to fall back to server after SQLite miss; add offline guard |
| No other files need changes | SQLite query, FlatList setup, spinner all already correct |
