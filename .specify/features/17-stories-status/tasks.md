# Tasks: Stories/Status Feature

**Input**: Design documents from `.specify/features/17-stories-status/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Manual testing in Expo Go (no automated tests per project convention)

**Organization**: Tasks grouped by user story. Each story is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile app**: `apps/mobile/src/`
- **Server API**: `apps/server/src/`
- Feature code under `features/stories/`
- Shared code under `shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and install dependencies

- [X] T001 Create stories feature directory structure at apps/mobile/src/features/stories/ with subdirectory hooks/
- [X] T002 Create stories feature directory structure at apps/server/src/features/stories/
- [X] T003 [P] Add Story TypeScript types to apps/mobile/src/shared/types/index.ts:
  - `StoryMediaType = 'photo' | 'video'`
  - `Story` interface with id, userId, user (nested), mediaUrl, mediaType, mediaDuration, thumbnailUrl, caption, createdAt, expiresAt, viewCount, isViewed
  - `StoryView` interface with id, storyId, viewerId, viewer (nested), viewedAt
  - `UserStories` interface with user, stories array, hasUnviewed, latestAt
- [X] T004 [P] Add story constants to apps/mobile/src/features/stories/constants.ts:
  - `STORY_DURATION_PHOTO = 5000`
  - `STORY_MAX_VIDEO_DURATION = 30`
  - `STORY_EXPIRY_HOURS = 24`
  - `STORY_CAPTION_MAX_LENGTH = 200`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core services that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Add stories and story_views tables to apps/server/src/shared/db/schema.ts:
  - Create `storyMediaTypeEnum` with values 'photo', 'video'
  - Create `stories` table: id (uuid PK), user_id (FK users), media_url (varchar 500), media_type (enum), media_duration (int nullable), thumbnail_url (varchar 500 nullable), caption (varchar 200 nullable), created_at (timestamp), expires_at (timestamp)
  - Add indexes: idx_stories_user on (user_id, created_at), idx_stories_expiry on (expires_at)
  - Create `storyViews` table: id (uuid PK), story_id (FK stories with cascade delete), viewer_id (FK users), viewed_at (timestamp)
  - Add indexes: unique_story_view on (story_id, viewer_id), idx_story_views_story on (story_id, viewed_at)
- [ ] T006 Run Drizzle migration: `cd apps/server && npx drizzle-kit generate && npx drizzle-kit push`
- [X] T007 [P] Add STORIES bucket to apps/server/src/shared/services/supabase.ts:
  - Add `STORIES: 'stories'` to BUCKETS constant
  - Update initStorage to create stories bucket with public: true, fileSizeLimit: 50MB
- [X] T008 [P] Create apps/mobile/src/shared/db/stories.db.ts with SQLite schema:
  - Create cached_stories table: id TEXT PK, user_id, user_display_name, user_avatar_url, user_avatar_color, media_local_path, media_url, media_type, media_duration, caption, created_at, expires_at, viewed_at, cached_at
  - Create story_view_status table: story_id TEXT PK, viewed INTEGER default 0, viewed_at TEXT
  - Add CRUD functions: cacheStory, getCachedStories, markStoryViewed, clearExpiredCache, getViewStatus
- [X] T009 [P] Create apps/server/src/features/stories/stories.types.ts with server-side types:
  - `CreateStoryInput`: mediaUrl, mediaType, mediaDuration?, caption?
  - `StoryWithUser`: story fields + user object
  - `StoryViewWithViewer`: view fields + viewer object

**Checkpoint**: Foundation ready - database, storage, and types in place

---

## Phase 3: User Story 1 - Post a Story (Priority: P1) 🎯 MVP

**Goal**: Users can capture/select photo or video (max 30s), add caption, and post as ephemeral story

**Independent Test**: User taps add story → selects media → adds caption → posts → sees story in their stories row

### Implementation for User Story 1

- [X] T010 [P] [US1] Create apps/server/src/features/stories/stories.service.ts with:
  - `createStory(userId, input: CreateStoryInput)`: validate mediaDuration <= 30 for video, set expiresAt = now + 24h, insert into stories table, return story with user
  - `getMyStories(userId)`: get all active stories for user where expires_at > now
  - `deleteStory(userId, storyId)`: verify ownership, delete from stories table
  - `cleanupExpiredStories()`: delete all stories where expires_at < now (for cron job)
