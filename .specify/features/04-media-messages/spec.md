# Feature Specification: Media Messages

**Status**: Draft
**Created**: 2026-03-26
**Last Updated**: 2026-03-26
**Spec**: 04 of 12

---

## Overview

Enable users to send and receive photos, voice recordings, and files in 1:1 conversations, matching the media messaging experience of Facebook Messenger. Users can attach media via a dedicated attachment button, preview before sending, and interact with received media inline in the chat.

## Problem Statement

LoZo currently supports text-only messaging. Modern messaging apps are built around rich media — sharing a photo, sending a voice note, or forwarding a document is as natural as typing. Without media support, the app is incomplete and users must leave the app to share anything beyond text.

---

## Goals & Objectives

1. Users MUST be able to send photos from their device gallery
2. Users MUST be able to take a photo with the device camera and send it
3. Users MUST be able to record and send voice messages directly in chat
4. Users MUST be able to attach and send files of any type
5. Received images MUST be viewable full-screen with zoom support
6. Received voice messages MUST be playable inline in the chat
7. Received files MUST be openable from the chat
8. Upload progress MUST be visible while media is being sent

---

## User Scenarios & Testing

### Scenario 1: Send a Photo from Gallery

**As a** user in a conversation,
**I want to** share a photo from my device,
**So that** I can show something to the other person without leaving the app.

**Acceptance criteria:**
- Tapping the attachment button shows a bottom sheet with Gallery, Camera, and File options
- Selecting Gallery opens the device photo library
- Selecting one photo shows a full-screen preview with "Send" and "Cancel" buttons
- Tapping Send uploads the image and sends it as a message
- The image appears as a thumbnail in the chat bubble immediately (with upload progress overlay)
- Once upload completes, the progress overlay disappears
- The other participant receives the image within 2 seconds

### Scenario 2: Take and Send a Photo

**As a** user in a conversation,
**I want to** take a fresh photo and send it immediately,
**So that** I can share something happening right now.

**Acceptance criteria:**
- Selecting Camera opens the device camera
- After capturing, the photo shows in the same preview screen as gallery selection
- Tapping Send proceeds identically to the gallery flow

### Scenario 3: Send a Voice Message

**As a** user in a conversation,
**I want to** send a voice note by holding the microphone button,
**So that** I can communicate naturally without typing.

**Acceptance criteria:**
- Holding the microphone button starts recording immediately
- While recording: elapsed time counter is visible + animated waveform bars (3–4 bars)
- Releasing the button sends the voice message
- Swiping left while holding (or tapping a cancel button) discards the recording without sending
- Minimum recording duration: 1 second (shorter recordings are discarded with feedback)
- The voice message appears in chat with a play/pause button, duration, and a static waveform visual
- Tapping play starts playback; tapping pause stops it
- The other participant can play the voice message on their device

### Scenario 4: Send a File

**As a** user in a conversation,
**I want to** share a document or file,
**So that** I can send work files, PDFs, or any other document.

