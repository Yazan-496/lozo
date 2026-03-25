import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { errorHandler } from './shared/middleware/error-handler';
import { authRouter } from './features/auth/auth.router';
import { contactsRouter } from './features/contacts/contacts.router';
import { chatRouter } from './features/chat/chat.router';
import { setupChatSocket } from './features/chat/chat.socket';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Feature routes
app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/chat', chatRouter);

// Socket.IO setup
setupChatSocket(io);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
