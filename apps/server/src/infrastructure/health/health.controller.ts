import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { HealthService } from './health.service';

let ioInstance: Server | null = null;

/** Call this after Socket.IO is initialized so health checks can query it. */
export function setIOInstance(io: Server): void {
  ioInstance = io;
}

const router = Router();
const healthService = new HealthService();

router.get('/', async (_req: Request, res: Response) => {
  const health = await healthService.checkHealth(ioInstance);
  res.status(health.status === 'unhealthy' ? 503 : 200).json(health);
});

router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json(healthService.checkLiveness());
});

router.get('/ready', async (_req: Request, res: Response) => {
  const health = await healthService.checkHealth(ioInstance);
  res.status(health.status === 'unhealthy' ? 503 : 200).json(health);
});

export default router;
