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
  storyReplyId?: string | null;
  storyThumbnailUrl?: string | null;
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

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
}

export interface SearchResult {
  messageId: string;
  conversationId: string;
  conversationName: string;
  conversationAvatar: string | null;
  content: string;
  highlight: string;
  createdAt: number;
}

export interface MediaItem {
  id: string;
  conversationId: string;
  type: 'image' | 'voice' | 'file';
  mediaUrl: string;
  mediaName: string | null;
  mediaSize: number | null;
  mediaDuration: number | null;
  createdAt: number;
  senderId: string;
}

export interface Draft {
  conversationId: string;
  text: string;
  updatedAt: number;
}

export type StoryMediaType = 'photo' | 'video';

export interface StoryUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
}

export interface Story {
  id: string;
  userId: string;
  user: StoryUser;
  mediaUrl: string;
  mediaType: StoryMediaType;
  mediaDuration: number | null;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  isViewed: boolean;
}

export interface StoryView {
  id: string;
  storyId: string;
  viewerId: string;
  viewer: StoryUser;
  viewedAt: string;
}

export interface UserStories {
  user: StoryUser;
  stories: Story[];
  hasUnviewed: boolean;
  latestAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Scheduled Message Types
export interface ScheduledMessage {
  id: string;
  conversationId: string;
  content: string;
  scheduledAt: string;  // ISO 8601 UTC
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'sending' | 'sent' | 'canceled';
}

export interface ScheduledMessageRow {
  id: string;
  conversation_id: string;
  content: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export type RootStackParamList = {
  Home: undefined;
  Chat: {
    conversationId: string;
    otherUser?: User;
    user?: User;
    relationshipType?: 'friend' | 'lover';
    contactId?: string;
    nickname?: string;
    highlightMessageId?: string;
  };
  MediaGallery: {
    conversationId: string;
    conversationName?: string;
  };
  Settings: undefined;
  ContactProfile: {
    contactId: string;
    otherUser: User;
    conversationId?: string;
    relationshipType?: 'friend' | 'lover';
  };
  UserProfile: {
    user: User;
  };
  CreateStory: undefined;
  StoryViewer: {
    userStories: UserStories[];
    startIndex: number;
  };
};
