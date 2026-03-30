# Tasks: Presence & Status

**Feature**: 07 — Presence & Status
**Plan**: [plan.md](plan.md)
**Spec**: [spec.md](spec.md)
**Generated**: 2026-03-26

---

## Implementation Strategy

No new packages. All work is wiring existing socket events → new Zustand store → 3 screens.

Build order: Foundational (store + utility + socket) → US1 typing indicator → US2 header status → US3 online dots (convos) → US4 online dots (contacts) → US5 read receipts. US2–US4 are fully parallelizable after foundational. US5 needs the server change first.

---

## Phase 1 — Foundational (blocks all user stories)

- [X] T001 [P] Create `apps/mobile/src/shared/utils/presence.ts` with exported function `getPresenceString(isOnline: boolean, lastSeenAt: string): string` — returns "Active now" if online or <1m ago, "Active Xm ago" if <60m, "Active Xh ago" if <24h, "Active Xd ago" otherwise — never returns "Offline"

- [X] T002 [P] Create `apps/mobile/src/shared/stores/presence.ts` — Zustand store with `onlineUserIds: Set<string>`, `lastSeenMap: Record<string, string>`, and three actions: `setOnline(userId)` adds to set, `setOffline(userId, lastSeenAt)` removes from set + records in map, `seedOnline(userIds)` replaces the set

- [X] T003 Add `status: 'sent' | 'delivered' | 'read' | null` field to the `lastMessage` object inside the `Conversation` interface in `apps/mobile/src/shared/types/index.ts` (add after `createdAt` field)

- [X] T004 Wire `user:online` and `user:offline` socket listeners inside `connectSocket()` in `apps/mobile/src/shared/services/socket.ts` — import `usePresenceStore` from `'../stores/presence'`, add `socket.on('user:online', ({ userId }) => usePresenceStore.getState().setOnline(userId))` and `socket.on('user:offline', ({ userId, lastSeenAt }) => usePresenceStore.getState().setOffline(userId, lastSeenAt))` after the existing `connect_error` handler

---

## Phase 2 — User Story 1: Typing Indicator

**Story goal**: When the other user is typing, an animated 3-dot bubble appears at the bottom of the chat within 500ms and disappears when they stop or send.

**Independent test criteria**: Open a chat with another device logged in as a different user. Have them type → "..." bubble appears within 0.5s at the bottom of the chat. Have them stop/send → bubble disappears immediately.

- [X] T005 [US1] Create `apps/mobile/src/features/chat/components/TypingIndicator.tsx` — `View` wrapper aligned left with 16px horizontal padding; inside: a gray-100 bubble (borderRadius 18, horizontal padding 14, vertical padding 12) containing 3 `Animated.View` dots (8px diameter, gray400 color, gap 5); each dot uses `Animated.loop(Animated.sequence([Animated.delay(i * 150), bounce up to scale 1.5 over 200ms, bounce back over 200ms]))` started in `useEffect`, stopped on cleanup

- [X] T006 [US1] In `apps/mobile/src/features/chat/ChatScreen.tsx` add `import { TypingIndicator } from './components/TypingIndicator'` and set `ListFooterComponent={isTyping ? <TypingIndicator /> : null}` on the FlatList (the `isTyping` state already exists and is already wired to `typing:start`/`typing:stop` socket events)

---

## Phase 3 — User Story 2: Online Status in Chat Header

**Story goal**: Chat header subtitle shows "Active now" when other user is online and "Active Xm/Xh/Xd ago" otherwise — updates in real-time without navigating away.

**Independent test criteria**: Open a chat. If other user is online: header shows "Active now". Disconnect their device → header updates to "Active Xm ago" within 2 seconds. Never shows "Offline" or "Online".

- [X] T007 [US2] In `apps/mobile/src/features/chat/ChatScreen.tsx`: (1) add `import { usePresenceStore } from '../../shared/stores/presence'` and `import { getPresenceString } from '../../shared/utils/presence'`; (2) add two store subscriptions at top of component: `const isOtherOnline = usePresenceStore((s) => s.onlineUserIds.has(otherUser.id))` and `const otherLastSeen = usePresenceStore((s) => s.lastSeenMap[otherUser.id] ?? otherUser.lastSeenAt)`; (3) replace the header subtitle `{isTyping ? 'typing...' : otherUser.isOnline ? 'Online' : 'Offline'}` with `{isTyping ? 'typing...' : getPresenceString(isOtherOnline, otherLastSeen)}`; (4) add `isOtherOnline` and `otherLastSeen` to the `useEffect` dependency array for `navigation.setOptions`

---

## Phase 4 — User Story 3: Online Dot in Conversations List

**Story goal**: Green dot on avatar in ConversationsScreen reflects real-time online status without refresh.

**Independent test criteria**: Conversations list shows green dot on avatar for online users. Log out another device → dot disappears within 2 seconds. Log back in → dot reappears within 2 seconds. No app refresh needed.

