# Data Model: Stories/Status Feature

**Feature**: 17-stories-status  
**Date**: 2026-04-01  
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   stories   │       │ story_views │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ user_id (FK)│       │ id (PK)     │
│ username    │       │ id (PK)     │◄──────│ story_id(FK)│
│ display_name│       │ media_url   │       │ viewer_id   │──────►│ users │
│ avatar_url  │       │ media_type  │       │ viewed_at   │
│ ...         │       │ caption     │       └─────────────┘
└─────────────┘       │ created_at  │
                      │ expires_at  │
                      └─────────────┘
                            │
                            │ storyReplyId
                            ▼
                      ┌─────────────┐
                      │  messages   │
                      ├─────────────┤
                      │ id (PK)     │
                      │ story_reply │
                      │ story_thumb │
                      │ ...         │
                      └─────────────┘
```

## Server-Side Entities (PostgreSQL)

### stories

Represents a single ephemeral story post with 24-hour lifetime.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, default random | Unique identifier |
| `user_id` | UUID | FK → users.id, NOT NULL | Story owner |
| `media_url` | VARCHAR(500) | NOT NULL | Supabase Storage URL |
| `media_type` | ENUM | NOT NULL, 'photo' \| 'video' | Media content type |
| `media_duration` | INTEGER | NULL | Video duration in seconds (NULL for photos) |
| `caption` | VARCHAR(200) | NULL | Optional text caption |
| `thumbnail_url` | VARCHAR(500) | NULL | Pre-generated thumbnail for replies |
| `created_at` | TIMESTAMP | NOT NULL, default now | When posted |
| `expires_at` | TIMESTAMP | NOT NULL | When story auto-deletes (created_at + 24h) |

**Indexes**:
- `idx_stories_user` on `(user_id, created_at DESC)` - User's stories
- `idx_stories_expiry` on `(expires_at)` - Cleanup job queries
- `idx_stories_active` on `(expires_at, user_id)` - Active stories by user

**Validation Rules**:
- `media_type = 'video'` requires `media_duration <= 30`
- `expires_at = created_at + INTERVAL '24 hours'`
- `caption` max 200 characters

### story_views

Records when a contact views a story for analytics.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, default random | Unique identifier |
| `story_id` | UUID | FK → stories.id, NOT NULL | Story that was viewed |
| `viewer_id` | UUID | FK → users.id, NOT NULL | User who viewed |
| `viewed_at` | TIMESTAMP | NOT NULL, default now | When viewed |

**Indexes**:
- `idx_story_views_story` on `(story_id, viewed_at DESC)` - Viewers list
- `unique_story_view` on `(story_id, viewer_id)` - One view per user

**Constraints**:
- `viewer_id != story.user_id` (can't view own story for analytics)

### messages (Extended)

Add story reply fields to existing messages table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `story_reply_id` | UUID | FK → stories.id, NULL | Story being replied to |
| `story_thumbnail_url` | VARCHAR(500) | NULL | Cached thumbnail for expired stories |

**Note**: Both fields nullable. When `story_reply_id` is set, message is a story reply.

## Client-Side Entities (SQLite Cache)

### cached_stories

Local cache of viewed stories for offline access.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PK | Story UUID from server |
| `user_id` | TEXT | NOT NULL | Story owner ID |
| `user_display_name` | TEXT | NOT NULL | Cached display name |
| `user_avatar_url` | TEXT | NULL | Cached avatar URL |
| `user_avatar_color` | TEXT | NOT NULL | Cached avatar color |
| `media_local_path` | TEXT | NULL | Local filesystem path |
| `media_url` | TEXT | NOT NULL | Remote URL (fallback) |
| `media_type` | TEXT | NOT NULL | 'photo' or 'video' |
| `media_duration` | INTEGER | NULL | Video duration |
| `caption` | TEXT | NULL | Caption text |
| `created_at` | TEXT | NOT NULL | ISO timestamp |
| `expires_at` | TEXT | NOT NULL | ISO timestamp |
| `viewed_at` | TEXT | NULL | When current user viewed |
| `cached_at` | TEXT | NOT NULL | When downloaded |

**Indexes**:
- `idx_cached_user` on `(user_id, created_at DESC)`
- `idx_cached_expiry` on `(expires_at)`

### story_view_status

Track which stories have been viewed (for ring color).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `story_id` | TEXT | PK | Story UUID |
| `viewed` | INTEGER | NOT NULL, default 0 | 1 = viewed, 0 = unviewed |
| `viewed_at` | TEXT | NULL | ISO timestamp |

## State Transitions

### Story Lifecycle

```
[Created] ─────► [Active] ─────► [Expired] ─────► [Deleted]
    │               │                │
    │               │                └── expires_at reached
    │               │                    (server cleanup job)
    │               │
    │               └── viewed by contact
    │                   (creates story_view record)
    │
    └── uploaded to Supabase Storage
        (media_url populated)
```

### View Status

```
[Unviewed] ────► [Viewed]
     │               │
     │               └── User opens story
     │                   (colored ring → muted ring)
     │
     └── Story appears in contacts' stories
```

## TypeScript Interfaces

### Shared Types

```typescript
// Story media type
type StoryMediaType = 'photo' | 'video';

// Story from server API
interface Story {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string;
  };
  mediaUrl: string;
  mediaType: StoryMediaType;
  mediaDuration: number | null; // seconds, null for photos
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  viewCount: number; // for own stories
  isViewed: boolean; // for others' stories
}

// Story view record
interface StoryView {
  id: string;
  storyId: string;
  viewerId: string;
  viewer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string;
  };
  viewedAt: string;
}

// Grouped stories by user (for StoriesRow)
interface UserStories {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
  latestAt: string;
}

// Story reply in message
interface StoryReplyContext {
  storyId: string;
  thumbnailUrl: string | null;
  wasExpired: boolean; // true if story expired when reply sent
}
```

## Drizzle Schema Extension

```typescript
// Add to apps/server/src/shared/db/schema.ts

export const storyMediaTypeEnum = pgEnum('story_media_type', ['photo', 'video']);

export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  mediaUrl: varchar('media_url', { length: 500 }).notNull(),
  mediaType: storyMediaTypeEnum('media_type').notNull(),
  mediaDuration: integer('media_duration'), // seconds, null for photos
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  caption: varchar('caption', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => [
  index('idx_stories_user').on(table.userId, table.createdAt),
  index('idx_stories_expiry').on(table.expiresAt),
]);

export const storyViews = pgTable('story_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  viewerId: uuid('viewer_id').notNull().references(() => users.id),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('unique_story_view').on(table.storyId, table.viewerId),
  index('idx_story_views_story').on(table.storyId, table.viewedAt),
]);

// Extend messages table
// Add to existing messages definition:
// storyReplyId: uuid('story_reply_id').references(() => stories.id),
// storyThumbnailUrl: varchar('story_thumbnail_url', { length: 500 }),
```

## Validation Rules Summary

| Entity | Field | Rule |
|--------|-------|------|
| stories | media_duration | ≤ 30 seconds for videos |
| stories | caption | ≤ 200 characters |
| stories | expires_at | = created_at + 24 hours |
| story_views | viewer_id | ≠ story.user_id |
| story_views | (story_id, viewer_id) | Unique |
| messages | story_thumbnail_url | Required if story_reply_id set |
