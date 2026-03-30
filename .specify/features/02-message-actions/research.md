# Research: Message Actions

**Feature**: 02 — Message Actions
**Date**: 2026-03-25

---

## Decision 1: Clipboard API

**Decision**: Use `expo-clipboard` (`Clipboard.setStringAsync`)

**Rationale**: The built-in `Clipboard` from `react-native` is deprecated since RN 0.65. `@react-native-clipboard/clipboard` requires native module linking (incompatible with Expo Go). `expo-clipboard` is the Expo-managed alternative — works in Expo Go, no native linking needed. It is bundled with Expo SDK 54 under `expo/node_modules` (same pattern as `@expo/vector-icons`).

**Alternatives considered**:
- `react-native` built-in `Clipboard` — deprecated, will log warnings
- `@react-native-clipboard/clipboard` — requires native build, incompatible with Expo Go
- `expo-clipboard` ✅ — works in Expo Go, async API, consistent with Expo ecosystem

---

## Decision 2: Long-press Gesture

**Decision**: Use `onLongPress` prop on `TouchableOpacity` (delayLongPress: 400ms)

**Rationale**: The existing ChatScreen already wraps message bubbles in `TouchableOpacity` or `View`. Adding `onLongPress` is zero-cost: no new gesture handler needed, no gesture conflict, works identically across iOS and Android. `LongPressGestureHandler` from `react-native-gesture-handler` adds complexity for no benefit in this context.

**Alternatives considered**:
- `LongPressGestureHandler` from `react-native-gesture-handler` — overkill, same result
- `onLongPress` prop ✅ — simplest, already supported

---

## Decision 3: Swipe-to-Reply

**Decision**: Use `PanResponder` on each message row, detecting horizontal swipe > 40px at shallow angle

**Rationale**: `react-native-gesture-handler` is already installed (GestureHandlerRootView wraps the app). However, using `Swipeable` or `PanGestureHandler` for individual message rows in a FlatList creates gesture nesting conflicts. `PanResponder` gives explicit control: ignore gesture if vertical component exceeds horizontal (dy > dx), cancel if FlatList has claimed the gesture. This mirrors the Toast swipe-dismiss approach already in the codebase.

**Swipe threshold**: Translate message right up to 60px; trigger reply at 40px release or velocity > 0.5. Snap back to 0 after release.

**Alternatives considered**:
- `Swipeable` from `react-native-gesture-handler` — gesture nesting issues with FlatList scroll
- `PanGestureHandler` — requires gesture handler context, same conflicts
- `PanResponder` ✅ — explicit control, conflict-free with FlatList vertical scroll

---

## Decision 4: Action Menu Presentation

**Decision**: Custom absolute-positioned `Modal` (transparent) with Animated scale-in from the message position

**Rationale**: `ActionSheetIOS` is iOS-only. `Alert.alert` with options is ugly. A custom Modal gives full control over positioning (above/below message), Messenger-style appearance, and the backdrop dim. Auto-position: if message's Y position > screenHeight / 2, show menu above; else below.

**Menu structure**:
```
[backdrop — semi-transparent]
[menu card — white, rounded, shadow]
  React | Reply | Copy | Forward | Edit | Delete for me | Delete for everyone
```

**Alternatives considered**:
- `ActionSheetIOS` — iOS only, no custom styling
- Bottom sheet library — extra package, overkill for this feature
- Custom Modal ✅ — full control, no new package, matches Messenger style

---

## Decision 5: Forward Conversation Picker

**Decision**: Reuse existing `GET /api/chat/conversations` list inside a `Modal` FlatList

**Rationale**: No new endpoint needed. The conversations list already returns other-user name, avatar, last message. Forwarding sends the message content via the existing `message:send` Socket.IO event (or REST fallback). The modal is a simple full-screen overlay with a FlatList.

**Forward mechanics**:
1. User selects conversation
2. `POST /api/chat/conversations/:conversationId/messages` with `{ type: 'text', content: originalContent, forwardedFromId: originalMessageId }`
3. `isForwarded: true` will be set by the server (field already exists in schema)

---

## Decision 6: Edit and Delete Server Endpoints

**Finding**: All required server endpoints already exist:
- Edit: `PUT /api/chat/messages/:messageId` — body `{ content }`
- Delete for me: `DELETE /api/chat/messages/:messageId`
- Delete for everyone: `DELETE /api/chat/messages/:messageId/everyone`

**Time window enforcement**: Server enforces the 15-minute edit window and 1-hour delete window. Client also gates the menu options as a UX guard, but server is the authority.

**No new server code needed for this spec.**

---

## Decision 7: Real-time Propagation for Edit/Delete

**Finding**: The existing socket events already handle this:
- `message:edited` — broadcast by server after `editMessage`
- `message:deleted` — broadcast by server after `deleteForEveryone`

The existing `ChatScreen` already listens to both events and updates local state. No new socket events needed.

---

## Decision 8: Reply Scroll-to-original

**Decision**: Use `FlatList.scrollToItem` with `animated: true`. If item not found, no-op.

**Rationale**: The FlatList is inverted (`inverted` prop set). `scrollToItem` requires the item to be in the `data` array. If the original message is not loaded (outside the 50-message initial load), scrolling fails silently — acceptable per spec.

**Implementation**: Store a ref to the FlatList. On quoted message tap, find the original message in the current `messages` array by `replyToId`. If found, call `flatListRef.current.scrollToItem({ item: originalMessage, animated: true })`.

---

## Constitution Compliance Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Syria Accessibility | ✅ PASS | `expo-clipboard` is open source, no geo-blocking |
| Offline-First | ⚠ DEFERRED | "Delete for me" is local-only (offline-safe). Edit/delete-for-everyone requires network. Offline queue is Spec 10. |
| TypeScript Everywhere | ✅ PASS | All new code will be strict TypeScript |
| Feature-Based Architecture | ✅ PASS | New components go in `apps/mobile/src/features/chat/components/` |
| Messenger-Identical UX | ✅ PASS | Long-press menu, swipe-reply, edit mode match Messenger patterns exactly |
| Incremental Module Delivery | ✅ PASS | No half-features — all 6 actions complete in this spec |
