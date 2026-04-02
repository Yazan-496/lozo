export type StoryMediaType = 'photo' | 'video';

export interface CreateStoryInput {
  mediaUrl: string;
  mediaType: StoryMediaType;
  mediaDuration?: number | null;
  caption?: string | null;
  thumbnailUrl?: string | null;
}

export interface StoryWithUser {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  mediaDuration: number | null;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: Date;
  expiresAt: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string;
  };
}

export interface StoryViewWithViewer {
  id: string;
  storyId: string;
  viewerId: string;
  viewedAt: Date;
  viewer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarColor: string;
  };
}
