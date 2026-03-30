# Tasks: Contacts Enhancement

**Feature**: 09 — Contacts Enhancement
**Plan**: [plan.md](plan.md)
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-26
**Status**: Ready

---

## Phase 1: Setup

> Initialize schema changes and run migration before any other work.

- [X] T001 Update `apps/server/src/shared/db/schema.ts` — add `myNickname` varchar(100) and `relationshipType` varchar(10) default 'friend' columns to the `contacts` table, and add the new `blockedUsers` pgTable with `(id, blockerId, blockedId, createdAt)` and unique index on `(blockerId, blockedId)`
- [X] T002 Run `cd apps/server && npx drizzle-kit generate && npx drizzle-kit migrate` to apply migration for the two new contacts columns and the blocked_users table

---

## Phase 2: Foundational

> Shared prerequisites that all user stories depend on. Complete before any US phase.

- [X] T003 Update `apps/mobile/src/shared/types/index.ts` — add `myNickname: string | null` and `relationshipType: 'friend' | 'lover'` fields to the `Contact` interface; add `ContactProfile` to `RootStackParamList` with params `{ contactId: string; otherUser: User; conversationId?: string; relationshipType?: 'friend' | 'lover' }`
- [X] T004 [P] Update `apps/mobile/src/shared/services/api.ts` — add five new API calls: `setMyNickname(contactId, myNickname)`, `setRelationshipType(contactId, relationshipType)`, `removeContact(contactId)`, `blockContact(userId)`, `deleteConversation(conversationId, scope: 'me' | 'everyone')`
- [X] T005 [P] Update `apps/mobile/src/navigation/index.tsx` — add `ContactProfileScreen` import and a `ContactProfile` screen to `MainStack.Navigator` with options: empty title, `headerBackTitle: ''`, `headerStyle backgroundColor: colors.bg`, `headerShadowVisible: false`, `headerTintColor: colors.primary`
- [X] T006 Update `apps/server/src/features/contacts/contacts.service.ts` — add import for `blockedUsers` from schema; update `getContacts` to exclude contacts where a `blockedUsers` row exists with `blockerId = userId AND blockedId = otherUserId` (use a subquery or post-filter on the results)

---

## Phase 3: US1 — View Contact Profile

> **Goal**: Tapping a contact opens a read-only profile screen.
> **Test**: Tap any contact row → ContactProfileScreen opens showing avatar, display name (nickname if set, else displayName), @username, bio, online/last-seen status, and relationship label badge.

- [X] T007 [US1] Update `apps/mobile/src/features/contacts/ContactsScreen.tsx` — wrap each contact row in a `TouchableOpacity` that calls `navigation.navigate('ContactProfile', { contactId: item.contactId, otherUser: item.user, conversationId: undefined, relationshipType: item.relationshipType })`; display `item.nickname ?? item.user.displayName` as the row label
- [X] T008 [US1] Create `apps/mobile/src/features/contacts/ContactProfileScreen.tsx` — full screen with four sections:
  1. **Header**: large `Avatar` (size 80), display name (nickname ?? displayName) in 22px bold, `@username` in gray, online dot + "Online" or `getPresenceString(isOnline, lastSeenAt)` text, relationship badge (💙 Friend / ❤️ Lover in a pill)
  2. **Nicknames section**: two tappable rows — "Contact's nickname" (shows current value or "Add nickname") and "My nickname" (shows current value or "Add nickname") — tapping opens an `Alert.prompt` or a modal text input
  3. **Actions section**: "Open Chat" button (navigates to Chat screen), "Delete conversation for me", "Delete conversation for everyone", "Remove contact", "Block" — last two styled in `colors.red`
  4. All sections styled using `makeStyles(colors)` pattern with `useThemeColors()`; local state: `nickname`, `myNickname`, `relationshipType` initialized from route params + a `GET /contacts` refresh on mount

---

## Phase 4: US2 — Edit Nicknames

> **Goal**: User can set/clear contact nickname and their own nickname per relationship.
> **Test**: Edit contact nickname → name updates in ContactsScreen row and ConversationsScreen row without navigation. Edit my nickname → persists across sessions.

