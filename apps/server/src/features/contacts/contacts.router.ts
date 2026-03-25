import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/error-handler';
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  blockUser,
  getContacts,
  getPendingRequests,
  searchUsers,
  setNickname,
  toggleMute,
} from './contacts.service';

const router = Router();

// All contacts routes require auth
router.use(authenticate);

router.post('/request/:userId', async (req, res, next) => {
  try {
    const contact = await sendRequest(req.user!.userId, req.params.userId);
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

export { router as contactsRouter };
