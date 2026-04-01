# LoZo Messenger - Feature Specification Prompts

This file contains prompts to generate specs using the `speckit.specify` slash command in Claude Code.
Copy each prompt and run `/specify` to create detailed spec.md files.

---

## CRITICAL FIXES (Do First)

### 1. ~~Fix getCurrentUserId Integration~~ — SKIPPED

---

### 2. Message Pagination UI (Infinite Scroll)

```
Add infinite scroll to ChatScreen to load older messages when user scrolls to top.
Backend already supports cursor-based pagination: GET /messages?cursor=&limit=50

Requirements:
- On chat open: load from SQLite first (instant display), then sync newer messages from server in background
- FlatList: trigger load-more when user scrolls to top
- Loading indicator: small spinner pinned at the very top of the message list (above oldest visible message)
- Load 50 messages per page, cache all loaded messages in local SQLite
- When offline or no more messages: silently stop loading (disable trigger, no error shown)
- Maintain scroll position after older messages are inserted (no scroll jumps)

Tech stack: React Native FlatList, SQLite getMessages(conversationId, limit, before)
```

---

### 3. Read Receipts UI

```
Implement real-time message status updates in chat bubbles and conversation list.
Backend already tracks message status (sent/delivered/read) in messageStatuses table.

Requirements:
- Keep existing text-based status labels: sending → sent → delivered → seen
- Show status on sender's messages only (right-aligned bubbles)
- Update in real-time when status changes via Socket.IO
- Conversation list: show status label on last message preview
- Handle offline mode: show "sending" for pending messages in outbox

No checkmark icons — use existing status text style only.
```

---

## HIGH PRIORITY FEATURES

### 4. Image Compression Before Upload

```
Compress images before uploading to Supabase Storage to save bandwidth and storage.
Use expo-image-manipulator to resize/compress on device.

Requirements:
- Compress images to max 1920x1920 pixels (maintain aspect ratio)
- JPEG quality: 80%
- Skip compression for images already under 500KB
- Don't compress GIFs (keep original)
- Keep EXIF orientation
- UI feedback: show small "Compressing..." indicator on the send button / attachment preview during compression
- On compression failure: upload original image silently + show brief warning toast ("Couldn't compress, uploading original")
- Apply to camera photos and gallery selections

Tech: expo-image-manipulator (already available in expo)
```

---

### 5. Message Search (Local SQLite FTS5)

```
Add full-text search capability to find messages across all conversations.
Use SQLite FTS5 (Full-Text Search) for offline-first searching.

Requirements:
- Entry point: tap a search icon in the ConversationsScreen header to reveal a search bar
- Search covers: message text content and media captions only (local SQLite, works offline)
- Show results grouped by conversation
- Highlight matching text in results
- Tap result: open ChatScreen, scroll to the matched message, briefly highlight it
- Real-time search (debounced input)
- Clear search / close search bar button
- Index text content and media captions in FTS5 virtual table

Tech stack: SQLite FTS5 virtual table, React Native search UI
No external services — fully local search.
```

---

### 6. Shared Media Gallery

```
Add a "View Media" screen to browse all images/videos/files shared in a conversation.
Accessible from ChatScreen header menu (3-dot menu → "View Media").

Requirements:
- Three tabs: Photos, Videos, Files
- Photos/Videos: grid layout (3 columns)
- Files: list layout with icon, name, size, date
- Tap photo: open full-screen viewer with swipe navigation
- Long-press item: show action sheet with Forward, Download, Delete options
- Load from local SQLite (filter messages by type)
- Paginated loading (50 items at a time)
- Show date section headers (Today, Yesterday, March 2026, etc.)
- Empty state: "No photos shared yet" (per tab)
- Download file to device storage

Design: Similar to WhatsApp Media tab
```

---

### 7. Message Drafts Auto-Save

```
Auto-save unfinished messages when user leaves a conversation, restore when returning.

Requirements:
- Storage: MMKV key-value store (one key per conversationId)
- Save draft whenever user types in ChatScreen input (debounced, 500ms after last keystroke)
- Restore draft text when ChatScreen mounts
- Clear draft after message is sent
- Persist across app restarts (MMKV persists to disk)
- ConversationsScreen list: show italic preview text in red/orange prefixed with "Draft:" — e.g. "Draft: hey how are..."
- Support text drafts only (media attachments discarded on exit)
- One draft per conversation, max 5000 characters
```