- [X] T009 [US2] Update `apps/server/src/features/contacts/contacts.service.ts` — add `setMyNickname(contactId, userId, myNickname)` function: verify caller is a participant and status is 'accepted', then `UPDATE contacts SET my_nickname = $myNickname WHERE id = contactId`, return updated row
- [X] T010 [P] [US2] Update `apps/server/src/features/contacts/contacts.router.ts` — add `router.put('/:contactId/myNickname', ...)` route calling `setMyNickname`; also add `router.delete('/:contactId', ...)` placeholder (will be implemented in US4) — import both from service
- [X] T011 [P] [US2] Update `apps/mobile/src/features/contacts/ContactProfileScreen.tsx` — wire the "Contact's nickname" tappable row: on press, show `Alert.prompt('Set nickname', '', (text) => handleSaveNickname(text))`, call `api.setNickname(contactId, text || null)`, update local `nickname` state on success; wire "My nickname" row similarly calling `api.setMyNickname`
- [X] T012 [US2] Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — when rendering a conversation row, display `contact.nickname ?? conversation.otherUser.displayName` as the conversation title; ensure `GET /contacts` data is available (load contacts list into a local map keyed by userId on mount)

---

## Phase 5: US3 — Set Relationship Type

> **Goal**: User can switch between Friend and Lover; icon appears in chat header.
> **Test**: Tap relationship badge → picker appears → select Lover → badge updates to ❤️ → open the chat → header subtitle shows ❤️.

- [X] T013 [US3] Update `apps/server/src/features/contacts/contacts.service.ts` — add `setRelationshipType(contactId, userId, relationshipType)`: validate value is 'friend' or 'lover' (throw AppError 400 otherwise), verify caller is participant and status 'accepted', update `contacts.relationship_type`, return updated row
- [X] T014 [P] [US3] Update `apps/server/src/features/contacts/contacts.router.ts` — add `router.put('/:contactId/relationship', ...)` route calling `setRelationshipType`; export new service functions
- [X] T015 [P] [US3] Update `apps/mobile/src/features/contacts/ContactProfileScreen.tsx` — make the relationship badge tappable; on press, show `ActionSheetIOS` (iOS) or `Alert.alert` with two buttons ("💙 Friend" / "❤️ Lover"); on selection call `api.setRelationshipType(contactId, value)` and update local `relationshipType` state
- [X] T016 [US3] Update `apps/mobile/src/features/chat/ChatScreen.tsx` — read `relationshipType` from route params (add to Chat route params in navigation/index.tsx); in the header subtitle or header title area, render a small emoji (💙 or ❤️) next to the contact name; pass `relationshipType` when navigating to Chat from ConversationsScreen and ContactProfileScreen

---

## Phase 6: US4 — Remove Contact

> **Goal**: User can unfriend a contact; both sides lose the contact, chat remains.
> **Test**: Tap "Remove contact" → confirmation dialog → confirm → navigate back to Contacts tab → contact is gone from list; open Chats tab → conversation still visible.

- [X] T017 [US4] Update `apps/server/src/features/contacts/contacts.service.ts` — add `removeContact(contactId, userId)`: verify caller is participant and status is 'accepted', delete the contact record (`DELETE FROM contacts WHERE id = contactId`), return `{ success: true }`
- [X] T018 [P] [US4] Update `apps/server/src/features/contacts/contacts.router.ts` — wire the already-added `router.delete('/:contactId', ...)` to call `removeContact`
- [X] T019 [P] [US4] Update `apps/mobile/src/features/contacts/ContactProfileScreen.tsx` — wire the "Remove contact" action: show `Alert.alert('Remove contact', 'Are you sure?', [{text:'Cancel'}, {text:'Remove', style:'destructive', onPress: handleRemove}])`; on confirm, call `api.removeContact(contactId)`, navigate back to Contacts tab (`navigation.navigate('Home', { screen: 'Contacts' })`), trigger contacts list refresh

---

## Phase 7: US5 — Block Contact

> **Goal**: Blocker no longer sees the contact; blocked person still sees them but can't message.
> **Test**: Block user B → B disappears from A's contacts list. As B, contacts list still shows A. As B, try to send message to A → server returns 403.

