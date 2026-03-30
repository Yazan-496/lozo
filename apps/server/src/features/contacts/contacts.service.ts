import { eq, and, or, like, ne } from 'drizzle-orm';
import { db } from '../../shared/db';
import { users, contacts, blockedUsers } from '../../shared/db/schema';
import { AppError } from '../../shared/middleware/error-handler';

const publicUserFields = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl,
  avatarColor: users.avatarColor,
  bio: users.bio,
  isOnline: users.isOnline,
  lastSeenAt: users.lastSeenAt,
};

export async function sendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw new AppError(400, 'Cannot send request to yourself');
  }

  const [addressee] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, addresseeId))
    .limit(1);

  if (!addressee) {
    throw new AppError(404, 'User not found');
  }

  // Check if requester is blocked by addressee
  const block = await db
    .select()
    .from(blockedUsers)
    .where(
      and(
        eq(blockedUsers.blockerId, addresseeId),
        eq(blockedUsers.blockedId, requesterId),
      ),
    )
    .limit(1);

  if (block.length > 0) {
    throw new AppError(403, 'Cannot send request to this user');
  }

  // Check if a relationship already exists (in either direction)
  const existing = await db
    .select()
    .from(contacts)
    .where(
      or(
        and(eq(contacts.requesterId, requesterId), eq(contacts.addresseeId, addresseeId)),
        and(eq(contacts.requesterId, addresseeId), eq(contacts.addresseeId, requesterId)),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const rel = existing[0];
    if (rel.status === 'blocked') {
      throw new AppError(403, 'Cannot send request to this user');
    }
    if (rel.status === 'accepted') {
      throw new AppError(409, 'Already connected');
    }
    throw new AppError(409, 'Request already pending');
  }

  const [contact] = await db
    .insert(contacts)
    .values({ requesterId, addresseeId })
    .returning();

  return contact;
}

export async function acceptRequest(contactId: string, userId: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new AppError(404, 'Request not found');
  }

  if (contact.addresseeId !== userId) {
    throw new AppError(403, 'Only the recipient can accept this request');
  }

  if (contact.status !== 'pending') {
    throw new AppError(400, `Cannot accept a ${contact.status} request`);
  }

  const [updated] = await db
    .update(contacts)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .returning();

  return updated;
}

export async function rejectRequest(contactId: string, userId: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new AppError(404, 'Request not found');
  }

  if (contact.addresseeId !== userId && contact.requesterId !== userId) {
    throw new AppError(403, 'Not authorized');
  }

  if (contact.status !== 'pending') {
    throw new AppError(400, `Cannot reject a ${contact.status} request`);
  }

  await db.delete(contacts).where(eq(contacts.id, contactId));

  return { success: true };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new AppError(400, 'Cannot block yourself');
  }

  // Idempotent: if already blocked, just return success
  const existing = await db
    .select()
    .from(blockedUsers)
    .where(
      and(
        eq(blockedUsers.blockerId, blockerId),
        eq(blockedUsers.blockedId, blockedId),
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(blockedUsers).values({ blockerId, blockedId });
  }

  return { success: true };
}

export async function getContacts(userId: string) {
  const rows = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.status, 'accepted'),
        or(eq(contacts.requesterId, userId), eq(contacts.addresseeId, userId)),
      ),
    );

  const result = await Promise.all(
    rows.map(async (row) => {
      const otherUserId = row.requesterId === userId ? row.addresseeId : row.requesterId;

      // Check if user has blocked this contact
      const isBlocked = await db
        .select()
        .from(blockedUsers)
        .where(
          and(
            eq(blockedUsers.blockerId, userId),
            eq(blockedUsers.blockedId, otherUserId),
          ),
        )
        .limit(1);

      if (isBlocked.length > 0) {
        return null;
      }

      const [otherUser] = await db
        .select(publicUserFields)
        .from(users)
        .where(eq(users.id, otherUserId))
        .limit(1);

      return {
        contactId: row.id,
        nickname: row.nickname,
        myNickname: row.myNickname,
        relationshipType: row.relationshipType,
        isMuted: row.isMuted,
        user: otherUser,
        since: row.updatedAt,
      };
    }),
  );

  return result.filter((r) => r !== null);
}

export async function getPendingRequests(userId: string) {
  const result = await db
    .select({
      contactId: contacts.id,
      from: publicUserFields,
      createdAt: contacts.createdAt,
    })
    .from(contacts)
    .innerJoin(users, eq(users.id, contacts.requesterId))
    .where(
      and(eq(contacts.addresseeId, userId), eq(contacts.status, 'pending')),
    );

  return result;
}

export async function searchUsers(query: string, currentUserId: string) {
  const result = await db
    .select(publicUserFields)
    .from(users)
    .where(
      and(
        ne(users.id, currentUserId),
        or(
          like(users.username, `%${query}%`),
          like(users.displayName, `%${query}%`),
        ),
      ),
    )
    .limit(20);

  return result;
}

export async function setNickname(contactId: string, userId: string, nickname: string | null) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new AppError(404, 'Contact not found');
  }

  if (contact.requesterId !== userId && contact.addresseeId !== userId) {
    throw new AppError(403, 'Not authorized');
  }

  if (contact.status !== 'accepted') {
    throw new AppError(400, 'Can only set nickname for accepted contacts');
  }

  const [updated] = await db
    .update(contacts)
    .set({ nickname, updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .returning();

  return updated;
}

export async function toggleMute(contactId: string, userId: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new AppError(404, 'Contact not found');
  }

  if (contact.requesterId !== userId && contact.addresseeId !== userId) {
    throw new AppError(403, 'Not authorized');
  }

  const [updated] = await db
    .update(contacts)
    .set({ isMuted: !contact.isMuted, updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .returning();

  return updated;
}

export async function setMyNickname(
  contactId: string,
  userId: string,
  myNickname: string | null,
) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new AppError(404, 'Contact not found');
  }

  if (contact.requesterId !== userId && contact.addresseeId !== userId) {
    throw new AppError(403, 'Not authorized');
  }

  if (contact.status !== 'accepted') {
    throw new AppError(400, 'Can only set my nickname for accepted contacts');
  }

  const [updated] = await db
    .update(contacts)
    .set({ myNickname, updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .returning();

  return updated;
}

export async function setRelationshipType(
  contactId: string,
  userId: string,
  relationshipType: string,
) {
  if (!['friend', 'lover'].includes(relationshipType)) {
    throw new AppError(400, 'relationshipType must be "friend" or "lover"');
  }

  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new AppError(404, 'Contact not found');
  }

  if (contact.requesterId !== userId && contact.addresseeId !== userId) {
    throw new AppError(403, 'Not authorized');
  }

  if (contact.status !== 'accepted') {
    throw new AppError(400, 'Can only set relationship type for accepted contacts');
  }

  const [updated] = await db
    .update(contacts)
    .set({ relationshipType: relationshipType as 'friend' | 'lover', updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .returning();

  return updated;
}

export async function removeContact(contactId: string, userId: string) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);

  if (!contact) {
    throw new AppError(404, 'Contact not found');
  }

  if (contact.requesterId !== userId && contact.addresseeId !== userId) {
    throw new AppError(403, 'Not authorized');
  }

  if (contact.status !== 'accepted') {
    throw new AppError(400, 'Can only remove accepted contacts');
  }

  await db.delete(contacts).where(eq(contacts.id, contactId));

  return { success: true };
}
