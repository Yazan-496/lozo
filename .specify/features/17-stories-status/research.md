# Research: Stories/Status Feature

**Feature**: 17-stories-status  
**Date**: 2026-04-01  
**Status**: Complete

## Research Tasks

### 1. Supabase Storage Lifecycle Policies

**Question**: How to implement 24-hour auto-deletion for story media?

**Decision**: Use Supabase Storage with folder-based organization and server-side cron job for cleanup.

**Rationale**: Supabase free tier doesn't support native lifecycle policies like S3. Instead:
1. Store stories with UTC timestamp in folder path: `stories/{userId}/{timestamp}/`
2. Run server-side cleanup job every hour to delete expired stories
3. Keep metadata in PostgreSQL with `expires_at` column for efficient queries

**Alternatives Considered**:
- S3 with lifecycle rules: Rejected (not Syria-accessible)
- Cloudflare R2: Rejected (no free tier lifecycle policies)
- Manual deletion only: Rejected (unreliable, stories could persist)

### 2. Video Duration Validation

**Question**: How to enforce 30-second video limit before upload?

**Decision**: Use `expo-av` to read video metadata on the client before upload.

**Rationale**: 
- `expo-av` is already available in Expo Go
- Can read duration without processing the entire video
- Reject at client side to save bandwidth

**Implementation**:
```typescript
import { AVPlaybackStatus, Video } from 'expo-av';

async function getVideoDuration(uri: string): Promise<number> {
  const { sound } = await Audio.Sound.createAsync({ uri });
  const status = await sound.getStatusAsync();
  await sound.unloadAsync();
  return status.isLoaded ? status.durationMillis / 1000 : 0;
}
```

### 3. Story Progress Bar Implementation

**Question**: How to implement segmented progress bars like Instagram/WhatsApp?

**Decision**: Use `Animated.View` with `Animated.timing` for smooth progress animation.

**Rationale**:
- React Native's built-in Animated API is performant
- No additional dependencies needed
- Can pause/resume animation on hold gesture

**Implementation Pattern**:
- Array of progress bars, one per story segment
- Current segment animates from 0 to 1 over duration
- Completed segments show full (1), pending show empty (0)
- Hold gesture calls `Animated.timing().stop()` and resumes on release

### 4. Hold-to-Pause Gesture

**Question**: How to implement hold-to-pause for story viewing?

**Decision**: Use `Pressable` with `onPressIn` and `onPressOut` handlers.

**Rationale**:
- `Pressable` provides cleaner API than `TouchableWithoutFeedback`
- Can track press state and pause/resume animation accordingly
- Works well with video playback pause/resume

**Implementation Pattern**:
```typescript
<Pressable
  onPressIn={() => {
    pauseProgress();
    pauseVideo();
  }}
  onPressOut={() => {
    resumeProgress();
    resumeVideo();
  }}
  onPress={(e) => {
    const { locationX, width } = e.nativeEvent;
    if (locationX < width / 3) goToPrevious();
    else if (locationX > width * 2/3) goToNext();
  }}
>
```

### 5. Story Reply Message Format

**Question**: How should story replies appear in chat with thumbnail?

**Decision**: Extend message schema with `storyReplyId` and `storyThumbnailUrl` fields.

**Rationale**:
- Thumbnail URL can be stored at send time (story may expire)
- Clear reference to original story for context
- Follows existing reply pattern (like `replyToId` for message replies)

**Implementation**:
- Add `storyReplyId` (nullable UUID) to messages table
- Add `storyThumbnailUrl` (nullable varchar) to messages table
- Display as special reply bubble in ChatScreen with thumbnail image

### 6. Real-time Story Notifications

**Question**: How to notify contacts when a new story is posted?

**Decision**: Use existing Socket.IO infrastructure with new `story:new` event.

**Rationale**:
- Socket.IO already handles presence and typing indicators
- Can target specific users (accepted contacts only)
- Low latency for real-time updates

**Events**:
- `story:new` - Server → Client: New story posted by contact
- `story:viewed` - Client → Server: Current user viewed a story
- `story:deleted` - Server → Client: Story expired or deleted

### 7. Local Story Caching Strategy

**Question**: How to cache viewed stories for offline access?

**Decision**: Use SQLite for metadata and filesystem for media files.

**Rationale**:
- SQLite already used for messages (consistent pattern)
- Media files cached in app's cache directory
- Clear cache on story expiration

**Schema** (local SQLite):
```sql
CREATE TABLE cached_stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  media_local_path TEXT,
  caption TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  viewed_at TEXT
);
```

### 8. Contact-Only Visibility

**Question**: How to efficiently query stories visible to current user?

**Decision**: Join stories with contacts table on accepted relationships.

**Rationale**:
- Existing contact system has `status = 'accepted'` check
- Single query can fetch all visible stories
- Index on `user_id` and `expires_at` for performance

**Query Pattern**:
```sql
SELECT s.* FROM stories s
JOIN contacts c ON (
  (c.requester_id = :currentUserId AND c.addressee_id = s.user_id)
  OR (c.addressee_id = :currentUserId AND c.requester_id = s.user_id)
)
WHERE c.status = 'accepted'
  AND s.expires_at > NOW()
ORDER BY s.created_at DESC;
```

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 24h Expiration | Server cron + metadata | No native lifecycle on free tier |
| Video Validation | expo-av client-side | Pre-upload validation |
| Progress Bars | Animated.View | Native, no deps |
| Hold Gesture | Pressable component | Clean API |
| Story Replies | Extended message schema | Thumbnail persistence |
| Real-time | Socket.IO events | Existing infrastructure |
| Local Cache | SQLite + filesystem | Consistent with messages |
| Privacy | Contact join query | Reuse existing system |

## Unresolved Items

None. All technical decisions have been made.
