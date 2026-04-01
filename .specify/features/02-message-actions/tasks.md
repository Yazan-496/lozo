# Tasks: Message Actions

**Feature**: 02 — Message Actions
**Plan**: [plan.md](plan.md)
**Created**: 2026-03-25
**Status**: Ready

---

## Overview

Pure mobile (React Native) implementation. No server changes required — all endpoints already exist.

- **New files**: 3 components (`MessageActionMenu`, `ReplyPreviewBar`, `ForwardModal`)
- **Modified files**: 1 screen (`ChatScreen.tsx`)
- **New package**: `expo-clipboard`
- **Total tasks**: 12

---

## Phase 1: Setup

> Install the one new dependency required by this feature.

- [x] T001 Install expo-clipboard by running `npx expo install expo-clipboard` from `apps/mobile/` and confirm the package appears in `apps/mobile/package.json` dependencies as `"expo-clipboard": "~7.0.0"` (or the version resolved by expo install)

---

## Phase 2: Foundational — New Components

> Three self-contained components. All three can be created in parallel (independent files).

- [x] T002 [P] Create `apps/mobile/src/features/chat/components/MessageActionMenu.tsx` — a transparent `Modal` that renders a white rounded card (borderRadius 12, minWidth 180, shadow) with Animated scale 0.85→1.0 + opacity 0→1 over 150ms on open. Export two pure functions: `canEdit(message, currentUserId)` (own message + text type + < 15 min) and `canDeleteForEveryone(message, currentUserId)` (own message + < 1 hour). Render action rows in this order: React (always, placeholder — closes menu), Reply (always), Copy (text type only), Forward (always), Edit (canEdit only), Delete for me (own message only), Delete for everyone (canDeleteForEveryone only). Destructive rows (Delete for me, Delete for everyone) use `colors.red` text. Auto-position the card: if `messageY > screenHeight / 2` render above the midpoint, else below. Props: `{ message, currentUserId, visible, messageY, onClose, onReply, onCopy, onForward, onEdit, onDeleteForMe, onDeleteForEveryone, onReact }`

- [x] T003 [P] Create `apps/mobile/src/features/chat/components/ReplyPreviewBar.tsx` — a presentational bar (~52px tall) rendered above the message input when replying. Layout: left colored border (4px wide, `colors.primary`) + left section with sender name (bold 12px, `colors.dark`) above truncated content (12px, `colors.gray500`, max 50 chars + ellipsis, show "Message deleted" if `replyingTo.deletedForEveryone`) + right × button (`onCancel`). Thin top border, white background. Props: `{ replyingTo: Message, senderName: string, onCancel: () => void }`

- [x] T004 [P] Create `apps/mobile/src/features/chat/components/ForwardModal.tsx` — a full-screen `Modal` (white background). Header row: "Forward to" title (bold 18px) + × close button. Body: `FlatList` of conversations fetched fresh on `visible` becoming true via `api.get('/chat/conversations')`. While loading render `<ConversationSkeleton />` (import from `../../shared/components/ConversationSkeleton`). Each row: `Avatar` + displayName (16px bold) + lastMessage preview (14px gray, numberOfLines 1). Tapping a row calls `onForward(conversation.id)`. Props: `{ visible: boolean, message: Message, onClose: () => void, onForward: (conversationId: string) => void }`

---

## Phase 3: User Story 1 — Long-press Menu

> **Goal**: Long-pressing any message bubble opens the contextual action menu.
> **Test**: Long-press a received message → menu appears with Reply, Copy, Forward visible but not Edit/Delete. Long-press own message sent > 1 hour ago → only Reply, Copy, Forward, Delete for me visible.

- [x] T005 [US1] Wire `MessageActionMenu` into `apps/mobile/src/features/chat/ChatScreen.tsx`:
  1. Add state: `const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)` and `const [selectedMessageY, setSelectedMessageY] = useState(0)`
  2. Import `MessageActionMenu` from `./components/MessageActionMenu`
  3. In `renderMessage`: wrap the outer `View` (the message row) in a `TouchableOpacity` with `onLongPress` (and `delayLongPress={400}`) that calls `event.target.measure(...)` to get screen Y then sets `selectedMessage` and `selectedMessageY`. Use `activeOpacity={1}` so no visual feedback on long-press
  4. Render `<MessageActionMenu>` at the bottom of the `KeyboardAvoidingView` (below FlatList and input bar) with all required props — pass stub `() => setSelectedMessage(null)` for all action callbacks except `onClose` for now (will be replaced in later tasks)
  5. Import `{ Dimensions } from 'react-native'` for `screenHeight` in MessageActionMenu if not already imported

---

## Phase 4: User Story 2 — Reply

> **Goal**: Swipe right on a message OR tap Reply → reply preview appears above input → sent message shows quoted bubble.
> **Test**: Swipe message right past 40px → ReplyPreviewBar appears with sender name and truncated content. Send message → new bubble shows quoted original above it. Tap quoted part → list scrolls to original.