- [X] T008 [US3] In `apps/mobile/src/features/chat/ConversationsScreen.tsx`: (1) add `import { usePresenceStore } from '../../shared/stores/presence'`; (2) add `const onlineUserIds = usePresenceStore((s) => s.onlineUserIds)` at top of component; (3) in `renderConversation`, change the Avatar `isOnline` prop from `isOnline={otherUser.isOnline}` to `isOnline={onlineUserIds.has(otherUser.id)}`

---

## Phase 5 — User Story 4: Online Dot in Contacts List

**Story goal**: Green dot on avatar in ContactsScreen reflects real-time online status. Status subtitle shows "Active now" instead of "Online".

**Independent test criteria**: Contacts list shows green dot for online contacts. Status text says "Active now" (not "Online"). Dot updates in real-time when a contact connects/disconnects.

- [X] T009 [US4] In `apps/mobile/src/features/contacts/ContactsScreen.tsx`: (1) add `import { usePresenceStore } from '../../shared/stores/presence'` and `import { getPresenceString } from '../../shared/utils/presence'`; (2) add `const onlineUserIds = usePresenceStore((s) => s.onlineUserIds)` at top of component; (3) in the contacts map, change Avatar `isOnline` prop from `isOnline={contact.user.isOnline}` to `isOnline={onlineUserIds.has(contact.user.id)}`; (4) replace the subtitle text `{contact.user.isOnline ? 'Online' : contact.user.bio}` with `{onlineUserIds.has(contact.user.id) ? 'Active now' : contact.user.bio}`

---

## Phase 6 — User Story 5: Read Receipts in Conversations List

**Story goal**: When the last message in a conversation was sent by me and has been read, a small (14px) avatar of the reader appears in the bottom-right of the conversation row instead of the unread count.

**Independent test criteria**: Send a message to another user. Conversation row shows unread count on their side. When they open the chat, the unread badge on my side (conversations list) is replaced by their 14px avatar. On app re-open, receipt avatar still shows.

- [X] T010 [US5] In `apps/server/src/features/chat/chat.service.ts`, in the `getConversations` function, after fetching `lastMessage`, add a query to get its status: if `lastMessage` exists, query `messageStatuses` where `messageId = lastMessage.id` AND `userId = (lastMessage.senderId === userId ? otherUserId : userId)`, get the `status` field; include `status: statusRow?.status ?? null` in the returned `lastMessage` object

- [X] T011 [US5] In `apps/mobile/src/features/chat/ConversationsScreen.tsx`: (1) add `import { useAuthStore } from '../../shared/stores/auth'` and `import { getSocket } from '../../shared/services/socket'`; (2) add `const currentUser = useAuthStore((s) => s.user)` at top of component; (3) inside `useFocusEffect`, after `loadConversations()`, get the socket and register `socket.on('messages:status', onMessageStatus)` where `onMessageStatus` updates `conversations` state by finding the matching `conv.id === data.conversationId` and setting `conv.lastMessage.status = data.status`, return cleanup `socket.off('messages:status', onMessageStatus)`; (4) in `renderConversation`, replace the `{item.unreadCount > 0 && <View style={styles.unreadBadge}>...}` block with a conditional: if `item.lastMessage?.senderId === currentUser?.id && item.lastMessage?.status === 'read'` render `<Avatar uri={otherUser.avatarUrl} name={otherUser.displayName} color={otherUser.avatarColor} size={14} />`, else if `item.unreadCount > 0` render the existing `unreadBadge`, else render nothing

---

## Phase 7 — Polish

- [X] T012 Verify that `TypingIndicator` animation cleanup (calling `a.stop()` on each animation in `useEffect` return) prevents any "can't perform state update on unmounted component" warnings when navigating away from ChatScreen mid-typing — in `apps/mobile/src/features/chat/components/TypingIndicator.tsx`

- [X] T013 In `apps/mobile/src/shared/stores/presence.ts`, verify that `Set` spread `new Set([...s.onlineUserIds, userId])` correctly produces a new Set reference (triggering Zustand re-render) — if not, replace with `new Set(s.onlineUserIds).add(userId)` and ensure the same for `setOffline`

---

## Dependencies

```
T001, T002, T003 (parallel, no deps)
T004 depends on T002 (needs store to exist)
T005, T006 can start after T004 (US1 typing — uses existing isTyping state)
T007 depends on T001, T002, T004 (US2 header — needs store + utility)
T008 depends on T002, T004 (US3 — needs store)
T009 depends on T001, T002, T004 (US4 — needs store + utility)
T010 — server change, independent
T011 depends on T003, T010 (US5 — needs updated type + server data)
T012, T013 — polish, after all
```

## Parallel Execution

- T001, T002, T003 all touch different new files — run in parallel
- T007, T008, T009 all touch different screen files — run in parallel after foundational
- T010 (server) can run in parallel with T005–T009 (mobile-only)
