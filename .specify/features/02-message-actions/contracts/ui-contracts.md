# UI Contracts: Message Actions

**Feature**: 02 — Message Actions
**Date**: 2026-03-25

---

## Component: MessageActionMenu

**File**: `apps/mobile/src/features/chat/components/MessageActionMenu.tsx`

**Props**:
```typescript
interface MessageActionMenuProps {
  message: Message;
  currentUserId: string;
  visible: boolean;
  messageY: number;          // Y position of message on screen (for auto-positioning)
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onEdit: () => void;        // only called if canEdit(message)
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onReact: () => void;       // Spec 03 placeholder — closes menu
}
```

**Behavior**:
- Renders as a `Modal` with `transparent={true}`
- Backdrop: `rgba(0,0,0,0.5)` full-screen TouchableOpacity that calls `onClose`
- Menu card: white background, `borderRadius: 12`, shadow, `minWidth: 180`
- Auto-position: if `messageY > screenHeight / 2` → menu appears above message; else below
- Action items shown/hidden based on `canEdit`, `canDeleteForEveryone`, `message.senderId`, `message.type`
- Action order: React, Reply, Copy, Forward, Edit, Delete for me, Delete for everyone
- Destructive actions (Delete for me, Delete for everyone) styled with `colors.red`
- Animate in: scale from 0.8 to 1.0 + opacity 0 to 1 over 150ms on open

---

## Component: ReplyPreviewBar

**File**: `apps/mobile/src/features/chat/components/ReplyPreviewBar.tsx`

**Props**:
```typescript
interface ReplyPreviewBarProps {
  replyingTo: Message;
  senderName: string;        // Display name of the original sender
  onCancel: () => void;
}
```

**Behavior**:
- Rendered above the message input bar when `replyingTo` is set
- Left colored border (4px, `colors.primary`)
- Left section: sender name (bold, 12px) + truncated content (max 50 chars, 12px gray)
- Right: × icon button calling `onCancel`
- Height: ~52px, white background, thin top border

---

## Component: ForwardModal

**File**: `apps/mobile/src/features/chat/components/ForwardModal.tsx`

**Props**:
```typescript
interface ForwardModalProps {
  visible: boolean;
  message: Message;
  onClose: () => void;
  onForward: (conversationId: string) => void;
}
```

**Behavior**:
- Full-screen modal with white background
- Header: "Forward to" title + × close button
- Body: FlatList of conversations (fetched fresh on open)
- Each row: Avatar + displayName + last message preview
- Tap a row → call `onForward(conversationId)` → close modal
- Loading state: show `ConversationSkeleton` (already built in Spec 01)

---

## ChatScreen State Extensions

**File**: `apps/mobile/src/features/chat/ChatScreen.tsx`

New state added to existing ChatScreen:

```typescript
const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
const [replyingTo, setReplyingTo] = useState<Message | null>(null);
const [editingMessage, setEditingMessage] = useState<Message | null>(null);
const [showForwardModal, setShowForwardModal] = useState(false);
```

**Message row changes**:
- Each message row wrapped to capture `onLongPress` → sets `selectedMessage` + stores message Y position
- Each message row wrapped in a `PanResponder` for horizontal swipe detection

---

## Server API Contracts (existing endpoints)

| Action | Method | URL | Body |
|--------|--------|-----|------|
| Edit message | PUT | `/api/chat/messages/:messageId` | `{ content: string }` |
| Delete for me | DELETE | `/api/chat/messages/:messageId` | — |
| Delete for everyone | DELETE | `/api/chat/messages/:messageId/everyone` | — |
| Forward (send new) | POST | `/api/chat/conversations/:conversationId/messages` | `{ type: 'text', content, forwardedFromId }` |

**All endpoints require**: `Authorization: Bearer <token>` header

---

## Socket Events (existing — no changes)

| Event (inbound) | Payload | Handler |
|-----------------|---------|---------|
| `message:edited` | `{ message, conversationId }` | Update message in list |
| `message:deleted` | `{ messageId, conversationId }` | Mark `deletedForEveryone: true` in list |

These are already handled in ChatScreen. No new socket events needed.
