# Implementation Plan: Contacts Enhancement

**Feature**: 09 — Contacts Enhancement
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-26
**Status**: Ready to implement

---

## Summary

Server gets 2 new columns + 1 new table + 3 new endpoints + 1 modified endpoint.
Mobile gets 1 new screen (`ContactProfileScreen`) + updates to ContactsScreen, ConversationsScreen, types, and API service.

**New server files**: none (all changes in existing files + migration)
**Modified server files**: `schema.ts`, `contacts.service.ts`, `contacts.router.ts`, `chat.service.ts`, `chat.router.ts`
**New mobile files**: `ContactProfileScreen.tsx`
**Modified mobile files**: `types/index.ts`, `api.ts`, `ContactsScreen.tsx`, `ConversationsScreen.tsx`, `navigation/index.tsx`
**New packages**: none

---

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| Syria Accessibility | ✅ Pass | No new external services |
| Offline-First Messaging | ✅ Pass | Delete-for-me clears local SQLite too (handled by existing message delete flow) |
| TypeScript Everywhere | ✅ Pass | All new code in TypeScript strict |
| Feature-Based Architecture | ✅ Pass | ContactProfileScreen lives in `features/contacts/` |
| Messenger-Identical UX | ✅ Pass | Nicknames + relationship labels match Messenger behavior |
| Incremental Module Delivery | ✅ Pass | Each user story is independently testable |

---

## Technical Context

| Concern | Decision |
|---|---|
| Block storage | Separate `blocked_users` table (one-sided block, contact record preserved) |
| myNickname storage | New `my_nickname` column on `contacts` table |
| Relationship type | New `relationship_type varchar(10)` column on `contacts` table |
| Conversation delete | Bulk-apply existing message-delete mechanisms |
| ContactProfileScreen navigation | MainStack route with `contactId` + `otherUser` params |
| Nickname propagation | ContactsScreen and ConversationsScreen re-fetch on focus |

---

## File Structure

```
apps/server/src/
├── shared/db/
│   └── schema.ts                          ← MODIFY (add columns + blockedUsers table)
├── features/contacts/
│   ├── contacts.service.ts                ← MODIFY (new functions + modify blockUser)
│   └── contacts.router.ts                 ← MODIFY (new routes)
└── features/chat/
    ├── chat.service.ts                    ← MODIFY (deleteConversationForMe, deleteConversationForEveryone)
    └── chat.router.ts                     ← MODIFY (new DELETE /conversations/:id route)

apps/mobile/src/
├── shared/
│   ├── types/index.ts                     ← MODIFY (add myNickname, relationshipType to Contact)
│   └── services/api.ts                    ← MODIFY (new API calls)
├── features/contacts/
│   ├── ContactsScreen.tsx                 ← MODIFY (tappable rows → navigate to profile)
│   └── ContactProfileScreen.tsx           ← NEW
└── navigation/index.tsx                   ← MODIFY (add ContactProfile to MainStack)
```

---

## Step-by-Step Implementation

### Step 1: Server — Schema Changes

**File**: `apps/server/src/shared/db/schema.ts`

Add `myNickname` and `relationshipType` to the `contacts` table, and add the new `blockedUsers` table:

```typescript
// In contacts table definition, after `nickname`:
myNickname: varchar('my_nickname', { length: 100 }),
relationshipType: varchar('relationship_type', { length: 10 }).notNull().default('friend'),

// New table after contacts:
export const blockedUsers = pgTable('blocked_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  blockerId: uuid('blocker_id').notNull().references(() => users.id),
  blockedId: uuid('blocked_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_block_pair').on(table.blockerId, table.blockedId),
]);
```

Then run:
```bash
cd apps/server && npx drizzle-kit generate && npx drizzle-kit migrate
```

---

### Step 2: Server — contacts.service.ts

**New imports**: add `blockedUsers` to schema import, add `notExists`, `sql` from drizzle-orm.

**Modify `blockUser`**:
```typescript
export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new AppError(400, 'Cannot block yourself');

  // Idempotent: if already blocked, just return success
  const existing = await db.select().from(blockedUsers)
    .where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(blockedUsers).values({ blockerId, blockedId });
  }

  return { success: true };
}
```

**Modify `getContacts`** — exclude blocked users from the blocker's view:
```typescript
// After fetching rows, filter out contacts the user has blocked
// Add a check: for each row, if a blockedUsers entry exists where
// blockerId = userId AND blockedId = otherUserId → exclude that row
```

Efficient approach: join with blockedUsers in the query using `notExists` subquery.

**Add `setMyNickname`**:
```typescript
export async function setMyNickname(contactId: string, userId: string, myNickname: string | null) {
  // Same auth checks as setNickname
  // Update contacts.myNickname
}
```

**Add `setRelationshipType`**:
```typescript
export async function setRelationshipType(contactId: string, userId: string, relationshipType: string) {
  if (!['friend', 'lover'].includes(relationshipType)) {
    throw new AppError(400, 'relationshipType must be friend or lover');
  }
  // Same auth checks, update contacts.relationshipType
}
```

**Add `removeContact`**:
```typescript
export async function removeContact(contactId: string, userId: string) {
  // Verify caller is a participant, status === 'accepted'
  // Delete the contact record
  return { success: true };
}
```

---

### Step 3: Server — contacts.router.ts

Add three new routes:

```typescript
router.put('/:contactId/myNickname', async (req, res, next) => { ... });
router.put('/:contactId/relationship', async (req, res, next) => { ... });
router.delete('/:contactId', async (req, res, next) => { ... });
```

---

### Step 4: Server — chat.service.ts

