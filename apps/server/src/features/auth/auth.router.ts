import { Router } from 'express';
import { register, login, refresh, getMe, updateProfile, changePassword } from './auth.service';
import { authenticate } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/error-handler';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName) {
      throw new AppError(400, 'username, password, and displayName are required');
    }
    if (username.length < 3 || username.length > 50) {
      throw new AppError(400, 'Username must be 3-50 characters');
    }
    if (password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    const result = await register(username, password, displayName);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(400, 'username and password are required');
    }

    const result = await login(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'refreshToken is required');
    }

    const tokens = await refresh(refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getMe(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { displayName, bio, avatarUrl, avatarColor } = req.body;
    const user = await updateProfile(req.user!.userId, { displayName, bio, avatarUrl, avatarColor });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(400, 'currentPassword and newPassword are required');
    }
    if (newPassword.length < 6) {
      throw new AppError(400, 'New password must be at least 6 characters');
    }

    const result = await changePassword(req.user!.userId, currentPassword, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
