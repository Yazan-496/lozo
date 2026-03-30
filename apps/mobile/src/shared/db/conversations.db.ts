import { getDb } from './sqlite';
import { Conversation } from '../types';

export interface LocalConversationRow {
  id: string;
  other_user: string; // JSON blob
  last_message: string | null; // JSON blob
  unread_count: number;
  updated_at: string;
}

export async function upsertConversations(convs: Conversation[]): Promise<void> {
  const db = getDb();
  for (const conv of convs) {
    await db.runAsync(
      `INSERT OR REPLACE INTO conversations (id, other_user, last_message, unread_count, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        conv.id,
        JSON.stringify(conv.otherUser),
        conv.lastMessage ? JSON.stringify(conv.lastMessage) : null,
        conv.unreadCount,
        conv.updatedAt,
      ]
    );
  }
}

export async function getCachedConversations(): Promise<Conversation[]> {
  const db = getDb();
  const rows = await db.getAllAsync<LocalConversationRow>(
    `SELECT * FROM conversations ORDER BY updated_at DESC`
  );
  return rows.map((row) => ({
    id: row.id,
    otherUser: JSON.parse(row.other_user),
    lastMessage: row.last_message ? JSON.parse(row.last_message) : null,
    unreadCount: row.unread_count,
    updatedAt: row.updated_at,
  }));
}

export async function hideCachedConversation(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM conversations WHERE id = ?`, [id]);
}
