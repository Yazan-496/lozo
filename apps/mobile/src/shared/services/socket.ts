import { AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';
import { useAuthStore } from '../stores/auth';
import { usePresenceStore } from '../stores/presence';
import { useConversationsStore } from '../stores/conversations';
import { useNetworkStore } from '../stores/network';
import { hideCachedConversation } from '../db/conversations.db.ts';
import { inAppNotifRef } from '../components/InAppNotification';

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

    // Receive the list of users who were already online before this client connected
    socket.on('presence:sync', ({ userIds }: { userIds: string[] }) => {
        usePresenceStore.getState().seedOnline(userIds);
    });

    // Acknowledge delivery for every incoming message regardless of which screen is active
    socket.on(
        'message:new',
        (data: {
            message: { id: string; senderId: string; content: string | null; type: string };
            conversationId: string;
            sender?: { id: string; displayName: string; avatarUrl: string | null; avatarColor: string } | null;
        }) => {
            socket?.emit('messages:delivered', {
                conversationId: data.conversationId,
                senderId: data.message.senderId,
            });

            // Show in-app banner when app is in foreground and user is not in that conversation
            if (AppState.currentState === 'active') {
                const currentUserId = useAuthStore.getState().user?.id;
                if (data.message.senderId === currentUserId) return;

                import('../../navigation/navigationRef').then(({ navigationRef }) => {
                    const route = navigationRef.getCurrentRoute();
                    const inThatChat =
                        route?.name === 'Chat' &&
                        (route.params as any)?.conversationId === data.conversationId;
                    if (!inThatChat) {
                        // Prefer nickname over display name
                        const sender = data.sender;
                        inAppNotifRef.current?.show({
                            type: 'message',
                            senderId: data.message.senderId,
                            senderName: sender?.displayName ?? 'Unknown',
                            senderAvatarUrl: sender?.avatarUrl ?? null,
                            senderAvatarColor: sender?.avatarColor ?? '#0084FF',
                            preview:
                                data.message.type === 'text'
                                    ? (data.message.content ?? '...')
                                    : `📎 ${data.message.type}`,
                            conversationId: data.conversationId,
                        });
                    }
                });
            }
        },
    );

    // Contact request notification
    socket.on(
        'contact:request',
        (data: {
            from: {
                id: string;
                displayName: string;
                avatarUrl: string | null;
                avatarColor: string;
            };
            contactId: string;
        }) => {
            if (AppState.currentState === 'active') {
                inAppNotifRef.current?.show({
                    type: 'request',
                    senderId: data.from.id,
                    senderName: data.from.displayName,
                    senderAvatarUrl: data.from.avatarUrl,
                    senderAvatarColor: data.from.avatarColor,
                    preview: 'sent you a friend request',
                });
            }
        },
    );

    // Listen for conversation deletion events
    socket.on('conversation:deleted', (data: { conversationId: string }) => {
        useConversationsStore.getState().addHiddenConversation(data.conversationId);
        void hideCachedConversation(data.conversationId);
    });

    socket.on('story:new', (_data: any) => {});
    socket.on('story:view_count', (_data: any) => {});
    socket.on('story:deleted', (_data: any) => {});

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.off('story:new');
        socket.off('story:view_count');
        socket.off('story:deleted');
        socket.disconnect();
        socket = null;
    }
}
