import { eq, and, or, desc, lt, notInArray } from 'drizzle-orm';
import { db } from '../../shared/db';
import {
  conversations,
  messages,
  messageDeletes,
  messageReactions,
  messageStatuses,
  blockedUsers,
} from '../../shared/db/schema';
import { AppError } from '../../shared/middleware/error-handler';

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
    storyReplyId?: string;
    storyThumbnailUrl?: string;
    forwardedFromId?: string;
  },
) {
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
      storyReplyId: data.storyReplyId,
      storyThumbnailUrl: data.storyThumbnailUrl,
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
  cursor?: string,
  limit = 50,
) {
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
