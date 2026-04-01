# Implementation Plan: Message Actions

**Feature**: 02 — Message Actions
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-25
**Status**: Ready to implement

---

## Summary

All server-side code already exists. This is a pure mobile (React Native) implementation. Three new components are created, ChatScreen is significantly extended. One new package (`expo-clipboard`) is needed.

**New files**: 3 components
**Modified files**: 1 screen (`ChatScreen.tsx`)
**New packages**: `expo-clipboard`
**Server changes**: None

---

## Technical Context

| Concern | Decision |
|---------|----------|
| Clipboard | `expo-clipboard` — `Clipboard.setStringAsync(text)` |
| Long-press trigger | `onLongPress` prop on `TouchableOpacity`, `delayLongPress: 400` |
| Swipe-to-reply | `PanResponder` per message row, horizontal threshold 40px |
| Action menu | Transparent `Modal` + absolute positioned card with Animated scale-in |
| Forward picker | `Modal` FlatList reusing conversation API |
| Edit mode | Input pre-fill + "Editing" bar above input |
| Scroll-to-reply | `FlatList.scrollToItem` via ref, silent no-op if not found |
| Time windows | Client gates (UX) + server enforces (authoritative) |
| Real-time | Existing `message:edited` / `message:deleted` socket events — no changes |

---

## File Structure

```
apps/mobile/src/features/chat/
├── ChatScreen.tsx                    ← MODIFY (significant changes)
├── ConversationsScreen.tsx           ← unchanged
└── components/                       ← NEW folder
    ├── MessageActionMenu.tsx          ← NEW
    ← ReplyPreviewBar.tsx              ← NEW
    └── ForwardModal.tsx               ← NEW
```

---

## Implementation Order

### Step 1: Install expo-clipboard

```
npx expo install expo-clipboard
```

Add to `apps/mobile/package.json` dependencies.

### Step 2: MessageActionMenu component

**Props**: `message`, `currentUserId`, `visible`, `messageY`, `onClose`, + 7 action callbacks

**Key logic**:
```typescript
// Time window helpers (pure functions, export for testing)
export function canEdit(message: Message, currentUserId: string): boolean {
  return message.senderId === currentUserId
    && message.type === 'text'
    && Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000;
}

export function canDeleteForEveryone(message: Message, currentUserId: string): boolean {
  return message.senderId === currentUserId
    && Date.now() - new Date(message.createdAt).getTime() < 60 * 60 * 1000;
}
```

**Rendered items** (conditional):
```
React        — always (placeholder, closes menu, wired in Spec 03)
Reply        — always
Copy         — message.type === 'text' && message.content !== null
Forward      — always
Edit         — canEdit(message, currentUserId)
Delete for me— message.senderId === currentUserId
Delete for everyone — canDeleteForEveryone(message, currentUserId)
```

**Animation**:
```typescript
const scaleAnim = useRef(new Animated.Value(0.85)).current;
const opacityAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (visible) {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }
}, [visible]);
```

### Step 3: ReplyPreviewBar component

Simple presentational component. Left colored border + sender name + content truncated to 50 chars + × button.

```typescript
const preview = replyingTo.deletedForEveryone
  ? 'Message deleted'
  : (replyingTo.content ?? '').slice(0, 50) + ((replyingTo.content?.length ?? 0) > 50 ? '…' : '');
```

### Step 4: ForwardModal component

Modal with FlatList. Fetches conversations on mount (`api.get('/chat/conversations')`). Tap row → call `onForward(conversation.id)`. Shows `ConversationSkeleton` while loading.

### Step 5: ChatScreen — state and action handlers

**New state**:
```typescript
const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
const [selectedMessageY, setSelectedMessageY] = useState(0);
const [replyingTo, setReplyingTo] = useState<Message | null>(null);
const [editingMessage, setEditingMessage] = useState<Message | null>(null);
const [showForwardModal, setShowForwardModal] = useState(false);
```

**Action handlers**:

