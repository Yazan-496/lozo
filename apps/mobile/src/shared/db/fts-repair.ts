import { getDb } from './sqlite';

/**
 * Manually rebuild FTS5 index.
 * Call this if search returns no results despite having messages.
 */
export async function rebuildFtsIndex(): Promise<void> {
  try {
    const db = getDb();
    
    console.log('[FTS REPAIR] Starting FTS rebuild...');
    
    // Clear existing FTS data
    await db.execAsync('DELETE FROM messages_fts');
    console.log('[FTS REPAIR] Cleared old FTS data');
    
    // Backfill from messages table
    await db.execAsync(`
      INSERT INTO messages_fts(message_id, conversation_id, content)
      SELECT local_id, conversation_id, content
      FROM messages
      WHERE content IS NOT NULL AND content != ''
    `);
    
    const count = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages_fts'
    );
    console.log('[FTS REPAIR] Rebuilt FTS index with', count?.count, 'messages');
    
    // Test search
    const testResults = await db.getAllAsync(
      `SELECT COUNT(*) as count FROM messages_fts WHERE messages_fts MATCH ?`,
      ['test*']
    );
    console.log('[FTS REPAIR] Test search for "test*" returned:', testResults);
    
  } catch (err) {
    console.error('[FTS REPAIR ERROR]', err);
    throw err;
  }
}

/**
 * Check FTS health and return diagnostics
 */
export async function checkFtsHealth(): Promise<{
  messagesCount: number;
  ftsCount: number;
  isHealthy: boolean;
  needsRebuild: boolean;
}> {
  try {
    const db = getDb();
    
    const msgCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages WHERE content IS NOT NULL AND content != ""'
    );
    
    const ftsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages_fts'
    );
    
    const messagesCount = msgCount?.count ?? 0;
    const ftsIndexCount = ftsCount?.count ?? 0;
    const isHealthy = messagesCount === ftsIndexCount && messagesCount > 0;
    const needsRebuild = messagesCount > 0 && ftsIndexCount === 0;
    
    console.log('[FTS HEALTH]', {
      messagesCount,
      ftsCount: ftsIndexCount,
      isHealthy,
      needsRebuild,
    });
    
    return {
      messagesCount,
      ftsCount: ftsIndexCount,
      isHealthy,
      needsRebuild,
    };
  } catch (err) {
    console.error('[FTS HEALTH CHECK ERROR]', err);
    return {
      messagesCount: 0,
      ftsCount: 0,
      isHealthy: false,
      needsRebuild: false,
    };
  }
}
