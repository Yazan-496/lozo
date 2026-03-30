export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
  bio: string;
  isOnline: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface Contact {
  contactId: string;
  nickname: string | null;
  myNickname: string | null;
  relationshipType: 'friend' | 'lover';
  isMuted: boolean;
  user: User;
  since: string;
}

export interface PendingRequest {
  contactId: string;
  from: User;
  createdAt: string;
}

export type SyncStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  localId?: string;
  syncStatus?: SyncStatus;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'voice' | 'file';
  content: string | null;
  mediaUrl: string | null;
  mediaName: string | null;
  mediaSize: number | null;
  mediaDuration: number | null;
  replyToId: string | null;
  forwardedFromId: string | null;
  isForwarded: boolean;
  editedAt: string | null;
  deletedForEveryone: boolean;
  createdAt: string;
  reactions: Reaction[];
  replyTo?: ReplyTo | null;
  status: 'sent' | 'delivered' | 'read' | null;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface ReplyTo {
  id: string;
  senderId: string;
  type: string;
  content: string | null;
  deletedForEveryone: boolean;
}

export interface Conversation {
  id: string;
  otherUser: User;
  lastMessage: {
    id: string;
    senderId: string;
    type: string;
    content: string | null;
    isForwarded: boolean;
    deletedForEveryone: boolean;
    createdAt: string;
    status: 'sent' | 'delivered' | 'read' | null;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type RootStackParamList = {
  Home: undefined;
  Chat: {
    conversationId: string;
    otherUser?: User;
    user?: User;
    relationshipType?: 'friend' | 'lover';
  };
  Settings: undefined;
  ContactProfile: {
    contactId: string;
    otherUser: User;
    conversationId?: string;
    relationshipType?: 'friend' | 'lover';
  };
};
