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

// Replace the local cache with exactly the server's list — removes stale/deleted rows
export async function syncConversations(convs: Conversation[]): Promise<void> {
  const db = getDb();
  if (convs.length === 0) {
    await db.runAsync(`DELETE FROM conversations`);
    return;
  }
  const placeholders = convs.map(() => '?').join(', ');
  await db.runAsync(
    `DELETE FROM conversations WHERE id NOT IN (${placeholders})`,
    convs.map((c) => c.id),
  );
  await upsertConversations(convs);
}

// ── Drafts ────────────────────────────────────────────────────────────────────

export async function saveDraft(conversationId: string, text: string): Promise<void> {
  const db = getDb();
  const truncated = text.slice(0, 5000);
  await db.runAsync(
    `INSERT OR REPLACE INTO drafts (conversation_id, text, updated_at) VALUES (?, ?, ?)`,
    [conversationId, truncated, Date.now()],
  );
}

export async function getDraft(conversationId: string): Promise<string | null> {
  const db = getDb();
  const row = await db.getFirstAsync<{ text: string }>(
    `SELECT text FROM drafts WHERE conversation_id = ?`,
    [conversationId],
  );
  return row?.text ?? null;
}

export async function clearDraft(conversationId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM drafts WHERE conversation_id = ?`, [conversationId]);
}

export async function getAllDrafts(): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db.getAllAsync<{ conversation_id: string; text: string }>(
    `SELECT conversation_id, text FROM drafts`,
  );
  return Object.fromEntries(rows.map((r) => [r.conversation_id, r.text]));
}
