import { eq, and, ne } from 'drizzle-orm';
import { db } from '../../shared/db';
import {
  messages,
  messageReactions,
  messageStatuses,
} from '../../shared/db/schema';
import { AppError } from '../../shared/middleware/error-handler';

// Add/update reaction
export async function reactToMessage(messageId: string, userId: string, emoji: string) {
  const [msg] = await db
    .select({ id: messages.id, conversationId: messages.conversationId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) {
    throw new AppError(404, 'Message not found');
  }

  // Upsert: update emoji if user already reacted, otherwise insert
  const [existing] = await db
    .select()
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.emoji === emoji) {
      // Same emoji = remove reaction
      await db.delete(messageReactions).where(eq(messageReactions.id, existing.id));
      return { action: 'removed', emoji };
    }
    // Different emoji = update
    await db
      .update(messageReactions)
      .set({ emoji, createdAt: new Date() })
      .where(eq(messageReactions.id, existing.id));
    return { action: 'updated', emoji };
  }

  await db
    .insert(messageReactions)
    .values({ messageId, userId, emoji });

  return { action: 'added', emoji, conversationId: msg.conversationId };
}

// Remove reaction
export async function removeReaction(messageId: string, userId: string) {
  await db
    .delete(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
      ),
    );

  return { success: true };
}

// Mark messages as delivered
export async function markDelivered(conversationId: string, userId: string) {
  const msgs = await db
    .select({ id: messageStatuses.id })
    .from(messageStatuses)
    .innerJoin(messages, eq(messages.id, messageStatuses.messageId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messageStatuses.userId, userId),
        eq(messageStatuses.status, 'sent'),
      ),
    );

  if (msgs.length === 0) return { updated: 0 };

  await db
    .update(messageStatuses)
    .set({ status: 'delivered', deliveredAt: new Date() })
    .where(
      and(
        eq(messageStatuses.userId, userId),
        eq(messageStatuses.status, 'sent'),
      ),
    );

  return { updated: msgs.length };
}

// Mark messages as read
export async function markRead(conversationId: string, userId: string) {
  const msgs = await db
    .select({ id: messageStatuses.id, messageId: messageStatuses.messageId })
    .from(messageStatuses)
    .innerJoin(messages, eq(messages.id, messageStatuses.messageId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messageStatuses.userId, userId),
        ne(messageStatuses.status, 'read'),
      ),
    );

  if (msgs.length === 0) return { updated: 0 };

  const now = new Date();
  await db
    .update(messageStatuses)
    .set({ status: 'read', readAt: now, deliveredAt: now })
    .where(
      and(
        eq(messageStatuses.userId, userId),
        ne(messageStatuses.status, 'read'),
      ),
    );

  return { updated: msgs.length };
}
