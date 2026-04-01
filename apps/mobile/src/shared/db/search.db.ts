import { getDb } from './sqlite';
import type { SearchResult } from '../types';

/**
 * Full-text search across all local messages using SQLite FTS5.
 * Returns results sorted by recency, limit defaults to 50.
 * Always works offline — queries local SQLite only.
 */
export async function searchMessages(
  query: string,
  limit = 50,
): Promise<SearchResult[]> {
  try {
    if (!query || query.trim().length < 3) return [];

    const db = getDb();
    
    // DEBUG: Check if FTS table has data
    const ftsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages_fts'
    );
    console.log('[SEARCH DEBUG] FTS table count:', ftsCount?.count);
    
    const msgCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages WHERE content IS NOT NULL'
    );
    console.log('[SEARCH DEBUG] Messages with content:', msgCount?.count);
    
    // Append * for prefix matching (e.g. "hel" matches "hello")
    const ftsQuery = query.trim().replace(/['"*]/g, '') + '*';
    console.log('[SEARCH DEBUG] FTS query:', ftsQuery);

    const rows = await db.getAllAsync<{
      message_id: string;
      conversation_id: string;
      content: string;
      highlight: string;
      created_at: string;
    }>(
      `SELECT
         f.message_id,
         f.conversation_id,
         m.content,
         snippet(messages_fts, 2, '**', '**', '...', 32) AS highlight,
         m.created_at
       FROM messages_fts f
       JOIN messages m ON m.local_id = f.message_id
       WHERE messages_fts MATCH ?
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [ftsQuery, limit],
    );
    
    console.log('[SEARCH DEBUG] Query returned', rows.length, 'results');

    // Enrich with conversation display name from conversations cache
    const convRows = await db.getAllAsync<{ id: string; other_user: string }>(
      `SELECT id, other_user FROM conversations`,
    );
    const convMap: Record<string, { displayName: string; avatarUrl: string | null }> = {};
    for (const c of convRows) {
      try {
        const user = JSON.parse(c.other_user);
        convMap[c.id] = { displayName: user.displayName ?? '', avatarUrl: user.avatarUrl ?? null };
      } catch {
        convMap[c.id] = { displayName: '', avatarUrl: null };
      }
    }

    return rows.map((r) => ({
      messageId: r.message_id,
      conversationId: r.conversation_id,
      conversationName: convMap[r.conversation_id]?.displayName ?? '',
      conversationAvatar: convMap[r.conversation_id]?.avatarUrl ?? null,
      content: r.content,
      highlight: r.highlight,
      createdAt: new Date(r.created_at).getTime(),
    }));
  } catch (err) {
    console.error('[SEARCH ERROR]', err);
    return [];
  }
}

/**
 * Full-text search scoped to a single conversation.
 * Used for in-chat search in ChatScreen.
 */
export async function searchInConversation(
  conversationId: string,
  query: string,
  limit = 100,
): Promise<SearchResult[]> {
  try {
    if (!query || query.trim().length < 2) return [];

    const db = getDb();
    const ftsQuery = query.trim().replace(/['"*]/g, '') + '*';

    const rows = await db.getAllAsync<{
      message_id: string;
      conversation_id: string;
      content: string;
      highlight: string;
      created_at: string;
    }>(
      `SELECT
         f.message_id,
         f.conversation_id,
         m.content,
         snippet(messages_fts, 2, '**', '**', '...', 32) AS highlight,
         m.created_at
       FROM messages_fts f
       JOIN messages m ON m.local_id = f.message_id
       WHERE messages_fts MATCH ?
         AND f.conversation_id = ?
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [ftsQuery, conversationId, limit],
    );

    return rows.map((r) => ({
      messageId: r.message_id,
      conversationId: r.conversation_id,
      conversationName: '',
      conversationAvatar: null,
      content: r.content,
      highlight: r.highlight,
      createdAt: new Date(r.created_at).getTime(),
    }));
  } catch {
    return [];
  }
}
