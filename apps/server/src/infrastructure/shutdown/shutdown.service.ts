import http from 'http';
import { Server } from 'socket.io';
import { Sql } from 'postgres';
import { ConnectionTracker } from './connection-tracker';

export class ShutdownService {
  private readonly timeoutMs: number;

  constructor(
    private readonly httpServer: http.Server,
    private readonly io: Server,
    private readonly pgClient: Sql,
    private readonly connectionTracker: ConnectionTracker,
  ) {
    this.timeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 30_000;
  }

  async gracefulShutdown(): Promise<void> {
    console.log('[shutdown] Starting graceful shutdown...');

    // Notify WebSocket clients so they can reconnect to the new instance
    this.io.emit('server:shutdown', { message: 'Server is restarting, please reconnect' });

    // Stop accepting new HTTP connections
    this.httpServer.close();

    // Wait for in-flight HTTP requests (up to timeout)
    await this.connectionTracker.waitForCompletion(this.timeoutMs);

    // Close Socket.IO after HTTP is drained
    await new Promise<void>((resolve) => this.io.close(() => resolve()));

    // Release all PostgreSQL connections
    await this.pgClient.end();

    console.log('[shutdown] Graceful shutdown complete');
    process.exit(0);
  }
}
