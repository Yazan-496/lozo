import { getDb } from './sqlite';
import type { Story } from '../types';

export interface CachedStoryRow {
  id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url: string | null;
  user_avatar_color: string;
  media_local_path: string | null;
  media_url: string;
  media_type: 'photo' | 'video';
  media_duration: number | null;
  caption: string | null;
  created_at: string;
  expires_at: string;
  viewed_at: string | null;
  cached_at: string;
}

export async function initStoriesDb(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_display_name TEXT NOT NULL,
      user_avatar_url TEXT,
      user_avatar_color TEXT NOT NULL,
      media_local_path TEXT,
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL,
      media_duration INTEGER,
      caption TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      viewed_at TEXT,
      cached_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cached_stories_user
      ON cached_stories (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cached_stories_expiry
      ON cached_stories (expires_at);
    CREATE TABLE IF NOT EXISTS story_view_status (
      story_id TEXT PRIMARY KEY,
      viewed INTEGER NOT NULL DEFAULT 0,
      viewed_at TEXT
    );
  `);
}

export async function cacheStory(story: Story, mediaLocalPath: string | null = null): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO cached_stories (
      id, user_id, user_display_name, user_avatar_url, user_avatar_color,
      media_local_path, media_url, media_type, media_duration, caption,
      created_at, expires_at, viewed_at, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      story.id,
      story.userId,
      story.user.displayName,
      story.user.avatarUrl,
      story.user.avatarColor,
      mediaLocalPath,
      story.mediaUrl,
      story.mediaType,
      story.mediaDuration,
      story.caption,
      story.createdAt,
      story.expiresAt,
      story.isViewed ? new Date().toISOString() : null,
      new Date().toISOString(),
    ],
  );
}

export async function getCachedStories(): Promise<CachedStoryRow[]> {
  const db = getDb();
  return db.getAllAsync<CachedStoryRow>(
    `SELECT * FROM cached_stories ORDER BY created_at DESC`,
  );
}

export async function markStoryViewed(storyId: string): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO story_view_status (story_id, viewed, viewed_at) VALUES (?, 1, ?)`,
    [storyId, now],
  );
  await db.runAsync(`UPDATE cached_stories SET viewed_at = ? WHERE id = ?`, [now, storyId]);
}

export async function getViewStatus(storyId: string): Promise<boolean> {
  const db = getDb();
  const row = await db.getFirstAsync<{ viewed: number }>(
    `SELECT viewed FROM story_view_status WHERE story_id = ?`,
    [storyId],
  );
  return !!row?.viewed;
}

export async function clearExpiredCache(): Promise<number> {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const expired = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM cached_stories WHERE expires_at <= ?`,
    [nowIso],
  );
  await db.runAsync(`DELETE FROM cached_stories WHERE expires_at <= ?`, [nowIso]);
  if (expired.length > 0) {
    const placeholders = expired.map(() => '?').join(',');
    await db.runAsync(
      `DELETE FROM story_view_status WHERE story_id IN (${placeholders})`,
      expired.map((row) => row.id),
    );
  }
  return expired.length;
}
