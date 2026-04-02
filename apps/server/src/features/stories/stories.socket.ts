import type { Server } from 'socket.io';
import { getOnlineUsers } from '../chat/chat.socket';

export function handleStoryNew(io: Server, contactIds: string[], story: any) {
  const onlineUsers = getOnlineUsers();
  for (const contactId of contactIds) {
    const socketId = onlineUsers.get(contactId);
    if (socketId) {
      io.to(socketId).emit('story:new', { story });
    }
  }
}

export function handleStoryDeleted(io: Server, storyId: string, contactIds: string[]) {
  const onlineUsers = getOnlineUsers();
  for (const contactId of contactIds) {
    const socketId = onlineUsers.get(contactId);
    if (socketId) {
      io.to(socketId).emit('story:deleted', { storyId });
    }
  }
}

export function handleStoryViewCount(io: Server, ownerId: string, storyId: string, count: number) {
  const socketId = getOnlineUsers().get(ownerId);
  if (socketId) {
    io.to(socketId).emit('story:view_count', { storyId, count });
  }
}
