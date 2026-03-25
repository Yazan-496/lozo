# Feature Specification: LoZo Full Messenger Clone

**Status**: Draft
**Created**: 2026-03-25
**Last Updated**: 2026-03-25
**Author**: Yazan

---

## Overview

Complete the LoZo mobile messaging application to achieve feature parity with Facebook Messenger for 1:1 conversations. This includes enhancing existing messaging with rich interactions, adding media message support, building offline-first architecture, polishing the user experience to professional standards, and deploying the server for production use.

## Problem Statement

LoZo currently has a functional but incomplete messaging experience. Users can send text messages and manage contacts, but critical features expected in a modern messenger are missing: media sharing, message actions (reply, edit, delete, react), offline support, and professional UX polish. The app feels like a prototype rather than a product users would trust for daily communication.

## Goals & Objectives

1. **Feature completeness**: Every interaction a user expects from Messenger (within 1:1 scope) MUST be available
2. **Professional UX**: Loading states, animations, error handling, and visual polish that matches a production app
3. **Reliability**: Messages MUST never be lost — offline queue ensures delivery when connectivity returns
4. **Performance**: Smooth 60fps interactions even with large conversation histories
5. **Deployable**: Server running in production on Koyeb, mobile pointing to live API

---

## User Scenarios & Testing

### Scenario 1: Rich Message Interactions

**As a** user viewing a conversation,
**I want to** long-press any message to see actions (reply, edit, delete, forward, react),
**So that** I can interact with messages the same way I do in Messenger.

**Acceptance criteria:**
- Long-pressing a message shows a context menu with available actions
- "Reply" quotes the original message above the input field
- "Edit" (own messages only) opens inline editing with save/cancel
- "Delete" shows options: "Delete for me" and "Delete for everyone" (own messages only)
- "Forward" opens a contact picker to forward the message
- "React" shows an emoji picker; selected emoji appears below the message bubble
- Swiping right on a message triggers reply (same as menu reply)

### Scenario 2: Sending Media Messages

**As a** user in a conversation,
**I want to** send photos, voice recordings, and files,
**So that** I can share rich content with my contacts.

**Acceptance criteria:**
- Tapping the attachment icon shows options: Gallery, Camera, File
- Selecting an image from gallery or taking a photo shows a preview before sending
- Holding the microphone button records audio; releasing sends it
- Voice messages display a waveform with playback controls
- Files display name, size, and type icon
- Images in chat are tappable for full-screen view with pinch-to-zoom
- Media can be downloaded/saved to device

### Scenario 3: Offline Messaging

**As a** user with intermittent connectivity,
**I want to** compose and read messages offline,
**So that** my messaging experience is uninterrupted.

**Acceptance criteria:**
- All conversations and recent messages are cached locally
- Composing a message offline queues it with a "pending" indicator
- When connectivity returns, queued messages send automatically in order
- A network status indicator shows when the app is offline
- Previously loaded contacts and conversations are available offline

### Scenario 4: Profile & Account Management

**As a** user managing my account,
**I want to** upload an avatar, change my password, and configure settings,
**So that** I have full control over my identity and preferences.

**Acceptance criteria:**
- Profile screen allows picking an avatar from gallery or camera
- Avatar updates immediately after upload
- Change password requires current password + new password with confirmation
- Settings screen shows notification preferences per contact (mute/unmute)
- About section shows app version and info

### Scenario 5: Contact Management

**As a** user managing my contacts,
**I want to** view profiles, set nicknames, block, and mute contacts,
**So that** I can control my connections.

**Acceptance criteria:**
- Tapping a contact opens their profile view (avatar, name, bio, shared actions)
- Profile view has options: message, nickname, mute, block
- Blocking removes the contact and prevents future requests
- Muting silences notifications but messages still arrive
- Nicknames appear in place of display names throughout the app

### Scenario 6: Professional UX

**As a** user opening the app,
**I want** smooth animations, loading feedback, and clear error messages,
**So that** the app feels polished and trustworthy.

**Acceptance criteria:**
- App opens with a branded splash screen
- Tab bar uses proper icons (not emoji)
- Lists show skeleton placeholders while loading
- Empty states have helpful text/illustrations
- Errors show as toast notifications (not system alerts)
- Screen transitions are animated and smooth
- Haptic feedback on key actions (send, react, delete)

---

## Functional Requirements

### FR-1: Message Actions Menu

