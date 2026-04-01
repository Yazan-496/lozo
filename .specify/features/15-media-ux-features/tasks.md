# Tasks: Media & UX Features (Image Compression, Message Search, Media Gallery, Message Drafts)

**Input**: `.specify/features/15-media-ux-features/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Organization**: Tasks grouped by feature (F4→F7) in recommended implementation order: Drafts → Compression → Search → Gallery

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependency and extend SQLite schema for all 4 features

- [ ] T001 Install `expo-image-manipulator` package in `apps/mobile/package.json` (run `npx expo install expo-image-manipulator`)
- [ ] T002 Add `drafts` table to SQLite schema in `apps/mobile/src/shared/db/sqlite.ts` — `CREATE TABLE IF NOT EXISTS drafts (conversation_id TEXT PRIMARY KEY, text TEXT NOT NULL, updated_at INTEGER NOT NULL)`
- [ ] T003 Add `messages_fts` FTS5 virtual table + INSERT/DELETE triggers to `apps/mobile/src/shared/db/sqlite.ts` — call `initFts()` inside `initDb()`

**Checkpoint**: Package installed, SQLite schema extended with `drafts` and `messages_fts` tables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB access functions and types shared across features

- [ ] T004 [P] Add draft DB functions (`saveDraft`, `getDraft`, `clearDraft`, `getAllDrafts`) to `apps/mobile/src/shared/db/conversations.db.ts`
- [ ] T005 [P] Create `apps/mobile/src/shared/db/search.db.ts` — export `searchMessages(query: string): SearchResult[]` using FTS5 MATCH query with `snippet()` function
- [ ] T006 [P] Create `apps/mobile/src/shared/db/media.db.ts` — export `getMediaByType(conversationId, type, limit, offset): MediaItem[]`
- [ ] T007 [P] Add `SearchResult`, `MediaItem`, `Draft` TypeScript interfaces to `apps/mobile/src/shared/types/index.ts`

**Checkpoint**: All DB functions ready — features can now be implemented independently

---

## Phase 3: Feature 7 — Message Drafts Auto-Save (Priority: P1) 🎯 MVP

**Goal**: Auto-save text draft per conversation; restore on return; show "Draft:" preview in list

**Independent Test**: Type in ChatScreen, navigate away, return — draft text should be restored. Conversation list should show italic red "Draft: ..." preview.

### Implementation

- [ ] T008 [US7] Add draft auto-save to `apps/mobile/src/features/chat/ChatScreen.tsx` — `useRef` debounce timer (500ms); call `saveDraft(conversationId, value)` on text change; call `clearDraft(conversationId)` on send; restore draft in `useEffect` on mount
- [ ] T009 [US7] Add `useFocusEffect` draft loading to `apps/mobile/src/features/chat/ConversationsScreen.tsx` — call `getAllDrafts()` on focus; store in local state
- [ ] T010 [US7] Update conversation list item render in `apps/mobile/src/features/chat/ConversationsScreen.tsx` — if `drafts[item.conversationId]` exists, show italic `"Draft: [preview]"` text in color `#E74C3C` instead of normal last message preview

**Checkpoint**: Drafts persist across navigation and app restarts; "Draft:" label shows in conversation list

---

## Phase 4: Feature 4 — Image Compression Before Upload (Priority: P1)

**Goal**: Compress images over 500KB to max 1920×1920 / 80% JPEG before Supabase upload; show "Compressing..." indicator; skip GIFs

**Independent Test**: Pick a large photo (>500KB) from gallery and send — image should be compressed before upload. Pick a GIF — it uploads unchanged. Network tab (or log) shows smaller file size.

### Implementation

- [ ] T011 [US4] Add `isCompressing` state and compression logic to `apps/mobile/src/features/chat/ChatScreen.tsx` — inside `handleSendImage()`, before `uploadToSupabase()`: check file size via `FileSystem.getInfoAsync(uri)`, check if GIF via `mimeType`, call `manipulateAsync(uri, [{resize:{width:1920}}], {compress:0.8, format:SaveFormat.JPEG})`, compare sizes, fall back to original if compressed is larger or on error
- [ ] T012 [US4] Add "Compressing..." UI indicator to send button / attachment preview area in `apps/mobile/src/features/chat/ChatScreen.tsx` — show when `isCompressing === true`, disable send button during compression
- [ ] T013 [US4] Add compression failure toast in `apps/mobile/src/features/chat/ChatScreen.tsx` — on `manipulateAsync` catch: upload original + call existing toast utility with message "Couldn't compress, uploading original"

