import { getQueuedItems, incrementAttempt, markOutboxFailed, removeFromOutbox, requeueItem, OutboxRow } from '../db/outbox.db.ts';
import { updateMessageStatus } from '../db/messages.db.ts';
import { getDb } from '../db/sqlite';
import { getSocket } from './socket';

const MAX_ATTEMPTS = 3;
let flushing = false;

// ChatScreen registers this to get notified when a message is confirmed by server
let onMessageSynced: ((localId: string, serverId: string) => void) | null = null;

export function setOnMessageSynced(cb: ((localId: string, serverId: string) => void) | null) {
  onMessageSynced = cb;
}

interface SendPayload {
  conversationId: string;
  content: string;
  type: 'text';
  localId: string;
}

interface ServerAck {
  success: boolean;
  error?: string;
  message?: {
    id: string;
    createdAt: string;
    localId?: string;
    [key: string]: any;
  };
}

export async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const items = await getQueuedItems();
    for (const item of items) {
      await sendItem(item);
    }
  } finally {
    flushing = false;
  }
}

async function sendItem(item: OutboxRow): Promise<void> {
  const socket = getSocket();
  if (!socket?.connected) return;

  // T031: deduplication guard — skip if already delivered
  try {
    const db = getDb();
    const rows = await db.getAllAsync<{ server_id: string | null }>(
      `SELECT server_id FROM messages WHERE local_id = ?`,
      [item.local_id],
    );
    if (rows[0]?.server_id) {
      await removeFromOutbox(item.local_id);
      return;
    }
  } catch {
    // SQLite not ready yet — proceed with send
  }

  const payload = JSON.parse(item.payload) as SendPayload;

  try {
    await new Promise<void>((resolve, reject) => {
      socket.emit('message:send', payload, (ack: ServerAck) => {
        if (!ack.success || ack.error) {
          reject(new Error(ack.error ?? 'Send failed'));
          return;
        }
        if (ack.message) {
          void updateMessageStatus(item.local_id, {
            server_id: ack.message.id,
            sync_status: 'sent',
            server_created_at: ack.message.createdAt,
          }).then(() => {
            onMessageSynced?.(item.local_id, ack.message!.id);
          });
          void removeFromOutbox(item.local_id);
        }
        resolve();
      });
    });
  } catch {
    await incrementAttempt(item.local_id);
    // Use local attempt count to avoid re-querying DB
    if (item.attempts + 1 >= MAX_ATTEMPTS) {
      await markOutboxFailed(item.local_id);
      await updateMessageStatus(item.local_id, { sync_status: 'failed' });
    }
  }
}

export async function retry(localId: string): Promise<void> {
  await requeueItem(localId);
  await updateMessageStatus(localId, { sync_status: 'pending' });
  await flush();
}

export async function discard(localId: string): Promise<void> {
  await removeFromOutbox(localId);
}