- [x] T006 [US2] Add swipe-to-reply and full reply flow to `apps/mobile/src/features/chat/ChatScreen.tsx`:
  1. Add state: `const [replyingTo, setReplyingTo] = useState<Message | null>(null)`
  2. Add per-message swipe animation: inside `renderMessage`, create an `Animated.Value` via `useRef(new Animated.Value(0)).current` stored in a ref map keyed by `item.id` (use `useRef<Record<string, Animated.Value>>({})` — create if missing). Wrap the message row `TouchableOpacity` in `Animated.View` with `transform: [{ translateX: swipeAnim }]`
  3. Create `PanResponder` per message inside `renderMessage` using `useMemo` (key on `item.id`): `onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > Math.abs(dy) && dx > 5` (horizontal rightward only). `onPanResponderMove`: if `dx > 0 && Math.abs(dy) < Math.abs(dx)`, set `swipeAnim` to `Math.min(dx, 60)`. `onPanResponderRelease`: if `dx > 40 || vx > 0.5`, call `setReplyingTo(item)` and dismiss menu; always snap back `swipeAnim` to 0 with `Animated.spring`
  4. Import and render `<ReplyPreviewBar>` above the input bar `<View style={styles.inputBar}>` when `replyingTo !== null`. Pass `senderName={replyingTo.senderId === currentUser?.id ? 'You' : otherUser.displayName}` and `onCancel={() => setReplyingTo(null)}`
  5. Update `handleSend` to pass `replyToId: replyingTo?.id ?? null` in the `message:send` socket emit payload, and call `setReplyingTo(null)` after emitting
  6. Update the Reply action stub in `MessageActionMenu` props: `onReply={() => { setReplyingTo(selectedMessage!); setSelectedMessage(null); }}`
  7. In `renderMessage`, add the reply bubble above the message bubble (when `item.replyTo && !item.deletedForEveryone`): a `TouchableOpacity` wrapping a styled `View` with a 2px left border, small sender name text, and content (or "Message deleted" if `item.replyTo.deletedForEveryone`). On press call `scrollToMessage(item.replyToId)`
  8. Add `scrollToMessage(messageId: string | null)`: finds the message in `messages` array and calls `flatListRef.current?.scrollToItem({ item: found, animated: true })` — no-op if not found
  9. Add styles: `replyBubble`, `replyBubbleMe`, `replyBubbleOther`, `replyBubbleName`, `replyBubbleContent` to `StyleSheet.create`

---

## Phase 5: User Story 3 — Edit

> **Goal**: Tapping Edit pre-fills input, shows "Editing" bar; saving updates the message in-place.
> **Test**: Tap Edit on own text message < 15 min old → input pre-filled, "Editing" bar visible. Change text, tap send → message updates in list with "(edited)" label.

- [x] T007 [US3] Add edit mode to `apps/mobile/src/features/chat/ChatScreen.tsx`:
  1. Add state: `const [editingMessage, setEditingMessage] = useState<Message | null>(null)`
  2. Add `handleEditStart`: sets `editingMessage` to `selectedMessage`, calls `setText(selectedMessage?.content ?? '')`, clears `selectedMessage`
  3. Add `handleEditSave`: if `!editingMessage || !text.trim()` return early. Call `await api.put(\`/chat/messages/\${editingMessage.id}\`, { content: text.trim() })`. On success: `setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: text.trim(), editedAt: new Date().toISOString() } : m))`, `setEditingMessage(null)`, `setText('')`. On error: `showToast('error', err.response?.data?.error ?? 'Failed to edit message')`
  4. Modify `handleSend`: at the top, if `editingMessage` is set, call `handleEditSave()` and return early (do not emit `message:send`)
  5. Render an "Editing" bar above the input bar `<View style={styles.inputBar}>` when `editingMessage !== null`: a `View` with "Editing message" label text and a "Cancel" `TouchableOpacity` that calls `setEditingMessage(null)` and `setText('')`. Stack with `replyPreviewBar` (only one should be active at a time — if entering edit mode, clear `replyingTo`)
  6. Update the Edit action stub in `MessageActionMenu` props: `onEdit={handleEditStart}`
  7. Add styles: `editingBar`, `editingBarText`, `editingBarCancel` to `StyleSheet.create`

---

## Phase 6: User Story 4 — Delete

> **Goal**: "Delete for me" removes locally; "Delete for everyone" shows confirmation dialog then server-deletes.
> **Test**: Tap "Delete for me" on own message → message disappears from list immediately. Tap "Delete for everyone" → Alert appears → confirm → message shows "Message deleted" placeholder.

- [x] T008 [US4] Wire delete handlers in `apps/mobile/src/features/chat/ChatScreen.tsx`:
  1. Add `handleDeleteForMe`: `setMessages(prev => prev.filter(m => m.id !== selectedMessage?.id))`, `setSelectedMessage(null)`
  2. Add `handleDeleteForEveryone`: call `Alert.alert('Delete for everyone?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(\`/chat/messages/\${selectedMessage!.id}/everyone\`); setMessages(prev => prev.map(m => m.id === selectedMessage!.id ? { ...m, deletedForEveryone: true, content: null } : m)); } catch (err: any) { showToast('error', err.response?.data?.error ?? 'Failed to delete'); } setSelectedMessage(null); } }])` — note: `Alert` is already imported in the existing file (check: if not, add `Alert` to the `react-native` imports)
  3. Update `MessageActionMenu` props: `onDeleteForMe={handleDeleteForMe}`, `onDeleteForEveryone={handleDeleteForEveryone}`

