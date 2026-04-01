# Tasks: Media Messages

**Feature**: 04 — Media Messages
**Plan**: [plan.md](plan.md)
**Spec**: [spec.md](spec.md)
**Generated**: 2026-03-26

---

## Implementation Strategy

MVP = US1+US2 (image sending) + US5 (full-screen viewer) — gives a complete image send/receive/view loop.
US3 (voice) and US4 (file) build independently on the same foundational state and upload helper.

All tasks are purely mobile (React Native). No server changes.

---

## Phase 1 — Setup

- [X] T001 Install `expo-image-picker`, `expo-document-picker`, `expo-av`, and `expo-sharing` by running `npx expo install expo-image-picker expo-document-picker expo-av expo-sharing` in `apps/mobile/`

- [X] T002 Add permission plugin entries to the `plugins` array in `apps/mobile/app.json`: `["expo-image-picker", { "photosPermission": "Allow LoZo to access your photos to send images.", "cameraPermission": "Allow LoZo to use your camera to take photos." }]` and `["expo-av", { "microphonePermission": "Allow LoZo to access your microphone to send voice messages." }]`

- [X] T003 [P] Create `apps/mobile/src/shared/utils/media.ts` with two exported helpers: `formatFileSize(bytes: number): string` (returns "340 KB", "1.2 MB", etc.) and `formatDuration(seconds: number): string` (returns "0:12", "1:05" format)

---

## Phase 2 — Foundational

- [X] T004 Add all new state variables and refs to `ChatScreen` in `apps/mobile/src/features/chat/ChatScreen.tsx`: `showAttachmentSheet`, `previewImageUri`, `isSendingMedia`, `viewingImageUrl`, `isRecording`, `recordingDuration`, `playingMessageId`, `uploadProgressMap` (state) + `recordingRef`, `recordingTimerRef`, `activeSoundRef` (refs)

- [X] T005 Add `uploadMedia(uri, mimeType, fileName)` async helper function inside `ChatScreen` that builds a `FormData`, posts to `${BASE_URL}/api/upload` with `multipart/form-data` and `Authorization` header via `axios` (imported directly, not via `api` instance), and returns the CDN URL string — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T006 Add all new imports to `apps/mobile/src/features/chat/ChatScreen.tsx`: `* as ImagePicker from 'expo-image-picker'`, `* as DocumentPicker from 'expo-document-picker'`, `{ Audio } from 'expo-av'`, `{ Linking, ActivityIndicator }` from react-native, `{ formatFileSize, formatDuration } from '../../shared/utils/media'`, `{ BASE_URL } from '../../shared/services/api'`, and placeholder imports for the 5 new components (will be created in later tasks)

---

## Phase 3 — User Stories 1 & 2: Image Messages (Gallery + Camera)

**Story goal**: User taps attachment button → picks from gallery or takes a photo → sees full-screen preview → taps Send → image appears in chat as thumbnail.

**Independent test criteria**: Attachment button visible in input bar. Tapping opens sheet with Gallery/Camera/File. Selecting gallery/camera shows preview screen. Tapping Send shows thumbnail in chat immediately. Thumbnail is visible within 2 seconds on both devices.

- [X] T007 [US1] Create `AttachmentSheet` component in `apps/mobile/src/features/chat/components/AttachmentSheet.tsx` — slide-up `Modal` (same `Animated.spring` slide pattern as `EmojiPickerModal`), sheet height ~200px from bottom, 3 option rows (Gallery with image icon, Camera with camera icon, File with document icon from `@expo/vector-icons/Ionicons`), backdrop `TouchableOpacity` to close, props: `{ visible, onClose, onGallery, onCamera, onFile }`

- [X] T008 [US1] Add `handlePickImage(source: 'gallery' | 'camera')` function to `ChatScreen` that calls `ImagePicker.launchImageLibraryAsync` (gallery) or `ImagePicker.launchCameraAsync` (camera) with `mediaTypes: ['images'], quality: 0.85`, closes the attachment sheet, and sets `previewImageUri` to the selected asset URI if not canceled — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T009 [US1] Create `ImagePreviewScreen` component in `apps/mobile/src/features/chat/components/ImagePreviewScreen.tsx` — full-screen `Modal` with `animationType="slide"`, black background, `Image` source={uri} with `resizeMode="contain"` filling the screen, bottom bar with "Cancel" (left, white text) and "Send" (right, `colors.primary` button) — Send shows `ActivityIndicator` and is disabled when `isSending=true`, props: `{ visible, uri: string | null, onSend, onCancel, isSending }`

