# Implementation Plan: Message Reactions

**Feature**: 03 — Message Reactions
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-25
**Status**: Ready to implement

---

## Summary

All server-side code already exists. Pure mobile (React Native) implementation. Two new components, targeted changes to ChatScreen. Zero new packages.

**New files**: 2 components (`QuickReactionBar.tsx`, `EmojiPickerModal.tsx`)
**Modified files**: 1 screen (`ChatScreen.tsx`)
**New packages**: None
**Server changes**: None

---

## Technical Context

| Concern | Decision |
|---------|----------|
| Quick bar trigger | Long-press replaces direct MessageActionMenu with `QuickReactionBar` first |
| Quick bar UI | Transparent `Modal`, Animated scale+fade ~120ms, absolute card |
| Quick bar positioning | `bottom: screenHeight - messageY + 8` if lower half, else `top: messageY + 8` |
| Backdrop tap behavior | Closes QuickReactionBar, opens MessageActionMenu (state machine) |
| Full picker UI | `Modal` with `animationType="slide"`, no new packages |
| Reaction API | `POST /chat/messages/:id/reactions { emoji }` — server toggles |
| Optimistic update | Update `messages` state immediately, revert on API error with toast |
| Pill rendering | Inline `groupReactions()` helper in ChatScreen, `TouchableOpacity` pills |
| Real-time | Existing `message:reaction` socket handler — no changes needed |

---

## File Structure

```
apps/mobile/src/features/chat/
├── ChatScreen.tsx                         ← MODIFY
└── components/
    ├── MessageActionMenu.tsx              ← unchanged
    ├── ReplyPreviewBar.tsx                ← unchanged
    ├── ForwardModal.tsx                   ← unchanged
    ├── QuickReactionBar.tsx               ← NEW
    └── EmojiPickerModal.tsx               ← NEW
```

---

## State Machine

```
IDLE
  → onLongPress
      selectedMessage = item
      selectedMessageY = event.nativeEvent.pageY
      showQuickReactionBar = true

QUICK_REACTION_BAR open
  → emoji tap
      handleReact(emoji, selectedMessage.id)
      showQuickReactionBar = false
      selectedMessage = null
  → backdrop tap
      showQuickReactionBar = false
      showActionMenu = true          ← MessageActionMenu opens

ACTION_MENU open
  → close / dismiss
      showActionMenu = false
      selectedMessage = null
  → "React" tapped
      showActionMenu = false
      showEmojiPicker = true         ← selectedMessage STAYS (needed by picker)

EMOJI_PICKER open
  → emoji tap
      handleReact(emoji, selectedMessage.id)
      showEmojiPicker = false
      selectedMessage = null
  → close
      showEmojiPicker = false
      selectedMessage = null

ANY STATE
  → reaction pill tap
      handleReact(pill.emoji, message.id)   ← no modal, inline
```

New ChatScreen state variables needed:
- `showQuickReactionBar: boolean` (default `false`)
- `showActionMenu: boolean` (default `false`)
- `showEmojiPicker: boolean` (default `false`)

> The existing `selectedMessage` / `selectedMessageY` states remain unchanged. The existing `{selectedMessage && <MessageActionMenu ... visible={selectedMessage !== null} />}` pattern is replaced with `showActionMenu` flag so each modal is independently controlled.

---

## Step-by-Step Implementation

### Step 1: QuickReactionBar Component

**File**: `apps/mobile/src/features/chat/components/QuickReactionBar.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { Modal, TouchableOpacity, View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { colors } from '../../../shared/utils/theme';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const { height: screenHeight } = Dimensions.get('window');

interface Props {
  visible: boolean;
  messageId: string;
  messageY: number;
  currentUserEmoji: string | null;
  onReact: (emoji: string) => void;
  onClose: () => void;
}

export function QuickReactionBar({ visible, messageId, messageY, currentUserEmoji, onReact, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isAbove = messageY > screenHeight / 2;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 150, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const positionStyle = isAbove
    ? { bottom: screenHeight - messageY + 8 }
    : { top: messageY + 8 };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop — tap to open full action menu */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.bar, positionStyle, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        {QUICK_EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[styles.emojiBtn, currentUserEmoji === emoji && styles.emojiBtnActive]}
            onPress={() => onReact(emoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
}
```

**Styles**: Card with `borderRadius: 28`, `backgroundColor: colors.surface`, shadow, each emoji button 44×44, active state has `backgroundColor: colors.primary + '25'` with `borderRadius: 22`.

---