- [X] T011 [P] [US1] Create apps/server/src/features/stories/stories.router.ts with:
  - `POST /stories`: authenticate, validate body (mediaUrl required, mediaType required, mediaDuration if video, caption optional max 200), call createStory, return story
  - `GET /stories/mine`: authenticate, call getMyStories, return stories array
  - `DELETE /stories/:id`: authenticate, call deleteStory, return success
  - Mount router in apps/server/src/index.ts under /api/stories
- [X] T012 [P] [US1] Create apps/mobile/src/features/stories/hooks/useCreateStory.ts hook:
  - State: mediaUri, mediaType, mediaDuration, caption, isUploading, error
  - `selectFromGallery()`: use expo-image-picker to select image or video, validate video duration <= 30s
  - `capturePhoto()`: use expo-image-picker camera mode for photo
  - `captureVideo()`: use expo-image-picker camera mode for video, validate duration
  - `setCaption(text)`: validate max 200 chars
  - `uploadAndPost()`: upload media to /api/upload/story, then POST /api/stories, handle errors
- [X] T013 [US1] Create apps/mobile/src/features/stories/CreateStoryScreen.tsx:
  - Full-screen layout with media preview area
  - Top bar: close button (X), "Post" button (disabled while uploading)
  - Media selection: if no media, show two large buttons "Camera" and "Gallery"
  - Once media selected: show preview (Image or Video component)
  - Caption input at bottom: TextInput with placeholder "Add a caption...", max 200 chars, character count
  - Loading overlay when isUploading
  - Use useCreateStory hook for all logic
  - On success: navigation.goBack() and refresh stories
- [X] T014 [US1] Add upload endpoint for story media in apps/server/src/features/stories/stories.router.ts:
  - `POST /stories/upload`: authenticate, accept multipart form data (media file), upload to Supabase Storage stories bucket with path `{userId}/{timestamp}/{filename}`, return { mediaUrl, thumbnailUrl? }
  - Generate thumbnail for videos using sharp or similar
- [X] T015 [US1] Add CreateStory route to apps/mobile/src/navigation/index.tsx:
  - Import CreateStoryScreen
  - Add stack screen: `<Stack.Screen name="CreateStory" component={CreateStoryScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />`
  - Add to navigation types: CreateStory: undefined

**Checkpoint**: Users can post stories - ready for independent testing

---

## Phase 4: User Story 2 - View Stories from Contacts (Priority: P1) 🎯 MVP

**Goal**: Users see stories row on ConversationsScreen, tap to view full-screen with progress bars, navigation gestures

**Independent Test**: User sees avatar row → taps contact with ring → views story full-screen → taps to advance → swipes down to close

### Implementation for User Story 2

- [X] T016 [P] [US2] Extend apps/server/src/features/stories/stories.service.ts with:
  - `getContactsStories(userId)`: join stories with contacts where (requester_id = userId or addressee_id = userId) AND status = 'accepted' AND expires_at > now, group by user, include isViewed flag from story_views
  - `recordView(storyId, viewerId)`: insert into story_views if not exists (upsert), skip if viewer is owner
- [X] T017 [P] [US2] Extend apps/server/src/features/stories/stories.router.ts with:
  - `GET /stories`: authenticate, call getContactsStories, return array of UserStories (grouped by user)
  - `POST /stories/:id/view`: authenticate, call recordView, return success
- [X] T018 [P] [US2] Create apps/mobile/src/features/stories/hooks/useStories.ts hook:
  - State: userStories (UserStories[]), loading, error
  - `loadStories()`: GET /api/stories, parse response, update state
  - `refreshStories()`: reload and cache new data
  - Auto-load on mount, refresh on socket story:new event
  - Cache stories locally using stories.db.ts
