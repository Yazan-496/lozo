import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { client } from './shared/db';
import { correlationIdMiddleware } from './infrastructure/logging/correlation-id.middleware';
import { requestLoggerMiddleware } from './infrastructure/logging/request-logger.middleware';
import { logger } from './infrastructure/logging/logger.service';
import { errorHandler } from './infrastructure/errors/error-handler.middleware';
import { NotFoundError } from './infrastructure/errors/error-types';
import healthRouter, { setIOInstance } from './infrastructure/health/health.controller';
import { ipRateLimiter } from './infrastructure/rate-limiting/ip-limiter';
import { userRateLimiter } from './infrastructure/rate-limiting/user-limiter';
import { ConnectionTracker } from './infrastructure/shutdown/connection-tracker';
import { ShutdownService } from './infrastructure/shutdown/shutdown.service';

import { authRouter } from './features/auth/auth.router';
import { contactsRouter } from './features/contacts/contacts.router';
import { chatRouter } from './features/chat/chat.router';
import { setupChatSocket } from './features/chat/chat.socket';
import { usersRouter } from './features/users/users.router';
import { uploadRouter } from './features/chat/upload.router';
import linkPreviewRouter from './features/link-preview/link-preview.router';
import { initStorage } from './shared/services/supabase';
import { runMigrations } from './shared/db/migrate';
import { storiesRouter } from './features/stories/stories.router';
import { startStoriesCleanupJob } from './features/stories/stories.cron';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' },
});

// ── Middleware (order matters) ────────────────────────────────────────────────
app.use(correlationIdMiddleware); // 1. assign req.id + req.startTime
app.use(requestLoggerMiddleware); // 2. log every request
app.use(cors());
app.use(express.json());

// ── Connection tracking (for graceful shutdown) ───────────────────────────────
const connectionTracker = new ConnectionTracker();
app.use((req, res, next) => {
    connectionTracker.add(res);
    next();
});

// ── Health checks (no rate-limiting on these) ─────────────────────────────────
app.use('/health', healthRouter);

// ── Feature routes ────────────────────────────────────────────────────────────
app.use('/api/auth', ipRateLimiter, authRouter);
app.use('/api/users', userRateLimiter, usersRouter);
app.use('/api/contacts', userRateLimiter, contactsRouter);
app.use('/api/chat', userRateLimiter, chatRouter);
app.use('/api/upload', userRateLimiter, uploadRouter);
app.use('/api/link-preview', userRateLimiter, linkPreviewRouter);
app.use('/api/stories', userRateLimiter, storiesRouter);

// ── 404 catch-all (before error handler) ─────────────────────────────────────
app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
setupChatSocket(io);
setIOInstance(io); // let health checks inspect Socket.IO

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
    await runMigrations();
    await initStorage();
    startStoriesCleanupJob();
    logger.info('Server started', { port: PORT, nodeEnv: process.env.NODE_ENV });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdownService = new ShutdownService(httpServer, io, client, connectionTracker);
const onSignal = () => shutdownService.gracefulShutdown();

process.on('SIGTERM', onSignal);
process.on('SIGINT', onSignal);
process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message, stack: err.stack });
    shutdownService.gracefulShutdown();
});
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
    shutdownService.gracefulShutdown();
});

export { io };
