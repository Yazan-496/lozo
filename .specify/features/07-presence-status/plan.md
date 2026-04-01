# Implementation Plan: Presence & Status

**Feature**: 07 — Presence & Status
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-26
**Status**: Ready to implement

---

## Summary

Mostly mobile-only. One small server change (add `status` to `lastMessage` in conversations list). Core work is: create 1 store, 1 utility, 1 component, wire socket listeners globally, update 3 screens.

**New files**: `usePresenceStore`, `getPresenceString` util, `TypingIndicator` component
**Modified files**: `socket.ts`, `ChatScreen.tsx`, `ConversationsScreen.tsx`, `ContactsScreen.tsx`, `types/index.ts`
**Server changes**: Add `status` field to `lastMessage` in `GET /chat/conversations`
**New packages**: None

---

## Technical Context

| Concern | Decision |
|---------|----------|
| Presence state | Zustand store (`usePresenceStore`) — `onlineUserIds: Set<string>`, `lastSeenMap: Record<string, string>` |
| Socket listener placement | Inside `connectSocket()` in `socket.ts` — active for full session lifetime |
| Typing indicator | `TypingIndicator` component as `ListFooterComponent` of FlatList |
| Typing animation | `Animated.sequence + Animated.loop`, 3 dots staggered 150ms each |
| Presence string | Pure utility `getPresenceString(isOnline, lastSeenAt)` in `shared/utils/presence.ts` |
| Real-time online dots | Screens read `usePresenceStore` — Zustand triggers re-render automatically |
| Read receipt server data | Add `status` to `lastMessage` select in `chat.service.ts` getConversations |
| Read receipt real-time | `messages:status` socket listener in ConversationsScreen (updates local state) |
| Read receipt avatar | Render `Avatar` size=14 instead of `unreadBadge` when `lastMessage.status === 'read'` AND `lastMessage.senderId === currentUser.id` |

---

## File Structure

```
apps/mobile/src/
├── shared/
│   ├── stores/
│   │   ├── auth.ts                          ← unchanged
│   │   └── presence.ts                      ← NEW
│   ├── utils/
│   │   ├── theme.ts                         ← unchanged
│   │   └── presence.ts                      ← NEW
│   ├── services/
│   │   └── socket.ts                        ← MODIFY (add presence listeners)
│   └── types/
│       └── index.ts                         ← MODIFY (add status to lastMessage)
├── features/
│   ├── chat/
│   │   ├── ChatScreen.tsx                   ← MODIFY (header + typing indicator)
│   │   ├── ConversationsScreen.tsx          ← MODIFY (real-time dots + read receipt)
│   │   └── components/
│   │       └── TypingIndicator.tsx          ← NEW
│   └── contacts/
│       └── ContactsScreen.tsx               ← MODIFY (real-time online status text)

apps/server/src/features/chat/
└── chat.service.ts                          ← MODIFY (add status to lastMessage)
```

---

## Step-by-Step Implementation

### Step 1: Types Update

**File**: `apps/mobile/src/shared/types/index.ts`

Add `status` field to `Conversation.lastMessage`:

```typescript
export interface Conversation {
  id: string;
  otherUser: User;
  lastMessage: {
    id: string;
    senderId: string;
    type: string;
    content: string | null;
    isForwarded: boolean;
    deletedForEveryone: boolean;
    createdAt: string;
    status: 'sent' | 'delivered' | 'read' | null;  // ← ADD
  } | null;
  unreadCount: number;
  updatedAt: string;
}
```

---

### Step 2: Presence Utility

**File**: `apps/mobile/src/shared/utils/presence.ts`

```typescript
export function getPresenceString(isOnline: boolean, lastSeenAt: string): string {
  if (isOnline) return 'Active now';
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Active now';
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  return `Active ${days}d ago`;
}
```

---

### Step 3: Presence Store

**File**: `apps/mobile/src/shared/stores/presence.ts`

```typescript
import { create } from 'zustand';

interface PresenceState {
  onlineUserIds: Set<string>;
  lastSeenMap: Record<string, string>; // userId → ISO string
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeenAt: string) => void;
  seedOnline: (userIds: string[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: new Set(),
  lastSeenMap: {},

  setOnline: (userId) =>
    set((s) => ({ onlineUserIds: new Set([...s.onlineUserIds, userId]) })),

  setOffline: (userId, lastSeenAt) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next, lastSeenMap: { ...s.lastSeenMap, [userId]: lastSeenAt } };
    }),

  seedOnline: (userIds) =>
    set({ onlineUserIds: new Set(userIds) }),
}));
```

