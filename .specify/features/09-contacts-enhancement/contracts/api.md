# API Contracts: Contacts Enhancement

**Base URL**: `/api` (all routes require `Authorization: Bearer <jwt>`)

---

## Contacts API

### GET /contacts
*Existing — returns accepted contacts. Updated to include new fields.*

**Response** (array):
```json
[
  {
    "contactId": "uuid",
    "nickname": "string | null",
    "myNickname": "string | null",
    "relationshipType": "friend | lover",
    "isMuted": false,
    "user": {
      "id": "uuid",
      "username": "string",
      "displayName": "string",
      "avatarUrl": "string | null",
      "avatarColor": "#RRGGBB",
      "bio": "string",
      "isOnline": true,
      "lastSeenAt": "ISO8601"
    },
    "since": "ISO8601"
  }
]
```

---

### PUT /contacts/:contactId/nickname
*Existing — set contact nickname (what I call them).*

**Body**: `{ "nickname": "string | null" }`
**Response**: updated contact row

---

### PUT /contacts/:contactId/myNickname  ← NEW
*Set "my nickname" — how I appear in this contact's chat list.*

**Body**: `{ "myNickname": "string | null" }`
**Response**: updated contact row
**Errors**:
- 404 if contact not found
- 403 if caller is not a participant in this contact record
- 400 if contact status is not 'accepted'

---

### PUT /contacts/:contactId/relationship  ← NEW
*Set relationship type.*

**Body**: `{ "relationshipType": "friend | lover" }`
**Response**: updated contact row
**Errors**:
- 400 if `relationshipType` is not 'friend' or 'lover'
- 404 / 403 as above

---

### DELETE /contacts/:contactId  ← NEW
*Remove contact (unfriend). Symmetric — removes from both sides.*

**Response**: `{ "success": true }`
**Errors**:
- 404 if contact not found
- 403 if caller is not a participant
- 400 if contact status is not 'accepted'

---

### POST /contacts/block/:userId  ← MODIFIED
*Block a user. One-sided: inserts into blocked_users; contact record stays as 'accepted' for the blocked person.*

**Response**: `{ "success": true }`
**Changed behavior**:
- Before: deleted both contact records, inserted 'blocked' status record
- After: inserts into `blocked_users` table only; contact record unchanged
- Idempotent: if already blocked, returns 200
**Errors**:
- 400 if trying to block yourself

---

## Chat API

### DELETE /chat/conversations/:conversationId  ← NEW
*Delete a conversation. Scope determines who is affected.*

**Query param**: `scope` — required, must be `"me"` or `"everyone"`

**scope=me**:
- Inserts a `message_deletes` row for every message in the conversation (bulk delete-for-me)
- The conversation is hidden from the caller's list (no new `messageDeletes` record needed for conversation — hide via: all messages are deleted-for-me)
- The other participant is unaffected
- Response: `{ "success": true, "deletedCount": 42 }`

**scope=everyone**:
- Sets `deleted_for_everyone = true` on all messages in the conversation
- Emits `conversation:deleted` Socket.IO event to both participants
- Response: `{ "success": true, "deletedCount": 42 }`

**Errors**:
- 400 if `scope` is missing or invalid
- 403 if caller is not a participant in the conversation
- 404 if conversation not found

---

## Socket.IO Events

### `conversation:deleted` (server → client)  ← NEW
*Emitted to both participants when a conversation is deleted for everyone.*

**Payload**:
```json
{
  "conversationId": "uuid"
}
```

**Client action**: Remove the conversation from the local list and clear any cached messages for that conversationId.
