# Research: Media & UX Features (15-media-ux-features)

**Phase 0 — Unknowns resolved before design**

---

## Feature 4: Image Compression

### Decision: expo-image-manipulator
- **Decision**: Add `expo-image-manipulator` (not yet installed); integrate into `handleSendImage()` in `ChatScreen.tsx`
- **Rationale**: Already listed in Expo SDK and referenced in spec assumptions; zero native config needed for Expo Go
- **Alternatives considered**: `react-native-image-resizer` (requires native build, no Expo Go support)

### Decision: Compression threshold check
- **Decision**: Read file size via `expo-file-system` `getInfoAsync()` before compressing; skip if under 500KB
- **Rationale**: `expo-file-system` is already available in Expo SDK; no extra dependency
- **Alternatives considered**: Check after picker returns (but ImagePicker `fileSize` is unreliable on iOS)

### Decision: GIF detection
- **Decision**: Check `uri.toLowerCase().endsWith('.gif')` or MIME type from picker result (`type` field)
- **Rationale**: ImagePicker returns `mimeType` on newer Expo SDK versions; fallback to extension check

### Decision: Compression placement
- **Decision**: Compress inside `handleSendImage()` in `ChatScreen.tsx`, before the `uploadToSupabase()` call
- **Rationale**: Single integration point; compression is an upload concern, not a picker concern
- **Alternatives considered**: Compress on picker return — rejected because user may cancel after picker without sending

---

## Feature 5: Message Search (FTS5)

### Decision: FTS5 virtual table
- **Decision**: Add `messages_fts` FTS5 virtual table alongside existing `messages` table; populated via SQLite triggers
- **Rationale**: FTS5 is built into SQLite (no extra dependency); triggers keep index in sync automatically
- **Alternatives considered**: LIKE query on messages — rejected (too slow at scale); external search lib — rejected (overkill for local-only)

### Decision: FTS5 trigger strategy
- **Decision**: `AFTER INSERT` and `AFTER DELETE` triggers on `messages` to maintain `messages_fts`
- **Rationale**: Triggers execute atomically with inserts; no application-level sync needed
- **Note**: `UPDATE` is handled by delete + insert triggers (FTS5 doesn't support UPDATE directly)

### Decision: Search entry point
- **Decision**: Search icon in `ConversationsScreen` header (navigation header right button); expands to full-width search bar using Animated
- **Rationale**: Matches Messenger pattern; navigation header has right-button slot already used by settings gear — move gear to left or add search alongside
- **Alternatives considered**: Separate search screen — rejected (slower UX)

### Decision: Result navigation
- **Decision**: `navigation.navigate('Chat', { conversationId, highlightMessageId })` — ChatScreen reads `highlightMessageId` from route params and scrolls to it using FlatList `scrollToIndex`
- **Rationale**: No new screen needed; ChatScreen already accepts route params

### Decision: Minimum query length
- **Decision**: 3 characters minimum, 300ms debounce
- **Rationale**: Matches spec FR-5-007; FTS5 handles short queries but 3-char minimum avoids excessive results

---

## Feature 6: Shared Media Gallery

### Decision: Screen location
- **Decision**: New screen `MediaGalleryScreen` in `apps/mobile/src/features/chat/`; accessed from ChatScreen header via a new 3-dot `...` menu (HeaderMenu component)
- **Rationale**: Keeps it in the chat feature folder; ChatScreen header currently has no 3-dot menu — adding one is non-breaking

### Decision: Data source
- **Decision**: Query SQLite `messages` table filtered by `type IN ('image', 'video', 'file')` for the given `conversationId`; paginated with LIMIT 50 OFFSET
- **Rationale**: All media URLs are already stored in `media_url`; no new columns needed
- **Alternatives considered**: Separate media table — rejected (redundant; messages table already stores all media metadata)

### Decision: Photo viewer
- **Decision**: Use `expo-image-viewer` or a custom full-screen Modal with FlatList + `pagingEnabled` for swipe navigation
- **Rationale**: No heavy third-party dependency; Expo Modal + FlatList is sufficient for ~50 items per page
- **Alternatives considered**: `react-native-image-viewing` — would work but adds a dependency

### Decision: Download
- **Decision**: `expo-file-system` `downloadAsync()` + `expo-media-library` `saveToLibraryAsync()` for photos; `expo-file-system` to DocumentDirectory for files
- **Rationale**: Both already available in Expo SDK; no native config needed

### Decision: Tabs
- **Decision**: Simple custom tab bar with 3 buttons (Photos, Videos, Files); not React Navigation tabs (avoids nested navigator complexity)
- **Rationale**: Simpler; media gallery is a single screen with tab state, not a full navigator

---

## Feature 7: Message Drafts

### Decision: Storage — MMKV REJECTED (Constitution violation)
- **Decision**: Use SQLite `drafts` table (new table in existing SQLite database)
- **Rationale**: Constitution explicitly prohibits MMKV due to Expo Go incompatibility. SQLite is the existing local storage layer; a `drafts` table is the natural fit.
- **Alternatives considered**: AsyncStorage — works in Expo Go but slower and lacks SQLite's transactional guarantees; MMKV — prohibited

### Decision: Draft table schema
- **Decision**: `drafts(conversation_id TEXT PRIMARY KEY, text TEXT NOT NULL, updated_at INTEGER NOT NULL)`
- **Rationale**: One row per conversation; `upsert` on every save; `conversation_id` as PK ensures deduplication

### Decision: Save debounce
- **Decision**: 500ms debounce via `useRef` timeout in ChatScreen; clear on unmount
- **Rationale**: Matches FR-7-001; simple and avoids DB writes on every keystroke

### Decision: Draft persistence layer
- **Decision**: New functions in `apps/mobile/src/shared/db/conversations.db.ts` — `saveDraft(conversationId, text)`, `getDraft(conversationId)`, `clearDraft(conversationId)`
- **Rationale**: Keeps all DB access in the existing db module; co-located with conversations logic

### Decision: Draft preview in ConversationsScreen
- **Decision**: Load all drafts at mount (single `getAllDrafts()` query); store in component state; re-load on focus
- **Rationale**: Avoids per-item DB call in the list; drafts table will have at most a handful of rows
