import { Server } from 'socket.io';
import { HealthCheckResult } from '../../../shared/types/health.types';

export async function checkSocketIO(io: Server | null): Promise<HealthCheckResult> {
  if (!io) {
    return {
      status: 'unhealthy',
      error: 'Socket.IO not initialized',
    };
  }

  return {
    status: 'healthy',
    metadata: {
      connections: io.engine.clientsCount || 0,
    },
  };
}