- FR-1.1: Long-press on any message MUST display a floating action menu
- FR-1.2: Menu MUST include: Reply, Copy, Forward (all messages); Edit, Delete (own messages only)
- FR-1.3: Menu MUST include a row of quick-react emoji (top 6 + "+" for full picker)
- FR-1.4: Swiping right on a message MUST trigger the reply action
- FR-1.5: Reply MUST show the quoted message above the input field with a cancel button
- FR-1.6: Edit MUST replace message content inline; edited messages show "edited" label
- FR-1.7: Delete MUST offer "Delete for me" (always) and "Delete for everyone" (own, any time)
- FR-1.8: Forward MUST open a contact/conversation picker; forwarded messages show "Forwarded" label
- FR-1.9: Reactions MUST appear as emoji chips below the message bubble; tapping shows who reacted

### FR-2: Media Messages

- FR-2.1: Attachment button in chat input MUST open a bottom sheet with: Gallery, Camera, File options
- FR-2.2: Image selection MUST show a preview screen with send/cancel buttons
- FR-2.3: Camera capture MUST use the device camera and return to preview
- FR-2.4: Voice recording MUST activate on long-press of a microphone button
- FR-2.5: Voice recording MUST show elapsed time and a waveform animation while recording
- FR-2.6: Voice playback MUST show duration, progress bar, and play/pause control
- FR-2.7: File selection MUST support any document type available on the device
- FR-2.8: Sent images MUST be tappable to open a full-screen viewer with pinch-to-zoom and swipe-to-dismiss
- FR-2.9: All media MUST have a download/save option via long-press or dedicated button
- FR-2.10: Upload progress MUST be visible as a progress indicator on the message bubble

### FR-3: Offline-First Architecture

- FR-3.1: All messages MUST be persisted to local database on receipt and on send
- FR-3.2: Conversations list MUST load from local database first, then sync with server
- FR-3.3: Contacts list MUST be cached locally and refreshed on app focus
- FR-3.4: Messages composed offline MUST be queued with "pending" status and visible clock icon
- FR-3.5: On connectivity restoration, queued messages MUST send in chronological order
- FR-3.6: Sync MUST handle conflicts by server-timestamp-wins for message ordering
- FR-3.7: A persistent network status banner MUST appear when the device is offline
- FR-3.8: Local database MUST handle pagination for conversations with 10,000+ messages

### FR-4: Presence & Real-Time Status

- FR-4.1: Online contacts MUST show a green dot on their avatar (conversations list + chat header)
- FR-4.2: Offline contacts MUST show "Active Xm/Xh/Xd ago" in chat header
- FR-4.3: Typing indicator MUST show animated bouncing dots (not plain text)
- FR-4.4: Message status MUST update in real-time: single gray check (sent), double gray check (delivered), double blue check (read)
- FR-4.5: Read receipts MUST update without requiring a screen refresh

### FR-5: Profile & Settings

- FR-5.1: Avatar upload MUST support gallery selection and camera capture
- FR-5.2: Avatar MUST crop to circle and upload to server immediately
- FR-5.3: Change password MUST require current password, new password, and confirmation
- FR-5.4: Change password MUST validate: minimum 6 characters, new differs from current
- FR-5.5: Settings screen MUST show per-contact notification mute toggles
- FR-5.6: About section MUST display app name, version, and "Made in Syria" tagline

### FR-6: Contacts Enhancement

- FR-6.1: Tapping a contact MUST navigate to a dedicated profile view screen
- FR-6.2: Contact profile MUST show: large avatar, display name, username, bio, action buttons
- FR-6.3: Action buttons: Message, Set Nickname, Mute/Unmute, Block/Unblock
- FR-6.4: Blocking MUST remove the conversation and prevent future contact requests
- FR-6.5: Nicknames MUST replace display names in conversation list, chat header, and contacts list
- FR-6.6: Mute indicator MUST appear on muted contacts/conversations

### FR-7: Navigation & UX Polish

- FR-7.1: Tab bar MUST use vector icons (not emoji) with active/inactive states
- FR-7.2: App MUST show a branded splash screen on launch (logo + app name)
- FR-7.3: All list screens MUST show skeleton/shimmer placeholders during initial load
- FR-7.4: Empty states MUST show contextual text and an illustration or icon
- FR-7.5: All errors MUST show as dismissible toast notifications at the top of the screen
- FR-7.6: Key actions (send message, react, delete) MUST trigger haptic feedback
- FR-7.7: Screen transitions MUST use native-feeling animations (slide, fade)
- FR-7.8: Message bubbles MUST animate in when they appear (subtle slide-up)

### FR-8: Cleanup & Quality

