# Agent Context: LoZo Mobile App

*Auto-maintained. Do not edit between the markers manually.*

<!-- AGENT_CONTEXT_START -->

## Active Feature: 10 — Offline-First Messaging

### New Technology (this feature)
- `expo-sqlite` ~15.2.0 — local message + conversation storage (Expo Go compatible)
- `expo-network` ~7.1.0 — initial network state on startup

### New SQLite Tables (mobile local)
- `messages` — full message store with `local_id`, `server_id`, `sync_status` (pending/sent/delivered/read/failed)
- `outbox` — persisted send queue, FIFO per conversation, max 3 retries before `failed`
- `conversations` — cached conversations list (INSERT OR REPLACE)

### New Mobile Files
- `shared/db/sqlite.ts` — init + singleton
- `shared/db/messages.db.ts` — CRUD for messages table
- `shared/db/outbox.db.ts` — CRUD for outbox table
- `shared/db/conversations.db.ts` — CRUD for conversations cache
- `shared/services/outbox.ts` — flush() triggered on socket connect
- `shared/stores/network.ts` — isOnline Zustand store
- `shared/hooks/useNetworkState.ts` — wires expo-network + socket events to network store
- `shared/components/OfflineBanner.tsx` — gray 28dp banner shown when offline

### Key Decisions
- Outbox flushed on socket `connect` event (not a timer)
- `localId` format: `local_${Date.now()}_${rand}` (no extra UUID package)
- Server echoes `localId` in `message:send` ack — client reconciles optimistic record
- Cache-first: SQLite loaded first on screen mount, server refresh in background
- Pruning: 90 days / 500 messages per conversation, runs at startup
- No background sync (app must be foregrounded)

<!-- AGENT_CONTEXT_END -->

## Prior Features

| # | Name | Key additions |
|---|---|---|
| 01 | UX Foundation | Theme system, makeStyles, dark/light/system modes |
| 02 | Message Actions | Long-press menu, reply, copy, forward, delete per message |
| 03 | Message Reactions | Emoji reactions, reaction picker |
| 04 | Media — Images | Image picker, Supabase Storage upload, image bubble |
| 05 | Media — Voice | expo-audio recording, voice bubble, playback |
| 06 | Media — Files | File picker, file bubble, download |
| 07 | Presence & Status | usePresenceStore, online dots, typing indicator, last seen |
| 08 | Profile & Avatar | Avatar upload, bio edit, display name edit |
| 09 | Contacts Enhancement | ContactProfileScreen, nicknames, relationship types, block, delete conversation |
| 10 | Offline-First Messaging | SQLite local store, outbox queue, network store, OfflineBanner, cache-first screens |
