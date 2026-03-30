import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';
import { useAuthStore } from '../stores/auth';
import { usePresenceStore } from '../stores/presence';
import { useConversationsStore } from '../stores/conversations';
import { useNetworkStore } from '../stores/network';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket() {
  const token = useAuthStore.getState().accessToken;
  if (!token || socket?.connected) return;

  socket = io(BASE_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    useNetworkStore.getState().setOnline(true);
    // Flush any queued messages
    import('./outbox').then(({ flush }) => void flush());
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    useNetworkStore.getState().setOnline(false);
  });

  socket.on('connect_error', (err) => {
    console.log('Socket error:', err.message);
  });

  socket.on('user:online', ({ userId }: { userId: string }) => {
    usePresenceStore.getState().setOnline(userId);
  });

  socket.on('user:offline', ({ userId, lastSeenAt }: { userId: string; lastSeenAt: string }) => {
    usePresenceStore.getState().setOffline(userId, lastSeenAt);
  });

  // Acknowledge delivery for every incoming message regardless of which screen is active
  socket.on('message:new', (data: { message: { senderId: string }; conversationId: string }) => {
    socket?.emit('messages:delivered', {
      conversationId: data.conversationId,
      senderId: data.message.senderId,
    });
  });

  // Listen for conversation deletion events
  socket.on('conversation:deleted', (data: { conversationId: string }) => {
    useConversationsStore.getState().addHiddenConversation(data.conversationId);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