- [X] T010 [US1] Add `handleSendImage()` async function to `ChatScreen` that: (1) creates a temp `Message` object with `type: 'image'` and `mediaUrl: previewImageUri` (local URI for immediate display), inserts it at the front of messages, clears `previewImageUri`, (2) calls `uploadMedia()` to get CDN URL, (3) calls `api.post('/chat/messages', { conversationId, type: 'image', imageUrl: url })`, (4) replaces temp message with server response, (5) on error shows toast and removes temp message — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T011 [US1] Modify the input bar in `ChatScreen` to add an attachment `TouchableOpacity` button (paperclip `@expo/vector-icons/Ionicons attach-outline` icon, size 24, `colors.gray400`) to the left of the `TextInput`, and add `<AttachmentSheet>` and `<ImagePreviewScreen>` renders to the ChatScreen return alongside existing modals — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T012 [US2] Replace the existing `{item.type === 'image' && <Text>📷 Photo</Text>}` placeholder in `renderMessage` in `ChatScreen` with a `TouchableOpacity` wrapping an `<Image source={{ uri: item.mediaUrl }}` style `{ width: 200, height: 200, borderRadius: 12 }` that calls `setViewingImageUrl(item.mediaUrl)` on press — in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 4 — User Story 3: Voice Messages

**Story goal**: User holds the mic button to record, releases to send; voice messages appear with play/pause controls; only one plays at a time.

**Independent test criteria**: Mic button visible when text input is empty. Holding starts recording with elapsed timer. Releasing sends (if ≥1s). Voice bubble shows in chat. Tap play → audio plays. Tap pause → stops. Starting another voice message stops the current one.

- [X] T013 [US3] Add `startRecording()`, `stopAndSendRecording()`, and `cancelRecording()` functions to `ChatScreen` following the plan's code: `startRecording` requests Audio permission, calls `Audio.Recording.createAsync(HIGH_QUALITY)`, starts a 100ms `setInterval` incrementing `recordingDuration`; `stopAndSendRecording` stops recording, discards if < 1000ms, otherwise creates temp message, uploads `.m4a`, posts to `/chat/messages` with `type: 'voice'`; `cancelRecording` clears timer and discards — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T014 [US3] Modify the input bar in `ChatScreen` to show a mic `TouchableOpacity` button (`mic-outline` icon) with `onPressIn={startRecording}` + `onPressOut={stopAndSendRecording}` when `text.trim() === ''` (replacing the send button in that slot); when `isRecording=true`, hide the TextInput and attachment button and instead render: a cancel `TouchableOpacity` (left), a recording indicator View (center: red dot + elapsed time as `formatDuration(recordingDuration/1000)` + 3 animated opacity bars), and a swipe hint Text — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T015 [US3] Create `VoiceMessageBubble` component in `apps/mobile/src/features/chat/components/VoiceMessageBubble.tsx` — row layout: play/pause `TouchableOpacity` (▶ or ⏸ text/icon), 4 static `View` bars with heights `[16, 24, 20, 28]` and `borderRadius: 2`, duration `Text` (`formatDuration(duration)`); when `isMe`: bars and text are white/semi-transparent; when other: bars are `colors.primary`, text is `colors.gray500`; props: `{ messageId, audioUrl, duration, isPlaying, isMe, onPlay, onPause }`

- [X] T016 [US3] Add `handlePlayVoice(messageId, audioUrl)` async function to `ChatScreen` that stops and unloads any `activeSoundRef.current`, returns if `playingMessageId === messageId` (toggle off), otherwise creates `Audio.Sound` and plays it, sets `playingMessageId`, uses `setOnPlaybackStatusUpdate` to clear `playingMessageId` when playback finishes — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T017 [US3] Replace the `{item.type === 'voice' && <Text>🎤 Voice message</Text>}` placeholder in `renderMessage` with `<VoiceMessageBubble>` passing `messageId={item.id}`, `audioUrl={item.mediaUrl!}`, `duration={item.mediaDuration ?? 0}`, `isPlaying={playingMessageId === item.id}`, `isMe={isMe}`, `onPlay` and `onPause` both calling `handlePlayVoice(item.id, item.mediaUrl!)` — in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 5 — User Story 4: File Messages

**Story goal**: User taps attachment → File → picks any document → file message appears in chat with name/size; tapping opens the file.

**Independent test criteria**: File option in attachment sheet opens document picker. File message shows file icon + name + size. Tapping file message opens it on device (PDF/doc/etc). Error shown if file cannot be opened.

- [X] T018 [US4] Add `handlePickFile()` async function to `ChatScreen` that calls `DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })`, creates a temp message with `type: 'file'`, `mediaName: asset.name`, `mediaSize: asset.size`, then calls `uploadMedia()` and posts to `/chat/messages` with `type: 'file'`, `fileUrl`, `fileName`, `fileSize` — replacing the temp message with the server response on success — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T019 [P] [US4] Create `FileBubble` component in `apps/mobile/src/features/chat/components/FileBubble.tsx` — `TouchableOpacity` row with `Ionicons document-outline` icon (size 28), `fileName` text truncated to 1 line, `formatFileSize(fileSize)` text; on press calls `Linking.openURL(fileUrl)` wrapped in try/catch showing error toast if it fails; props: `{ fileName, fileSize, fileUrl, isMe }` — color scheme matches bubble: white text on `isMe`, dark text on other

