# LoZo Messenger - Feature Specification Prompts

This file contains prompts to generate specs using the `speckit.specify` slash command in Claude Code.
Copy each prompt and run `/specify` to create detailed spec.md files.

---

## CRITICAL FIXES (Do First)

### 1. Fix getCurrentUserId Integration
```
Fix the getCurrentUserId() function in messages.db.ts that currently returns empty string.
It should integrate with the auth store (Zustand) to return the actual logged-in user ID.
This is breaking local database queries that need to know the current user.

Technical context:
- File: apps/mobile/src/shared/db/messages.db.ts:153
- Auth store: apps/mobile/src/shared/stores/auth.ts
- The function is used to determine sync_status for messages (sent vs delivered)
- Must work synchronously with Zustand getState()
```

### 2. Message Pagination UI (Infinite Scroll)
```
Add infinite scroll to ChatScreen to load older messages when user scrolls to top.
Backend already supports cursor-based pagination: GET /messages?cursor=&limit=50

Requirements:
- FlatList onEndReached to trigger load more
- Show loading spinner at top while fetching
- Maintain scroll position after new messages inserted
- Load 50 messages per page
- Cache loaded messages in local SQLite
- Handle edge case: no more messages (disable loading)
- Smooth UX - no scroll jumps

Tech stack: React Native FlatList, SQLite getMessages(conversationId, limit, before)
```

### 3. Read Receipts UI (Double Checkmarks)
```
Implement visual read receipt indicators in chat bubbles and conversation list.
Backend already tracks message status (sent/delivered/read) in messageStatuses table.

Requirements:
- Single gray checkmark ✓ = sent to server
- Double gray checkmarks ✓✓ = delivered to recipient
- Double blue checkmarks ✓✓ = read by recipient
- Show status on sender's messages only (right-aligned bubbles)
- Update in real-time when status changes via Socket.IO
- Conversation list: show status on last message preview
- Handle offline mode: show clock icon for pending messages

Design: Match WhatsApp/Messenger style
```

---

## HIGH PRIORITY FEATURES

### 4. Message Search (Local SQLite FTS5)
```
Add full-text search capability to find messages across all conversations.
Use SQLite FTS5 (Full-Text Search) for offline-first searching.

Requirements:
- Search bar in ConversationsScreen header
- Search messages by content (text/captions)
- Filter by contact name
- Show results grouped by conversation
- Highlight matching text in results
- Tap result to jump to message in ChatScreen
- Search works offline (local SQLite only)
- Index text content and media captions
- Real-time search (debounced input)
- Clear search history

Tech stack: SQLite FTS5 virtual table, React Native search UI
No external services - fully local search
```

### 5. Shared Media Gallery
```
Add a "View Media" screen to browse all images/videos/files shared in a conversation.
Accessible from ChatScreen header menu or contact profile.

Requirements:
- Three tabs: Photos, Videos, Files
- Grid layout for photos (3 columns)
- List layout for files (with icon, name, size, date)
- Tap photo to open full-screen viewer with swipe navigation
- Long-press to forward/delete/download
- Load from local SQLite (filter messages by type)
- Paginated loading (50 items at a time)
- Show date headers (Today, Yesterday, March 2026)
- Empty state: "No photos shared yet"
- Download file to device storage

Design: Similar to WhatsApp Media tab
```

### 6. Image Compression Before Upload
```
Compress images before uploading to Supabase Storage to save bandwidth and storage.
Use expo-image-manipulator to resize/compress on device.

Requirements:
- Compress images to max 1920x1920 pixels (maintain aspect ratio)
- JPEG quality: 80% (balance quality/size)
- Keep EXIF orientation
- Show compression progress indicator
- Fallback: if compression fails, upload original with warning toast
- Skip compression for images already under 500KB
- Apply to camera photos and gallery selections
- Don't compress GIFs (keep original)

Tech: expo-image-manipulator (already available in expo)
Free tier limits: Supabase 1GB storage - compression extends this significantly
```

### 7. Message Drafts Auto-Save
```
Auto-save unfinished messages when user leaves a conversation, restore when returning.
Store drafts in local SQLite or MMKV for instant access.

Requirements:
- Save draft whenever user types in ChatScreen input
- Debounce saves (500ms after last keystroke)
- Restore draft when ChatScreen mounts
- Clear draft after message sent
- Show draft indicator in ConversationsScreen (italic preview: "Draft: message...")
- Support text drafts only (media attachments discarded on exit)
- Persist across app restarts
- One draft per conversation
- Maximum 5000 characters per draft

Storage: Add drafts table to SQLite or use MMKV key-value store
```

---

## MEDIUM PRIORITY FEATURES