**Checkpoint**: Large images compress before upload; GIFs and small images skip compression; UI shows progress; failure falls back gracefully

---

## Phase 5: Feature 5 — Message Search (Priority: P1)

**Goal**: Tap search icon in Chats header → type query → see results grouped by conversation with highlighted matches → tap result to open chat at that message

**Independent Test**: Send a few messages containing distinct words, open search, type one of those words — results appear grouped by conversation with the word highlighted. Tap a result — ChatScreen opens and scrolls to that message.

### Implementation

- [ ] T014 [US5] Create `apps/mobile/src/features/chat/components/SearchBar.tsx` — animated component that expands from search icon; `TextInput` with 300ms debounce; clear/close button that collapses bar and restores conversation list
- [ ] T015 [US5] Create `apps/mobile/src/features/chat/components/SearchResults.tsx` — `SectionList` grouped by `conversationId`; each item shows conversation name + highlighted snippet; uses bold/colored text for matched portions extracted from `highlight` field
- [ ] T016 [US5] Add search icon + `SearchBar` to `ConversationsScreen` header in `apps/mobile/src/features/chat/ConversationsScreen.tsx` — toggle `isSearching` state; when `isSearching`, hide conversation list and show `SearchResults`; wire search query to `searchMessages()`
- [ ] T017 [US5] Add `highlightMessageId` route param handling to `apps/mobile/src/features/chat/ChatScreen.tsx` — on mount, if `route.params.highlightMessageId` present, find message index in FlatList data and call `flatListRef.current?.scrollToIndex()`; apply 1.5s fade-out yellow highlight animation on the matched message bubble
- [ ] T018 [US5] Register `MediaGallery` screen in navigation stack in `apps/mobile/src/navigation/index.tsx` and confirm `Chat` screen accepts `highlightMessageId` param in type definitions

**Checkpoint**: Search finds messages offline, results are grouped/highlighted, tapping navigates to message

---

## Phase 6: Feature 6 — Shared Media Gallery (Priority: P1)

**Goal**: 3-dot menu in ChatScreen header → "View Media" → screen with Photos/Videos/Files tabs; tap photo for fullscreen viewer; long-press for Forward/Download/Delete

**Independent Test**: Send a few images in a chat, open 3-dot menu, tap "View Media" — gallery opens showing sent photos in grid. Tap one — fullscreen viewer opens. Long-press — action sheet shows Forward, Download, Delete.

### Implementation

- [ ] T019 [US6] Create `apps/mobile/src/features/chat/components/HeaderMenu.tsx` — dropdown menu component triggered by `...` button; accepts array of `{label, onPress}` items; renders as absolute-positioned card below header
- [ ] T020 [US6] Add `HeaderMenu` to `ChatScreen` header in `apps/mobile/src/features/chat/ChatScreen.tsx` — add `...` button to header right; menu item "View Media" navigates to `MediaGallery` screen with `conversationId`
- [ ] T021 [US6] Create `apps/mobile/src/features/chat/components/MediaGrid.tsx` — 3-column `FlatList` with date `SectionList` headers; renders `Image` thumbnails for photos; calls `onEndReached` to load next 50 items; empty state "No photos shared yet"
- [ ] T022 [US6] Create `apps/mobile/src/features/chat/components/MediaFullscreenViewer.tsx` — `Modal` with horizontal `FlatList` (`pagingEnabled`); shows full-res image; swipe left/right to navigate; close button
- [ ] T023 [US6] Create `apps/mobile/src/features/chat/MediaGalleryScreen.tsx` — 3-tab layout (Photos, Videos, Files); Photos/Videos use `MediaGrid`; Files tab uses `FlatList` list layout with icon, name, size, date; long-press triggers action sheet with Forward (opens existing `ForwardModal`), Download (`FileSystem.downloadAsync` + `MediaLibrary.saveToLibraryAsync`), Delete (calls delete message API); paginated loading via `getMediaByType()`
- [ ] T024 [US6] Add `MediaGallery` to navigation stack in `apps/mobile/src/navigation/index.tsx` — `Stack.Screen name="MediaGallery" component={MediaGalleryScreen}` with header title "Media"

