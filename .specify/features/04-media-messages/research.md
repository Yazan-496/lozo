# Research: Media Messages

**Feature**: 04 — Media Messages
**Date**: 2026-03-26

---

## Decision 1: Package Selection — All Expo Go Compatible

**Decision**: Use `expo-image-picker`, `expo-document-picker`, `expo-av`, and `expo-sharing`. All are pre-bundled in Expo Go SDK 54 — no native build required.

| Package | Purpose | Expo Go? |
|---------|---------|----------|
| `expo-image-picker` | Gallery + camera access | ✅ |
| `expo-document-picker` | Any file type picker | ✅ |
| `expo-av` | Voice recording + playback | ✅ |
| `expo-sharing` | Open file with device app | ✅ |

**Rationale**: All four packages are in Expo SDK 54's managed workflow. Zero native linking needed. `expo-av` covers both recording and playback in a single package.

**Alternatives considered**:
- `react-native-audio-recorder-player` — requires native build ❌
- `react-native-fs` for file handling — requires native build ❌

---

## Decision 2: Image Upload — Multipart via axios directly (no SDK)

**Decision**: Upload images/audio/files using `axios` multipart `FormData` directly against `POST /upload`, passing the auth token in headers. No Supabase JS client needed.

```typescript
const formData = new FormData();
formData.append('file', {
  uri: fileUri,
  name: fileName,
  type: mimeType,
} as any);

const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${token}`,
  },
  onUploadProgress: (e) => {
    const pct = Math.round((e.loaded * 100) / (e.total ?? 1));
    setUploadProgress(pct);
  },
});
// response.data.url = public Supabase Storage URL
```

**Rationale**: The server already has a `/upload` endpoint. Avoids adding `@supabase/supabase-js` as a client dependency. `axios` already in the project.

**Alternatives considered**:
- Supabase JS client direct upload — adds 200KB dependency, exposes storage credentials to client ❌
- `fetch` with FormData — no upload progress callback ❌

---

## Decision 3: Voice Recording — expo-av Audio Recording API

**Decision**: Use `Audio.Recording` from `expo-av` with `Audio.RecordingOptionsPresets.HIGH_QUALITY` (produces `.m4a`/AAC). Request permissions before first record. Hold the mic button using `onPressIn`/`onPressOut` on `TouchableOpacity`.

```typescript
async function startRecording() {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  recordingRef.current = recording;
}

async function stopRecording() {
  await recordingRef.current?.stopAndUnloadAsync();
  const uri = recordingRef.current?.getURI();
  const status = await recordingRef.current?.getStatusAsync();
  const durationMs = status?.durationMillis ?? 0;
  // uri + duration available for upload
}
```

**Timer for elapsed display**: `setInterval` every 100ms updating a display string (`MM:SS`).

**Waveform animation**: 3–4 `Animated.Value` bars, each running a looping `Animated.sequence` of spring up/down with staggered delays. No audio data analysis needed — purely decorative.

**Alternatives considered**:
- `expo-audio` (newer API) — still experimental in SDK 54 ❌
- `react-native-audio-recorder-player` — native build required ❌

---

## Decision 4: Voice Playback — expo-av Sound API

**Decision**: `Audio.Sound.createAsync({ uri })` for playback. One global sound ref per screen to enforce single-playback-at-a-time.

```typescript
// In ChatScreen, one ref for all voice playback
const activeSoundRef = useRef<Audio.Sound | null>(null);

async function playVoice(uri: string, messageId: string) {
  // Stop any currently playing sound
  await activeSoundRef.current?.stopAsync();
  await activeSoundRef.current?.unloadAsync();

  const { sound } = await Audio.Sound.createAsync({ uri });
  activeSoundRef.current = sound;
  await sound.playAsync();
}
```

Track playback state per message using `playingMessageId: string | null` state.

---

## Decision 5: Image Full-Screen Viewer — react-native-reanimated + Gesture Handler (already installed)

**Decision**: Build a custom full-screen viewer using `Modal` + `Animated` (core RN) for swipe-down dismiss, and React Native's built-in `<Image>` with a manual pinch gesture via `PanResponder`. No additional package needed.

**Rationale**: `react-native-reanimated` and `react-native-gesture-handler` are already in the project. However, a pinch-to-zoom gesture handler is complex to build correctly with these primitives. Instead, use a simpler approach:

- `Modal` with black background
- `Animated.Image` with `transform: [{ scale }, { translateY }]`
- Two-finger distance delta tracked with `PanResponder` for scale
- Single-finger drag tracked for `translateY` (swipe-down to dismiss)
- When `translateY > 80` → trigger dismiss animation

This avoids adding `react-native-image-zoom-viewer` (requires native linking) while still providing a functional viewer.

**Alternatives considered**:
- `react-native-image-zoom-viewer` — requires native build ❌
- `expo-image-viewer` — doesn't exist ❌
- Manual PanResponder pinch ✅ — works in Expo Go, sufficient for the feature

---

## Decision 6: Attachment Bottom Sheet — Plain Modal (same pattern as EmojiPickerModal)

**Decision**: Reuse the same `Modal + Animated.spring` slide-up pattern from `EmojiPickerModal`. No additional package. Sheet shows 3 tappable rows: Gallery, Camera, File.

**Alternatives considered**:
- `@gorhom/bottom-sheet` — native build required ❌
- Plain Modal with slide animation ✅

---

## Decision 7: File Opening — expo-sharing + Linking

**Decision**: Use `Linking.openURL(fileUrl)` for remote file URLs (opens in browser or system handler). Use `expo-sharing` for locally downloaded files if needed. Since files are stored as Supabase public URLs, `Linking.openURL` is sufficient for most cases.

```typescript
import { Linking } from 'react-native';
await Linking.openURL(message.mediaUrl);
```

**Alternatives considered**:
- `expo-file-system` + `expo-sharing` (download then share) — adds complexity for the same user outcome ❌

---

## Decision 8: Upload Progress — local state per upload

**Decision**: Track `uploadProgress: number | null` per in-flight upload using a local state map keyed by a temporary message ID. Show a semi-transparent overlay with a `View` width proportional to progress percentage.

```typescript
// Temporary ID during upload
const tempId = `temp_${Date.now()}`;
setMessages(prev => [{ ...tempMessage, id: tempId }, ...prev]);

// On progress update:
setUploadProgressMap(prev => ({ ...prev, [tempId]: pct }));

// On complete: replace temp message with real message from server
setMessages(prev => prev.map(m => m.id === tempId ? serverMessage : m));
```

---

## Constitution Compliance Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Syria Accessibility | ✅ PASS | Supabase Storage URLs are public CDN; expo-av/expo-image-picker have no geo-restrictions |
| Offline-First | ⚠️ DEFERRED | Media messages require upload; offline queue for media is Spec 10 |
| TypeScript Everywhere | ✅ PASS | All new code strict TypeScript |
| Feature-Based Architecture | ✅ PASS | New components in `features/chat/components/` |
| No New Packages | ⚠️ 4 new packages | All Expo SDK 54 — pre-bundled in Expo Go, no native build |
