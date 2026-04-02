# Quickstart: Stories/Status Feature

**Feature**: 17-stories-status  
**Date**: 2026-04-01

## Overview

This document provides integration scenarios for the Stories feature, demonstrating how components interact.

## Scenario 1: Post a Story (MVP Flow)

**User Journey**: User captures a photo and posts it as a story.

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐     ┌─────────────┐
│ User taps +  │────►│ CreateStory    │────►│ Upload to    │────►│ Notify      │
│ on avatar    │     │ Screen opens   │     │ Supabase     │     │ contacts    │
└──────────────┘     └────────────────┘     └──────────────┘     └─────────────┘
```

### Step-by-Step

1. **Entry Point**: User taps their avatar (with + indicator) in StoriesRow
2. **Media Selection**: CreateStoryScreen presents camera/gallery options
3. **Capture/Select**: User takes photo or selects from gallery
4. **Caption**: Optional caption input (max 200 chars)
5. **Upload**: 
   - Media uploaded to Supabase Storage (`stories/{userId}/{timestamp}/`)
   - Story record created in PostgreSQL
   - `expires_at` set to `created_at + 24 hours`
6. **Notification**: Socket.IO `story:new` event sent to all accepted contacts
7. **Confirmation**: User returns to ConversationsScreen, sees their story in StoriesRow

### Code Integration Points

```typescript
// CreateStoryScreen.tsx
const handlePost = async (mediaUri: string, caption: string) => {
  // 1. Upload media
  const mediaUrl = await uploadStoryMedia(mediaUri);
  
  // 2. Create story record
  const story = await api.post('/stories', {
    mediaUrl,
    mediaType: isVideo ? 'video' : 'photo',
    mediaDuration: isVideo ? duration : null,
    caption: caption || null,
  });
  
  // 3. Socket notification handled server-side
  navigation.goBack();
};
```

## Scenario 2: View Stories from Contact

**User Journey**: User browses and views a contact's stories.

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐     ┌─────────────┐
│ User taps    │────►│ StoryViewer    │────►│ Mark as      │────►│ Ring color  │
│ contact ring │     │ opens          │     │ viewed       │     │ updates     │
└──────────────┘     └────────────────┘     └──────────────┘     └─────────────┘
```

### Step-by-Step

1. **Entry Point**: User taps contact avatar with colored ring in StoriesRow
2. **Load Stories**: Fetch all stories from that user (may be multiple segments)
3. **Full-Screen**: StoryViewerScreen opens with first story
4. **Progress**: Progress bar animates (5s for photos, video duration for videos)
5. **Navigation**:
   - Tap right → next segment/user
   - Tap left → previous segment
   - Swipe down → close viewer
   - Hold → pause progress
6. **View Recording**: Server records view via `story:viewed` socket event
7. **UI Update**: Ring changes from colored to muted in StoriesRow

### Code Integration Points

```typescript
// StoryViewerScreen.tsx
const handleStoryViewed = (storyId: string) => {
  socket.emit('story:viewed', { storyId });
  markStoryViewed(storyId); // Update local state
};

// useStoryViewer.ts
const { currentStory, goNext, goPrev, pause, resume } = useStoryViewer({
  stories: userStories,
  onViewed: handleStoryViewed,
});
```

## Scenario 3: Reply to Story

**User Journey**: User sends a message in response to a contact's story.

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐     ┌─────────────┐
│ User types   │────►│ Reply sent as  │────►│ Message with │────►│ Recipient   │
│ reply        │     │ DM             │     │ thumbnail    │     │ sees reply  │
└──────────────┘     └────────────────┘     └──────────────┘     └─────────────┘
```

### Step-by-Step

1. **Entry Point**: User taps reply input at bottom of StoryViewerScreen
2. **Compose**: User types message
3. **Send**: 
   - Create message with `storyReplyId` and `storyThumbnailUrl`
   - Route to existing conversation (or create new)
4. **Display**: ChatScreen shows message with story thumbnail context
5. **Notification**: Standard message notification to recipient

### Code Integration Points

```typescript
// StoryReplyInput.tsx
const handleSendReply = async (text: string) => {
  await api.post('/chat/messages', {
    conversationId: getOrCreateConversation(storyOwner.id),
    content: text,
    storyReplyId: currentStory.id,
    storyThumbnailUrl: currentStory.thumbnailUrl,
  });
  navigation.navigate('Chat', { ... });
};

// ChatScreen.tsx - render story reply
{message.storyReplyId && (
  <StoryReplyBubble
    thumbnailUrl={message.storyThumbnailUrl}
    isExpired={!storyStillActive}
  />
)}
```

## Scenario 4: View Story Analytics

**User Journey**: Story owner checks who viewed their story.

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│ Owner taps   │────►│ StoryViewer    │────►│ Viewers list │
│ own story    │     │ with swipe-up  │     │ appears      │
└──────────────┘     └────────────────┘     └──────────────┘
```

### Step-by-Step

1. **Entry Point**: User taps their own story in StoriesRow
2. **Viewer Mode**: StoryViewerScreen opens (same as viewing others)
3. **Analytics Access**: Swipe up or tap view count to open ViewersListSheet
4. **Viewer List**: Shows list of contacts who viewed with timestamps
5. **Real-time**: View count updates in real-time via socket

### Code Integration Points

```typescript
// ViewersListSheet.tsx
const { viewers, loading } = useStoryViewers(storyId);

return (
  <BottomSheet>
    <FlatList
      data={viewers}
      renderItem={({ item }) => (
        <ViewerRow
          name={item.viewer.displayName}
          avatar={item.viewer.avatarUrl}
          viewedAt={item.viewedAt}
        />
      )}
    />
  </BottomSheet>
);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stories` | Get all visible stories (contacts only) |
| GET | `/stories/mine` | Get current user's active stories |
| POST | `/stories` | Create new story |
| DELETE | `/stories/:id` | Delete own story early |
| GET | `/stories/:id/viewers` | Get viewers list (owner only) |

## Socket.IO Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `story:new` | Server → Client | `{ story }` | New story posted by contact |
| `story:viewed` | Client → Server | `{ storyId }` | Current user viewed a story |
| `story:view_count` | Server → Client | `{ storyId, count }` | Updated view count (owner only) |
| `story:deleted` | Server → Client | `{ storyId }` | Story expired or deleted |

## Storage Structure

```
Supabase Storage: stories/
└── {userId}/
    └── {timestamp}/
        ├── media.jpg (or .mp4)
        └── thumb.jpg (thumbnail)
```

## Local Cache Structure

```
App Cache Directory:
└── stories/
    └── {storyId}/
        ├── media.jpg (or .mp4)
        └── thumb.jpg
```

## Configuration Constants

```typescript
// stories.constants.ts
export const STORY_DURATION_PHOTO = 5000; // 5 seconds
export const STORY_MAX_VIDEO_DURATION = 30; // 30 seconds
export const STORY_EXPIRY_HOURS = 24;
export const STORY_CAPTION_MAX_LENGTH = 200;
export const STORY_CACHE_MAX_SIZE_MB = 100;
```