**Checkpoint**: Media gallery accessible from ChatScreen; all 3 tabs work; fullscreen viewer navigable; download saves to device

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, empty states, and UX consistency across all 4 features

- [ ] T025 [P] Verify FTS5 backfill — existing messages before T003 migration have no FTS entries; add one-time backfill query in `initFts()` in `apps/mobile/src/shared/db/sqlite.ts`: `INSERT INTO messages_fts SELECT id, conversation_id, content FROM messages WHERE content IS NOT NULL`
- [ ] T026 [P] Add `maxLength={5000}` guard to draft save in `apps/mobile/src/features/chat/ChatScreen.tsx` — TextInput already has `maxLength: 5000`, confirm `saveDraft` also truncates to 5000 chars
- [ ] T027 [P] Add "No results for '[term]'" empty state to `SearchResults.tsx` when results array is empty
- [ ] T028 [P] Add offline guard for FTS search in `apps/mobile/src/shared/db/search.db.ts` — FTS5 is local-only so search always works; add try/catch and return empty array on DB error
- [ ] T029 Verify EXIF orientation preserved in image compression — `expo-image-manipulator` preserves orientation by default when no `rotate` action is passed; add code comment in `ChatScreen.tsx` compression block

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001–T003 must be complete)
- **Phase 3 (F7 Drafts)**: Depends on Phase 2 (T004 required)
- **Phase 4 (F4 Compression)**: Depends on Phase 1 (T001 required); independent of F7
- **Phase 5 (F5 Search)**: Depends on Phase 2 (T005 required)
- **Phase 6 (F6 Gallery)**: Depends on Phase 2 (T006 required)
- **Phase 7 (Polish)**: Depends on all feature phases

### Feature Independence

- **F7 (Drafts)**: Independent after T002 + T004
- **F4 (Compression)**: Independent after T001; no DB dependency
- **F5 (Search)**: Independent after T003 + T005
- **F6 (Gallery)**: Independent after T006

### Parallel Opportunities

Phase 2: T004, T005, T006, T007 all touch different files — run in parallel
Phase 3+4: F7 and F4 can be implemented in parallel (different files)
Phase 5+6: F5 and F6 can be implemented in parallel after Phase 2
Phase 7: T025–T029 all touch different files — run in parallel

---

## Parallel Example: Phase 2

```
Parallel group:
  Task T004: Add draft functions to conversations.db.ts
  Task T005: Create search.db.ts
  Task T006: Create media.db.ts
  Task T007: Add types to index.ts
```

---

## Implementation Strategy

### MVP First (Drafts only — smallest scope)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: T004 only
3. Complete Phase 3: T008–T010
4. **STOP and VALIDATE**: Drafts work in Expo Go
5. Continue with F4, F5, F6 in any order

### Incremental Delivery

1. Setup (T001–T003) → Foundation
2. F7 Drafts (T004, T008–T010) → Draft persistence ✅
3. F4 Compression (T001, T011–T013) → Bandwidth savings ✅
4. F5 Search (T003, T005, T007, T014–T018) → Message discoverability ✅
5. F6 Gallery (T006, T007, T019–T024) → Media browsing ✅
6. Polish (T025–T029) → Edge cases ✅

---

## Notes

- All 4 features are independent after Phase 2; can be done in any order
- F7 is the simplest — good warm-up before tackling F5/F6
- F6 (Gallery) has the most tasks and new components — tackle last
- No backend changes required for any feature
- MMKV is **not used** — drafts are stored in SQLite per constitution constraint
- `expo-image-manipulator` must be installed before any compression code is added
- FTS5 backfill (T025) is important — without it, existing messages won't be searchable
