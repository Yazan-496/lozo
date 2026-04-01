export interface RequestLogEntry {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  ip: string;
  userAgent?: string;
  error?: string;
}

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}