### 8. Link Preview Generation
```
Generate rich previews for URLs sent in messages (title, description, image).
Use a free meta-scraping service or custom backend endpoint.

Requirements:
- Detect URLs in message content (regex)
- Fetch metadata: og:title, og:description, og:image
- Show preview card below message bubble (title + image + domain)
- Tap preview to open URL in browser
- Cache previews locally (SQLite table: url_previews)
- Fallback: if fetch fails, show plain URL
- Support http/https only (no javascript: or file: schemes)
- Max 1 preview per message (first URL found)
- Privacy: warn before loading external content (optional)

Free service options:
- Option A: Self-hosted meta scraper on Koyeb backend
- Option B: linkpreview.net free tier (60 requests/hour)
- Recommendation: Build simple endpoint on existing backend to avoid 3rd party
```

### 9. Group Chats (Full Implementation)
```
Add support for group conversations with multiple participants (3+ users).
This is a major feature requiring database schema changes, new UI screens, and Socket.IO events.

Requirements:
- Create group: select contacts, set group name, upload group photo
- Group metadata: name, photo, description, created by, created date
- Participant roles: admin (creator + promoted members), member
- Admin actions: add/remove members, edit group info, promote/demote admins
- Member actions: send messages, leave group
- Group settings: who can send messages (everyone/admins only)
- Show participant list with roles
- Group message bubbles: show sender name above bubble
- Typing indicator: "Alice and Bob are typing..."
- Message delivery: track per participant (complex)
- Notifications: mute group, custom notification sound
- Group icon: auto-generate from first 4 members if no photo set

Database changes:
- conversations table: add isGroup boolean, groupName, groupPhoto, groupDescription
- conversation_participants table: conversationId, userId, role, joinedAt
- Update message schema to support group context

Socket.IO events:
- group:create, group:update, group:member:add, group:member:remove
- Broadcast messages to all online group members

UI Screens:
- CreateGroupScreen: select contacts, set name/photo
- GroupInfoScreen: view/edit group details, participant list
- ChatScreen updates: show sender names in bubbles

This is a multi-day feature - break into sub-specs if needed
```

### 10. Voice/Video Calls (WebRTC)
```
Add 1:1 voice and video calling capability using WebRTC.
Use a free TURN/STUN server for NAT traversal.

Requirements:
- Call types: voice only, video call
- Call UI: incoming call screen (accept/reject), active call screen
- Call controls: mute/unmute, speaker on/off, camera toggle, end call
- Call history: missed/received/outgoing calls with timestamps
- Ringtone: play sound for incoming call (use expo-av)
- Notifications: show incoming call even when app backgrounded
- Connection quality indicator: show poor connection warning
- Fallback: if WebRTC fails, show error + suggest trying again
- Save call records to SQLite (call_history table)

Tech stack:
- react-native-webrtc for peer connections
- Socket.IO for signaling (offer/answer/ICE candidates)
- Free STUN server: stun:stun.l.google.com:19302
- Free TURN server: metered.ca free tier (50GB/month)

Signaling flow:
1. Caller emits 'call:initiate' with recipientId
2. Recipient receives 'call:incoming' event
3. If accepted: exchange SDP offer/answer via Socket.IO
4. ICE candidates exchanged until connection established
5. Stream audio/video via WebRTC peer connection

This is a major feature - consider breaking into sub-specs:
- Part 1: Voice calls only
- Part 2: Add video
- Part 3: Call history UI
```

### 11. Stories/Status Feature
```
Add ephemeral story/status sharing (24-hour auto-delete), similar to WhatsApp Status.

Requirements:
- Post story: photo/video with optional caption
- Story types: image, video (max 30 seconds)
- View stories: full-screen vertical swipe navigation
- Story ring in ContactsScreen: colored ring around avatar for unread stories
- Story privacy: visible to all contacts or selected contacts only
- View count: see who viewed your story
- Reply to story: sends a private message to story owner
- Auto-delete after 24 hours
- Upload to Supabase Storage with 24h lifecycle policy
- Local cache: don't re-download viewed stories

Database schema:
- stories table: id, userId, mediaUrl, caption, createdAt, expiresAt
- story_views table: storyId, viewerId, viewedAt

UI Screens:
- StoriesScreen: horizontal scrollable list of contact stories
- StoryViewerScreen: full-screen story viewer with progress bars
- CreateStoryScreen: camera + caption input

Socket.IO events:
- story:new (notify contacts), story:viewed

Supabase Storage lifecycle:
- Set auto-delete policy on 'stories' bucket (24 hours)

Free tier consideration: Stories consume storage/bandwidth - implement view limits if needed
```

### 12. Input Sanitization & Security
```
Add input validation and sanitization to prevent XSS attacks and malicious content.
Implement on both frontend (React Native) and backend (Express).

Requirements:
- Sanitize message content: strip HTML tags, escape special characters
- Validate username: alphanumeric + underscore only, 3-50 chars
- Validate bio/captions: max length, strip scripts
- URL validation: allow only http/https schemes
- File upload validation: check MIME types, file extensions, size limits
- Rate limiting: max 10 messages per minute per user
- SQL injection prevention: use parameterized queries (already done with Drizzle)
- JWT validation: verify token signature and expiration on every request
- CORS configuration: whitelist allowed origins only

Backend middleware:
- express-validator for input validation
- express-rate-limit for API rate limiting
- helmet.js for security headers
- DOMPurify or validator.js for sanitization

Frontend:
- Validate inputs before sending to API
- Escape user-generated content in UI
- CSP headers (for web version if applicable)

All packages are free and npm-available
```

