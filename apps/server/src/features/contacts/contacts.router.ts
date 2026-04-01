import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/error-handler';
import { getIo } from '../chat/chat.socket';
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  blockUser,
  getBlockedUsers,
  getBlockStatus,
  unblockUser,
  getContacts,
  getPendingRequests,
  searchUsers,
  setNickname,
  toggleMute,
  setMyNickname,
  setRelationshipType,
  removeContact,
} from './contacts.service';
import { db } from '../../shared/db';
import { users } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// All contacts routes require auth
router.use(authenticate);

router.post('/request/:userId', async (req, res, next) => {
  try {
    const contact = await sendRequest(req.user!.userId, req.params.userId);

    // Notify the addressee in real-time
    try {
      const [requester] = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          avatarColor: users.avatarColor,
        })
        .from(users)
        .where(eq(users.id, req.user!.userId))
        .limit(1);

      getIo()
        .to(`user:${req.params.userId}`)
        .emit('contact:request', { from: requester, contactId: contact.id });
    } catch {
      // Socket notification is best-effort — don't fail the request
    }

    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
});

router.post('/accept/:contactId', async (req, res, next) => {
  try {
    const contact = await acceptRequest(req.params.contactId, req.user!.userId);
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

router.post('/reject/:contactId', async (req, res, next) => {
  try {
    const result = await rejectRequest(req.params.contactId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/block/:userId', async (req, res, next) => {
  try {
    const contact = await blockUser(req.user!.userId, req.params.userId);
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

// Must be before /:contactId to avoid param capture
router.get('/block-status/:userId', async (req, res, next) => {
  try {
    const status = await getBlockStatus(req.user!.userId, req.params.userId);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.get('/blocked', async (req, res, next) => {
  try {
    const blocked = await getBlockedUsers(req.user!.userId);
    res.json(blocked);
  } catch (err) {
    next(err);
  }
});

router.delete('/block/:userId', async (req, res, next) => {
  try {
    const result = await unblockUser(req.user!.userId, req.params.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const contacts = await getContacts(req.user!.userId);
    res.json(contacts);
  } catch (err) {
    next(err);
  }
});

router.get('/pending', async (req, res, next) => {
  try {
    const requests = await getPendingRequests(req.user!.userId);
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      throw new AppError(400, 'Search query must be at least 2 characters');
    }
    const users = await searchUsers(q, req.user!.userId);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.put('/:contactId/nickname', async (req, res, next) => {
  try {
    const { nickname } = req.body;
    const contact = await setNickname(req.params.contactId, req.user!.userId, nickname || null);
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

router.put('/:contactId/mute', async (req, res, next) => {
  try {
    const contact = await toggleMute(req.params.contactId, req.user!.userId);
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

router.put('/:contactId/myNickname', async (req, res, next) => {
  try {
    const { myNickname } = req.body;
    const contact = await setMyNickname(req.params.contactId, req.user!.userId, myNickname || null);
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

router.put('/:contactId/relationship', async (req, res, next) => {
  try {
    const { relationshipType } = req.body;
    const contact = await setRelationshipType(
      req.params.contactId,
      req.user!.userId,
      relationshipType,
    );
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

router.delete('/:contactId', async (req, res, next) => {
  try {
    const result = await removeContact(req.params.contactId, req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as contactsRouter };
