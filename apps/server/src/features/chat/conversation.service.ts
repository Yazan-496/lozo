import { eq, and, or, desc, ne, inArray } from 'drizzle-orm';
import { db } from '../../shared/db';
import {
  users,
  contacts,
  conversations,
  messages,
  messageDeletes,
  messageReactions,
  messageStatuses,
} from '../../shared/db/schema';
import { AppError } from '../../shared/middleware/error-handler';

// Ensure two users are contacts before chatting
async function verifyContact(userOneId: string, userTwoId: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.status, 'accepted'),
        or(
          and(eq(contacts.requesterId, userOneId), eq(contacts.addresseeId, userTwoId)),
          and(eq(contacts.requesterId, userTwoId), eq(contacts.addresseeId, userOneId)),
        ),
      ),
    )
    .limit(1);

  if (!contact) {
    throw new AppError(403, 'You must be contacts to chat');
  }
}

// Get or create a 1:1 conversation
export async function getOrCreateConversation(userId: string, otherUserId: string) {
  await verifyContact(userId, otherUserId);

  // Always store with smaller UUID first to avoid duplicates
  const [pOne, pTwo] = userId < otherUserId
    ? [userId, otherUserId]
    : [otherUserId, userId];

  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.participantOneId, pOne),
        eq(conversations.participantTwoId, pTwo),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const [conv] = await db
    .insert(conversations)
    .values({ participantOneId: pOne, participantTwoId: pTwo })
    .returning();

  return conv;
}

// Get all conversations for a user with last message and other user info
export async function getConversations(userId: string) {
  const rows = await db
    .select()
    .from(conversations)
    .where(
      or(
        eq(conversations.participantOneId, userId),
        eq(conversations.participantTwoId, userId),
      ),
    )
    .orderBy(desc(conversations.updatedAt));

  const result = await Promise.all(
    rows.map(async (conv) => {
      const otherUserId = conv.participantOneId === userId
        ? conv.participantTwoId
        : conv.participantOneId;

      const [otherUser] = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          avatarColor: users.avatarColor,
          isOnline: users.isOnline,
          lastSeenAt: users.lastSeenAt,
        })
        .from(users)
        .where(eq(users.id, otherUserId))
        .limit(1);

      // Get last message (not deleted for everyone)
      const [lastMessage] = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          type: messages.type,
          content: messages.content,
          isForwarded: messages.isForwarded,
          deletedForEveryone: messages.deletedForEveryone,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.id),
            eq(messages.deletedForEveryone, false),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Get status of last message (from recipient's perspective when I sent it)
      let lastMessageStatus: string | null = null;
      if (lastMessage) {
        const statusUserId = lastMessage.senderId === userId ? otherUserId : userId;
        const [statusRow] = await db
          .select({ status: messageStatuses.status })
          .from(messageStatuses)
          .where(
            and(
              eq(messageStatuses.messageId, lastMessage.id),
              eq(messageStatuses.userId, statusUserId),
            ),
          )
          .limit(1);
        lastMessageStatus = statusRow?.status ?? null;
      }

      // Count unread messages
      const unreadMessages = await db
        .select({ id: messageStatuses.id })
        .from(messageStatuses)
        .innerJoin(messages, eq(messages.id, messageStatuses.messageId))
        .where(
          and(
            eq(messages.conversationId, conv.id),
            eq(messageStatuses.userId, userId),
            ne(messageStatuses.status, 'read'),
          ),
        );

      const builtLastMessage = lastMessage
        ? {
            ...(lastMessage.deletedForEveryone
              ? { ...lastMessage, content: null, type: 'text' as const }
              : lastMessage),
            status: lastMessageStatus,
          }
        : null;

      return {
        id: conv.id,
        otherUser,
        lastMessage: builtLastMessage,
        unreadCount: unreadMessages.length,
        updatedAt: conv.updatedAt,
      };
    }),
  );

  return result;
}

// Delete conversation for current user only (clears message history)
export async function deleteConversationForMe(conversationId: string, userId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participantOneId, userId),
          eq(conversations.participantTwoId, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) {
    throw new AppError(403, 'Not authorized to delete this conversation');
  }

  const messageIds = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  if (messageIds.length > 0) {
    await db
      .insert(messageDeletes)
      .values(messageIds.map((msg) => ({ messageId: msg.id, userId })))
      .onConflictDoNothing();
  }

  return { success: true, deletedCount: messageIds.length };
}

// Delete conversation for everyone (permanent deletion)
export async function deleteConversationForEveryone(conversationId: string, userId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participantOneId, userId),
          eq(conversations.participantTwoId, userId),
        ),
      ),
    )
    .limit(1);

  if (!conv) {
    throw new AppError(403, 'Not authorized to delete this conversation');
  }

  const msgIds = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  if (msgIds.length > 0) {
    const ids = msgIds.map((m) => m.id);
    await db.delete(messageReactions).where(inArray(messageReactions.messageId, ids));
    await db.delete(messageStatuses).where(inArray(messageStatuses.messageId, ids));
    await db.delete(messageDeletes).where(inArray(messageDeletes.messageId, ids));
    await db.delete(messages).where(inArray(messages.id, ids));
  }

  await db.delete(conversations).where(eq(conversations.id, conversationId));

  return {
    success: true,
    participantIds: [conv.participantOneId, conv.participantTwoId],
  };
}
