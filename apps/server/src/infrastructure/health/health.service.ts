import { Server } from 'socket.io';
import { HealthStatus, HealthChecks } from '../../shared/types/health.types';
import { checkDatabase } from './checks/database.check';
import { checkSocketIO } from './checks/socketio.check';

export class HealthService {
  private readonly startTime: number = Date.now();

  async checkHealth(io: Server | null): Promise<HealthStatus> {
    const [database, socketio] = await Promise.all([
      checkDatabase(),
      checkSocketIO(io),
    ]);

    const checks: HealthChecks = { database, socketio };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (database.status === 'unhealthy') {
      status = 'unhealthy';
    } else if (socketio.status === 'unhealthy') {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  checkLiveness(): Pick<HealthStatus, 'status' | 'timestamp' | 'uptime'> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
