# Implementation Plan: Stories/Status Feature

**Branch**: `17-stories-status` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `.specify/features/17-stories-status/spec.md`

## Summary

Implement ephemeral story/status sharing with 24-hour auto-delete, similar to WhatsApp Status. Users can post photo/video stories (max 30 seconds) visible only to accepted contacts, view stories in a full-screen viewer with progress bars and hold-to-pause, reply to stories as private messages, and see who viewed their stories. Stories are uploaded to Supabase Storage with lifecycle policies and synchronized via Socket.IO for real-time notifications.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React Native (Expo SDK 54), Node.js + Express, Socket.IO, Drizzle ORM  
**Storage**: PostgreSQL (Supabase) for metadata, Supabase Storage for media (new 'stories' bucket with 24h lifecycle)  
**Testing**: Manual testing in Expo Go (per project convention)  
**Target Platform**: iOS/Android via Expo Go, Node.js server on Koyeb  
**Project Type**: Mobile app + API server (existing monorepo)  
**Performance Goals**: Story load <2s, post completion <30s, real-time notifications <3s  
**Constraints**: Syria-accessible services only, free tier limits, offline-capable viewing (cached stories)  
**Scale/Scope**: ~10 users, 3 new screens, 2 new database tables, 1 new storage bucket

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **1. Syria Accessibility** | ✅ PASS | Supabase Storage already in use and Syria-accessible |
| **2. Offline-First** | ✅ PASS | Stories cached locally after first view; offline viewing supported |
| **3. TypeScript Everywhere** | ✅ PASS | All code will be TypeScript strict mode |
| **4. Feature-Based Architecture** | ✅ PASS | New `stories/` feature folder in mobile and server |
| **5. Messenger-Identical UX** | ✅ PASS | Stories row matches Facebook/Instagram stories pattern |
| **6. Incremental Module Delivery** | ✅ PASS | Phased implementation by user story priority |

**Gate Result**: ✅ All principles satisfied. No violations.

## Project Structure

### Documentation (this feature)

```text
.specify/features/17-stories-status/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Validation checklists
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/
├── mobile/src/
│   ├── features/
│   │   └── stories/                    # NEW: Stories feature module
│   │       ├── StoriesRow.tsx          # Horizontal scroll at ConversationsScreen top
│   │       ├── StoryViewerScreen.tsx   # Full-screen viewer with progress bars
│   │       ├── CreateStoryScreen.tsx   # Camera/gallery picker + caption
│   │       ├── StoryBubble.tsx         # Individual story avatar in row
│   │       ├── StoryProgressBar.tsx    # Segmented progress indicator
│   │       ├── StoryReplyInput.tsx     # Reply input overlay
│   │       ├── ViewersListSheet.tsx    # Bottom sheet showing who viewed
│   │       ├── hooks/
│   │       │   ├── useStories.ts       # Fetch/cache stories hook
│   │       │   └── useStoryViewer.ts   # Viewer navigation/timing hook
│   │       └── types.ts                # Story-specific TypeScript types
│   │   └── chat/
│   │       └── ConversationsScreen.tsx # Modified to include StoriesRow
│   ├── shared/
│   │   ├── db/
│   │   │   └── stories.db.ts           # Local SQLite for story cache
│   │   ├── services/
│   │   │   └── socket.ts               # Extended with story:* events
│   │   └── types/
│   │       └── index.ts                # Extended with Story types
│   └── navigation/
│       └── index.tsx                   # Add StoryViewer + CreateStory routes
│
└── server/src/
    ├── features/
    │   └── stories/                    # NEW: Stories feature module
    │       ├── stories.router.ts       # REST endpoints for stories CRUD
    │       ├── stories.service.ts      # Business logic
    │       ├── stories.socket.ts       # Socket.IO event handlers
    │       └── stories.types.ts        # Server-side types
    └── shared/
        ├── db/
        │   └── schema.ts               # Extended with stories + story_views tables
        └── services/
            └── supabase.ts             # Extended with STORIES bucket
```

**Structure Decision**: Feature-based folders under existing `apps/mobile/src/features/` and `apps/server/src/features/` directories. New `stories/` feature module contains all story-related code, following established patterns from `chat/` and `contacts/` features.