---

### Step 4: Socket — Wire Presence Listeners

**File**: `apps/mobile/src/shared/services/socket.ts`

Import `usePresenceStore` and add listeners inside `connectSocket()`, right after the existing `connect_error` handler:

```typescript
import { usePresenceStore } from '../stores/presence';

// Inside connectSocket(), after existing handlers:
socket.on('user:online', ({ userId }: { userId: string }) => {
  usePresenceStore.getState().setOnline(userId);
});

socket.on('user:offline', ({ userId, lastSeenAt }: { userId: string; lastSeenAt: string }) => {
  usePresenceStore.getState().setOffline(userId, lastSeenAt);
});
```

---

### Step 5: TypingIndicator Component

**File**: `apps/mobile/src/features/chat/components/TypingIndicator.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../../../shared/utils/theme';

const DOT_SIZE = 8;
const STAGGER = 150;
const DURATION = 400;

export function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * STAGGER),
          Animated.timing(dot, { toValue: 1.5, duration: DURATION / 2, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 1.0, duration: DURATION / 2, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ scale: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.gray400,
  },
});
```

---

### Step 6: ChatScreen — Presence Header + Typing Indicator

**File**: `apps/mobile/src/features/chat/ChatScreen.tsx`

**6a. Add imports:**
```typescript
import { usePresenceStore } from '../../shared/stores/presence';
import { getPresenceString } from '../../shared/utils/presence';
import { TypingIndicator } from './components/TypingIndicator';
```

**6b. Add presence subscriptions (at top of component, after existing state):**
```typescript
const isOtherOnline = usePresenceStore((s) => s.onlineUserIds.has(otherUser.id));
const otherLastSeen = usePresenceStore(
  (s) => s.lastSeenMap[otherUser.id] ?? otherUser.lastSeenAt,
);
```

**6c. Update header useEffect dependency + subtitle:**

Replace:
```typescript
{isTyping ? 'typing...' : otherUser.isOnline ? 'Online' : 'Offline'}
```

With:
```typescript
{isTyping ? 'typing...' : getPresenceString(isOtherOnline, otherLastSeen)}
```

Update the `useEffect` dependency array to include `isOtherOnline` and `otherLastSeen`:
```typescript
}, [otherUser, isTyping, isOtherOnline, otherLastSeen]);
```

**6d. Add TypingIndicator to FlatList:**

In the FlatList props, add:
```typescript
ListFooterComponent={isTyping ? <TypingIndicator /> : null}
```

**6e. Add `user:online` / `user:offline` listeners for this specific user in the socket useEffect:**

Add inside the existing socket useEffect (alongside existing listeners):
```typescript
function onUserOnline(data: { userId: string }) {
  // Already handled globally by presenceStore — no action needed here
}
// No local handler needed: usePresenceStore subscription handles re-render
```

*(No local socket handler needed — the Zustand store subscription causes a re-render automatically.)*

---

### Step 7: ConversationsScreen — Real-Time Dots + Read Receipt

**File**: `apps/mobile/src/features/chat/ConversationsScreen.tsx`

**7a. Add imports:**
```typescript
import { usePresenceStore } from '../../shared/stores/presence';
import { getSocket } from '../../shared/services/socket';
import { useAuthStore } from '../../shared/stores/auth';
```

**7b. Add store subscriptions (at top of component):**
```typescript
const currentUser = useAuthStore((s) => s.user);
const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
```

**7c. Add `messages:status` socket listener in `useFocusEffect`:**

```typescript
useFocusEffect(
  useCallback(() => {
    loadConversations();

    const socket = getSocket();
    if (!socket) return;

    function onMessageStatus(data: { conversationId: string; status: string }) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === data.conversationId && conv.lastMessage
            ? {
                ...conv,
                lastMessage: { ...conv.lastMessage, status: data.status as any },
              }
            : conv,
        ),
      );
    }

    socket.on('messages:status', onMessageStatus);
    return () => {
      socket.off('messages:status', onMessageStatus);
    };
  }, []),
);
```

**7d. Update `renderConversation` — Avatar isOnline from store:**

```typescript
// Replace:
isOnline={otherUser.isOnline}

// With:
isOnline={onlineUserIds.has(otherUser.id)}
```

**7e. Replace unread badge area with conditional read receipt / badge:**