- [X] T020 [US4] Replace the `{item.type === 'file' && <Text>📎 {item.mediaName}</Text>}` placeholder in `renderMessage` with `<FileBubble fileName={item.mediaName ?? 'File'} fileSize={item.mediaSize ?? 0} fileUrl={item.mediaUrl!} isMe={isMe} />` — in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 6 — User Story 5: Full-Screen Image Viewer

**Story goal**: Tapping an image thumbnail opens a full-screen viewer with pinch-to-zoom; swiping down dismisses it.

**Independent test criteria**: Tapping image thumbnail opens black full-screen modal. Image fills screen. Swipe down → dismisses. Close button → dismisses. Pinch → scales image (1× to 4×).

- [X] T021 [US5] Create `ImageViewerModal` component in `apps/mobile/src/features/chat/components/ImageViewerModal.tsx` — full-screen `Modal transparent animationType="fade"` with black background; `Animated.Image` with `transform: [{ scale }, { translateY }]`; swipe-down `PanResponder` on the image: tracks single-finger `dy`, sets `translateY`, on release if `dy > 80` animates translateY to 600 then calls `onClose()`, else springs back; close button (top-right `×`) always visible; props: `{ visible, imageUrl: string | null, onClose }`

- [X] T022 [US5] Add pinch-to-zoom to `ImageViewerModal` using a second `PanResponder` that tracks two-pointer distance delta and updates the `scale` Animated.Value (min 1, max 4) — in `apps/mobile/src/features/chat/components/ImageViewerModal.tsx`

- [X] T023 [US5] Render `<ImageViewerModal visible={viewingImageUrl !== null} imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl(null)} />` in the `ChatScreen` return alongside other modals, and add the import — in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Phase 7 — Polish

- [X] T024 [P] Add upload progress overlay to the image thumbnail in `renderMessage`: when `uploadProgressMap[item.id]` exists, render a semi-transparent `View` overlay at the bottom of the thumbnail containing a `View` with `width: '${uploadProgressMap[item.id]}%'` and `height: 4` in `colors.primary` — remove from map when temp message is replaced — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T025 [P] Add a 50 MB file size guard in `handlePickFile()` and `handleSendImage()` — if the asset size exceeds `50 * 1024 * 1024` bytes, call `showToast('error', 'File too large (max 50 MB)')` and return early without sending — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T026 [P] Disable the attachment button while `isSendingMedia` is true by adding `disabled={isSendingMedia}` and `opacity: isSendingMedia ? 0.4 : 1` style to the attachment `TouchableOpacity` in the input bar — in `apps/mobile/src/features/chat/ChatScreen.tsx`

- [X] T027 [P] Add permission-denied handling: in `handlePickImage()` check `ImagePicker.requestMediaLibraryPermissionsAsync()` result before launching gallery (if denied, show toast with message "Go to Settings > LoZo to allow photo access"); in `startRecording()` check `Audio.requestPermissionsAsync()` result (if denied, show toast "Go to Settings > LoZo to allow microphone access") — in `apps/mobile/src/features/chat/ChatScreen.tsx`

---

## Dependencies

```
T001 → T002 → T003 (setup complete)
           ↓
T004 → T005 → T006 (foundational state + helpers)
           ↓
    ┌──────┼──────┬──────┐
    ↓      ↓      ↓      ↓
 US1/2   US3    US4    US5
T007-T012 T013-T017 T018-T020 T021-T023
    └──────┴──────┴──────┘
           ↓
        T024-T027 (polish — all parallel)
```

## Parallel Opportunities

- T003 (media.ts) can be written in parallel with T004 (state) and T006 (imports)
- T007 (AttachmentSheet), T009 (ImagePreviewScreen), T015 (VoiceMessageBubble), T019 (FileBubble) are all separate files — can be built in parallel
- T021+T022 (ImageViewerModal) can be built in parallel with voice/file phases
- T024, T025, T026, T027 (polish) are all independent — fully parallel

---

## Task Count Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | 3 (T001–T003) | — |
| Foundational | 3 (T004–T006) | — |
| US1+US2 — Image Messages | 6 (T007–T012) | US1/US2 |
| US3 — Voice Messages | 5 (T013–T017) | US3 |
| US4 — File Messages | 3 (T018–T020) | US4 |
| US5 — Image Viewer | 3 (T021–T023) | US5 |
| Polish | 4 (T024–T027) | — |
| **Total** | **27** | |
