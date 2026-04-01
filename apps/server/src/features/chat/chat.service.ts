import { eq, and, or, desc, lt, ne, notInArray, inArray } from 'drizzle-orm';
import { db } from '../../shared/db';
import {
  users,
  contacts,
  conversations,
  messages,
  messageDeletes,
  messageReactions,
  messageStatuses,
  blockedUsers,
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

      // Get last message (not deleted for this user, not deleted for everyone)
      const deletedMessageIds = db
        .select({ messageId: messageDeletes.messageId })
        .from(messageDeletes)
        .where(eq(messageDeletes.userId, userId));

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
        // If I sent the last message, get the recipient's status row
        // If they sent it, get my status row
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

// Send a message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  data: {
    type: 'text' | 'image' | 'voice' | 'file';
    content?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaDuration?: number;
    replyToId?: string;
    forwardedFromId?: string;
  },
) {
  // Verify sender is part of conversation
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) {
    throw new AppError(404, 'Conversation not found');
  }

  if (conv.participantOneId !== senderId && conv.participantTwoId !== senderId) {
    throw new AppError(403, 'Not a participant in this conversation');
  }

  const recipientId = conv.participantOneId === senderId
    ? conv.participantTwoId
    : conv.participantOneId;

  // Check if recipient has blocked the sender
  const [blocked] = await db
    .select()
    .from(blockedUsers)
    .where(
      and(
        eq(blockedUsers.blockerId, recipientId),
        eq(blockedUsers.blockedId, senderId),
      ),
    )
    .limit(1);

  if (blocked) {
    throw new AppError(403, 'Cannot send message to this user');
  }

  const isForwarded = !!data.forwardedFromId;

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId,
      type: data.type,
      content: data.content,
      mediaUrl: data.mediaUrl,
      mediaName: data.mediaName,
      mediaSize: data.mediaSize,
      mediaDuration: data.mediaDuration,
      replyToId: data.replyToId,
      forwardedFromId: data.forwardedFromId,
      isForwarded,
    })
    .returning();

  // Create status entry for recipient (sent)
  await db.insert(messageStatuses).values({
    messageId: message.id,
    userId: recipientId,
    status: 'sent',
  });

  // Update conversation's last message and timestamp
  await db
    .update(conversations)
    .set({ lastMessageId: message.id, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // Populate replyTo so the recipient's socket message includes the preview
  let replyTo = null;
  if (message.replyToId) {
    const [replyMsg] = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        type: messages.type,
        content: messages.content,
        deletedForEveryone: messages.deletedForEveryone,
      })
      .from(messages)
      .where(eq(messages.id, message.replyToId))
      .limit(1);
    replyTo = replyMsg ?? null;
  }

  return { message: { ...message, reactions: [], replyTo }, recipientId };
}

// Get messages for a conversation with pagination
export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string, // message id to paginate from
  limit = 50,
) {
  // Verify participant
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) {
    throw new AppError(404, 'Conversation not found');
  }

  if (conv.participantOneId !== userId && conv.participantTwoId !== userId) {
    throw new AppError(403, 'Not a participant');
  }

  // Get IDs of messages deleted by this user
  const deletedIds = await db
    .select({ messageId: messageDeletes.messageId })
    .from(messageDeletes)
    .where(eq(messageDeletes.userId, userId));

  const deletedIdList = deletedIds.map((d) => d.messageId);

  let query = db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ...(deletedIdList.length > 0 ? [notInArray(messages.id, deletedIdList)] : []),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  if (cursor) {
    // Get cursor message's createdAt
    const [cursorMsg] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, cursor))
      .limit(1);

    if (cursorMsg) {
      query = db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            lt(messages.createdAt, cursorMsg.createdAt),
            ...(deletedIdList.length > 0 ? [notInArray(messages.id, deletedIdList)] : []),
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit);
    }
  }

  const rows = await query;

  // For each message, fetch reactions and reply-to info
  const enriched = await Promise.all(
    rows.map(async (msg) => {
      // Replace content if deleted for everyone
      if (msg.deletedForEveryone) {
        return {
          ...msg,
          content: null,
          mediaUrl: null,
          reactions: [],
          replyTo: null,
          status: null,
        };
      }

      const reactions = await db
        .select({
          emoji: messageReactions.emoji,
          userId: messageReactions.userId,
        })
        .from(messageReactions)
        .where(eq(messageReactions.messageId, msg.id));

      let replyTo = null;
      if (msg.replyToId) {
        const [original] = await db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            type: messages.type,
            content: messages.content,
            deletedForEveryone: messages.deletedForEveryone,
          })
          .from(messages)
          .where(eq(messages.id, msg.replyToId))
          .limit(1);
        replyTo = original || null;
      }

      // Get delivery status (for sent messages)
      let status = null;
      if (msg.senderId === userId) {
        const [msgStatus] = await db
          .select({ status: messageStatuses.status })
          .from(messageStatuses)
          .where(eq(messageStatuses.messageId, msg.id))
          .limit(1);
        status = msgStatus?.status || 'sent';
      }

      return { ...msg, reactions, replyTo, status };
    }),
  );

  return enriched;
}

// Edit a message (only sender, only text)
export async function editMessage(messageId: string, userId: string, newContent: string) {
  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) {
    throw new AppError(404, 'Message not found');
  }

  if (msg.senderId !== userId) {
    throw new AppError(403, 'Can only edit your own messages');
  }

  if (msg.type !== 'text') {
    throw new AppError(400, 'Can only edit text messages');
  }

  if (msg.deletedForEveryone) {
    throw new AppError(400, 'Cannot edit a deleted message');
  }

  const [updated] = await db
    .update(messages)
    .set({ content: newContent, editedAt: new Date() })
    .where(eq(messages.id, messageId))
    .returning();

  return updated;
}

// Delete message for me
export async function deleteForMe(messageId: string, userId: string) {
  const [msg] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) {
    throw new AppError(404, 'Message not found');
  }

  await db
    .insert(messageDeletes)
    .values({ messageId, userId })
    .onConflictDoNothing();

  return { success: true };
}

// Delete message for everyone (only sender)
export async function deleteForEveryone(messageId: string, userId: string) {
  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) {
    throw new AppError(404, 'Message not found');
  }

  if (msg.senderId !== userId) {
    throw new AppError(403, 'Can only delete your own messages for everyone');
  }

  const [updated] = await db
    .update(messages)
    .set({ deletedForEveryone: true })
    .where(eq(messages.id, messageId))
    .returning();

  return updated;
}

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

// Delete conversation for current user only (clears message history)
export async function deleteConversationForMe(conversationId: string, userId: string) {
  // Verify user is a participant
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

  // Get all message IDs in the conversation
  const messageIds = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  // Bulk insert into messageDeletes (idempotent)
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
  // Verify user is a participant
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

  // Get all message IDs for FK-safe cascade
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
