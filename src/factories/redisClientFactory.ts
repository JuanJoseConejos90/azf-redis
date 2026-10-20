import { Redis } from 'ioredis';
import { LogMessages } from '@utils/messages.js';

export class RedisClientFactory {
  private static instance: Redis | null = null;

  private constructor() { }

  public static getInstance(): Redis {
    if (!this.instance) {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT) || 6379;
      const password = process.env.REDIS_PASSWORD || undefined;
      const enableTls = process.env.REDIS_TLS === 'true';

      this.instance = new Redis({
        host,
        port,
        password,
        tls: enableTls ? {} : undefined,
        lazyConnect: false,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => Math.min(times * 200, 2000),
      });

      this.instance.on('error', (err: Error) => {
        console.error(LogMessages.REDIS_CONNECT_ERROR, err.message);
      });
    }
    return this.instance;
  }
}
