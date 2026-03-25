import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/error-handler';
import { supabase, BUCKETS } from '../../shared/services/supabase';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

router.use(authenticate);

// Upload a file for chat (image, voice, file)
router.post('/chat', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file provided');
    }

    const ext = path.extname(req.file.originalname);
    const fileName = `${req.user!.userId}/${Date.now()}${ext}`;

    const { error } = await supabase.storage
      .from(BUCKETS.CHAT_MEDIA)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new AppError(500, `Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKETS.CHAT_MEDIA)
      .getPublicUrl(fileName);

    res.json({
      url: urlData.publicUrl,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
});

// Upload avatar
router.post('/avatar', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file provided');
    }

    if (!req.file.mimetype.startsWith('image/')) {
      throw new AppError(400, 'Avatar must be an image');
    }

    const ext = path.extname(req.file.originalname);
    const fileName = `${req.user!.userId}/avatar${ext}`;

    // Upsert to replace existing avatar
    const { error } = await supabase.storage
      .from(BUCKETS.AVATARS)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new AppError(500, `Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKETS.AVATARS)
      .getPublicUrl(fileName);

    res.json({ url: urlData.publicUrl });
  } catch (err) {
    next(err);
  }
});

export { router as uploadRouter };
