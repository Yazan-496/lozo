import { getDb } from './sqlite';
import type { ScheduledMessage, ScheduledMessageRow } from '../types';

// Convert DB row to domain object
export function rowToScheduledMessage(row: ScheduledMessageRow): ScheduledMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status as ScheduledMessage['status'],
  };
}

// Generate UUID for new scheduled messages
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// Insert new scheduled message
export async function scheduleMessage(
  conversationId: string,
  content: string,
  scheduledAt: string
): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO scheduled_messages (id, conversation_id, content, scheduled_at, created_at, updated_at, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [id, conversationId, content, scheduledAt, now, now]
  );
  
  return id;
}

// Get all scheduled messages for a conversation
export async function getScheduledMessages(conversationId: string): Promise<ScheduledMessage[]> {
  const db = getDb();
  const rows = await db.getAllAsync<ScheduledMessageRow>(
    `SELECT * FROM scheduled_messages 
     WHERE conversation_id = ? AND status IN ('pending', 'sending')
     ORDER BY scheduled_at ASC`,
    [conversationId]
  );
  
  return rows.map(rowToScheduledMessage);
}

// Get all due messages (scheduled_at <= now AND status = 'pending')
export async function getDueMessages(): Promise<ScheduledMessage[]> {
  const db = getDb();
  const now = new Date().toISOString();
  
  const rows = await db.getAllAsync<ScheduledMessageRow>(
    `SELECT * FROM scheduled_messages 
     WHERE scheduled_at <= ? AND status = 'pending'
     ORDER BY created_at ASC`,
    [now]
  );
  
  return rows.map(rowToScheduledMessage);
}

// Update scheduled message content or time
export async function updateScheduledMessage(
  id: string,
  updates: { content?: string; scheduledAt?: string }
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  
  if (updates.content && updates.scheduledAt) {
    await db.runAsync(
      `UPDATE scheduled_messages 
       SET content = ?, scheduled_at = ?, updated_at = ?
       WHERE id = ?`,
      [updates.content, updates.scheduledAt, now, id]
    );
  } else if (updates.content) {
    await db.runAsync(
      `UPDATE scheduled_messages 
       SET content = ?, updated_at = ?
       WHERE id = ?`,
      [updates.content, now, id]
    );
  } else if (updates.scheduledAt) {
    await db.runAsync(
      `UPDATE scheduled_messages 
       SET scheduled_at = ?, updated_at = ?
       WHERE id = ?`,
      [updates.scheduledAt, now, id]
    );
  }
}

// Cancel (delete) a scheduled message
export async function cancelScheduledMessage(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM scheduled_messages WHERE id = ?`, [id]);
}

// Mark as sending (when processing due message)
export async function markAsSending(id: string): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `UPDATE scheduled_messages SET status = 'sending', updated_at = ? WHERE id = ?`,
    [now, id]
  );
}

// Delete scheduled message (after successful send)
export async function deleteScheduledMessage(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM scheduled_messages WHERE id = ?`, [id]);
}

// Get count of scheduled messages for conversation (for validation)
export async function getScheduledMessageCount(conversationId: string): Promise<number> {
  const db = getDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM scheduled_messages 
     WHERE conversation_id = ? AND status IN ('pending', 'sending')`,
    [conversationId]
  );
  
  return result?.count ?? 0;
}