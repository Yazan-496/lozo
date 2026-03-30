# Implementation Plan: Media Messages

**Feature**: 04 — Media Messages
**Spec**: [spec.md](spec.md)
**Date**: 2026-03-26
**Status**: Ready to implement

---

## Summary

Pure mobile implementation. Server endpoints already exist. `Message` type already covers all media fields. Work is: install 4 packages, build 5 new components, wire them into ChatScreen.

**New files**: 5 components + 1 util function file
**Modified files**: `ChatScreen.tsx`, `package.json`
**New packages**: `expo-image-picker`, `expo-document-picker`, `expo-av`, `expo-sharing`
**Server changes**: None

---

## Technical Context

| Concern | Decision |
|---------|----------|
| Gallery + Camera | `expo-image-picker` — `launchImageLibraryAsync` / `launchCameraAsync` |
| File picker | `expo-document-picker` — `getDocumentAsync` |
| Voice recording | `expo-av` — `Audio.Recording.createAsync` with HIGH_QUALITY preset |
| Voice playback | `expo-av` — `Audio.Sound.createAsync` |
| File opening | `Linking.openURL(url)` for remote URLs |
| Image viewer | Custom Modal + PanResponder (no new package) |
| Upload | `axios` FormData with `onUploadProgress` callback |
| Attachment sheet | Plain Modal slide-up (same as EmojiPickerModal pattern) |
| Input bar layout | Attachment button left of input; mic button right (replaces send when input empty) |
| Optimistic upload | Temp message with local URI → replace on server confirm |

---

## File Structure

```
apps/mobile/src/features/chat/
├── ChatScreen.tsx                             ← MODIFY (significant)
└── components/
    ├── MessageActionMenu.tsx                  ← unchanged
    ├── ReplyPreviewBar.tsx                    ← unchanged
    ├── ForwardModal.tsx                       ← unchanged
    ├── QuickReactionBar.tsx                   ← unchanged
    ├── EmojiPickerModal.tsx                   ← unchanged
    ├── AttachmentSheet.tsx                    ← NEW
    ├── ImagePreviewScreen.tsx                 ← NEW
    ├── ImageViewerModal.tsx                   ← NEW
    ├── VoiceMessageBubble.tsx                 ← NEW
    └── FileBubble.tsx                         ← NEW

apps/mobile/src/shared/utils/
    └── media.ts                               ← NEW (formatFileSize, formatDuration)
```

---

## Step-by-Step Implementation

### Step 1: Install Packages

```bash
cd apps/mobile
npx expo install expo-image-picker expo-document-picker expo-av expo-sharing
```

Add permissions to `app.json`:
```json
"expo": {
  "plugins": [
    "expo-secure-store",
    ["expo-image-picker", {
      "photosPermission": "Allow LoZo to access your photos to send images.",
      "cameraPermission": "Allow LoZo to use your camera to take photos."
    }],
    ["expo-av", {
      "microphonePermission": "Allow LoZo to access your microphone to send voice messages."
    }]
  ]
}
```

---

### Step 2: Media Utilities

**File**: `apps/mobile/src/shared/utils/media.ts`

```typescript
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
```

---

### Step 3: AttachmentSheet Component

**File**: `apps/mobile/src/features/chat/components/AttachmentSheet.tsx`

- Slide-up Modal (same animation pattern as EmojiPickerModal)
- 3 option rows with icons from `@expo/vector-icons/Ionicons`:
  - `images-outline` → Gallery
  - `camera-outline` → Camera
  - `document-outline` → File
- Backdrop tap → close
- Sheet height: auto (3 rows × ~56px + padding ≈ 220px)

```typescript
interface Props {
  visible: boolean;
  onClose: () => void;
  onGallery: () => void;
  onCamera: () => void;
  onFile: () => void;
}
```

---

### Step 4: ImagePreviewScreen Component

**File**: `apps/mobile/src/features/chat/components/ImagePreviewScreen.tsx`

- Full-screen Modal, black background, `animationType="slide"`
- `Image` source={uri} with `resizeMode="contain"`, `style={{ flex: 1 }}`
- Bottom bar with "Cancel" (left) and "Send" (right) buttons
- `isSending` prop → "Send" shows `ActivityIndicator` and is disabled

```typescript
interface Props {
  visible: boolean;
  uri: string | null;
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;
}
```

