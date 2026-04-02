import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/error-handler';
import { getIo, getOnlineUsers } from './chat.socket';
import {
  getOrCreateConversation,
  getConversations,
  deleteConversationForMe,
  deleteConversationForEveryone,
} from './conversation.service';
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteForMe,
  deleteForEveryone,
} from './message.service';
import {
  reactToMessage,
  removeReaction,
  markDelivered,
  markRead,
} from './reaction-status.service';

const router = Router();

router.use(authenticate);

// Get or create a conversation with another user
router.post('/conversations/:userId', async (req, res, next) => {
  try {
    const conv = await getOrCreateConversation(req.user!.userId, req.params.userId);
    res.json(conv);
  } catch (err) {
    next(err);
  }
});

// List all conversations
router.get('/conversations', async (req, res, next) => {
  try {
    const convs = await getConversations(req.user!.userId);
    res.json(convs);
  } catch (err) {
    next(err);
  }
});

// Get messages in a conversation (with cursor pagination)
router.get('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const msgs = await getMessages(req.params.conversationId, req.user!.userId, cursor, limit);
    res.json(msgs);
  } catch (err) {
    next(err);
  }
});

// Send a message (REST fallback — primary sending is via Socket.IO)
router.post('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const {
      type,
      content,
      mediaUrl,
      mediaName,
      mediaSize,
      mediaDuration,
      replyToId,
      storyReplyId,
      storyThumbnailUrl,
      forwardedFromId,
    } = req.body;

    if (!type) {
      throw new AppError(400, 'type is required');
    }
    if (type === 'text' && !content) {
      throw new AppError(400, 'content is required for text messages');
    }
    if (['image', 'voice', 'file'].includes(type) && !mediaUrl) {
      throw new AppError(400, 'mediaUrl is required for media messages');
    }

    const result = await sendMessage(req.params.conversationId, req.user!.userId, {
      type,
      content,
      mediaUrl,
      mediaName,
      mediaSize,
      mediaDuration,
      replyToId,
      storyReplyId,
      storyThumbnailUrl,
      forwardedFromId,
    });

    // Notify recipient in real-time (same as socket message:send handler)
    const io = getIo();
    const recipientSocketId = getOnlineUsers().get(result.recipientId);
    if (io && recipientSocketId) {
      io.to(recipientSocketId).emit('message:new', {
        message: result.message,
        conversationId: req.params.conversationId,
      });
    }

    res.status(201).json(result.message);
  } catch (err) {
    next(err);
  }
});

// Edit a message
router.put('/messages/:messageId', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      throw new AppError(400, 'content is required');
    }
    const msg = await editMessage(req.params.messageId, req.user!.userId, content);
    res.json(msg);
  } catch (err) {
    next(err);
  }
});

// Delete message for me
router.delete('/messages/:messageId', async (req, res, next) => {
  try {
    const result = await deleteForMe(req.params.messageId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Delete message for everyone
router.delete('/messages/:messageId/everyone', async (req, res, next) => {
  try {
    const msg = await deleteForEveryone(req.params.messageId, req.user!.userId);
    res.json(msg);
  } catch (err) {
    next(err);
  }
});

// React to a message
router.post('/messages/:messageId/reactions', async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      throw new AppError(400, 'emoji is required');
    }
    const result = await reactToMessage(req.params.messageId, req.user!.userId, emoji);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Remove reaction
router.delete('/messages/:messageId/reactions', async (req, res, next) => {
  try {
    const result = await removeReaction(req.params.messageId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Mark messages as delivered
router.post('/conversations/:conversationId/delivered', async (req, res, next) => {
  try {
    const result = await markDelivered(req.params.conversationId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Mark messages as read
router.post('/conversations/:conversationId/read', async (req, res, next) => {
  try {
    const result = await markRead(req.params.conversationId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Delete conversation for me or everyone
router.delete('/conversations/:conversationId', async (req, res, next) => {
  try {
    const { scope } = req.query;
    if (scope !== 'me' && scope !== 'everyone') {
      throw new AppError(400, 'scope must be "me" or "everyone"');
    }

    if (scope === 'me') {
      const result = await deleteConversationForMe(req.params.conversationId, req.user!.userId);
      res.json(result);
    } else {
      const result = await deleteConversationForEveryone(req.params.conversationId, req.user!.userId);
      // Emit socket event to both participants
      const io = getIo();
      if (io) {
        result.participantIds.forEach((participantId: string) => {
          const socketId = getOnlineUsers().get(participantId);
          if (socketId) {
            io.to(socketId).emit('conversation:deleted', {
              conversationId: req.params.conversationId,
            });
          }
        });
      }
      res.json(result);
    }
  } catch (err) {
    next(err);
  }
});

export { router as chatRouter };
