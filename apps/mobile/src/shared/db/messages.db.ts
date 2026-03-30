import { getDb } from './sqlite';
import { Message } from '../types';

export type SyncStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface LocalMessageRow {
    local_id: string;
    server_id: string | null;
    conversation_id: string;
    sender_id: string;
    type: string;
    content: string | null;
    media_url: string | null;
    media_name: string | null;
    media_size: number | null;
    media_duration: number | null;
    reply_to_id: string | null;
    is_forwarded: number;
    forwarded_from_id: string | null;
    edited_at: string | null;
    deleted_for_everyone: number;
    sync_status: SyncStatus;
    created_at: string;
    server_created_at: string | null;
}

export async function insertMessage(row: LocalMessageRow): Promise<void> {
    const db = getDb();
    await db.runAsync(
        `INSERT INTO messages (local_id, server_id, conversation_id, sender_id, type, content, media_url, media_name, media_size, media_duration, reply_to_id, is_forwarded, forwarded_from_id, edited_at, deleted_for_everyone, sync_status, created_at, server_created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            row.local_id,
            row.server_id,
            row.conversation_id,
            row.sender_id,
            row.type,
            row.content,
            row.media_url,
            row.media_name,
            row.media_size,
            row.media_duration,
            row.reply_to_id,
            row.is_forwarded,
            row.forwarded_from_id,
            row.edited_at,
            row.deleted_for_everyone,
            row.sync_status,
            row.created_at,
            row.server_created_at,
        ],
    );
}

export async function getMessages(
    conversationId: string,
    limit = 50,
    before?: string,
): Promise<LocalMessageRow[]> {
    const db = getDb();
    // Return most recent messages first (newest -> oldest). FlatList is inverted, so this displays correctly.
    const rows = await db.getAllAsync<LocalMessageRow>(
        before
            ? `SELECT * FROM messages WHERE conversation_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?`
            : `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`,
        before ? [conversationId, before, limit] : [conversationId, limit],
    );
    return rows;
}

export async function updateMessageStatus(
    localId: string,
    updates: Partial<Pick<LocalMessageRow, 'server_id' | 'sync_status' | 'server_created_at'>>,
): Promise<void> {
    const db = getDb();
    const parts: string[] = [];
    const values: (string | null)[] = [];

    if (updates.server_id !== undefined) {
        parts.push('server_id = ?');
        values.push(updates.server_id);
    }
    if (updates.sync_status !== undefined) {
        parts.push('sync_status = ?');
        values.push(updates.sync_status);
    }
    if (updates.server_created_at !== undefined) {
        parts.push('server_created_at = ?');
        values.push(updates.server_created_at);
    }

    if (parts.length === 0) return;

    values.push(localId);
    await db.runAsync(`UPDATE messages SET ${parts.join(', ')} WHERE local_id = ?`, values);
}

export async function deleteMessage(localId: string): Promise<void> {
    const db = getDb();
    await db.runAsync('DELETE FROM messages WHERE local_id = ?', [localId]);
}

export async function pruneOldMessages(daysOld = 90, maxPerConversation = 500): Promise<void> {
    const db = getDb();

    // Delete messages older than daysOld
    await db.runAsync(
        `DELETE FROM messages WHERE datetime(created_at) < datetime('now', ? || ' days')`,
        [`-${daysOld}`],
    );

    // Keep only the most recent maxPerConversation per conversation
    await db.runAsync(
        `DELETE FROM messages WHERE local_id IN (
      SELECT local_id FROM messages m1
      WHERE (SELECT COUNT(*) FROM messages m2 WHERE m2.conversation_id = m1.conversation_id AND m2.created_at >= m1.created_at) > ?
    )`,
        [maxPerConversation],
    );
}

export function localRowToMessage(row: LocalMessageRow): Message {
    return {
        id: row.server_id || row.local_id,
        localId: row.local_id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        type: row.type as any,
        content: row.content,
        mediaUrl: row.media_url ?? null,
        mediaName: row.media_name ?? null,
        mediaSize: row.media_size ?? null,
        mediaDuration: row.media_duration ?? null,
        replyToId: row.reply_to_id ?? null,
        isForwarded: row.is_forwarded === 1,
        forwardedFromId: row.forwarded_from_id ?? null,
        editedAt: row.edited_at ?? null,
        deletedForEveryone: row.deleted_for_everyone === 1,
        createdAt: row.created_at,
        syncStatus: row.sync_status as SyncStatus,
        status: null,
        reactions: [],
    };
}

export async function upsertServerMessage(msg: Message, senderId?: string): Promise<void> {
    const db = getDb();
    // Determine sync status: 'sent' if from current user, 'delivered' if from other user
    const syncStatus: SyncStatus = senderId === msg.senderId ? 'sent' : 'delivered';

    await db.runAsync(
        `INSERT OR IGNORE INTO messages (local_id, server_id, conversation_id, sender_id, type, content, media_url, media_name, media_size, media_duration, reply_to_id, is_forwarded, forwarded_from_id, edited_at, deleted_for_everyone, sync_status, created_at, server_created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            msg.id, // use server ID as local_id for server messages
            msg.id, // server_id
            msg.conversationId,
            msg.senderId,
            msg.type,
            msg.content,
            msg.mediaUrl,
            msg.mediaName,
            msg.mediaSize,
            msg.mediaDuration,
            msg.replyToId,
            msg.isForwarded ? 1 : 0,
            msg.forwardedFromId,
            msg.editedAt,
            msg.deletedForEveryone ? 1 : 0,
            syncStatus,
            msg.createdAt,
            msg.createdAt,
        ],
    );
}

// Helper — TODO: integrate with auth store
async function getCurrentUserId(): Promise<string> {
    // For now, return empty — this will be bound to the actual auth context
    return '';
}
