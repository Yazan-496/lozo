import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';
import { useAuthStore } from '../stores/auth';

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
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.log('Socket error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