- [X] T020 [US5] Update `apps/server/src/features/contacts/contacts.service.ts` — rewrite `blockUser(blockerId, blockedId)`: remove the old delete+insert logic; instead: check `blocked_users` for existing row (idempotent), if not found `INSERT INTO blocked_users (blocker_id, blocked_id)`, return `{ success: true }`; contact record is left unchanged
- [X] T021 [P] [US5] Update `apps/server/src/features/chat/chat.service.ts` — in `sendMessage`: after fetching the conversation, check if a `blocked_users` row exists where `blockerId = recipientId AND blockedId = senderId`; if so throw `AppError(403, 'Cannot send message to this user')`
- [X] T022 [P] [US5] Update `apps/server/src/features/contacts/contacts.service.ts` — in `sendRequest`: add check for `blocked_users` row where `blockerId = addresseeId AND blockedId = requesterId`; if found throw `AppError(403, 'Cannot send request to this user')`
- [X] T023 [US5] Update `apps/mobile/src/features/contacts/ContactProfileScreen.tsx` — wire the "Block" action: show `Alert.alert('Block [name]?', 'They won\'t be able to message you or send contact requests.', [{text:'Cancel'}, {text:'Block', style:'destructive', onPress: handleBlock}])`; on confirm call `api.blockContact(otherUser.id)`, navigate back to Contacts tab, trigger refresh

---

## Phase 8: US6 — Delete Conversation for Me

> **Goal**: User clears their own message history; other party unaffected; conversation row hidden.
> **Test**: Delete conversation for me → conversation disappears from Chats tab. Switch to other user's account → their conversation is still intact.

- [X] T024 [US6] Update `apps/server/src/features/chat/chat.service.ts` — add `deleteConversationForMe(conversationId, userId)`: verify userId is a participant; select all message IDs in the conversation; bulk-insert into `message_deletes` `(message_id, user_id)` for each message using `INSERT ... ON CONFLICT DO NOTHING`; return `{ success: true, deletedCount: n }`
- [X] T025 [P] [US6] Update `apps/server/src/features/chat/chat.router.ts` — add `router.delete('/conversations/:conversationId', ...)`: read `scope` query param; if `scope === 'me'` call `deleteConversationForMe`; return result (scope=everyone handled in T027)
- [X] T026 [US6] Update `apps/mobile/src/features/contacts/ContactProfileScreen.tsx` — wire "Delete conversation for me": show confirmation dialog explaining "This clears your message history only. [Name] won't be affected."; on confirm call `api.deleteConversation(conversationId, 'me')`; emit or dispatch an event to hide this conversation from ConversationsScreen (add a `hiddenConversationIds` set to the notifications store or a dedicated store, and filter in ConversationsScreen)

---

## Phase 9: US7 — Delete Conversation for Everyone

> **Goal**: Both parties' conversation history is removed; socket event notifies the other party in real time.
> **Test**: Delete for everyone → conversation disappears for current user AND for the other user without them refreshing.

- [X] T027 [US7] Update `apps/server/src/features/chat/chat.service.ts` — add `deleteConversationForEveryone(conversationId, userId)`: verify userId is participant; `UPDATE messages SET deleted_for_everyone = true WHERE conversation_id = conversationId`; return `{ success: true, deletedCount: n }` plus both participant IDs for socket emit
- [X] T028 [P] [US7] Update `apps/server/src/features/chat/chat.router.ts` — in the `DELETE /conversations/:conversationId` handler, add the `scope === 'everyone'` branch: call `deleteConversationForEveryone`, then emit `conversation:deleted` Socket.IO event to both participant socket IDs via `getIo()` and `getOnlineUsers()`
- [X] T029 [P] [US7] Update `apps/mobile/src/shared/services/socket.ts` — add listener for `conversation:deleted` event: payload `{ conversationId: string }`; on receipt, add the conversationId to `hiddenConversationIds` in the store (same store used in T026) so ConversationsScreen hides it reactively
- [X] T030 [US7] Update `apps/mobile/src/features/contacts/ContactProfileScreen.tsx` — wire "Delete conversation for everyone": show confirmation dialog with explicit warning "This permanently deletes the conversation for both you and [Name]. This cannot be undone."; on confirm call `api.deleteConversation(conversationId, 'everyone')`; add the conversationId to hiddenConversationIds locally (the socket event handles the other user)

