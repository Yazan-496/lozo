# Research: Offline-First Messaging

**Feature**: 10 — Offline-First Messaging
**Date**: 2026-03-26

---

## Decision 1: Local SQLite Package

**Decision**: `expo-sqlite` (~15.x, SDK 54 compatible)

**Rationale**: The project constitution already designates SQLite for message storage. `expo-sqlite` is bundled with Expo SDK and works in Expo Go without ejecting. It provides a synchronous-friendly async API, supports WAL mode for better concurrent reads/writes, and handles migrations via `useMigrations` or manual `execAsync`. No external service calls — fully offline capable.

**Alternatives considered**:
- `react-native-sqlite-storage` — requires bare workflow / native build. Ruled out.
- WatermelonDB — excellent offline-first ORM but adds ~2 MB, complex setup, overkill for this scope.
- MMKV for messages — fast key-value but no relational queries (joining messages by conversation); unsuitable.

---

## Decision 2: Network Detection

**Decision**: `expo-network` (~7.x) for initial state + Socket.IO `connect`/`disconnect` events for real-time transitions

**Rationale**: `expo-network` is Expo Go compatible and provides `Network.getNetworkStateAsync()` for startup checks. Socket.IO's own reconnect lifecycle (`connect`, `disconnect`, `connect_error`) is already wired in `socket.ts` and is the most accurate signal for "can we reach the server" — a device may have Wi-Fi but no internet. Combining both covers all transition scenarios.

**Alternatives considered**:
- `@react-native-community/netinfo` — accurate but requires native module; incompatible with Expo Go.
- Polling with `expo-network` every N seconds — wasteful; Socket.IO events are more precise.

---

## Decision 3: UUID Generation for localId

**Decision**: Pure-JS UUID v4 utility (no extra package)

**Rationale**: Local IDs are temporary and internal. A simple `Math.random()` + timestamp hex string is sufficient for collision avoidance across a single device. Avoids adding `expo-crypto` as a dependency.

**Format**: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

---

## Decision 4: Outbox Processing Strategy

**Decision**: Single-pass FIFO per conversation, triggered on Socket.IO `connect` event. Max 3 retry attempts; beyond that status = `failed`.

**Rationale**: Processing per-conversation FIFO preserves message ordering guarantees. Triggering on socket connect is the most reliable trigger (already have the event). 3 attempts balances retry persistence with avoiding infinite loops on permanent errors (e.g., server validation failure).

**Alternatives considered**:
- Background task (Expo TaskManager) — deferred; requires push notifications to be set up first (feature dependency).
- Exponential backoff timer — adds complexity; socket reconnect already handles the "retry when online" requirement.

---

## Decision 5: Conversation List Caching

**Decision**: Cache conversations in SQLite (`conversations` table) alongside messages. Load from SQLite on mount, refresh from server in background when online.

**Rationale**: Consistent storage layer — one SQLite database for both messages and conversations. Simpler than maintaining two storage strategies.

**Alternatives considered**:
- `expo-secure-store` for conversations JSON blob — 2 KB limit per key; a user with 20+ conversations would hit it.
- AsyncStorage — not in the tech stack, adds a new dependency.

---

## Decision 6: Optimistic ID Reconciliation

**Decision**: Server response includes `localId` echoed back. Mobile matches on `localId`, replaces with `serverId`, updates `syncStatus` to `sent`.

**Rationale**: Server must echo `localId` in the acknowledgment payload so the client can find the correct local record. This is the standard pattern for optimistic updates.

**Server change needed**: `POST /messages` (via socket `message:send`) must accept and echo `localId` in its response.

---

## Decision 7: New Packages Required

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-sqlite` | `~15.2.0` | Local message + conversation storage |
| `expo-network` | `~7.1.0` | Initial network state on startup |

No other new packages needed.