- FR-8.1: Unused packages (nativewind, tailwindcss) MUST be removed from dependencies
- FR-8.2: Server input validation MUST use a schema validation library for all endpoints
- FR-8.3: Mobile network requests MUST retry failed calls with exponential backoff (max 3 retries)
- FR-8.4: All TypeScript code MUST compile with strict mode enabled and zero errors

### FR-9: Deployment

- FR-9.1: Server MUST be deployed to Koyeb with all environment variables configured
- FR-9.2: Mobile API base URL MUST be configurable between development (local IP) and production (Koyeb URL)
- FR-9.3: App icons and splash screen MUST use the LoZo branding assets
- FR-9.4: Production server MUST use HTTPS and proper CORS configuration

---

## Non-Functional Requirements

- **Performance**: Conversation list MUST render within 1 second with 100+ conversations. Message list MUST scroll at 60fps with 1,000+ messages loaded.
- **Storage**: Local database MUST not exceed 100MB for typical usage (10 users, moderate messaging).
- **Network**: App MUST gracefully handle network transitions (WiFi to cellular, online to offline) without crashes or data loss.
- **Security**: Tokens MUST be stored in secure device storage. Media URLs MUST not be guessable. Passwords MUST be hashed server-side.
- **Accessibility**: All interactive elements MUST have minimum 44x44pt touch targets. Text MUST meet 4.5:1 contrast ratio.

---

## Success Criteria

1. Users can send text, image, voice, and file messages and receive them in real-time within 2 seconds
2. Users can reply, edit, delete, forward, and react to messages via intuitive gestures
3. Users can compose messages offline and have them delivered automatically when online
4. All list screens display loading feedback within 200ms of navigation
5. Zero unhandled errors visible to users during normal messaging flows
6. Server is live and reachable from Syria without VPN
7. App feels indistinguishable from Messenger in core 1:1 messaging interactions
8. Voice messages can be recorded and played back with visual waveform feedback
9. Users can upload and view avatars from their device gallery or camera
10. App launches with branded splash screen and uses professional iconography throughout

---

## Key Entities

### Message (enhanced)
- All existing fields plus: local queue status (pending/sent/failed), local ID for offline tracking, upload progress percentage for media

### LocalMessageQueue
- localId, conversationId, message payload, status (pending/sending/failed), retryCount, createdAt

### MediaAttachment
- uri (local), remoteUrl, type (image/voice/file), name, size, duration (voice), uploadProgress, thumbnailUri

### ContactProfile (view model)
- All User fields plus: nickname, isMuted, isBlocked, mutualContactsSince

---

## Assumptions

1. **Expo Go compatibility**: All new packages MUST work within Expo Go (SDK 54) without native builds
2. **SQLite for offline**: expo-sqlite is the local database choice (works in Expo Go)
3. **Icon library**: @expo/vector-icons (included with Expo) provides tab bar and UI icons
4. **Image manipulation**: expo-image-picker handles both gallery and camera without extra native config
5. **Audio recording**: expo-av handles voice recording and playback within Expo Go
6. **File picking**: expo-document-picker handles file selection
7. **Haptics**: expo-haptics provides haptic feedback
8. **Network detection**: @react-native-community/netinfo or expo-network detects connectivity changes
9. **Toast library**: A lightweight React Native toast library replaces Alert-based errors
10. **Voice waveform**: A simple amplitude-based visualization (not FFT analysis) is sufficient
11. **Max ~10 users**: Performance optimizations for large scale are not required
12. **No end-to-end encryption**: Messages are encrypted in transit (HTTPS) but not E2E encrypted

---

## Out of Scope

- Group chats and group management
- Stories / Status updates
- Voice and video calls
- Payments and money transfer
- Disappearing / self-destructing messages
- End-to-end encryption
- Message pinning
- Custom chat themes / wallpapers
- Location sharing
- Contact sync from phone address book
- Multi-device support
- Read receipt toggle (always on)
- Message scheduling

---

## Dependencies

1. **Supabase Storage**: Must remain accessible from Syria for media uploads
2. **Koyeb**: Must have free tier capacity for deployment
3. **Expo Go SDK 54**: All packages must be compatible
4. **Supabase PostgreSQL**: Database must support the message volume

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Expo Go package incompatibility | Blocks feature | Verify each package in Expo Go before building UI |
| Supabase storage limits on free tier | Media uploads fail | Monitor usage, compress images before upload |
| Koyeb free tier cold starts | Slow first request | Implement client-side retry with user feedback |
| SQLite performance with large datasets | Slow message loading | Index key columns, paginate aggressively |
| Voice recording quality on low-end devices | Poor user experience | Use standard quality settings, test on budget devices |