---

## Phase 10: Polish & Cross-Cutting Concerns

> Final wiring: ensure new fields flow through existing screens correctly.

- [X] T031 Update `apps/server/src/features/contacts/contacts.service.ts` — in `getContacts`, add `myNickname: row.myNickname` and `relationshipType: row.relationshipType` to the returned object for each contact so the mobile app receives them
- [X] T032 [P] Add `hiddenConversationIds` set (or array) to `apps/mobile/src/shared/stores/notifications.ts` (or a new `conversationsStore.ts`) with `addHiddenConversation(id)` and `clearHiddenConversation(id)` actions; update `apps/mobile/src/features/chat/ConversationsScreen.tsx` to filter out conversations whose ID is in `hiddenConversationIds`
- [X] T033 [P] Update `apps/mobile/src/features/contacts/ContactsScreen.tsx` — on screen focus (`useFocusEffect`), re-fetch contacts list so changes made in ContactProfileScreen (nickname, unfriend) are reflected immediately without full app reload
- [X] T034 Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — on screen focus (`useFocusEffect`), re-fetch contacts list and build a `contactNicknameMap: Record<userId, string>` from the results; use `contactNicknameMap[conv.otherUser.id] ?? conv.otherUser.displayName` as each conversation row's title
- [X] T035 [P] Update `apps/mobile/src/features/chat/ConversationsScreen.tsx` — when navigating to Chat screen, pass `relationshipType` from `contactNicknameMap` (or a `contactRelationshipMap`) so the chat header icon renders correctly

---

## Dependencies

```
T001 → T002 (migration runs after schema change)
T002 → T006, T020, T021, T022, T024, T027 (server logic depends on migrated schema)
T003 → T004, T005, T008 (types must exist before api calls + navigation + screen)
T006 → (getContacts filter) — needed before T033/T034 to return clean data
T007 → T008 (ContactsScreen taps before screen exists would crash)
T008 → T011, T015, T019, T023, T026, T030 (all profile actions built on top of the screen)
T009 → T010 (service before router)
T013 → T014 (service before router)
T017 → T018 (service before router)
T024 → T025 (service before router)
T025 → T028 (share the same route handler)
T027 → T028 (service before router)
T026 → T032 (needs hiddenConversationIds store)
T029 → T032 (same store)
T032 → T034, T035 (store must exist before ConversationsScreen uses it)
```

---

## Parallel Execution Opportunities

**Server foundational** (T001 → T002 → then these in parallel):
```
T006 (getContacts filter)
T009 + T013 + T017 (service additions — different functions, same file — sequential)
T021 + T022 (chat.service block checks — parallel with contacts service work)
T024 + T027 (conversation delete services — parallel)
```

**Mobile foundational** (T003 → then in parallel):
```
T004 (api.ts calls)
T005 (navigation)
```

**Per user story** (after T008 is done, these are parallel with each other):
```
T011 (US2 nickname UI) || T015 (US3 relationship UI) || T019 (US4 remove UI)
T023 (US5 block UI) || T026 (US6 delete-for-me UI) || T030 (US7 delete-for-everyone UI)
```

---

## Implementation Strategy

**MVP Scope** (US1 + US2 — minimum viable feature):
- T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T031

This gives: tappable contacts, profile screen, nickname editing. Enough to be useful.

**Full delivery order**:
1. Server schema + migration (T001–T002)
2. Mobile foundations (T003–T005) in parallel with server service work
3. Server service additions (T006, T009, T013, T017, T020–T022, T024, T027)
4. Server router additions (T010, T014, T018, T025, T028)
5. Mobile UI — ContactProfileScreen base + ContactsScreen tap (T007–T008)
6. Mobile UI — profile actions per story (T011, T015–T016, T019, T023, T026, T030)
7. Mobile socket + store (T029, T032)
8. Polish (T031, T033–T035)