```typescript
{/* Replace the existing unreadBadge block: */}
{(() => {
  const isLastMine = item.lastMessage?.senderId === currentUser?.id;
  const isRead = item.lastMessage?.status === 'read';
  if (isLastMine && isRead) {
    return (
      <Image
        source={
          otherUser.avatarUrl
            ? { uri: otherUser.avatarUrl }
            : undefined
        }
        style={styles.readReceiptAvatar}
        // Fallback initial when no avatar URL:
        // handled inline below
      />
    );
  }
  if (item.unreadCount > 0) {
    return (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadText}>{item.unreadCount}</Text>
      </View>
    );
  }
  return null;
})()}
```

For the read receipt avatar with fallback to initials (since `Image` doesn't handle missing URLs gracefully):

```typescript
{(() => {
  const isLastMine = item.lastMessage?.senderId === currentUser?.id;
  const isRead = item.lastMessage?.status === 'read';
  if (isLastMine && isRead) {
    return (
      <Avatar
        uri={otherUser.avatarUrl}
        name={otherUser.displayName}
        color={otherUser.avatarColor}
        size={14}
      />
    );
  }
  if (item.unreadCount > 0) {
    return (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadText}>{item.unreadCount}</Text>
      </View>
    );
  }
  return null;
})()}
```

---

### Step 8: ContactsScreen — Real-Time Online Status Text

**File**: `apps/mobile/src/features/contacts/ContactsScreen.tsx`

**8a. Add imports:**
```typescript
import { usePresenceStore } from '../../shared/stores/presence';
import { getPresenceString } from '../../shared/utils/presence';
```

**8b. Add store subscription:**
```typescript
const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
```

**8c. Update each contact Avatar isOnline prop:**
```typescript
isOnline={onlineUserIds.has(contact.user.id)}
```

**8d. Update the status subtitle text for contacts:**
```typescript
// Replace:
{contact.user.isOnline ? 'Online' : contact.user.bio}

// With:
{onlineUserIds.has(contact.user.id) ? 'Active now' : contact.user.bio}
```

---

### Step 9: Server — Add status to lastMessage

**File**: `apps/server/src/features/chat/chat.service.ts`

In the `getConversations` query, the `lastMessage` select currently returns:
```typescript
{ id, senderId, type, content, isForwarded, deletedForEveryone, createdAt }
```

Add a subquery to get the message status for the recipient:

```typescript
// After getting lastMessage, fetch its status:
let lastMessageStatus: string | null = null;
if (lastMessage) {
  const [statusRow] = await db
    .select({ status: messageStatuses.status })
    .from(messageStatuses)
    .where(
      and(
        eq(messageStatuses.messageId, lastMessage.id),
        eq(messageStatuses.userId, userId),
      ),
    )
    .limit(1);
  lastMessageStatus = statusRow?.status ?? null;
}

// Include in return:
lastMessage: lastMessage
  ? { ...lastMessage, status: lastMessageStatus }
  : null,
```

> Note: `messageStatuses` tracks delivery/read state per recipient. The `status` for the *sender's* view is derived from recipient's status row. If the last message was sent by me, its status row belongs to the recipient (otherUserId). Adjust the `where` clause to use `otherUserId` when `lastMessage.senderId === userId`.

Final corrected query:
```typescript
if (lastMessage) {
  const statusUserId = lastMessage.senderId === userId ? otherUserId : userId;
  const [statusRow] = await db
    .select({ status: messageStatuses.status })
    .from(messageStatuses)
    .where(
      and(
        eq(messageStatuses.messageId, lastMessage.id),
        eq(messageStatuses.userId, statusUserId),
      ),
    )
    .limit(1);
  lastMessageStatus = statusRow?.status ?? null;
}
```

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Syria Accessibility | ✅ PASS | No new external services; all Socket.IO on existing Koyeb server |
| Offline-First | ✅ PASS | Presence is real-time only, no offline requirement; chat messages already offline-first |
| TypeScript Everywhere | ✅ PASS | Strict TS throughout; Zustand Set serialization handled correctly |
| Feature-Based Architecture | ✅ PASS | Presence store in `shared/stores/`, utility in `shared/utils/`, component in `features/chat/components/` |
| Messenger-Identical UX | ✅ PASS | "Active now/Xm/Xh/Xd ago" matches Messenger; 3-dot bounce animation matches; read receipt avatar matches |
| Incremental Module Delivery | ✅ PASS | Feature is complete before merge; typing + header + dots + read receipt all ship together |
