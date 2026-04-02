# Feature Specification: Stories/Status Feature

**Feature Branch**: `17-stories-status`  
**Created**: 2026-04-01  
**Status**: Clarified  
**Input**: User description: "Add ephemeral story/status sharing (24-hour auto-delete), similar to WhatsApp Status"

## Clarifications Applied

The following clarifications were made during the `/speckit.clarify` phase:

1. **Multiple Stories Grouping**: Multiple stories from the same user are grouped as segments (one avatar, multiple progress bars) - matches WhatsApp/Instagram UX
2. **Video Display Duration**: Video stories play for their full length (up to 30 seconds) before auto-advancing
3. **Hold-to-Pause**: Users can hold/press to pause progress bar and content display - standard gesture expected by users
4. **Story Reply Context**: Story replies show thumbnail preview of story media + text indicator in chat

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Post a Story (Priority: P1) 🎯 MVP

Users can share ephemeral photo or video content with their contacts that automatically disappears after 24 hours.

**Why this priority**: Core value proposition of the feature. Without the ability to post stories, no other functionality matters. This is the foundational capability that enables all other story-related features.

**Independent Test**: User opens the story creation screen, captures or selects a photo/video (max 30 seconds), adds an optional caption, posts it, and sees it appear in their own stories. The story automatically expires after 24 hours.

**Acceptance Scenarios**:

1. **Given** a user has the app open on the Conversations screen, **When** they tap the "Add Story" button, **Then** they are presented with options to capture a photo/video or select from gallery
2. **Given** a user has selected a photo, **When** they add a caption and tap "Post", **Then** the story is uploaded and visible to their contacts within 5 seconds
3. **Given** a user has selected a video longer than 30 seconds, **When** they try to post, **Then** they see an error message indicating the maximum duration limit
4. **Given** a user posts a story, **When** 24 hours have elapsed, **Then** the story is automatically removed and no longer visible to anyone

---

### User Story 2 - View Stories from Contacts (Priority: P1) 🎯 MVP

Users can browse and view stories posted by their contacts in a full-screen immersive experience with intuitive navigation.

**Why this priority**: Equally critical to posting - users need to consume content for the feature to provide social value. The viewing experience must be smooth and engaging.

**Independent Test**: User sees a horizontal row of contact avatars at the top of Conversations screen, taps on one with an unread indicator, views the story full-screen with progress bars, and can swipe to navigate between stories.

**Acceptance Scenarios**:

1. **Given** a user has contacts who have posted stories, **When** they view the Conversations screen, **Then** they see a horizontal scrollable row at the top showing avatars with colored rings for unread stories
2. **Given** a user taps on a contact's story avatar, **When** the story opens, **Then** it displays full-screen with a progress bar showing story duration
3. **Given** a user is viewing a story, **When** they tap the right side of the screen, **Then** they advance to the next story segment or next contact's story
4. **Given** a user is viewing a story, **When** they swipe down, **Then** the story viewer closes and returns to Conversations screen
5. **Given** a user has viewed all of a contact's stories, **When** they return to Conversations, **Then** the colored ring around that contact's avatar changes to indicate "viewed"

---

### User Story 3 - Reply to a Story (Priority: P2)

Users can react to a friend's story by sending them a private message directly from the story viewer.

**Why this priority**: Enhances engagement and social interaction, but the core viewing/posting experience must work first. Replies create meaningful conversations from story content.

**Independent Test**: User views a contact's story, types a reply in the input field, sends it, and the message appears as a new or continued conversation in ChatScreen referencing the story.

**Acceptance Scenarios**:

1. **Given** a user is viewing another contact's story, **When** they tap the reply input field and type a message, **Then** they can send it as a direct message to the story owner
2. **Given** a user sends a story reply, **When** the recipient opens their chat, **Then** they see the message with context indicating it was a reply to their story
3. **Given** a user tries to reply to their own story, **Then** the reply option is not available

---

### User Story 4 - View Story Analytics (Priority: P2)

Story owners can see who has viewed their stories, providing transparency and engagement insights.

**Why this priority**: Important for user satisfaction and understanding reach, but secondary to the core post/view experience. Helps users understand their audience engagement.

**Independent Test**: User posts a story, waits for views, taps on their own story, and sees a list of viewers with timestamps.

**Acceptance Scenarios**:

1. **Given** a user has posted a story that has been viewed, **When** they tap on their own story and swipe up, **Then** they see a list of contacts who viewed it
2. **Given** a user views the viewer list, **When** they examine an entry, **Then** they see the viewer's name, avatar, and when they viewed it
3. **Given** a user's story has no views yet, **When** they check analytics, **Then** they see an empty state message indicating no views yet

---

### User Story 5 - Stories Row Discovery (Priority: P3)

The stories row provides visual discovery of available stories and clearly indicates which have new content.

**Why this priority**: UX polish that enhances discoverability. Core functionality works without it, but this improves the user experience significantly.

**Independent Test**: User opens Conversations screen and immediately sees which contacts have stories (avatars with rings) and which have unread content (colored vs muted rings).

**Acceptance Scenarios**:

