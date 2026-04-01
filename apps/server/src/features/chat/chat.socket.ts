import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { users } from '../../shared/db/schema';
import type { AuthPayload } from '../../shared/middleware/auth';
import {
  sendMessage,
  editMessage,
  deleteForEveryone,
  reactToMessage,
  markDelivered,
  markRead,
} from './chat.service';

// Map userId -> socketId for presence and direct messaging
const onlineUsers = new Map<string, string>();

export function getOnlineUsers() {
  return onlineUsers;
}

let _io: Server | null = null;

export function getIo(): Server | null {
  return _io;
}

export function setupChatSocket(io: Server) {
  _io = io;
  // Auth middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.user.userId;
    onlineUsers.set(userId, socket.id);

    // Mark user as online
    await db
      .update(users)
      .set({ isOnline: true, lastSeenAt: new Date() })
      .where(eq(users.id, userId));

    // Cache sender's public profile so we can include it in message:new
    const [senderProfile] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        avatarColor: users.avatarColor,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    socket.data.profile = senderProfile;

    // Broadcast online status to all connected users
    socket.broadcast.emit('user:online', { userId });

    // Send the list of already-online users to the newly connected client
    const alreadyOnline = Array.from(onlineUsers.keys()).filter((id) => id !== userId);
    socket.emit('presence:sync', { userIds: alreadyOnline });

    console.log(`User connected: ${socket.data.user.username} (${socket.id}) | sending presence:sync with ${alreadyOnline.length} online users: [${alreadyOnline.join(', ')}]`);

    // Send message
    socket.on('message:send', async (data, callback) => {
      try {
        const result = await sendMessage(data.conversationId, userId, {
          type: data.type || 'text',
          content: data.content,
          mediaUrl: data.mediaUrl,
          mediaName: data.mediaName,
          mediaSize: data.mediaSize,
          mediaDuration: data.mediaDuration,
          replyToId: data.replyToId,
          forwardedFromId: data.forwardedFromId,
        });

        // Send to recipient if online
        const recipientSocketId = onlineUsers.get(result.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:new', {
            message: result.message,
            conversationId: data.conversationId,
            sender: socket.data.profile ?? null,
          });
        }

        // Echo back localId for client reconciliation
        callback?.({ success: true, message: { ...result.message, localId: data.localId } });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Edit message
    socket.on('message:edit', async (data, callback) => {
      try {
        const updated = await editMessage(data.messageId, userId, data.content);

        // Notify other participant
        const recipientSocketId = onlineUsers.get(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:edited', {
            message: updated,
            conversationId: data.conversationId,
          });
        }

        callback?.({ success: true, message: updated });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Delete for everyone
    socket.on('message:delete', async (data, callback) => {
      try {
        const deleted = await deleteForEveryone(data.messageId, userId);

        const recipientSocketId = onlineUsers.get(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:deleted', {
            messageId: data.messageId,
            conversationId: data.conversationId,
          });
        }

        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Reaction
    socket.on('message:react', async (data, callback) => {
      try {
        const result = await reactToMessage(data.messageId, userId, data.emoji);

        const recipientSocketId = onlineUsers.get(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:reaction', {
            messageId: data.messageId,
            userId,
            emoji: data.emoji,
            action: result.action,
            conversationId: data.conversationId,
          });
        }

        callback?.({ success: true, ...result });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:start', {
          userId,
          conversationId: data.conversationId,
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:stop', {
          userId,
          conversationId: data.conversationId,
        });
      }
    });

    // Mark delivered
    socket.on('messages:delivered', async (data, callback) => {
      try {
        const result = await markDelivered(data.conversationId, userId);

        // Notify sender that their messages were delivered
        const senderSocketId = onlineUsers.get(data.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages:status', {
            conversationId: data.conversationId,
            status: 'delivered',
            userId,
          });
        }

        callback?.({ success: true, ...result });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Mark read
    socket.on('messages:read', async (data, callback) => {
      try {
        const result = await markRead(data.conversationId, userId);

        const senderSocketId = onlineUsers.get(data.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages:status', {
            conversationId: data.conversationId,
            status: 'read',
            userId,
          });
        }

        callback?.({ success: true, ...result });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);

      await db
        .update(users)
        .set({ isOnline: false, lastSeenAt: new Date() })
        .where(eq(users.id, userId));

      socket.broadcast.emit('user:offline', {
        userId,
        lastSeenAt: new Date().toISOString(),
      });

      console.log(`User disconnected: ${socket.data.user.username}`);
    });
  });
}
