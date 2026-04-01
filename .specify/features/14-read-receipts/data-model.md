# Data Model: Read Receipts UI

**Branch**: `14-read-receipts` | **Date**: 2026-04-01

## No Schema Changes Required

All required data structures already exist. No new tables, columns, or migrations needed.

## Existing Status Field

### Message.status (runtime)

The `status` field on the `Message` type carries the server-side delivery status.

| Value | Meaning | When set |
|-------|---------|----------|
| `null` | No server status yet (outbox or just sent) | Initial state |
| `'sent'` | Server confirmed receipt | After server ACK |
| `'delivered'` | Recipient device received the message | Via `messages:status` Socket.IO event |
| `'seen'` | Recipient opened and read the message | Via `messages:status` Socket.IO event |

### LocalMessageRow.sync_status (SQLite)

Tracks the local outbox state. Separate from `status`.

| Value | Meaning |
|-------|---------|
| `'pending'` | In outbox, not yet sent to server |
| `'sent'` | Server confirmed |
| `'delivered'` | Delivered to recipient |
| `'read'` | Read by recipient |
| `'failed'` | Send failed |

## Status State Machine

```
null / pending
    │
    ▼ server ACK
  'sent'
    │
    ▼ messages:status { status: 'delivered' }
 'delivered'
    │
    ▼ messages:status { status: 'seen' / 'read' }
  'seen'   ← terminal state (regression guard prevents going back)
```

## Regression Guard Logic

```
const STATUS_ORDER = ['sent', 'delivered', 'seen']

function canUpdate(current: string, next: string): boolean {
  return STATUS_ORDER.indexOf(next) > STATUS_ORDER.indexOf(current)
}
```

Applied in both `onMessageStatus` handlers before updating state.

## Display Mapping

| status value | ChatScreen label | ConversationsScreen label |
|---|---|---|
| pending / null | "Sending..." (localStatus) | — |
| 'sent' | "Sent" | "Sent" (small gray text) ← **new** |
| 'delivered' | "Delivered" | "Delivered" (small gray text) ← **new** |
| 'seen' / 'read' | "Seen" | Avatar icon (existing) |
