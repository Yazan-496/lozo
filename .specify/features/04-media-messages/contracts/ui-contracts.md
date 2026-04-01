# UI Contracts: Media Messages

**Feature**: 04 — Media Messages
**Date**: 2026-03-26

---

## Component: AttachmentSheet

**File**: `apps/mobile/src/features/chat/components/AttachmentSheet.tsx`

```typescript
interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onGallery: () => void;
  onCamera: () => void;
  onFile: () => void;
}
```

- Slide-up `Modal` (same pattern as `EmojiPickerModal`)
- 3 rows: Gallery (image icon), Camera (camera icon), File (paperclip icon)
- Backdrop tap → `onClose()`

---

## Component: ImagePreviewScreen

**File**: `apps/mobile/src/features/chat/components/ImagePreviewScreen.tsx`

```typescript
interface ImagePreviewScreenProps {
  visible: boolean;
  uri: string | null;          // local file:// URI from picker
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;          // disables Send button + shows spinner
}
```

- Full-screen `Modal`, black background
- `Image` fills screen with `resizeMode="contain"`
- "Send" button (bottom right, primary color) — disabled + spinner when `isSending`
- "Cancel" button (bottom left, white text) → `onCancel()`

---

## Component: ImageViewerModal

**File**: `apps/mobile/src/features/chat/components/ImageViewerModal.tsx`

```typescript
interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}
```

- Full-screen `Modal`, `transparent`, `animationType="fade"`, black background
- `Animated.Image` with `transform: [{ scale }, { translateY }]`
- `PanResponder` handles:
  - Two-pointer distance delta → `scale` (1× to 4×)
  - Single-pointer vertical drag → `translateY`
  - `translateY > 80` on release → animated dismiss → `onClose()`
- Close button (top-right ×) always visible → `onClose()`

---

## Component: VoiceMessageBubble

**File**: `apps/mobile/src/features/chat/components/VoiceMessageBubble.tsx`

```typescript
interface VoiceMessageBubbleProps {
  messageId: string;
  audioUrl: string;
  duration: number;            // seconds
  isPlaying: boolean;          // true when this message is the active one
  isMe: boolean;
  onPlay: () => void;          // ChatScreen manages actual Audio.Sound
  onPause: () => void;
}
```

- Play/Pause `TouchableOpacity` button (▶ / ⏸)
- 4 static waveform bars (varying heights) — visual only
- Duration text (MM:SS format)
- Background: `colors.primary` if `isMe`, `colors.surface` if other

---

## Component: FileBubble

**File**: `apps/mobile/src/features/chat/components/FileBubble.tsx`

```typescript
interface FileBubbleProps {
  fileName: string;
  fileSize: number;            // bytes — displayed as "1.2 MB"
  fileUrl: string;
  isMe: boolean;
}
```

- File icon (📄 or vector icon from `@expo/vector-icons`)
- `fileName` truncated to 1 line (`numberOfLines={1}`)
- `formatFileSize(fileSize)` helper → "1.2 MB", "340 KB"
- Entire row is `TouchableOpacity` → `Linking.openURL(fileUrl)`

---

## Inline Recording UI (inside ChatScreen input bar)

No separate component — recording state renders inline replacing the normal input:

```typescript
// When isRecording = true, render:
// [Cancel button] [Waveform bars + elapsed time] [swipe hint]
// instead of: [TextInput] [send button]
```

The mic button is a `TouchableOpacity` with `onPressIn={startRecording}` and `onPressOut={stopAndSendRecording}`.

---

## Server API Contracts

### Upload endpoint

```
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: FormData { file: <binary> }

Response 200:
{
  url: string   // public Supabase CDN URL
}

Response 413: file too large
Response 400: unsupported type
```

### Send media message

```
POST /api/chat/messages
Authorization: Bearer <token>

Body (image):
{
  conversationId: string,
  type: "image",
  imageUrl: string,        // from upload response
  replyToId?: string
}

Body (voice):
{
  conversationId: string,
  type: "voice",
  audioUrl: string,
  audioDuration: number    // seconds
}

Body (file):
{
  conversationId: string,
  type: "file",
  fileUrl: string,
  fileName: string,
  fileSize: number         // bytes
}

Response 201: Message object (same shape as text message)
```

---

## Helper Functions

```typescript
// Format bytes to human-readable
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format seconds to MM:SS
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
```
