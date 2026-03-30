# Research: Presence & Status

**Feature**: 07 — Presence & Status
**Date**: 2026-03-26

---

## Decision 1: Presence State — Global Zustand Store

**Decision**: Create a `usePresenceStore` Zustand store in `apps/mobile/src/shared/stores/presence.ts` that holds `onlineUserIds: Set<string>` and `lastSeenMap: Record<string, string>`. All screens subscribe to this store for real-time online status without prop drilling.

**Rationale**: The same `user:online` / `user:offline` socket events affect multiple screens simultaneously (ConversationsScreen, ContactsScreen, ChatScreen header). A global store is the correct pattern — the same approach already used for auth state. Using component-local state would require each screen to independently re-register socket listeners, causing duplicate handlers and inconsistent state.

**Alternatives considered**:
- Component-local socket listeners per screen — leads to duplicated handler registrations and race conditions when navigating between screens
- React Context for presence — functional, but Zustand is already the established pattern in this project

---

## Decision 2: Socket Listener Placement — Inside `connectSocket()`

**Decision**: Register `user:online` and `user:offline` handlers inside `connectSocket()` in `socket.ts`, immediately after setting up `connect` / `disconnect` / `connect_error` handlers. These handlers update the global `usePresenceStore`.

**Rationale**: The socket is initialized once in `App.tsx` when `isAuthenticated` changes. Placing presence listeners here ensures they are active for the lifetime of the session, regardless of which screen is mounted. If listeners were placed in individual screens, they would be torn down on unmount and miss events.

**Alternatives considered**:
- App.tsx useEffect — possible but adds logic to a file that should stay thin
- Each screen registers its own listener — unreliable, duplicate updates

---

## Decision 3: Typing Indicator — Animated Dots in FlatList Footer

**Decision**: Render a `TypingIndicator` component as the `ListFooterComponent` of the inverted FlatList in ChatScreen. The component shows 3 dots with sequential bounce animation using `Animated.sequence` + `Animated.loop`. It only mounts/renders when `isTyping === true`.

**Rationale**: FlatList's `ListFooterComponent` renders at the "bottom" of an inverted list (visually), which is exactly where a typing indicator belongs. Using the footer avoids inserting a fake message into the messages array.

**Animation spec** (matches Messenger exactly):
- 3 dots, diameter 8px, color `colors.gray300`
- Bounce: each dot scales from 1.0 → 1.5 → 1.0 over 400ms
- Stagger: dot 1 starts at 0ms, dot 2 at 150ms, dot 3 at 300ms
- All 3 loop indefinitely

**Alternatives considered**:
- Inserting a `{ id: 'typing', type: 'typing' }` fake message into the messages array — creates complexity in renderMessage logic and can interfere with keyExtractor
- `lottie-react-native` animation — requires native build, incompatible with Expo Go

---

## Decision 4: Presence String Utility — Pure Function

**Decision**: Create `getPresenceString(isOnline: boolean, lastSeenAt: string): string` in `apps/mobile/src/shared/utils/presence.ts`. ChatScreen calls this function, passing the store's live values for the otherUser.

**Rules** (in priority order):
1. `isOnline === true` → `"Active now"`
2. `lastSeenAt` < 1 min ago → `"Active now"`
3. `lastSeenAt` < 60 min ago → `"Active Xm ago"` (e.g. `"Active 5m ago"`)
4. `lastSeenAt` < 24 hours ago → `"Active Xh ago"` (e.g. `"Active 2h ago"`)
5. `lastSeenAt` ≥ 24 hours → `"Active Xd ago"` (e.g. `"Active 1d ago"`)

**Never show "Offline"** — matches Messenger behavior.

---

## Decision 5: Read Receipt in ConversationsScreen — Server Change Required

**Decision**: Add `status: string | null` to the `lastMessage` field returned by `GET /chat/conversations`. This requires a small addition to the server's `getConversations` query (join with `messageStatuses` to get the latest message's status for the current user).

**Rationale**: Without this, the ConversationsScreen can only show the read receipt avatar after a `messages:status` socket event is received during the current session. On initial render, the status would always be unknown. For correct Messenger-like behavior, the initial list load must reflect the already-read state.

**Server change scope**: In `apps/server/src/features/chat/chat.service.ts`, add `status` to the `lastMessage` select. Also update the `Conversation.lastMessage` TypeScript type on the mobile client.

**Alternatives considered**:
- Socket-only (no server change) — read receipt only shows after a new event in the current session, incorrect on app re-open
- Separate `/conversations/:id/receipt` endpoint — unnecessary round-trip, over-engineered

---

## Decision 6: Real-Time Updates for ConversationsScreen and ContactsScreen

**Decision**: Both screens subscribe directly to `usePresenceStore`. Since Zustand triggers re-renders on state change, the `isOnline` dot will update automatically when `user:online` / `user:offline` events update the store — no manual socket listeners needed in these screens.

**For ConversationsScreen read receipt**: Register a single `messages:status` socket listener in `useFocusEffect` to update the local `conversations` state when a status event arrives matching a known conversation.

**Rationale**: Zustand subscriptions are reactive — components re-render only when the part of the store they read changes. This is zero-boilerplate for the online dot feature.