### Step 2: EmojiPickerModal Component

**File**: `apps/mobile/src/features/chat/components/EmojiPickerModal.tsx`

```typescript
import { Modal, View, TouchableOpacity, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../../shared/utils/theme';

// ~48 emojis across 4 categories
const EMOJI_DATA = [
  // Smileys
  '😀','😃','😄','😁','😆','😂','🤣','😊','😇','🙂','😉','😍','🤩','😘','😗',
  // Gestures
  '👍','👎','👏','🙌','🤝','🤜','✌️','🤞','👌','🤌','🫶','❤️','🧡','💛','💚',
  // Expressions
  '😮','😢','😡','😱','🥲','😤','🫡','🥳','😴','🤔','🤫','🤭','😬','😏','🙄',
  // Objects/symbols
  '🔥','⭐','💯','✅','❌','🎉','🎊','💪','🚀','👀','💀','🫠','🤯','💥','🫶',
];

const NUM_COLS = 6;
const { height: screenHeight } = Dimensions.get('window');

interface Props {
  visible: boolean;
  currentUserEmoji: string | null;
  onReact: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerModal({ visible, currentUserEmoji, onReact, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Semi-transparent backdrop top 40% */}
      <TouchableOpacity style={[StyleSheet.absoluteFill, { height: screenHeight * 0.4 }]} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />
        <FlatList
          data={EMOJI_DATA}
          keyExtractor={(item) => item}
          numColumns={NUM_COLS}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.emojiCell, currentUserEmoji === item && styles.emojiCellActive]}
              onPress={() => onReact(item)}
            >
              <Text style={styles.emojiText}>{item}</Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}
```

**Styles**: `sheet` is `position: 'absolute', bottom: 0, left: 0, right: 0, height: screenHeight * 0.6`, `backgroundColor: colors.background`, `borderTopLeftRadius: 20, borderTopRightRadius: 20`. Handle is a short gray bar centered at top. Each cell is `(screenWidth / NUM_COLS) × (screenWidth / NUM_COLS)`.

---

### Step 3: ChatScreen — State & Modal Wiring

**New state variables** (add alongside existing state):
```typescript
const [showQuickReactionBar, setShowQuickReactionBar] = useState(false);
const [showActionMenu, setShowActionMenu] = useState(false);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
```

**Modify `onLongPress`** (currently sets `selectedMessage` + `selectedMessageY`):
```typescript
onLongPress={(event) => {
  if (item.deletedForEveryone) return;  // already guarded
  setSelectedMessageY(event.nativeEvent.pageY);
  setSelectedMessage(item);
  setShowQuickReactionBar(true);        // ← NEW: show quick bar first
}}
```

**Replace MessageActionMenu render** (currently `{selectedMessage && <MessageActionMenu ... visible={selectedMessage !== null} />}`):
```typescript
<MessageActionMenu
  message={selectedMessage}
  currentUserId={currentUser?.id ?? ''}
  visible={showActionMenu}             // ← use showActionMenu flag
  messageY={selectedMessageY}
  onClose={() => { setShowActionMenu(false); setSelectedMessage(null); }}
  onReply={() => { setReplyingTo(selectedMessage); setShowActionMenu(false); setSelectedMessage(null); }}
  onCopy={handleCopy}
  onForward={() => { setShowForwardModal(true); }}
  onEdit={handleEditStart}
  onDeleteForMe={handleDeleteForMe}
  onDeleteForEveryone={handleDeleteForEveryone}
  onReact={() => { setShowActionMenu(false); setShowEmojiPicker(true); }} // ← opens picker
/>
```

**Add `handleReact` function**:
```typescript
async function handleReact(emoji: string, messageId: string) {
  const message = messages.find((m) => m.id === messageId);
  if (!message) return;
  const myCurrentReaction = message.reactions.find((r) => r.userId === currentUser!.id);

  // Optimistic update
  setMessages((prev) =>
    prev.map((m) => {
      if (m.id !== messageId) return m;
      let reactions = m.reactions.filter((r) => r.userId !== currentUser!.id);
      if (myCurrentReaction?.emoji !== emoji) {
        reactions = [...reactions, { emoji, userId: currentUser!.id }];
      }
      return { ...m, reactions };
    }),
  );

  // Background API call
  api.post(`/chat/messages/${messageId}/reactions`, { emoji }).catch(() => {
    showToast('error', 'Failed to update reaction');
  });
}
```

