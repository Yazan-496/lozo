# Data Model: Contacts Enhancement

**Feature**: 09 — Contacts Enhancement
**Date**: 2026-03-26

---

## Modified Table: `contacts`

Add two columns. All existing columns and indexes are unchanged.

```sql
ALTER TABLE contacts
  ADD COLUMN my_nickname VARCHAR(100),
  ADD COLUMN relationship_type VARCHAR(10) NOT NULL DEFAULT 'friend';
```

### Drizzle schema change (schema.ts)

```typescript
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  requesterId: uuid('requester_id').notNull().references(() => users.id),
  addresseeId: uuid('addressee_id').notNull().references(() => users.id),
  status: contactStatusEnum('status').notNull().default('pending'),
  nickname: varchar('nickname', { length: 100 }),
  myNickname: varchar('my_nickname', { length: 100 }),            // NEW
  relationshipType: varchar('relationship_type', { length: 10 })  // NEW
    .notNull().default('friend'),
  isMuted: boolean('is_muted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_contact_pair').on(table.requesterId, table.addresseeId),
]);
```

**Validation**: `relationshipType` must be one of `['friend', 'lover']` — enforced at service layer.

---

## New Table: `blocked_users`

Tracks one-sided blocks. Separate from contacts so the blocked person's contact record is untouched.

```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);
```

### Drizzle schema (schema.ts)

```typescript
export const blockedUsers = pgTable('blocked_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  blockerId: uuid('blocker_id').notNull().references(() => users.id),
  blockedId: uuid('blocked_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_block_pair').on(table.blockerId, table.blockedId),
]);
```

---

## Unchanged Tables

| Table | Why unchanged |
|---|---|
| `users` | No new user-level fields needed |
| `conversations` | Conversation-level delete is handled via bulk message operations |
| `messages` | `deletedForEveryone` and `messageDeletes` already support what we need |
| `message_deletes` | Reused as-is for "delete conversation for me" |
| `message_reactions` | Not touched |
| `message_statuses` | Not touched |

---

## State Transitions

### Contact Relationship Lifecycle

```
[none] → pending → accepted → [deleted via unfriend]
                ↘ rejected (deleted)
accepted → blocked (insert into blocked_users, contact record stays as 'accepted')
```

### Block Semantics
- Block does NOT change `contacts.status`
- Block inserts `{ blockerId, blockedId }` into `blocked_users`
- `getContacts` for the blocker excludes entries where `blocked_users` row exists with `blockerId = self`
- `getContacts` for the blocked person includes the contact normally (they still see the blocker)
- `sendMessage` and `sendRequest` reject when `blocked_users` row exists where `blockerId = recipient, blockedId = sender`

---

## Entity Relationships Diagram

```
users ──< contacts >── users
           │
           ├── nickname (what I call the other person)
           ├── myNickname (what I want to be called by them)
           └── relationshipType (friend | lover)

users ──< blocked_users >── users
           └── one-sided: blocker → blocked
```