- [X] T019 [P] [US2] Create apps/mobile/src/features/stories/hooks/useStoryViewer.ts hook:
  - Props: userStories array, startUserIndex, onComplete callback
  - State: currentUserIndex, currentStoryIndex, isPaused, progress (Animated.Value)
  - `goNext()`: advance to next story or next user, call recordView
  - `goPrev()`: go to previous story or previous user
  - `pause()`: stop progress animation
  - `resume()`: restart progress animation
  - Progress animation: 5000ms for photos, mediaDuration * 1000 for videos
  - Auto-advance when progress completes
  - Return: currentStory, currentUser, progress, goNext, goPrev, pause, resume, isLastStory
- [X] T020 [P] [US2] Create apps/mobile/src/features/stories/StoryProgressBar.tsx:
  - Props: totalSegments (number), currentIndex (number), progress (Animated.Value)
  - Render horizontal row of progress bar segments
  - Completed segments: full background color
  - Current segment: animated width based on progress
  - Pending segments: empty/faded background
  - Style: height 2px, gap 4px between segments, rounded corners
- [X] T021 [P] [US2] Create apps/mobile/src/features/stories/StoryBubble.tsx:
  - Props: user (with avatar), hasUnviewed (boolean), isOwn (boolean), onPress callback
  - Render: Avatar component with colored ring (primary if unviewed, gray if viewed)
  - If isOwn and hasStory: show ring; if isOwn and no story: show "+" overlay
  - Display name below avatar (truncated to ~10 chars)
  - TouchableOpacity wrapper calling onPress
- [X] T022 [US2] Create apps/mobile/src/features/stories/StoriesRow.tsx:
  - Props: userStories (UserStories[]), currentUser, onStoryPress, onAddPress
  - Horizontal ScrollView with showsHorizontalScrollIndicator={false}
  - First item: current user's StoryBubble (isOwn=true), onPress opens CreateStory if no story, or viewer if has story
  - Remaining items: contacts' StoryBubble sorted by hasUnviewed (unviewed first), then by latestAt
  - Style: paddingVertical 12, paddingHorizontal 16, gap 12 between bubbles
- [X] T023 [US2] Create apps/mobile/src/features/stories/StoryViewerScreen.tsx:
  - Route params: userStories, startIndex
  - Full-screen black background, SafeAreaView
  - Use useStoryViewer hook for logic
  - Top: StoryProgressBar showing segments for current user
  - Below progress: user info row (avatar, name, time ago)
  - Center: Image or Video component showing current story media
  - Caption overlay at bottom if caption exists
  - Pressable covering screen for gestures:
    - onPressIn: pause()
    - onPressOut: resume()
    - onPress: determine tap zone (left 1/3 = prev, right 2/3 = next)
  - PanGestureHandler for swipe down to close (translateY > 100 = close)
  - Close button (X) in top right
- [X] T024 [US2] Add StoryViewer route to apps/mobile/src/navigation/index.tsx:
  - Import StoryViewerScreen
  - Add stack screen: `<Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />`
  - Add to navigation types: StoryViewer: { userStories: UserStories[], startIndex: number }
- [X] T025 [US2] Integrate StoriesRow into apps/mobile/src/features/chat/ConversationsScreen.tsx:
  - Import StoriesRow, useStories
  - Add useStories hook at component top
  - Insert StoriesRow above FlatList (before conversation list)
  - Handle onStoryPress: navigate to StoryViewer with userStories and tapped index
  - Handle onAddPress: navigate to CreateStory

**Checkpoint**: Users can view stories with full navigation - ready for independent testing

---

## Phase 5: User Story 3 - Reply to a Story (Priority: P2)

**Goal**: Users can send private message as reply to a story from the viewer

**Independent Test**: User views story → types reply → sends → message appears in chat with story thumbnail

### Implementation for User Story 3

- [X] T026 [P] [US3] Extend messages table in apps/server/src/shared/db/schema.ts:
  - Add `storyReplyId: uuid('story_reply_id').references(() => stories.id)` (nullable)
  - Add `storyThumbnailUrl: varchar('story_thumbnail_url', { length: 500 })` (nullable)