---

### Step 5: ImageViewerModal Component

**File**: `apps/mobile/src/features/chat/components/ImageViewerModal.tsx`

```typescript
interface Props {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}
```

Key implementation:
```typescript
const scale = useRef(new Animated.Value(1)).current;
const translateY = useRef(new Animated.Value(0)).current;

// PanResponder for swipe-down dismiss (single finger vertical)
const dismissPan = PanResponder.create({
  onMoveShouldSetPanResponder: (_, { dy, dx }) => Math.abs(dy) > Math.abs(dx) && dy > 5,
  onPanResponderMove: (_, { dy }) => {
    if (dy > 0) translateY.setValue(dy);
  },
  onPanResponderRelease: (_, { dy }) => {
    if (dy > 80) {
      Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true }).start(onClose);
    } else {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    }
  },
});
```

Pinch-to-zoom via two-pointer PanResponder tracking distance delta.
Close button: top-right `×` button always visible.

---

### Step 6: VoiceMessageBubble Component

**File**: `apps/mobile/src/features/chat/components/VoiceMessageBubble.tsx`

```typescript
interface Props {
  messageId: string;
  audioUrl: string;
  duration: number;        // seconds
  isPlaying: boolean;
  isMe: boolean;
  onPlay: () => void;
  onPause: () => void;
}
```

Layout: `[▶/⏸]  [||||]  [0:12]` (play button + 4 static waveform bars + duration)

Static waveform: 4 `View` bars with heights `[16, 24, 20, 28]` px, rounded corners, colored based on `isMe`.

```typescript
const BAR_HEIGHTS = [16, 24, 20, 28];
// isMe: white bars; other: colors.primary bars
```

---

### Step 7: FileBubble Component

**File**: `apps/mobile/src/features/chat/components/FileBubble.tsx`

```typescript
interface Props {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  isMe: boolean;
}
```

Layout: `[📄 icon]  [fileName \n fileSize]`
Entire component is `TouchableOpacity` → `Linking.openURL(fileUrl)`
File icon: `Ionicons document-outline` size 28

---

### Step 8: ChatScreen — New State

Add to existing state declarations:

```typescript
const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
const [isSendingMedia, setIsSendingMedia] = useState(false);
const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
const [isRecording, setIsRecording] = useState(false);
const [recordingDuration, setRecordingDuration] = useState(0);
const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({});

const recordingRef = useRef<Audio.Recording | null>(null);
const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
const activeSoundRef = useRef<Audio.Sound | null>(null);
```

Add imports:
```typescript
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Linking, ActivityIndicator } from 'react-native';
import { formatFileSize, formatDuration } from '../../shared/utils/media';
import { AttachmentSheet } from './components/AttachmentSheet';
import { ImagePreviewScreen } from './components/ImagePreviewScreen';
import { ImageViewerModal } from './components/ImageViewerModal';
import { VoiceMessageBubble } from './components/VoiceMessageBubble';
import { FileBubble } from './components/FileBubble';
import { BASE_URL } from '../../shared/services/api';
```

---

### Step 9: ChatScreen — Upload Helper

```typescript
async function uploadMedia(
  uri: string,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', { uri, name: fileName, type: mimeType } as any);
  const token = useAuthStore.getState().accessToken;
  const { data } = await axios.post(`${BASE_URL}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
  return data.url as string;
}
```

---

### Step 10: ChatScreen — Image Send Flow

```typescript
async function handlePickImage(source: 'gallery' | 'camera') {
  setShowAttachmentSheet(false);
  const result = source === 'gallery'
    ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 })
    : await ImagePicker.launchCameraAsync({ quality: 0.85 });

  if (!result.canceled && result.assets[0]) {
    setPreviewImageUri(result.assets[0].uri);
  }
}