**Add new component renders** (after MessageActionMenu render):
```typescript
<QuickReactionBar
  visible={showQuickReactionBar}
  messageId={selectedMessage?.id ?? ''}
  messageY={selectedMessageY}
  currentUserEmoji={
    selectedMessage?.reactions.find((r) => r.userId === currentUser?.id)?.emoji ?? null
  }
  onReact={(emoji) => {
    handleReact(emoji, selectedMessage!.id);
    setShowQuickReactionBar(false);
    setSelectedMessage(null);
  }}
  onClose={() => {
    setShowQuickReactionBar(false);
    setShowActionMenu(true);  // backdrop tap → open full menu
  }}
/>

<EmojiPickerModal
  visible={showEmojiPicker}
  currentUserEmoji={
    selectedMessage?.reactions.find((r) => r.userId === currentUser?.id)?.emoji ?? null
  }
  onReact={(emoji) => {
    handleReact(emoji, selectedMessage!.id);
    setShowEmojiPicker(false);
    setSelectedMessage(null);
  }}
  onClose={() => { setShowEmojiPicker(false); setSelectedMessage(null); }}
/>
```

---

### Step 4: ChatScreen — Reaction Pills

**Add `groupReactions` helper** (top-level, before the component):
```typescript
function groupReactions(reactions: Reaction[], currentUserId: string) {
  const map: Record<string, number> = {};
  let myEmoji: string | null = null;
  for (const r of reactions) {
    map[r.emoji] = (map[r.emoji] ?? 0) + 1;
    if (r.userId === currentUserId) myEmoji = r.emoji;
  }
  return Object.entries(map)
    .map(([emoji, count]) => ({ emoji, count, mine: emoji === myEmoji }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}
```

**Replace existing reactions render** (currently a simple `.map` showing raw emojis):
```typescript
// BEFORE (lines ~535-540):
{item.reactions.length > 0 && (
  <View style={styles.reactionsRow}>
    {item.reactions.map((r, i) => (
      <Text key={i} style={styles.reactionEmoji}>{r.emoji}</Text>
    ))}
  </View>
)}

// AFTER:
{item.reactions.length > 0 && !item.deletedForEveryone && (
  <View style={[styles.reactionsRow, isMe ? { alignSelf: 'flex-end', marginRight: 8 } : { alignSelf: 'flex-start', marginLeft: 8 }]}>
    {groupReactions(item.reactions, currentUser!.id).map((pill) => (
      <TouchableOpacity
        key={pill.emoji}
        style={[styles.reactionPill, pill.mine && styles.reactionPillMine]}
        onPress={() => handleReact(pill.emoji, item.id)}
      >
        <Text style={styles.reactionPillText}>{pill.emoji} {pill.count}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

**Add styles** for pills (replaces old `reactionEmoji` style):
```typescript
reactionPill: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: 8,
  paddingVertical: 3,
  marginRight: 4,
  marginTop: 2,
},
reactionPillMine: {
  backgroundColor: colors.primary + '25',
  borderColor: colors.primary,
},
reactionPillText: {
  fontSize: 13,
  color: colors.text,
},
```

---

### Step 5: Add Imports

In `ChatScreen.tsx`, add imports:
```typescript
import { QuickReactionBar } from './components/QuickReactionBar';
import { EmojiPickerModal } from './components/EmojiPickerModal';
```

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Syria Accessibility | ✅ PASS | No external services; plain Unicode emoji |
| Offline-First | ⚠️ DEFERRED | Reactions are network-only; offline queue is Spec 10 |
| TypeScript Everywhere | ✅ PASS | All code strict TypeScript |
| Feature-Based Architecture | ✅ PASS | New components in `features/chat/components/` |
| Messenger-Identical UX | ✅ PASS | Quick bar + full picker matches Messenger exactly |
| Incremental Module Delivery | ✅ PASS | All reaction flows complete in this spec |
| No New Packages | ✅ PASS | Zero new dependencies |

---

## Notes

- The `handleReact` function handles the `myCurrentReaction?.emoji !== emoji` check client-side to match optimistic behavior — if same emoji tapped, the filter removes the user's entry without re-adding it.
- `QuickReactionBar` uses `Animated.spring` for scale (snappy feel) + `Animated.timing` for opacity (smooth reveal). Both run in parallel.
- `EmojiPickerModal`'s backdrop is a `TouchableOpacity` covering the top 40% of screen. The `View` sheet occupies the bottom 60% with `position: 'absolute'`. This works because `Modal` with `transparent` paints the full screen.
- The existing `message:reaction` socket handler already correctly updates `reactions[]` on the message — no changes needed there.
