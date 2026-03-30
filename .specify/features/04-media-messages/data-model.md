# Data Model: Media Messages

**Feature**: 04 — Media Messages
**Date**: 2026-03-26

---

## Existing Entity: Message (extended)

The `Message` interface in `apps/mobile/src/shared/types/index.ts` already contains all required media fields. **No schema changes needed.**

```typescript
interface Message {
  // ... existing fields ...
  type: 'text' | 'image' | 'voice' | 'file';  // already covers all types
  mediaUrl: string | null;       // imageUrl / audioUrl / fileUrl
  mediaName: string | null;      // original file name (file type)
  mediaSize: number | null;      // bytes (file type)
  mediaDuration: number | null;  // seconds (voice type)
}
```

---

## Client-Only State Additions to ChatScreen

| Variable | Type | Purpose |
|----------|------|---------|
| `uploadProgressMap` | `Record<string, number>` | Upload % per temp message ID |
| `playingMessageId` | `string \| null` | ID of currently playing voice message |
| `playbackProgress` | `Record<string, number>` | Playback position 0–1 per message |
| `activeSoundRef` | `useRef<Audio.Sound \| null>` | Single sound instance for exclusive playback |
| `recordingRef` | `useRef<Audio.Recording \| null>` | Active recording instance |
| `isRecording` | `boolean` | Controls recording UI mode |
| `recordingDuration` | `number` | Elapsed ms during recording (for timer display) |
| `showAttachmentSheet` | `boolean` | Controls attachment bottom sheet visibility |
| `previewImageUri` | `string \| null` | URI of image selected, awaiting Send/Cancel |
| `viewingImageUrl` | `string \| null` | URL of image being viewed full-screen |

---

## Temporary Message Pattern (Optimistic Upload)

During upload, a temporary `Message` object is inserted into the messages list with a client-generated ID:

```typescript
const tempMessage: Message = {
  id: `temp_${Date.now()}`,
  conversationId,
  senderId: currentUser.id,
  type,                          // 'image' | 'voice' | 'file'
  content: null,
  mediaUrl: localUri,            // local file:// URI for immediate display
  mediaName: fileName ?? null,
  mediaSize: fileSize ?? null,
  mediaDuration: durationSecs ?? null,
  replyToId: null,
  forwardedFromId: null,
  isForwarded: false,
  editedAt: null,
  deletedForEveryone: false,
  createdAt: new Date().toISOString(),
  reactions: [],
  replyTo: null,
  status: 'sent',
};
```

On upload completion: temp message is replaced with the server-returned message (real ID, CDN URL).
On upload failure: temp message stays with `uploadProgressMap[id] = -1` (error state).

---

## New Component State

### AttachmentSheet (stateless)
Props only — no internal state.

### ImagePreviewScreen (local state)
- `isSending: boolean` — disables Send button during upload

### ImageViewerModal (local state)
- `scale: Animated.Value` — pinch zoom level
- `translateY: Animated.Value` — swipe-down position

### VoiceMessageBubble (local state — or managed in ChatScreen)
- Playback state is managed in ChatScreen via `playingMessageId` + `activeSoundRef` to enforce single-playback rule