async function handleSendImage() {
  if (!previewImageUri) return;
  setIsSendingMedia(true);
  const tempId = `temp_${Date.now()}`;
  const tempMsg: Message = {
    id: tempId, conversationId, senderId: currentUser!.id,
    type: 'image', content: null, mediaUrl: previewImageUri,
    mediaName: null, mediaSize: null, mediaDuration: null,
    replyToId: null, forwardedFromId: null, isForwarded: false,
    editedAt: null, deletedForEveryone: false,
    createdAt: new Date().toISOString(), reactions: [], replyTo: null, status: 'sent',
  };
  setMessages(prev => [tempMsg, ...prev]);
  setPreviewImageUri(null);

  try {
    const fileName = `image_${Date.now()}.jpg`;
    const url = await uploadMedia(previewImageUri, 'image/jpeg', fileName);
    const { data } = await api.post('/chat/messages', {
      conversationId, type: 'image', imageUrl: url,
    });
    setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, reactions: [] } : m));
    getSocket()?.emit('message:new', { conversationId });
  } catch {
    showToast('error', 'Failed to send image');
    setMessages(prev => prev.filter(m => m.id !== tempId));
  } finally {
    setIsSendingMedia(false);
  }
}
```

---

### Step 11: ChatScreen — File Send Flow

```typescript
async function handlePickFile() {
  setShowAttachmentSheet(false);
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) return;

  const asset = result.assets[0];
  const tempId = `temp_${Date.now()}`;
  const tempMsg: Message = {
    id: tempId, conversationId, senderId: currentUser!.id,
    type: 'file', content: null, mediaUrl: null,
    mediaName: asset.name, mediaSize: asset.size ?? 0,
    mediaDuration: null, replyToId: null, forwardedFromId: null, isForwarded: false,
    editedAt: null, deletedForEveryone: false,
    createdAt: new Date().toISOString(), reactions: [], replyTo: null, status: 'sent',
  };
  setMessages(prev => [tempMsg, ...prev]);

  try {
    const url = await uploadMedia(asset.uri, asset.mimeType ?? 'application/octet-stream', asset.name);
    const { data } = await api.post('/chat/messages', {
      conversationId, type: 'file', fileUrl: url,
      fileName: asset.name, fileSize: asset.size ?? 0,
    });
    setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, reactions: [] } : m));
  } catch {
    showToast('error', 'Failed to send file');
    setMessages(prev => prev.filter(m => m.id !== tempId));
  }
}
```

---

### Step 12: ChatScreen — Voice Recording Flow

```typescript
async function startRecording() {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) { showToast('error', 'Microphone permission required'); return; }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
    setIsRecording(true);
    setRecordingDuration(0);
    recordingTimerRef.current = setInterval(
      () => setRecordingDuration(d => d + 100), 100
    );
  } catch { showToast('error', 'Could not start recording'); }
}

async function stopAndSendRecording() {
  clearInterval(recordingTimerRef.current!);
  setIsRecording(false);
  if (!recordingRef.current) return;

  await recordingRef.current.stopAndUnloadAsync();
  const uri = recordingRef.current.getURI();
  const status = await recordingRef.current.getStatusAsync();
  const durationMs = (status as any).durationMillis ?? 0;
  recordingRef.current = null;

  if (durationMs < 1000 || !uri) return; // discard < 1s

  const durationSecs = Math.round(durationMs / 1000);
  const tempId = `temp_${Date.now()}`;
  const tempMsg: Message = {
    id: tempId, conversationId, senderId: currentUser!.id,
    type: 'voice', content: null, mediaUrl: uri,
    mediaName: null, mediaSize: null, mediaDuration: durationSecs,
    replyToId: null, forwardedFromId: null, isForwarded: false,
    editedAt: null, deletedForEveryone: false,
    createdAt: new Date().toISOString(), reactions: [], replyTo: null, status: 'sent',
  };
  setMessages(prev => [tempMsg, ...prev]);

  try {
    const fileName = `voice_${Date.now()}.m4a`;
    const url = await uploadMedia(uri, 'audio/m4a', fileName);
    const { data } = await api.post('/chat/messages', {
      conversationId, type: 'voice', audioUrl: url, audioDuration: durationSecs,
    });
    setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, reactions: [] } : m));
  } catch {
    showToast('error', 'Failed to send voice message');
    setMessages(prev => prev.filter(m => m.id !== tempId));
  }
}