- [ ] T027 [US3] Run Drizzle migration for message schema changes: `cd apps/server && npx drizzle-kit generate && npx drizzle-kit push`
- [X] T028 [P] [US3] Create apps/mobile/src/features/stories/StoryReplyInput.tsx:
  - Props: storyId, storyOwnerId, storyThumbnailUrl, onSent callback
  - Positioned at bottom of StoryViewerScreen (absolute, above safe area)
  - TextInput with placeholder "Reply to story...", send button (arrow icon)
  - On send: POST /api/chat/messages with storyReplyId and storyThumbnailUrl, call onSent
  - Hide component if viewing own story
- [X] T029 [US3] Extend chat message creation in apps/server/src/features/chat/chat.service.ts:
  - Accept optional storyReplyId and storyThumbnailUrl in createMessage
  - Store both fields in messages table
- [X] T030 [US3] Update StoryViewerScreen to include StoryReplyInput:
  - Add StoryReplyInput at bottom when viewing others' stories
  - Pass currentStory.id, currentUser.id, currentStory.thumbnailUrl
  - onSent: optionally navigate to chat or show toast confirmation
- [X] T031 [US3] Create apps/mobile/src/features/chat/components/StoryReplyBubble.tsx:
  - Props: thumbnailUrl (string | null), isExpired (boolean)
  - Render small preview: thumbnail image (60x80) with "Replied to story" label
  - If thumbnailUrl null or isExpired: show placeholder "Story expired"
  - Style: rounded corners, border, muted colors
- [X] T032 [US3] Integrate StoryReplyBubble into ChatScreen message rendering:
  - In renderMessage function, check if message.storyReplyId exists
  - If yes, render StoryReplyBubble above message content
  - Pass message.storyThumbnailUrl and isExpired flag (check if story still active)

**Checkpoint**: Story replies work end-to-end - ready for independent testing

---

## Phase 6: User Story 4 - View Story Analytics (Priority: P2)

**Goal**: Story owners can see list of who viewed their stories

**Independent Test**: User posts story → waits for views → taps own story → swipes up → sees viewer list

### Implementation for User Story 4

- [X] T033 [P] [US4] Extend apps/server/src/features/stories/stories.service.ts with:
  - `getStoryViewers(storyId, userId)`: verify userId owns story, join story_views with users, return array of StoryViewWithViewer sorted by viewedAt desc
  - `getViewCount(storyId)`: count story_views for story
- [X] T034 [P] [US4] Extend apps/server/src/features/stories/stories.router.ts with:
  - `GET /stories/:id/viewers`: authenticate, verify ownership, call getStoryViewers, return array
- [X] T035 [P] [US4] Create apps/mobile/src/features/stories/hooks/useStoryViewers.ts hook:
  - Props: storyId (string)
  - State: viewers (StoryView[]), loading, error
  - `loadViewers()`: GET /api/stories/{storyId}/viewers, update state
  - Auto-load on mount
- [X] T036 [US4] Create apps/mobile/src/features/stories/ViewersListSheet.tsx:
  - Props: storyId, visible, onClose
  - Use @gorhom/bottom-sheet or similar for slide-up sheet
  - Header: "Viewers" title with view count, close button
  - FlatList of viewers: Avatar, displayName, "Viewed X ago" timestamp
  - Empty state: "No views yet" message
  - Use useStoryViewers hook for data
- [X] T037 [US4] Update StoryViewerScreen for analytics access:
  - Add view count display when viewing own story (bottom area, e.g., "12 views")
  - Add swipe-up gesture detector when viewing own story
  - On swipe up or tap view count: open ViewersListSheet
  - Include ViewersListSheet component with proper storyId

**Checkpoint**: Story analytics work - ready for independent testing

---

## Phase 7: User Story 5 - Stories Row Discovery (Priority: P3)

**Goal**: Stories row shows clear visual indicators for unread vs viewed stories

**Independent Test**: User opens app → sees colored rings for unviewed → views story → ring changes to muted

### Implementation for User Story 5

