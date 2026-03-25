import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { authenticate } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/error-handler';
import { db } from '../../shared/db';
import { users } from '../../shared/db/schema';

const router = Router();

router.use(authenticate);

// Get a user's public profile
router.get('/:userId', async (req, res, next) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        avatarColor: users.avatarColor,
        bio: users.bio,
        isOnline: users.isOnline,
        lastSeenAt: users.lastSeenAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.params.userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export { router as usersRouter };
