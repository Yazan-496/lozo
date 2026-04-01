import { getDb } from './sqlite';

export interface OutboxRow {
  local_id: string;
  conversation_id: string;
  payload: string; // JSON
  attempts: number;
  last_attempt_at: string | null;
  status: 'queued' | 'failed';
  created_at: string;
}

export async function enqueueOutbox(localId: string, conversationId: string, payload: object): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO outbox (local_id, conversation_id, payload, attempts, status, created_at)
     VALUES (?, ?, ?, 0, 'queued', ?)`,
    [localId, conversationId, JSON.stringify(payload), new Date().toISOString()]
  );
}

export async function getQueuedItems(): Promise<OutboxRow[]> {
  const db = getDb();
  const rows = await db.getAllAsync<OutboxRow>(
    `SELECT * FROM outbox WHERE status = 'queued' ORDER BY created_at ASC`
  );
  return rows.map((row) => ({ ...row, payload: row.payload }));
}

export async function incrementAttempt(localId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `UPDATE outbox SET attempts = attempts + 1, last_attempt_at = ? WHERE local_id = ?`,
    [new Date().toISOString(), localId]
  );
}

export async function markOutboxFailed(localId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`UPDATE outbox SET status = 'failed' WHERE local_id = ?`, [localId]);
}

export async function removeFromOutbox(localId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM outbox WHERE local_id = ?`, [localId]);
}

export async function requeueItem(localId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `UPDATE outbox SET attempts = 0, status = 'queued', last_attempt_at = NULL WHERE local_id = ?`,
    [localId]
  );
}
