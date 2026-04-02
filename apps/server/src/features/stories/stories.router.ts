import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/error-handler';
import { BUCKETS, supabase } from '../../shared/services/supabase';
import { getIo } from '../chat/chat.socket';
import { handleStoryDeleted, handleStoryNew, handleStoryViewCount } from './stories.socket';
import {
  cleanupExpiredStories,
  createStory,
  deleteStory,
  getAcceptedContactIds,
  getContactsStories,
  getStoryOwner,
  getStoryViewCount,
  getStoryViewers,
  getMyStories,
  recordView,
} from './stories.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();
router.use(authenticate);

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'No file provided');
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname || '');
    const fileName = `${req.user!.userId}/${timestamp}/${timestamp}${ext || ''}`;

    const { error } = await supabase.storage.from(BUCKETS.STORIES).upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (error) throw new AppError(500, `Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage.from(BUCKETS.STORIES).getPublicUrl(fileName);
    res.status(201).json({ mediaUrl: urlData.publicUrl, thumbnailUrl: null });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { mediaUrl, mediaType, mediaDuration, caption, thumbnailUrl } = req.body;
    if (!mediaUrl) throw new AppError(400, 'mediaUrl is required');
    if (!mediaType || !['photo', 'video'].includes(mediaType)) {
      throw new AppError(400, 'mediaType must be photo or video');
    }
    if (mediaType === 'video' && mediaDuration && mediaDuration > 30) {
      throw new AppError(400, 'mediaDuration cannot exceed 30 seconds');
    }
    if (caption && String(caption).length > 200) {
      throw new AppError(400, 'caption cannot exceed 200 characters');
    }

    const story = await createStory(req.user!.userId, {
      mediaUrl,
      mediaType,
      mediaDuration,
      caption,
      thumbnailUrl,
    });
    const io = getIo();
    if (io) {
      const contactIds = await getAcceptedContactIds(req.user!.userId);
      handleStoryNew(io, contactIds, story);
    }
    res.status(201).json(story);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', async (req, res, next) => {
  try {
    const data = await getMyStories(req.user!.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const data = await getContactsStories(req.user!.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/view', async (req, res, next) => {
  try {
    const data = await recordView(req.params.id, req.user!.userId);
    const io = getIo();
    if (io) {
      const ownerId = await getStoryOwner(req.params.id);
      if (ownerId && ownerId !== req.user!.userId) {
        const count = await getStoryViewCount(req.params.id);
        handleStoryViewCount(io, ownerId, req.params.id, count);
      }
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const data = await deleteStory(req.user!.userId, req.params.id);
    const io = getIo();
    if (io) {
      const contactIds = await getAcceptedContactIds(req.user!.userId);
      handleStoryDeleted(io, req.params.id, contactIds);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/viewers', async (req, res, next) => {
  try {
    const data = await getStoryViewers(req.params.id, req.user!.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/maintenance/cleanup', async (_req, res, next) => {
  try {
    const deleted = await cleanupExpiredStories();
    res.json({ deleted: deleted.length });
  } catch (err) {
    next(err);
  }
});

export { router as storiesRouter };
