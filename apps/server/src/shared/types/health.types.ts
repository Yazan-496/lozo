export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthChecks;
}

export interface HealthChecks {
  database: HealthCheckResult;
  socketio?: HealthCheckResult;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}