**Add `deleteConversationForMe`**:
```typescript
export async function deleteConversationForMe(conversationId: string, userId: string) {
  // Verify userId is participant in conversation
  // Select all message ids in conversation
  // Bulk-insert into messageDeletes for each messageId + userId
  // (use INSERT ... ON CONFLICT DO NOTHING for idempotency)
  return { success: true, deletedCount: n };
}
```

**Add `deleteConversationForEveryone`**:
```typescript
export async function deleteConversationForEveryone(conversationId: string, userId: string) {
  // Verify userId is participant
  // UPDATE messages SET deleted_for_everyone = true WHERE conversation_id = conversationId
  return { success: true, deletedCount: n };
}
```

---

### Step 5: Server — chat.router.ts

```typescript
router.delete('/conversations/:conversationId', async (req, res, next) => {
  const { scope } = req.query;
  if (scope !== 'me' && scope !== 'everyone') {
    throw new AppError(400, 'scope must be "me" or "everyone"');
  }
  if (scope === 'me') {
    const result = await deleteConversationForMe(req.params.conversationId, req.user!.userId);
    res.json(result);
  } else {
    const result = await deleteConversationForEveryone(req.params.conversationId, req.user!.userId);
    // Emit socket event to both participants
    const io = getIo();
    // ... emit conversation:deleted to both participant sockets
    res.json(result);
  }
});
```

---

### Step 6: Mobile — Types

**File**: `apps/mobile/src/shared/types/index.ts`

Update the `Contact` type returned by `GET /contacts`:
```typescript
export interface Contact {
  contactId: string;
  nickname: string | null;
  myNickname: string | null;       // NEW
  relationshipType: 'friend' | 'lover';  // NEW
  isMuted: boolean;
  user: User;
  since: string;
}
```

---

### Step 7: Mobile — api.ts

Add new API functions:

```typescript
setMyNickname: (contactId: string, myNickname: string | null) =>
  api.put(`/contacts/${contactId}/myNickname`, { myNickname }),

setRelationshipType: (contactId: string, relationshipType: 'friend' | 'lover') =>
  api.put(`/contacts/${contactId}/relationship`, { relationshipType }),

removeContact: (contactId: string) =>
  api.delete(`/contacts/${contactId}`),

blockContact: (userId: string) =>
  api.post(`/contacts/block/${userId}`),

deleteConversation: (conversationId: string, scope: 'me' | 'everyone') =>
  api.delete(`/chat/conversations/${conversationId}`, { params: { scope } }),
```

---

### Step 8: Mobile — Navigation

**File**: `apps/mobile/src/navigation/index.tsx`

Add `ContactProfile` to `MainStack`:
```typescript
<MainStack.Screen
  name="ContactProfile"
  component={ContactProfileScreen}
  options={{
    title: '',
    headerBackTitle: '',
    headerStyle: { backgroundColor: colors.bg },
    headerShadowVisible: false,
    headerTintColor: colors.primary,
  }}
/>
```

Add to navigation types (RootStackParamList):
```typescript
ContactProfile: {
  contactId: string;
  otherUser: User;
  conversationId?: string;  // optional — for delete conversation actions
};
```

---

### Step 9: Mobile — ContactsScreen.tsx

Make each contact row tappable:
```typescript
onPress={() => navigation.navigate('ContactProfile', {
  contactId: item.contactId,
  otherUser: item.user,
  conversationId: undefined,  // fetched lazily in ContactProfileScreen if needed
})}
```

Display nickname instead of displayName where nickname is set:
```typescript
const displayLabel = item.nickname ?? item.user.displayName;
```

---

### Step 10: Mobile — ContactProfileScreen.tsx (NEW)

**File**: `apps/mobile/src/features/contacts/ContactProfileScreen.tsx`

Sections:
1. **Header**: Large avatar, display name (nickname if set), username handle, online/last-seen status
2. **Relationship label badge**: shows current type (Friend 💙 / Lover ❤️) — tappable to change
3. **Nicknames section**:
   - "Contact's nickname" row — current value, tappable → opens inline edit (TextInput in an Alert or inline)
   - "My nickname" row — current value, tappable → same inline edit
4. **Actions section** (destructive actions at bottom):
   - "Delete conversation for me"
   - "Delete conversation for everyone"
   - "Remove contact" (unfriend)
   - "Block"
5. Confirmation dialogs for all destructive actions using `Alert.alert`

**State**:
```typescript
const [contact, setContact] = useState<Contact>(/* from route params + GET /contacts */);
const [loading, setLoading] = useState(false);
```

**On nickname save**: call `api.setNickname` or `api.setMyNickname`, update local state, trigger ConversationsScreen/ContactsScreen refresh via navigation event or store invalidation.

**Style**: `makeStyles(colors)` pattern, Messenger-style layout.

---

### Step 11: Mobile — ConversationsScreen.tsx

- Display contact nickname (if set) instead of `displayName` in conversation rows
- Handle `conversation:deleted` socket event → remove the conversation from local list

---

## Socket.IO: conversation:deleted

Add listener in `chat.socket.ts` (server): after bulk delete-for-everyone, emit to both participant socket IDs.

Add listener in mobile `socket.ts`: on `conversation:deleted`, update ConversationsScreen store / trigger refetch.

---

## Relationship Badge in ChatScreen Header

Per US3 (spec note: "Relationship appears in chat screen also as icon"):
- ChatScreen header subtitle shows a small emoji: 💙 for Friend, ❤️ for Lover
- This data flows from `getContacts` through the navigation params when opening a chat
- No extra API call needed — just pass `relationshipType` alongside `otherUser` in Chat route params

---

## Drizzle Migration Command

```bash
cd apps/server
npx drizzle-kit generate
npx drizzle-kit migrate
```

This generates and applies the migration for `my_nickname`, `relationship_type`, and `blocked_users`.
