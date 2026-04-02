import { and, desc, eq, gt, lt, or, sql } from 'drizzle-orm';
import { db } from '../../shared/db';
import { AppError } from '../../shared/middleware/error-handler';
import { contacts, stories, storyViews, users } from '../../shared/db/schema';
import type { CreateStoryInput } from './stories.types';

const STORY_EXPIRY_HOURS = 24;
const STORY_VIDEO_LIMIT_SECONDS = 30;

function normalizeStoryRow(row: any) {
  return {
    id: row.id,
    userId: row.userId,
    mediaUrl: row.mediaUrl,
    mediaType: row.mediaType,
    mediaDuration: row.mediaDuration,
    thumbnailUrl: row.thumbnailUrl,
    caption: row.caption,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    user: {
      id: row.user.id,
      displayName: row.user.displayName,
      avatarUrl: row.user.avatarUrl,
      avatarColor: row.user.avatarColor,
    },
  };
}

export async function createStory(userId: string, input: CreateStoryInput) {
  if (input.mediaType === 'video' && (input.mediaDuration ?? 0) > STORY_VIDEO_LIMIT_SECONDS) {
    throw new AppError(400, 'Video duration cannot exceed 30 seconds');
  }
  if (input.caption && input.caption.length > 200) {
    throw new AppError(400, 'Caption cannot exceed 200 characters');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + STORY_EXPIRY_HOURS * 60 * 60 * 1000);

  const [story] = await db.insert(stories).values({
    userId,
    mediaUrl: input.mediaUrl,
    mediaType: input.mediaType,
    mediaDuration: input.mediaType === 'video' ? (input.mediaDuration ?? null) : null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    caption: input.caption ?? null,
    expiresAt,
  }).returning();

  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      avatarColor: users.avatarColor,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return normalizeStoryRow({ ...story, user });
}

export async function getMyStories(userId: string) {
  const now = new Date();
  const rows = await db
    .select({
      id: stories.id,
      userId: stories.userId,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      mediaDuration: stories.mediaDuration,
      thumbnailUrl: stories.thumbnailUrl,
      caption: stories.caption,
      createdAt: stories.createdAt,
      expiresAt: stories.expiresAt,
      user: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        avatarColor: users.avatarColor,
      },
      viewCount: sql<number>`COUNT(${storyViews.id})`,
    })
    .from(stories)
    .innerJoin(users, eq(users.id, stories.userId))
    .leftJoin(storyViews, eq(storyViews.storyId, stories.id))
    .where(and(eq(stories.userId, userId), gt(stories.expiresAt, now)))
    .groupBy(
      stories.id,
      users.id,
      users.displayName,
      users.avatarUrl,
      users.avatarColor,
    )
    .orderBy(desc(stories.createdAt));

  return rows.map((row) => ({
    ...normalizeStoryRow(row),
    viewCount: Number(row.viewCount ?? 0),
    isViewed: true,
  }));
}

export async function deleteStory(userId: string, storyId: string) {
  const [story] = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
  if (!story) throw new AppError(404, 'Story not found');
  if (story.userId !== userId) throw new AppError(403, 'Not allowed to delete this story');

  await db.delete(stories).where(eq(stories.id, storyId));
  return { success: true };
}

export async function cleanupExpiredStories() {
  const now = new Date();
  const expired = await db
    .select({ id: stories.id, mediaUrl: stories.mediaUrl })
    .from(stories)
    .where(lt(stories.expiresAt, now));
  await db.delete(stories).where(lt(stories.expiresAt, now));
  return expired;
}

export async function getContactsStories(userId: string) {
  const now = new Date();
  const rows = await db
    .select({
      id: stories.id,
      userId: stories.userId,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      mediaDuration: stories.mediaDuration,
      thumbnailUrl: stories.thumbnailUrl,
      caption: stories.caption,
      createdAt: stories.createdAt,
      expiresAt: stories.expiresAt,
      user: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        avatarColor: users.avatarColor,
      },
      viewerHit: storyViews.id,
    })
    .from(stories)
    .innerJoin(users, eq(users.id, stories.userId))
    .innerJoin(
      contacts,
      and(
        eq(contacts.status, 'accepted'),
        or(
          and(eq(contacts.requesterId, userId), eq(contacts.addresseeId, stories.userId)),
          and(eq(contacts.addresseeId, userId), eq(contacts.requesterId, stories.userId)),
        ),
      ),
    )
    .leftJoin(
      storyViews,
      and(eq(storyViews.storyId, stories.id), eq(storyViews.viewerId, userId)),
    )
    .where(gt(stories.expiresAt, now))
    .orderBy(desc(stories.createdAt));

  const grouped = new Map<string, any>();
  for (const row of rows) {
    const key = row.user.id;
    const story = {
      ...normalizeStoryRow(row),
      viewCount: 0,
      isViewed: !!row.viewerHit,
    };
    if (!grouped.has(key)) {
      grouped.set(key, {
        user: story.user,
        stories: [story],
        hasUnviewed: !story.isViewed,
        latestAt: story.createdAt.toISOString(),
      });
    } else {
      const existing = grouped.get(key);
      existing.stories.push(story);
      existing.hasUnviewed = existing.hasUnviewed || !story.isViewed;
      if (new Date(existing.latestAt) < story.createdAt) {
        existing.latestAt = story.createdAt.toISOString();
      }
    }
  }

  return Array.from(grouped.values());
}

export async function recordView(storyId: string, viewerId: string) {
  const [story] = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
  if (!story) throw new AppError(404, 'Story not found');
  if (story.userId === viewerId) return { success: true };

  await db.insert(storyViews).values({ storyId, viewerId }).onConflictDoNothing();
  return { success: true };
}

export async function getAcceptedContactIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({
      requesterId: contacts.requesterId,
      addresseeId: contacts.addresseeId,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.status, 'accepted'),
        or(eq(contacts.requesterId, userId), eq(contacts.addresseeId, userId)),
      ),
    );

  return rows.map((row) => (row.requesterId === userId ? row.addresseeId : row.requesterId));
}

export async function getStoryOwner(storyId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: stories.userId })
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);
  return row?.userId ?? null;
}

export async function getStoryViewCount(storyId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(${storyViews.id})` })
    .from(storyViews)
    .where(eq(storyViews.storyId, storyId));
  return Number(row?.count ?? 0);
}

export async function getStoryViewers(storyId: string, userId: string) {
  const [story] = await db
    .select({ id: stories.id, userId: stories.userId })
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);

  if (!story) {
    throw new AppError(404, 'Story not found');
  }
  if (story.userId !== userId) {
    throw new AppError(403, 'Not allowed to view story analytics');
  }

  const rows = await db
    .select({
      id: storyViews.id,
      storyId: storyViews.storyId,
      viewerId: storyViews.viewerId,
      viewedAt: storyViews.viewedAt,
      viewer: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        avatarColor: users.avatarColor,
      },
    })
    .from(storyViews)
    .innerJoin(users, eq(users.id, storyViews.viewerId))
    .where(eq(storyViews.storyId, storyId))
    .orderBy(desc(storyViews.viewedAt));

  return rows;
}

export async function mapMediaUrlToStoragePath(mediaUrl: string): Promise<string | null> {
  const marker = '/storage/v1/object/public/stories/';
  const idx = mediaUrl.indexOf(marker);
  if (idx === -1) return null;
  return mediaUrl.slice(idx + marker.length);
}
