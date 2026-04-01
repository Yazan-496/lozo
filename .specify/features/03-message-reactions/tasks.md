# Tasks: Message Reactions

**Feature**: 03 — Message Reactions
**Plan**: [plan.md](plan.md)
**Spec**: [spec.md](spec.md)
**Generated**: 2026-03-25

---

## Implementation Strategy

MVP = US1 (quick bar) + US3 (reaction display/pills) — these two together give a fully working reaction loop.
US2 (full picker) and US4/US5 (toggle/replace/real-time) build on top of the MVP.

All tasks are purely mobile (React Native). No server changes required.

---

## Phase 1 — Setup

- [X] T001 Add `showQuickReactionBar`, `showActionMenu`, `showEmojiPicker` state variables and replace the existing `{selectedMessage && <MessageActionMenu ... visible={selectedMessage !== null}>}` pattern with `showActionMenu` flag in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 2 — Foundational

- [X] T002 Add `groupReactions(reactions: Reaction[], currentUserId: string): GroupedReaction[]` helper function (top-level, before the component) and the `GroupedReaction` interface in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T003 Add `handleReact(emoji: string, messageId: string)` function inside `ChatScreen` — optimistic state update + background `api.post('/chat/messages/${messageId}/reactions', { emoji })` with `showToast('error', ...)` on failure in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 3 — User Story 1: Quick React via Floating Bar

**Story goal**: Long-pressing a message shows a floating emoji bar with 6 emojis; tapping one applies the reaction immediately.

**Independent test criteria**: Long-press a message → QuickReactionBar appears above/below message. Tap 👍 → bar closes, 👍 pill appears on message. Tap backdrop → bar closes and MessageActionMenu opens.

- [X] T004 [US1] Create `QuickReactionBar` component with transparent `Modal`, Animated scale+fade entry (~120ms via `Animated.spring` + `Animated.timing` in parallel), 6 emoji buttons (`['👍','❤️','😂','😮','😢','😡']`), auto-positioning (`bottom: screenHeight - messageY + 8` when `messageY > screenHeight/2`, else `top: messageY + 8`), active emoji highlight (`backgroundColor: colors.primary + '25'`, `borderColor: colors.primary`), backdrop `TouchableOpacity` calling `onClose`, and all required props (`visible`, `messageId`, `messageY`, `currentUserEmoji`, `onReact`, `onClose`) in `apps/mobile/src/features/chat/components/QuickReactionBar.tsx`

- [X] T005 [US1] Modify the `onLongPress` handler in `renderMessage` in `ChatScreen.tsx` to call `setShowQuickReactionBar(true)` instead of (or in addition to) the existing `setSelectedMessage` + `setSelectedMessageY` calls — deleted messages guard (`if (item.deletedForEveryone) return`) must come first in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T006 [US1] Render `<QuickReactionBar>` inside the `ChatScreen` return (after `<EmojiPickerModal>` placeholder or after `<MessageActionMenu>`), wiring `onReact` to call `handleReact(emoji, selectedMessage!.id)` then `setShowQuickReactionBar(false)` + `setSelectedMessage(null)`, and `onClose` to `setShowQuickReactionBar(false)` + `setShowActionMenu(true)` (backdrop → open full menu), and add the import in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 4 — User Story 2: Full Emoji Picker

**Story goal**: Tapping "React" in the long-press action menu opens a bottom-sheet emoji picker with ≥48 emojis; tapping any applies the reaction.

**Independent test criteria**: Long-press → tap backdrop → MessageActionMenu opens → tap "React" → picker slides up from bottom. Tap any emoji → picker closes, reaction applied. Tap backdrop → picker closes without reacting.

- [X] T007 [US2] Create `EmojiPickerModal` component with `Modal animationType="slide"`, semi-transparent backdrop covering top 40% (`TouchableOpacity` calling `onClose`), sheet `View` covering bottom 60% with `borderTopLeftRadius: 20 / borderTopRightRadius: 20`, drag handle bar, `FlatList` with `numColumns={6}` containing ≥48 Unicode emojis across smileys/gestures/symbols/objects categories, active emoji highlighting (`colors.primary + '25'` background), and props (`visible`, `currentUserEmoji`, `onReact`, `onClose`) in `apps/mobile/src/features/chat/components/EmojiPickerModal.tsx`

- [X] T008 [US2] Wire `onReact` in `<MessageActionMenu>` to `setShowActionMenu(false); setShowEmojiPicker(true)` (keeps `selectedMessage` set for the picker to use), and render `<EmojiPickerModal>` in `ChatScreen` with `onReact` calling `handleReact(emoji, selectedMessage!.id)` + `setShowEmojiPicker(false)` + `setSelectedMessage(null)`, and `onClose` calling `setShowEmojiPicker(false)` + `setSelectedMessage(null)`, and add the import in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 5 — User Story 3: View Reactions on a Message

