import { getDb } from './sqlite';
import type { MediaItem } from '../types';

/**
 * Fetch paginated media items for a conversation filtered by type.
 * Sorted by creation date descending (newest first).
 */
export async function getMediaByType(
  conversationId: string,
  type: 'image' | 'voice' | 'file',
  limit: number,
  offset: number,
): Promise<MediaItem[]> {
  try {
    const db = getDb();
    const rows = await db.getAllAsync<{
      local_id: string;
      conversation_id: string;
      type: string;
      media_url: string;
      media_name: string | null;
      media_size: number | null;
      media_duration: number | null;
      sender_id: string;
      created_at: string;
    }>(
      `SELECT local_id, conversation_id, type, media_url, media_name, media_size, media_duration, sender_id, created_at
       FROM messages
       WHERE conversation_id = ?
         AND type = ?
         AND media_url IS NOT NULL
         AND deleted_for_everyone = 0
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [conversationId, type, limit, offset],
    );

    return rows.map((r) => ({
      id: r.local_id,
      conversationId: r.conversation_id,
      type: r.type as 'image' | 'voice' | 'file',
      mediaUrl: r.media_url,
      mediaName: r.media_name,
      mediaSize: r.media_size,
      mediaDuration: r.media_duration,
      createdAt: new Date(r.created_at).getTime(),
      senderId: r.sender_id,
    }));
  } catch {
    return [];
  }
}