```typescript
// Copy
async function handleCopy() {
  if (!selectedMessage?.content) return;
  await Clipboard.setStringAsync(selectedMessage.content);
  showToast('success', 'Copied to clipboard');
  setSelectedMessage(null);
}

// Edit — enter edit mode
function handleEditStart() {
  setEditingMessage(selectedMessage);
  setText(selectedMessage?.content ?? '');
  setSelectedMessage(null);
}

// Edit — save
async function handleEditSave() {
  if (!editingMessage || !text.trim()) return;
  try {
    await api.put(`/chat/messages/${editingMessage.id}`, { content: text.trim() });
    setMessages(prev => prev.map(m =>
      m.id === editingMessage.id ? { ...m, content: text.trim(), editedAt: new Date().toISOString() } : m
    ));
    setEditingMessage(null);
    setText('');
  } catch (err: any) {
    showToast('error', err.response?.data?.error ?? 'Failed to edit message');
  }
}

// Delete for me
function handleDeleteForMe() {
  setMessages(prev => prev.filter(m => m.id !== selectedMessage?.id));
  setSelectedMessage(null);
}

// Delete for everyone
async function handleDeleteForEveryone() {
  // Show Alert.alert confirmation (this is an action dialog, not an error)
  Alert.alert('Delete for everyone?', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await api.delete(`/chat/messages/${selectedMessage!.id}/everyone`);
          setMessages(prev => prev.map(m =>
            m.id === selectedMessage!.id
              ? { ...m, deletedForEveryone: true, content: null }
              : m
          ));
        } catch (err: any) {
          showToast('error', err.response?.data?.error ?? 'Failed to delete');
        }
        setSelectedMessage(null);
      }
    }
  ]);
}

// Forward
async function handleForward(conversationId: string) {
  if (!selectedMessage?.content) return;
  try {
    const socket = getSocket();
    socket?.emit('message:send', {
      conversationId,
      type: 'text',
      content: selectedMessage.content,
      forwardedFromId: selectedMessage.id,
    }, () => {});
    showToast('success', 'Message forwarded');
  } catch {
    showToast('error', 'Failed to forward message');
  }
  setShowForwardModal(false);
  setSelectedMessage(null);
}
```

**Swipe-to-reply on each message row**:
```typescript
function createSwipeResponder(message: Message) {
  let startX = 0;
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      Math.abs(dx) > Math.abs(dy) && dx > 5,   // horizontal only, rightward
    onPanResponderGrant: (_, { x0 }) => { startX = x0; },
    onPanResponderMove: (_, { dx, dy }) => {
      // Only allow rightward, and abort if vertical component takes over
      if (dx < 0 || Math.abs(dy) > Math.abs(dx)) return;
      // Translate message (capped at 60px) — update via Animated.Value ref
    },
    onPanResponderRelease: (_, { dx, vx }) => {
      if (dx > 40 || vx > 0.5) {
        setReplyingTo(message);
      }
      // Snap back to 0
    },
  });
}
```

**Input bar changes**:
```typescript
// Above input bar, conditionally render:
{replyingTo && (
  <ReplyPreviewBar
    replyingTo={replyingTo}
    senderName={replyingTo.senderId === currentUser?.id ? 'You' : otherUser.displayName}
    onCancel={() => setReplyingTo(null)}
  />
)}
{editingMessage && (
  <EditingBar onCancel={() => { setEditingMessage(null); setText(''); }} />
)}
```

**Modified `handleSend`**:
```typescript
// Include replyToId or editedMessage handling
if (editingMessage) {
  await handleEditSave();
  return;
}
socket.emit('message:send', {
  conversationId,
  type: 'text',
  content: text.trim(),
  replyToId: replyingTo?.id ?? null,
}, callback);
setReplyingTo(null);  // clear reply mode after send
```

**Reply bubble in renderMessage**:
```typescript
{item.replyTo && !item.deletedForEveryone && (
  <TouchableOpacity onPress={() => scrollToMessage(item.replyToId)}>
    <View style={styles.replyBubble}>
      <Text style={styles.replyName}>
        {item.replyTo.senderId === currentUser?.id ? 'You' : otherUser.displayName}
      </Text>
      <Text style={styles.replyContent} numberOfLines={1}>
        {item.replyTo.deletedForEveryone ? 'Message deleted' : item.replyTo.content}
      </Text>
    </View>
  </TouchableOpacity>
)}
```

**Scroll to original**:
```typescript
function scrollToMessage(messageId: string | null) {
  if (!messageId) return;
  const target = messages.find(m => m.id === messageId);
  if (!target || !flatListRef.current) return;
  flatListRef.current.scrollToItem({ item: target, animated: true });
}
```

---

## Package Addition

```json
// apps/mobile/package.json — add to dependencies:
"expo-clipboard": "~7.0.0"
```

Install with: `npx expo install expo-clipboard`

---

## Constitution Compliance

| Principle | Check |
|-----------|-------|
| Syria Accessibility | ✅ `expo-clipboard` is open source, no external service |
| Offline-First | ✅ "Delete for me" works offline; edit/delete-for-everyone show error toast if offline |
| TypeScript Everywhere | ✅ All strict TypeScript, `canEdit`/`canDeleteForEveryone` are typed helpers |
| Feature-Based Architecture | ✅ New folder `features/chat/components/` — self-contained |
| Messenger-Identical UX | ✅ Long-press menu, swipe reply, edit mode, quoted bubbles all match Messenger |
| Incremental Module Delivery | ✅ All 6 actions complete; "React" is placeholder until Spec 03 |