---

## MEDIUM PRIORITY FEATURES

### 8. Link Preview Generation

```
Generate rich previews for URLs sent in messages (title, description, image).
Fetch metadata via a self-hosted endpoint on the existing Koyeb backend.

Requirements:
- Detect URLs in message input in real-time (regex: http/https only)
- Fetch metadata from backend: og:title, og:description, og:image
- Show preview card above the send button before the message is sent
- After message is sent: show preview card inside the chat bubble
- Tap preview to open URL in browser
- Cache previews locally (SQLite table: url_previews keyed by URL)
- Fallback: if fetch fails, show plain URL with no preview card
- Max 1 preview per message (first URL found)
- No privacy warning — fetch silently

Backend: Add /api/link-preview?url= endpoint to existing Express server
Scrape og: meta tags using cheerio or similar
```

---

### 9. Group Chats (Full Implementation — 3 Parts)

```
Add support for group conversations with multiple participants (3+ users).
Split into 3 parts:

--- PART 1: Create group + basic messaging ---
- Create group: select contacts from list, set group name, optional group photo
- Group avatar (no photo): auto-generated grid of up to 4 member avatars (like WhatsApp)
- Basic group messaging: send/receive messages in group conversation
- ChatScreen: show sender name above each bubble (for messages from others)
- Database changes:
  - conversations: add isGroup boolean, groupName, groupPhoto
  - conversation_participants: conversationId, userId, role (admin/member), joinedAt
- Socket.IO: broadcast messages to all online group members

--- PART 2: Admin roles + member management ---
- Creator is admin by default
- Admins can: add members, remove members, promote/demote other admins
- Members can: send messages, leave group
- Participant list screen showing names and roles
- Admin-only actions protected on backend

--- PART 3: Group settings + typing indicators ---
- Group settings screen: edit name, photo, description
- Group settings: who can send messages (everyone / admins only)
- Typing indicator: "Alice and Bob are typing..."
- Notifications: mute group option
- Socket.IO events: group:create, group:update, group:member:add, group:member:remove

UI Screens:
- CreateGroupScreen: contact selector + name/photo input
- GroupInfoScreen: participant list + settings
- ChatScreen updates: sender name in bubbles, group-aware typing indicator
```

---

### 10. Voice/Video Calls (WebRTC — 3 Parts)

```
Add 1:1 voice and video calling capability using WebRTC.
Split into 3 parts:

--- PART 1: Voice calls ---
- Call UI: incoming call screen (accept/reject), active voice call screen
- Call controls: mute/unmute, speaker on/off, end call
- Ringtone: play sound for incoming call (expo-av)
- Background incoming calls: push notification via OneSignal opens incoming call screen
- STUN: stun:stun.l.google.com:19302
- TURN: metered.ca free tier (50GB/month)
- Signaling via Socket.IO:
  1. Caller emits 'call:initiate' with recipientId
  2. Recipient receives 'call:incoming'
  3. SDP offer/answer exchange via Socket.IO
  4. ICE candidates exchanged until connected
  5. Audio stream via WebRTC peer connection

--- PART 2: Video calls ---
- Add video toggle to active call screen
- Camera on/off control
- Switch front/back camera
- Video stream rendering (react-native-webrtc)

--- PART 3: Call history UI ---
- Call records saved to SQLite: call_history table (type, duration, timestamp, contactId)
- Call history screen: list of missed/received/outgoing calls
- Missed call indicator in ConversationsScreen or ContactsScreen
- Connection quality indicator during active call

Tech: react-native-webrtc, Socket.IO signaling, OneSignal for background notifications
```

---

### 11. Stories/Status Feature