function cancelRecording() {
  clearInterval(recordingTimerRef.current!);
  recordingRef.current?.stopAndUnloadAsync();
  recordingRef.current = null;
  setIsRecording(false);
  setRecordingDuration(0);
}
```

---

### Step 13: ChatScreen — Voice Playback

```typescript
async function handlePlayVoice(messageId: string, audioUrl: string) {
  // Stop current
  if (activeSoundRef.current) {
    await activeSoundRef.current.stopAsync();
    await activeSoundRef.current.unloadAsync();
    activeSoundRef.current = null;
  }
  if (playingMessageId === messageId) {
    setPlayingMessageId(null);
    return; // toggle off
  }
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true },
    );
    activeSoundRef.current = sound;
    setPlayingMessageId(messageId);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setPlayingMessageId(null);
        activeSoundRef.current = null;
      }
    });
  } catch { showToast('error', 'Could not play voice message'); }
}
```

---

### Step 14: ChatScreen — Input Bar Changes

Replace the static input bar with a conditional layout:

**When `isRecording = false`** (normal):
```
[📎 attach]  [TextInput (flex:1)]  [🎤 mic OR ↑ send]
```
- Attachment button: left of input, always visible
- Mic button: right of input, shown when `text.trim() === ''`
- Send button: right of input, shown when `text.trim() !== ''`

**When `isRecording = true`**:
```
[✕ cancel]  [●● waveform + timer]  ← (no send, release releases)
```

Mic button: `onPressIn={startRecording}` + `onPressOut={stopAndSendRecording}`

---

### Step 15: ChatScreen — Replace Media Placeholders in renderMessage

Replace the existing `📷`, `🎤`, `📎` placeholder text renders with real components:

```typescript
// REPLACE:
{item.type === 'image' && <Text>📷 Photo</Text>}

// WITH:
{item.type === 'image' && item.mediaUrl && (
  <TouchableOpacity onPress={() => setViewingImageUrl(item.mediaUrl)}>
    <Image
      source={{ uri: item.mediaUrl }}
      style={styles.imageThumbnail}
      resizeMode="cover"
    />
    {uploadProgressMap[item.id] !== undefined && (
      <View style={styles.uploadOverlay}>
        <View style={[styles.uploadBar, { width: `${uploadProgressMap[item.id]}%` }]} />
      </View>
    )}
  </TouchableOpacity>
)}

{item.type === 'voice' && item.mediaUrl && item.mediaDuration !== null && (
  <VoiceMessageBubble
    messageId={item.id}
    audioUrl={item.mediaUrl}
    duration={item.mediaDuration}
    isPlaying={playingMessageId === item.id}
    isMe={item.senderId === currentUser?.id}
    onPlay={() => handlePlayVoice(item.id, item.mediaUrl!)}
    onPause={() => handlePlayVoice(item.id, item.mediaUrl!)}
  />
)}

{item.type === 'file' && item.mediaUrl && (
  <FileBubble
    fileName={item.mediaName ?? 'File'}
    fileSize={item.mediaSize ?? 0}
    fileUrl={item.mediaUrl}
    isMe={item.senderId === currentUser?.id}
  />
)}
```

**New styles**:
```typescript
imageThumbnail: {
  width: 200,
  height: 200,
  borderRadius: 12,
},
uploadOverlay: {
  position: 'absolute',
  bottom: 0, left: 0, right: 0,
  height: 4,
  backgroundColor: 'rgba(0,0,0,0.2)',
},
uploadBar: {
  height: 4,
  backgroundColor: colors.primary,
},
```

---

### Step 16: ChatScreen — Add New Modal Renders

Inside the return, alongside existing modals:
```typescript
<AttachmentSheet
  visible={showAttachmentSheet}
  onClose={() => setShowAttachmentSheet(false)}
  onGallery={() => handlePickImage('gallery')}
  onCamera={() => handlePickImage('camera')}
  onFile={handlePickFile}
/>

<ImagePreviewScreen
  visible={previewImageUri !== null}
  uri={previewImageUri}
  onSend={handleSendImage}
  onCancel={() => setPreviewImageUri(null)}
  isSending={isSendingMedia}
/>

<ImageViewerModal
  visible={viewingImageUrl !== null}
  imageUrl={viewingImageUrl}
  onClose={() => setViewingImageUrl(null)}
/>
```

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Syria Accessibility | ✅ PASS | All packages are Expo SDK; Supabase CDN accessible |
| Offline-First | ⚠️ DEFERRED | Media requires upload; offline queue is Spec 10 |
| TypeScript Everywhere | ✅ PASS | All strict TS |
| Feature-Based Architecture | ✅ PASS | All new files in `features/chat/components/` |
| No New Native Packages | ✅ PASS | All 4 packages are Expo managed (no native build) |