---

## OPTIONAL ENHANCEMENTS

### 13. Message Translation
```
Add automatic message translation to user's preferred language.
Use a free translation API with reasonable limits.

Requirements:
- Long-press message → "Translate" option
- Detect source language automatically
- Translate to user's app language (or custom preference)
- Show translated text below original in gray italic
- Cache translations locally (don't re-translate same message)
- Free tier limitation: max 500K characters/month

Free API options:
- LibreTranslate (self-hosted or libre-translate.com free tier)
- Google Translate API (free tier: $10/month credit, ~500K chars)
- MyMemory Translation API (free tier: 10K words/day)

Recommendation: MyMemory API (no credit card, 10K words/day is enough for testing)
```

### 14. Message Scheduling
```
Allow users to schedule messages to send at a future date/time.
Useful for birthday wishes, reminders, time-zone differences.

Requirements:
- Long-press send button → "Schedule" option
- Date/time picker modal (date, hour, minute)
- Show scheduled messages in ChatScreen with clock icon + timestamp
- Edit or cancel scheduled messages before send time
- Send automatically when time arrives (requires background task)
- If offline when scheduled, queue in outbox and send when online
- Store in local SQLite: scheduled_messages table
- Background execution: use expo-task-manager or expo-background-fetch

Limitations:
- Only works if app is running or in background (no push if app killed)
- Consider showing warning: "App must be running to send scheduled messages"

Tech: expo-task-manager (free, built into Expo)
```

### 15. Custom Chat Themes
```
Allow users to customize chat bubble colors, backgrounds, and fonts per conversation.

Requirements:
- Per-conversation customization: bubble colors, background image/color
- Global theme: light/dark mode (already implemented)
- Chat bubble gradients (like Messenger)
- Background options: solid color, gradient, uploaded image, default
- Font size: small/medium/large (accessibility)
- Save preferences in SQLite: conversation_themes table
- Apply theme instantly (no reload required)
- Reset to default option

UI:
- "Customize Chat" option in ChatScreen menu
- Color picker for bubbles (sender/receiver separate)
- Background picker: color/gradient/image gallery
- Preview before applying

Storage: Supabase Storage for custom backgrounds (user-uploaded)
```

---

## IMPLEMENTATION ORDER RECOMMENDATION

**Week 1 - Critical Fixes:**
1. Fix getCurrentUserId Integration
2. Message Pagination UI
3. Read Receipts UI
4. Image Compression

**Week 2 - Search & Media:**
5. Message Search (FTS5)
6. Shared Media Gallery
7. Message Drafts Auto-Save

**Week 3 - Security & Links:**
8. Input Sanitization & Security
9. Link Preview Generation

**Week 4 - Major Features (Choose 1):**
10. Group Chats (multi-week feature)
    OR
11. Voice/Video Calls (multi-week feature)
    OR
12. Stories/Status Feature

**Optional - Future Sprints:**
13. Message Translation
14. Message Scheduling
15. Custom Chat Themes

---

## HOW TO USE THIS FILE

1. **Copy a prompt** from above (the text in code blocks)
2. **Run in Claude Code:** `/specify` (or `speckit.specify`)
3. **Paste the prompt** when asked for feature description
4. **Review generated spec** in `.specify/features/[feature-name]/spec.md`
5. **Return to main chat** and tell me: "Implement feature X"
6. **I'll create implementation plan** and execute tasks one by one

---

## NOTES

- All features use **free services only** (Supabase free tier, Koyeb free tier)
- **Test locally first**: Run server on localhost before deploying to Koyeb
- **No CI/CD or tests** in these specs (as requested)
- **SQLite-first**: All features should work offline where possible
- **Syria-compatible**: No Firebase, no services blocked in Syria

---

## LOCAL TESTING SETUP

Before implementing features, ensure local environment is ready:

**Backend (Server):**
```bash
cd apps/server
npm install
# Create .env file with local PostgreSQL or Supabase connection
npm run dev  # Runs on http://localhost:3000
```

**Mobile App:**
```bash
cd apps/mobile
npm install
# Update BASE_URL in src/shared/services/api.ts to http://localhost:3000
npm start
# Press 'a' for Android or 'i' for iOS
```

**Database:**
- Use Supabase free tier (online) OR
- Install PostgreSQL locally (offline development)
- Run migrations: `npm run db:migrate` in apps/server

**Socket.IO:**
- Server already configured on same port as Express
- Mobile connects to same BASE_URL

Test checklist:
✅ Server running on localhost:3000
✅ Mobile app connecting to local server
✅ SQLite database created on device
✅ Socket.IO connected (check console logs)
✅ Can register, login, send messages locally
