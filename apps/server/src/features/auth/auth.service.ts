import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { users } from '../../shared/db/schema';
import { AppError } from '../../shared/middleware/error-handler';
import type { AuthPayload } from '../../shared/middleware/auth';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Messenger-style avatar colors
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F0B27A', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
}

// Fields returned to client (never include password)
const publicUserFields = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl,
  avatarColor: users.avatarColor,
  bio: users.bio,
  isOnline: users.isOnline,
  lastSeenAt: users.lastSeenAt,
  createdAt: users.createdAt,
};

export async function register(username: string, password: string, displayName: string) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, 'Username already taken');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const avatarColor = randomAvatarColor();

  const [user] = await db
    .insert(users)
    .values({ username, password: hashedPassword, displayName, avatarColor })
    .returning(publicUserFields);

  const tokens = generateTokens({ userId: user.id, username: user.username });

  return { user, ...tokens };
}

export async function login(username: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new AppError(401, 'Invalid username or password');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, 'Invalid username or password');
  }

  const tokens = generateTokens({ userId: user.id, username: user.username });

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeenAt: user.lastSeenAt,
    },
    ...tokens,
  };
}

export async function refresh(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as AuthPayload;
    const tokens = generateTokens({ userId: payload.userId, username: payload.username });
    return tokens;
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
}

export async function getMe(userId: string) {
  const [user] = await db
    .select(publicUserFields)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; bio?: string; avatarUrl?: string; avatarColor?: string },
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.displayName) updateData.displayName = data.displayName;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.avatarColor) updateData.avatarColor = data.avatarColor;

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning(publicUserFields);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const [user] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw new AppError(401, 'Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { success: true };
}