- [X] T038 [P] [US5] Enhance StoryBubble.tsx with ring styling:
  - Unviewed ring: 3px solid primary color (#0084FF), with gradient effect
  - Viewed ring: 2px solid gray (#8A8D91)
  - No story ring: dashed gray border
  - Add subtle shadow for depth
- [X] T039 [P] [US5] Update useStories.ts to track view status:
  - Update local story_view_status table when story is viewed
  - Compute hasUnviewed from local status + server data
  - Persist view status across app sessions
- [X] T040 [US5] Update StoriesRow.tsx ordering and indicators:
  - Sort order: own story first, then unviewed (sorted by latestAt desc), then viewed
  - Add "Your Story" label under own avatar
  - Add "+ Add" indicator if user has no active story

**Checkpoint**: Discovery UX polished - ready for independent testing

---

## Phase 8: Real-time & Polish

**Purpose**: Socket.IO events, cleanup job, and cross-cutting concerns

- [X] T041 [P] Create apps/server/src/features/stories/stories.socket.ts:
  - `handleStoryNew(io, userId, story)`: emit 'story:new' to all accepted contacts' rooms
  - `handleStoryViewed(socket, data)`: record view, emit 'story:view_count' to story owner if online
  - `handleStoryDeleted(io, storyId, contactIds)`: emit 'story:deleted' to affected users
- [X] T042 [P] Integrate story socket handlers in apps/server/src/index.ts:
  - Import stories.socket.ts handlers
  - Register socket event listeners for story:viewed
  - Call handleStoryNew after createStory in router
- [X] T043 [P] Update apps/mobile/src/shared/services/socket.ts:
  - Add listeners for 'story:new', 'story:view_count', 'story:deleted'
  - Export event handlers for stories hook to subscribe
- [X] T044 [P] Add story expiration cleanup job to server:
  - Create apps/server/src/features/stories/stories.cron.ts
  - `runCleanup()`: call cleanupExpiredStories, delete from Supabase Storage
  - Schedule with setInterval every hour (or use node-cron)
  - Call on server startup
- [X] T045 [P] Add video duration validation in CreateStoryScreen:
  - Use expo-av to read video duration before upload
  - Show error toast if duration > 30 seconds
  - Disable Post button until validation passes
- [X] T046 Update apps/mobile/src/features/stories/hooks/useStories.ts to handle socket events:
  - On 'story:new': add story to appropriate userStories group, refresh if needed
  - On 'story:deleted': remove story from cache and state
- [ ] T047 Run quickstart.md validation: manually test all 4 scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3-7 (User Stories)**: All depend on Phase 2 completion
- **Phase 8 (Polish)**: Depends on Phases 3-4 minimum (MVP)

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Post) | Phase 2 only | US2 (after T010-T011) |
| US2 (View) | Phase 2 + T010-T011 from US1 | US1 (after server endpoints) |
| US3 (Reply) | US2 complete | US4 |
| US4 (Analytics) | US1 complete | US3 |
| US5 (Discovery) | US2 complete | US3, US4 |

### Parallel Opportunities per Phase

**Phase 1**: T001, T002, T003, T004 - all parallel
**Phase 2**: T005 first, then T006, then T007, T008, T009 parallel
**Phase 3**: T010, T011, T012 parallel, then T013, T014, T015 sequential
**Phase 4**: T016-T021 parallel, then T022-T025 sequential
**Phase 5-7**: Follow marked [P] tasks

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: US1 Post Story (6 tasks)
4. Complete Phase 4: US2 View Stories (10 tasks)
5. **STOP and VALIDATE**: Test posting and viewing independently
6. Partial Phase 8: Socket events for real-time (T041-T043)

**MVP Total**: ~28 tasks

### Full Feature

7. Complete Phase 5: US3 Reply (7 tasks)
8. Complete Phase 6: US4 Analytics (5 tasks)
9. Complete Phase 7: US5 Discovery (3 tasks)
10. Complete Phase 8: Remaining polish (4 tasks)

**Full Total**: 47 tasks

---

## Notes

- [P] = parallelizable (different files, no dependencies)
- [USn] = belongs to User Story n
- All tasks include exact file paths for LLM execution
- Manual testing in Expo Go after each checkpoint
- Commit after each task or logical group
- Server changes need `npm run dev` restart
- Mobile changes hot-reload automatically