---

## Phase 7: User Story 5 — Copy

> **Goal**: Tapping Copy places the message text on the clipboard and shows a toast.
> **Test**: Tap Copy on a text message → toast says "Copied to clipboard" → paste elsewhere confirms text was copied.

- [x] T009 [US5] Wire copy handler in `apps/mobile/src/features/chat/ChatScreen.tsx`:
  1. Add import: `import * as Clipboard from 'expo-clipboard'`
  2. Add `handleCopy`: `if (!selectedMessage?.content) return; await Clipboard.setStringAsync(selectedMessage.content); showToast('success', 'Copied to clipboard'); setSelectedMessage(null)`
  3. Update `MessageActionMenu` props: `onCopy={handleCopy}`

---

## Phase 8: User Story 6 — Forward

> **Goal**: Tapping Forward opens a conversation picker; selecting one forwards the message there.
> **Test**: Tap Forward → ForwardModal opens with conversation list. Tap a conversation → modal closes, success toast appears, check that conversation received the forwarded message.

- [x] T010 [US6] Wire forward flow in `apps/mobile/src/features/chat/ChatScreen.tsx`:
  1. Add state: `const [showForwardModal, setShowForwardModal] = useState(false)`
  2. Import `ForwardModal` from `./components/ForwardModal`
  3. Add `handleForward(conversationId: string)`: `if (!selectedMessage?.content) return; try { const socket = getSocket(); socket?.emit('message:send', { conversationId, type: 'text', content: selectedMessage.content, forwardedFromId: selectedMessage.id }, () => {}); showToast('success', 'Message forwarded'); } catch { showToast('error', 'Failed to forward message'); } setShowForwardModal(false); setSelectedMessage(null)`
  4. Update the Forward action stub in `MessageActionMenu` props: `onForward={() => { setShowForwardModal(true); }}`
  5. Render `<ForwardModal visible={showForwardModal} message={selectedMessage!} onClose={() => setShowForwardModal(false)} onForward={handleForward} />` inside the `KeyboardAvoidingView` (after `MessageActionMenu`)

---

## Final Phase: Polish

> Verify correctness of the full integration and add any missing style details.

- [x] T011 Audit `apps/mobile/src/features/chat/components/MessageActionMenu.tsx`: confirm action items render in the exact order (React, Reply, Copy, Forward, Edit, Delete for me, Delete for everyone), that the `visible` prop resets the Animated values so the scale-in plays on each open (reset `scaleAnim` to 0.85 and `opacityAnim` to 0 in the `useEffect` before starting the animation), and that the backdrop `TouchableOpacity` covers the full screen and calls `onClose`

- [x] T012 Audit `apps/mobile/src/features/chat/ChatScreen.tsx`: confirm the per-message `Animated.Value` ref map is initialized correctly (`swipeAnimMap.current[item.id] = swipeAnimMap.current[item.id] ?? new Animated.Value(0)` inside `renderMessage`), that `PanResponder` is created with `useMemo` keyed on `item.id` to avoid recreation on every render, and that there are no TypeScript errors (`npx tsc --noEmit` from `apps/mobile/`)

---

## Dependency Graph

```
T001 (install expo-clipboard)
  └─► T002, T003, T004 (components — parallel)
        └─► T005 (US1: wire MessageActionMenu)
              └─► T006 (US2: reply — needs menu callbacks)
                    └─► T007 (US3: edit — adds to same ChatScreen)
                          └─► T008 (US4: delete — adds to same ChatScreen)
                                └─► T009 (US5: copy — adds to same ChatScreen)
                                      └─► T010 (US6: forward — adds to same ChatScreen)
                                            └─► T011, T012 (polish — parallel)
```

**Note**: T002, T003, T004 are parallel (independent files). T005–T010 are sequential (all modify `ChatScreen.tsx`). T011 and T012 are parallel (different files).

---

## Parallel Execution Examples

**Phase 2 (components)**: Run T002 + T003 + T004 simultaneously in three agent windows.

**Final phase**: Run T011 (MessageActionMenu audit) + T012 (ChatScreen audit) simultaneously.

---

## Implementation Strategy

**MVP scope**: T001 → T002 → T005 (long-press menu wired with stubs) — gives visible progress quickly.

**Incremental delivery**:
1. T001–T005: Menu opens on long-press, all actions close the menu (stubs)
2. T003 + T006: Reply works (preview bar + sent bubble + scroll)
3. T007: Edit works
4. T008: Delete works
5. T004 + T009 + T010: Copy and Forward work
6. T011 + T012: Polish

Each increment is independently testable in Expo Go.
