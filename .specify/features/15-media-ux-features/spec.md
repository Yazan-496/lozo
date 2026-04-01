# Feature Specification: Media & UX Features (Image Compression, Message Search, Media Gallery, Message Drafts)

**Feature Branch**: `15-media-ux-features`
**Created**: 2026-04-01
**Status**: Draft
**Input**: Features 4–7 from the project backlog

---

## Feature 4: Image Compression Before Upload

### User Scenarios

#### User Story 4.1 - Image Is Automatically Compressed Before Sending (Priority: P1)

When a user selects a photo from gallery or takes a camera photo and taps send, the image is silently compressed on the device before upload. A brief "Compressing..." indicator appears, then the message sends as normal.

**Acceptance Scenarios**:

1. **Given** a user selects a gallery photo larger than 500KB, **When** they tap send, **Then** "Compressing..." appears, the image is compressed, and the smaller version is uploaded.
2. **Given** a user takes a camera photo, **When** they tap send, **Then** the same compression applies before upload.
3. **Given** the image is already under 500KB, **When** the user sends it, **Then** no compression is applied and the original uploads without delay.
4. **Given** the image is a GIF, **When** the user sends it, **Then** no compression is applied and the original GIF uploads unchanged.

#### User Story 4.2 - Graceful Fallback When Compression Fails (Priority: P2)

If compression fails, the original image is uploaded silently and a brief warning toast appears. The message still sends.

**Acceptance Scenarios**:

1. **Given** compression fails, **When** the failure is detected, **Then** the original image uploads and a toast shows: "Couldn't compress, uploading original".
2. **Given** the original is uploaded after failure, **When** upload completes, **Then** the conversation continues normally.

#### Edge Cases (Feature 4)

- Image already within 1920×1920 → quality compression only (80% JPEG), no resize.
- Compressed output larger than original → upload original instead.
- EXIF orientation → preserved during compression.

### Requirements (Feature 4)

- **FR-4-001**: Compression MUST apply to all images from camera or gallery before upload.
- **FR-4-002**: Images under 500KB MUST NOT be compressed.
- **FR-4-003**: GIF files MUST NOT be compressed.
- **FR-4-004**: Compressed images MUST NOT exceed 1920×1920 pixels; aspect ratio MUST be preserved.
- **FR-4-005**: Compression quality MUST be 80% JPEG.
- **FR-4-006**: EXIF orientation MUST be preserved.
- **FR-4-007**: A "Compressing..." indicator MUST be visible during compression.
- **FR-4-008**: On failure: upload original + show toast "Couldn't compress, uploading original".
- **FR-4-009**: If compressed output is larger than original, upload original instead.

### Success Criteria (Feature 4)

- **SC-4-001**: Images over 500KB are reduced by at least 30% on average.
- **SC-4-002**: "Compressing..." indicator appears within 100ms of tapping send.
- **SC-4-003**: Compression completes in under 3 seconds for images up to 12MP.
- **SC-4-004**: 100% of GIFs and sub-500KB images upload unmodified.
- **SC-4-005**: 100% of messages send successfully even when compression fails.

---

## Feature 5: Message Search (Local Full-Text Search)

### User Scenarios

#### User Story 5.1 - Search Messages From Conversations Screen (Priority: P1)

A user taps the search icon in the Chats screen header. As they type, results appear in real-time grouped by conversation. Tapping a result opens the chat and scrolls to that message with a brief highlight.

**Acceptance Scenarios**:

1. **Given** the user taps the search icon in the Chats header, **When** the search bar appears, **Then** they can start typing immediately.
2. **Given** the user types a search term, **When** results are available, **Then** they appear grouped by conversation with matching text highlighted.
3. **Given** the user taps a result, **When** the chat opens, **Then** it scrolls to the matched message and briefly highlights it.
4. **Given** the user taps the clear/close button, **When** search is dismissed, **Then** the normal conversation list is restored.
5. **Given** the device is offline, **When** the user searches, **Then** results still appear from local cache — no network needed.

#### User Story 5.2 - Search Works on Media Captions (Priority: P2)

Search finds messages by text content and by captions on photos/videos.

**Acceptance Scenarios**:

1. **Given** a photo was sent with a caption, **When** the user searches for words in the caption, **Then** that message appears in results.

#### Edge Cases (Feature 5)

- No results → show "No results for '[term]'" empty state.
- Query under 3 characters → debounce, don't search yet.
- Special characters → treated as plain text.

### Requirements (Feature 5)

- **FR-5-001**: A search icon MUST appear in the Chats screen header; tapping it reveals a search bar.
- **FR-5-002**: Search MUST cover message text content and media captions only.
- **FR-5-003**: Search MUST work fully offline using local stored messages.
- **FR-5-004**: Results MUST be grouped by conversation.
- **FR-5-005**: Matching text MUST be highlighted in results.
- **FR-5-006**: Tapping a result MUST open the conversation and scroll to the matched message with a brief highlight.
- **FR-5-007**: Search input MUST be debounced; minimum 3 characters before firing.
- **FR-5-008**: A clear/close button MUST dismiss the search bar and restore the conversation list.

### Success Criteria (Feature 5)

- **SC-5-001**: Results appear within 300ms of the user pausing input (up to 10,000 messages).
- **SC-5-002**: Tapping a result navigates to the exact message in under 1 second.
- **SC-5-003**: Search works with no network connection, same results as online.
- **SC-5-004**: Matched text is highlighted in 100% of results.

---

## Feature 6: Shared Media Gallery

### User Scenarios

