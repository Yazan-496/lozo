import { Response } from 'express';

export class ConnectionTracker {
  private readonly active: Set<Response> = new Set();

  add(res: Response): void {
    this.active.add(res);
    res.on('finish', () => this.active.delete(res));
    res.on('close', () => this.active.delete(res));
  }

  getActiveCount(): number {
    return this.active.size;
  }

  /** Polls every 100ms until all responses finish or timeout is exceeded. */
  async waitForCompletion(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (this.active.size > 0) {
      if (Date.now() >= deadline) {
        console.warn(`[shutdown] Timeout: ${this.active.size} request(s) still in-flight`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