1. **Given** a user opens the app, **When** any contact has posted a story in the last 24 hours, **Then** their avatar appears in the stories row with a ring indicator
2. **Given** a user has unviewed stories, **When** they look at the stories row, **Then** unviewed stories show a colored ring (primary color) while viewed ones show a muted ring
3. **Given** a user scrolls the stories row horizontally, **When** there are more stories than fit on screen, **Then** they can scroll to see all available stories
4. **Given** the user's own story status, **When** they have posted a story, **Then** their avatar appears first with a distinct "+" indicator to add more

---

### Edge Cases

- What happens when a user tries to post a story while offline? → Story is queued locally and uploaded when connectivity returns, with user notification
- What happens when a story fails to upload? → User sees retry option; story remains in draft state until successfully posted or manually discarded
- How does the system handle corrupted or unsupported media files? → Validation occurs before upload; user sees clear error message with supported formats
- What happens when a user blocks someone who has viewed their story? → View record remains, but blocked user can no longer see future stories
- What happens when viewing a story and the app crashes? → Story progress is saved; user resumes from where they left off
- What happens when storage quota is exceeded? → Oldest expired stories are purged first; active stories are preserved

## Requirements *(mandatory)*

### Functional Requirements

**Story Creation & Posting**
- **FR-001**: System MUST allow users to capture photos using the device camera for stories
- **FR-002**: System MUST allow users to record videos up to 30 seconds using the device camera
- **FR-003**: System MUST allow users to select existing photos/videos from device gallery
- **FR-004**: System MUST allow users to add text captions (up to 200 characters) to stories
- **FR-005**: System MUST validate video duration does not exceed 30 seconds before upload
- **FR-006**: System MUST upload story media to cloud storage with appropriate compression
- **FR-007**: System MUST automatically delete stories 24 hours after posting

**Story Viewing**
- **FR-008**: System MUST display a horizontal scrollable stories row at the top of the conversations list
- **FR-009**: System MUST show colored ring around avatars with unread stories
- **FR-010**: System MUST show muted/gray ring around avatars with already-viewed stories
- **FR-011**: System MUST present stories in full-screen mode with progress bar indicators
- **FR-012**: System MUST support tap-to-advance and swipe navigation between stories
- **FR-013**: System MUST auto-advance to next story segment after display duration (5 seconds for photos, full video length up to 30 seconds for videos)
- **FR-014**: System MUST cache viewed stories locally to avoid re-downloading
- **FR-025**: System MUST group multiple stories from the same user as segments (one avatar with multiple progress bars)
- **FR-026**: System MUST pause story progress and playback when user holds/presses on the screen

**Privacy & Visibility**
- **FR-015**: System MUST restrict story visibility to accepted contacts only (matching existing relationship system)
- **FR-016**: System MUST record views when contacts view a story
- **FR-017**: System MUST allow story owners to see who viewed their story with timestamps

**Replies & Interaction**
- **FR-018**: System MUST provide reply input on story viewer for sending direct messages
- **FR-019**: System MUST route story replies to ChatScreen as private messages
- **FR-020**: System MUST indicate in the chat that the message was a story reply with thumbnail preview of the story media

**Real-time Updates**
- **FR-021**: System MUST notify contacts in real-time when a new story is posted
- **FR-022**: System MUST update story view counts in real-time for the owner

**Data Management**
- **FR-023**: System MUST enforce 24-hour lifecycle policy on story media storage
- **FR-024**: System MUST handle offline story posting by queuing and syncing when online

### Key Entities

- **Story**: Represents a single ephemeral post - contains media reference, optional caption, creation timestamp, expiration timestamp, and owner reference
- **StoryView**: Records when a contact views a story - contains story reference, viewer reference, and view timestamp
- **StoryOwner**: The user who posted the story - linked to existing user/contact system

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can post a story (photo or video with caption) in under 30 seconds from app open
- **SC-002**: Stories load and display within 2 seconds when tapped from the stories row
- **SC-003**: 100% of stories are automatically removed within 1 minute of their 24-hour expiration
- **SC-004**: Story privacy is enforced - 0% of stories visible to non-contacts
- **SC-005**: Users can view who watched their story with 100% accuracy
- **SC-006**: Story replies successfully deliver as chat messages 99% of the time
- **SC-007**: Real-time story notifications reach contacts within 3 seconds of posting
- **SC-008**: Offline-posted stories sync within 30 seconds of connectivity restoration
- **SC-009**: Story viewing experience has smooth navigation with no perceived lag between segments
- **SC-010**: Users can view all available contact stories through horizontal scroll without loading delays

## Assumptions

- Users have granted camera and photo library permissions (standard mobile app permissions flow)
- Device has sufficient storage for local story caching (minimum 100MB available)
- Existing contact/relationship system is in place and functional (contacts must be "accepted" to see stories)
- Network connectivity is generally available, though offline support is required for resilience
- Video compression will be handled to balance quality and upload speed
- The existing real-time messaging infrastructure (Socket.IO) will be extended for story notifications
- Storage service supports lifecycle policies for automatic content expiration
- Caption text is plain text only (no formatting, mentions, or links in v1)