#### User Story 6.1 - Browse All Shared Media in a Conversation (Priority: P1)

From the ChatScreen 3-dot menu, a user opens "View Media" to see all photos, videos, and files shared in a conversation, organized into three tabs with date section headers.

**Acceptance Scenarios**:

1. **Given** the user taps the 3-dot menu in a chat and selects "View Media", **When** the screen opens, **Then** three tabs appear: Photos, Videos, Files.
2. **Given** the Photos tab is active, **When** the user views it, **Then** images appear in a 3-column grid with date section headers.
3. **Given** the Files tab is active, **When** the user views it, **Then** files appear in a list with icon, name, size, and date.
4. **Given** a tab has no content, **When** the user views it, **Then** "No photos shared yet" empty state appears.
5. **Given** more than 50 items exist, **When** the user scrolls to the bottom, **Then** the next 50 items load automatically.

#### User Story 6.2 - View and Interact With Media Items (Priority: P2)

Tapping a photo opens a full-screen viewer with swipe navigation. Long-pressing any item shows Forward, Download, Delete options.

**Acceptance Scenarios**:

1. **Given** the user taps a photo, **When** the viewer opens, **Then** they can swipe left/right to navigate between photos.
2. **Given** the user long-presses any item, **When** the action sheet appears, **Then** Forward, Download, Delete options are available.
3. **Given** the user taps Download, **When** done, **Then** the file is saved to device storage.

#### Edge Cases (Feature 6)

- No media in conversation → all tabs show empty state immediately.
- Deleting from gallery → also removes from conversation.

### Requirements (Feature 6)

- **FR-6-001**: "View Media" MUST appear in the ChatScreen 3-dot header menu.
- **FR-6-002**: The gallery MUST have three tabs: Photos, Videos, Files.
- **FR-6-003**: Photos and Videos MUST display in a 3-column grid.
- **FR-6-004**: Files MUST display in a list with icon, name, size, and date.
- **FR-6-005**: Each tab MUST show date section headers.
- **FR-6-006**: Each tab MUST show an empty state when no content exists.
- **FR-6-007**: Tapping a photo MUST open a full-screen viewer with swipe navigation.
- **FR-6-008**: Long-pressing any item MUST show Forward, Download, Delete actions.
- **FR-6-009**: Download MUST save the file to device storage.
- **FR-6-010**: Items MUST load in pages of 50 from local storage.

### Success Criteria (Feature 6)

- **SC-6-001**: Gallery opens in under 500ms from tapping "View Media".
- **SC-6-002**: A grid of 50 photos renders without visible lag on a mid-range device.
- **SC-6-003**: Full-screen viewer opens in under 300ms from tapping a photo.
- **SC-6-004**: Downloaded files are accessible in device storage within 5 seconds (files under 10MB).

---

## Feature 7: Message Drafts Auto-Save

### User Scenarios

#### User Story 7.1 - Draft Is Saved and Restored Automatically (Priority: P1)

When a user starts typing and leaves without sending, the draft is saved automatically. When they return, the draft text is restored in the input field.

**Acceptance Scenarios**:

1. **Given** a user types in the chat input and navigates away, **When** they return, **Then** the draft text is restored in the input field.
2. **Given** the app is fully closed and reopened, **When** the user returns to that conversation, **Then** the draft is still there.
3. **Given** a user sends a message, **When** the send completes, **Then** the draft for that conversation is cleared.
4. **Given** a draft exists, **When** the user views the Chats list, **Then** the preview shows italic "Draft: [text]" in red/orange.

#### User Story 7.2 - Draft Limits Are Enforced (Priority: P2)

Drafts are capped at 5000 characters. Media attachments are not saved as drafts.

**Acceptance Scenarios**:

1. **Given** the user types more than 5000 characters, **When** they reach the limit, **Then** input stops accepting new characters.
2. **Given** the user attaches media but no text, **When** they leave, **Then** no draft is saved.

#### Edge Cases (Feature 7)

- User leaves with no text typed → no draft saved.
- Multiple conversations → each has its own independent draft keyed by `conversationId`.

### Requirements (Feature 7)

- **FR-7-001**: Draft text MUST be auto-saved as the user types, debounced at 500ms after last keystroke.
- **FR-7-002**: Draft MUST be restored when ChatScreen mounts for that conversation.
- **FR-7-003**: Draft MUST be cleared after a message is sent.
- **FR-7-004**: Drafts MUST persist across full app restarts.
- **FR-7-005**: The Chats list MUST show italic "Draft: [preview]" in red/orange for conversations with unsent drafts.
- **FR-7-006**: Only text drafts are saved — media attachments are discarded on exit.
- **FR-7-007**: One draft per conversation, maximum 5000 characters.

### Success Criteria (Feature 7)

- **SC-7-001**: Draft is saved within 500ms of the user stopping typing.
- **SC-7-002**: Draft is restored in the input field within 100ms of ChatScreen mounting.
- **SC-7-003**: "Draft:" label appears for 100% of conversations with unsent drafts.
- **SC-7-004**: Drafts survive full app restart in 100% of cases.
- **SC-7-005**: No draft is saved for media-only exits — 0 false positives in the Chats list.

---

## Shared Assumptions

- All features target 1:1 conversations only; group chat variants are out of scope.
- All local storage (search index, drafts, media metadata) comes from the existing SQLite message store.
- `expo-image-manipulator` is available in the current Expo SDK.
- MMKV is available for drafts storage (confirmed in project constitution — note: verify Expo Go compatibility).
- No new backend endpoints are required for any of these 4 features.
- Features 4–7 are independent and can be implemented in any order.