**Acceptance criteria:**
- Selecting File from the attachment sheet opens the device file picker
- After selection: the file message is sent immediately (no preview step)
- In chat: the file message shows a file icon, the file name, and file size
- Tapping the file message opens it on the device (using the device's default handler)

### Scenario 5: View an Image Full-Screen

**As a** user who received an image,
**I want to** view it full-screen with zoom,
**So that** I can see it clearly.

**Acceptance criteria:**
- Tapping an image thumbnail opens a full-screen image viewer
- The viewer supports pinch-to-zoom
- Swiping down dismisses the viewer and returns to the chat
- The viewer shows a close/back button

---

## Functional Requirements

### FR-1: Attachment Entry Point

- FR-1.1: A dedicated attachment button MUST be visible in the chat input bar alongside the text input and send button
- FR-1.2: Tapping the attachment button MUST open a bottom sheet with three options: Gallery, Camera, File
- FR-1.3: The bottom sheet MUST be dismissible by tapping outside it or swiping down
- FR-1.4: The attachment button MUST be disabled while an upload is in progress to prevent concurrent uploads

### FR-2: Image Messages (Gallery & Camera)

- FR-2.1: Gallery option MUST open the device photo library limited to single-image selection
- FR-2.2: Camera option MUST open the device camera for single photo capture
- FR-2.3: After selection or capture, MUST display a full-screen preview with "Send" and "Cancel" buttons
- FR-2.4: Tapping Cancel MUST return to the chat with no message sent
- FR-2.5: Tapping Send MUST begin the upload immediately and show the image thumbnail in the chat with a progress overlay
- FR-2.6: The progress overlay MUST show a circular or linear progress indicator and disappear on completion
- FR-2.7: On upload failure, the message MUST show an error state with a retry option
- FR-2.8: Image thumbnails in chat MUST be capped at 240px wide, maintaining aspect ratio
- FR-2.9: Tapping an image thumbnail MUST open the full-screen image viewer

### FR-3: Full-Screen Image Viewer

- FR-3.1: The viewer MUST display the image at full screen
- FR-3.2: The viewer MUST support pinch-to-zoom (min 1×, max 4×)
- FR-3.3: Swiping down MUST dismiss the viewer with an animated transition
- FR-3.4: A close/back button MUST be present for users who do not discover swipe-to-dismiss
- FR-3.5: The viewer MUST show on a black background

### FR-4: Voice Messages

- FR-4.1: A microphone button MUST be visible in the chat input area
- FR-4.2: Holding the microphone button MUST start audio recording immediately
- FR-4.3: While recording, the input area MUST transform to show: elapsed time, animated waveform (3–4 bars), and a cancel affordance
- FR-4.4: Releasing the microphone button MUST stop recording and send the voice message (if ≥ 1 second)
- FR-4.5: Recordings under 1 second MUST be discarded silently (no message sent)
- FR-4.6: Swiping left on the microphone button while holding MUST cancel and discard the recording
- FR-4.7: A tap-to-cancel button MUST also be shown during recording as an alternative to swipe-cancel
- FR-4.8: Voice messages in chat MUST display: play/pause button, total duration, static waveform bar visual
- FR-4.9: Tapping play MUST start playback; tapping pause MUST pause it; playback position MUST update visually
- FR-4.10: Only one voice message MUST play at a time — starting a new one MUST stop any currently playing

### FR-5: File Messages

- FR-5.1: File option MUST open the device document picker supporting all file types
- FR-5.2: File messages MUST be sent immediately after selection (no preview step)
- FR-5.3: File messages in chat MUST display: file type icon, file name (truncated if long), and human-readable file size (e.g., "2.4 MB")
- FR-5.4: Tapping a file message MUST open the file using the device's default application for that file type
- FR-5.5: If the file cannot be opened, a user-facing error message MUST be shown

### FR-6: Upload & Error Handling

- FR-6.1: All media MUST be uploaded before the message is considered sent
- FR-6.2: Upload progress MUST be visible on the sending message bubble
- FR-6.3: Network failure during upload MUST leave the message in a failed state with a retry button
- FR-6.4: Tapping retry MUST re-attempt the upload without requiring the user to reselect the media

---

## Non-Functional Requirements

- **Upload time**: Images under 5 MB MUST upload and appear on both devices within 10 seconds on a typical mobile connection
- **Voice quality**: Voice recordings MUST be audible and clear on both Android and iOS playback
- **Permissions**: App MUST request camera, microphone, and media library permissions gracefully — denied permissions MUST show a clear explanation and link to device settings
- **File size limit**: Individual media uploads MUST be rejected above 50 MB with a user-facing error

---

## Success Criteria

1. A user can send a photo in under 5 taps from the chat screen
2. Voice messages record, send, and play back correctly on both participants' devices
3. File messages open correctly on the recipient's device using the device's default app
4. Upload progress is visible for every media message sent
5. Failed uploads can be retried without reselecting the file
6. Full-screen image viewer opens in under 300ms of tapping a thumbnail

---

## Key Entities

### MediaMessage (extends Message)
- `type`: `"image"` | `"voice"` | `"file"`
- `imageUrl`: URL of uploaded image (type: image)
- `audioUrl`: URL of uploaded audio file (type: voice)
- `audioDuration`: Duration in seconds (type: voice)
- `fileUrl`: URL of uploaded file (type: file)
- `fileName`: Original file name (type: file)
- `fileSize`: File size in bytes (type: file)
- `uploadProgress`: 0–100 (client-only, for optimistic UI during upload)

---

## Assumptions

1. The server `POST /upload` endpoint accepts multipart form data and returns `{ url: string }` — the URL is a public Supabase Storage URL valid indefinitely
2. The server `POST /chat/messages` already accepts `type`, `imageUrl`, `audioUrl`, `fileUrl`, `fileName`, `fileSize` fields
3. Voice messages are recorded and stored as `.m4a` (AAC) — compatible with both Android and iOS playback
4. The device file picker (Scenario 4) opens natively — no custom file browser is built
5. No upload size limit is enforced at the client beyond the 50 MB guard — server enforces its own limits
6. Media permissions are requested on first use, not at app startup
7. The attachment button replaces the microphone button when text is present in the input (same slot in input bar), matching Messenger's layout

---

## Out of Scope

- Video messages
- GIF picker or animated image support
- Image compression or resizing before upload
- Multi-image selection (single image per message only)
- Viewing message sender's full media history
- Downloading / saving received media to device gallery
- Message search
- Audio waveform generation from recording data (static visual only)

---

## Dependencies

- Spec 01 (UX Foundation) — Toast system for error and permission feedback
- Spec 02 (Message Actions) — `renderMessage` in ChatScreen extended with new media bubble types
- Device permissions: camera, microphone, media library (requested at runtime)
- Server endpoints: `POST /upload`, `POST /chat/messages` (already exist)
- Packages needed: `expo-image-picker`, `expo-document-picker`, `expo-av`, `expo-sharing` (all Expo Go compatible)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| User denies camera/microphone permission | Feature unusable | Show permission rationale before requesting; show settings link if denied |
| Large file stalls or fails silently | Message stuck in uploading state | Enforce 50 MB client-side limit; add upload timeout with failure state |
| Voice playback incompatibility across platforms | Voice messages unplayable | Use m4a/AAC format — universally supported on iOS and Android |
| expo-av recording behaves differently on Xiaomi/MIUI | Recording starts or stops unexpectedly | Test on target device; document known MIUI audio quirks |