**Story goal**: Reactions appear as grouped pills below each message bubble, showing emoji + count; my own reaction pill is highlighted; tapping a pill toggles/replaces.

**Independent test criteria**: Message with reactions shows pills (e.g. `👍 2`). My own reaction pill has primary-color tint. Tapping my own pill → pill disappears (removed). Tapping another emoji pill → my reaction switches. Hidden on deleted messages.

- [X] T009 [US3] Replace the existing simple reactions render (`item.reactions.map((r, i) => <Text key={i}>{r.emoji}</Text>)`) in `renderMessage` in `ChatScreen.tsx` with grouped pill rendering: call `groupReactions(item.reactions, currentUser!.id)` and render each result as a `TouchableOpacity` pill (`reactionPill` style for default, `reactionPillMine` for `mine: true`) showing `emoji + ' ' + count`, wrapped in a `View` with `alignSelf: isMe ? 'flex-end' : 'flex-start'` and `marginRight/Left: 8`, hidden when `item.deletedForEveryone`, with `onPress` calling `handleReact(pill.emoji, item.id)` in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T010 [US3] Add `reactionPill`, `reactionPillMine`, and `reactionPillText` styles to `StyleSheet.create` in `ChatScreen.tsx` — pill: `flexDirection: 'row'`, `alignItems: 'center'`, `backgroundColor: colors.surface`, `borderRadius: 12`, `borderWidth: 1`, `borderColor: colors.border`, `paddingHorizontal: 8`, `paddingVertical: 3`, `marginRight: 4`, `marginTop: 2`; mine: `backgroundColor: colors.primary + '25'`, `borderColor: colors.primary`; text: `fontSize: 13`, `color: colors.text` in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 6 — User Story 4 & 5: Toggle / Replace / Real-time

**Story goal**: Tapping your current reaction removes it. Tapping a different reaction replaces yours in one action. Both participants see changes within 2 seconds.

**Independent test criteria**: React with 👍 → tap 👍 pill → pill removed. React with 👍 → tap ❤️ → 👍 removed, ❤️ added (single action). Open two devices → react on one → other device updates within 2 seconds.

> Note: The `handleReact` function (T003) already handles the toggle/replace logic via the optimistic update pattern. The existing `message:reaction` socket handler already updates other participants. US4 & US5 are covered by T003 + the existing socket code — no additional tasks needed.

- [X] T011 [US4] Verify the `handleReact` toggle logic handles all 3 cases correctly: (1) no current reaction → adds emoji, (2) same emoji tapped → removes (filter without re-adding when `myCurrentReaction?.emoji === emoji`), (3) different emoji → replaces (filter + push new). Adjust the condition in `handleReact` if needed in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 7 — Polish

- [X] T012 [P] Remove the now-unused `reactionEmoji` style entry from `StyleSheet.create` (if it exists) and clean up any leftover `reactionRow` styles that were replaced by the new pill styles in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T013 [P] Ensure `MessageActionMenu` `onClose` handler calls both `setShowActionMenu(false)` and `setSelectedMessage(null)` (not just the old `setSelectedMessage(null)` pattern), and update any `onReply`, `onCopy`, `onForward`, `onEdit`, `onDeleteForMe`, `onDeleteForEveryone` callbacks to call `setShowActionMenu(false)` instead of the old `setSelectedMessage(null)` where appropriate in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Dependencies

```
T001 (state setup)
  └─ T002 (groupReactions helper)
      └─ T003 (handleReact — uses groupReactions logic)
          ├─ T004 + T005 + T006 (US1 — QuickReactionBar)
          ├─ T007 + T008 (US2 — EmojiPickerModal)
          └─ T009 + T010 (US3 — pills rendering)
              └─ T011 (US4/5 — verify toggle logic)
                  └─ T012 + T013 (polish — parallel)
```

## Parallel Opportunities

- T004 and T007 can be written in parallel (separate component files, no shared dependencies mid-phase)
- T009 and T010 can be combined into one pass (same area of ChatScreen)
- T012 and T013 can run in parallel (both polish tasks in the same file but non-overlapping lines)

---

## Task Count Summary

| Phase | Tasks | User Story |
|-------|-------|------------|
| Setup | 1 (T001) | — |
| Foundational | 2 (T002–T003) | — |
| US1 — Quick Bar | 3 (T004–T006) | US1 |
| US2 — Full Picker | 2 (T007–T008) | US2 |
| US3 — Pill Display | 2 (T009–T010) | US3 |
| US4/5 — Toggle/RT | 1 (T011) | US4 |
| Polish | 2 (T012–T013) | — |
| **Total** | **13** | |