```
Add ephemeral story/status sharing (24-hour auto-delete), similar to WhatsApp Status.

Requirements:
- Entry point: horizontal scrollable row at the top of ConversationsScreen (above chat list)
- Story ring: colored ring around avatar for unread stories
- Post story: photo or video (max 30 seconds) with optional caption
- View stories: full-screen vertical swipe navigation with progress bars
- Privacy: visible to accepted contacts only (matches app relationship system)
- Reply to story: opens a private message to the story owner in ChatScreen
- View count: see who viewed your story
- Auto-delete after 24 hours
- Upload to Supabase Storage ('stories' bucket with 24h lifecycle policy)
- Local cache: don't re-download already-viewed stories

Database schema:
- stories: id, userId, mediaUrl, caption, createdAt, expiresAt
- story_views: storyId, viewerId, viewedAt

Socket.IO events: story:new (notify contacts), story:viewed

UI Screens:
- StoriesRow: horizontal scroll component at top of ConversationsScreen
- StoryViewerScreen: full-screen viewer with progress bars + reply input
- CreateStoryScreen: camera/gallery picker + caption input
```

---

### 12. Input Sanitization & Security

```
Add input validation and sanitization to prevent XSS and malicious content.
Implement on both frontend (React Native) and backend (Express).

Requirements:
- Sanitize message content: strip HTML tags, escape special characters
- Validate username: alphanumeric + underscore only, 3-50 chars
- Validate bio/captions: max length, strip scripts
- URL validation: allow only http/https schemes
- File upload validation: check MIME types, file extensions, size limits
- Rate limiting: max 30 messages per minute per user
- SQL injection prevention: already handled via Drizzle parameterized queries
- JWT validation: verify token signature and expiration on every request
- CORS: whitelist allowed origins via environment variable (Koyeb URL + local dev URL)
  - Configurable: ALLOWED_ORIGINS env var, not hardcoded

Backend middleware:
- express-validator for input validation
- express-rate-limit for API rate limiting (30 msg/min)
- helmet.js for security headers
- validator.js for sanitization

Frontend:
- Validate inputs before sending to API
- Escape user-generated content in UI

All packages are free and npm-available.
```

---

## OPTIONAL ENHANCEMENTS

### ~~13. Message Translation~~ — REMOVED (not needed)

---

### 14. Message Scheduling

```
Allow users to schedule messages to send at a future date/time.

Requirements:
- Trigger: long-press the send button → "Schedule" option appears
- Date/time picker modal (date, hour, minute)
- Show scheduled messages in ChatScreen with clock icon + scheduled timestamp
- Edit or cancel scheduled messages before send time
- Storage: local SQLite scheduled_messages table
- Background execution: expo-task-manager or expo-background-fetch
- If app is killed when message is due:
  - Show upfront warning when scheduling: "App must be running to send scheduled messages"
  - Queue in outbox, send automatically when app next opens
- If offline when scheduled: queue in outbox, send when back online

Tech: expo-task-manager (free, built into Expo)
```

---

### 15. Custom Chat Themes

```
Allow users to customize chat bubble colors and backgrounds per conversation.

Requirements:
- Per-conversation customization:
  - Sender bubble color (color picker)
  - Receiver bubble color (color picker)
  - Background: solid color, gradient, or uploaded image
- "Customize Chat" option in ChatScreen 3-dot menu
- Preview before applying
- Reset to default option
- Save preferences in SQLite: conversation_themes table
- Apply theme instantly (no reload)
- Custom background images uploaded to Supabase Storage (persists across devices/reinstalls)

UI:
- Color picker for sender/receiver bubbles (separate)
- Background picker: color swatches, gradient presets, image upload
- Live preview in the customization screen

Storage: Supabase Storage for user-uploaded background images
```

---

## IMPLEMENTATION ORDER RECOMMENDATION

**Week 1 - Critical Fixes & Core UX:**
1. Message Pagination UI
2. Read Receipts UI
3. Image Compression

**Week 2 - Search & Media:**
4. Message Search (FTS5)
5. Shared Media Gallery
6. Message Drafts Auto-Save

**Week 3 - Security & Links:**
7. Input Sanitization & Security
8. Link Preview Generation

**Week 4 - Major Features (Choose 1):**
9. Group Chats (multi-week, 3 parts)
   OR
10. Voice/Video Calls (multi-week, 3 parts)
    OR
11. Stories/Status Feature

**Optional - Future Sprints:**
12. Message Scheduling
13. Custom Chat Themes

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

- All features use **free services only** (Supabase free tier, Koyeb free tier, metered.ca free tier)
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
